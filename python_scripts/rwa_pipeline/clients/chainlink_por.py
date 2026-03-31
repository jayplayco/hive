"""Chainlink Proof-of-Reserve client — reads on-chain PoR feed answers."""

import logging
from decimal import Decimal
from typing import Optional

from web3 import Web3

from rwa_pipeline.config import TokenConfig, config

logger = logging.getLogger(__name__)

# Chainlink AggregatorV3Interface — only the methods we need.
_AGGREGATOR_ABI = [
    {
        "inputs": [],
        "name": "latestRoundData",
        "outputs": [
            {"name": "roundId",         "type": "uint80"},
            {"name": "answer",          "type": "int256"},
            {"name": "startedAt",       "type": "uint256"},
            {"name": "updatedAt",       "type": "uint256"},
            {"name": "answeredInRound", "type": "uint80"},
        ],
        "stateMutability": "view",
        "type": "function",
    },
    {
        "inputs": [],
        "name": "decimals",
        "outputs": [{"name": "", "type": "uint8"}],
        "stateMutability": "view",
        "type": "function",
    },
    {
        "inputs": [],
        "name": "description",
        "outputs": [{"name": "", "type": "string"}],
        "stateMutability": "view",
        "type": "function",
    },
]

# Staleness threshold: Chainlink PoR feeds typically update every 24 h.
_MAX_ANSWER_AGE_SECONDS = 86_400 * 2   # alert if older than 2 days


class ChainlinkPoRClient:
    """
    Reads Chainlink Proof-of-Reserve feeds to verify that on-chain reported
    reserves back the circulating token supply 1:1.
    """

    def __init__(self, rpc_url: Optional[str] = None) -> None:
        rpc = rpc_url or config.eth_rpc_url
        self._w3 = Web3(Web3.HTTPProvider(rpc))
        if not self._w3.is_connected():
            logger.warning("Web3 not connected — PoR reads will fail.")

    # ── Public API ────────────────────────────────────────────────────────────

    def get_reserve(self, token: TokenConfig) -> Optional[dict]:
        """
        Query the Chainlink PoR feed for *token* and return the latest answer.

        Returns:
            {
                "symbol":            str,
                "feed_address":      str,
                "on_chain_reserve":  Decimal,   # human-readable units
                "round_id":          int,
                "answer_timestamp":  datetime (UTC),
                "is_stale":          bool,
            }
        or None if the token has no configured PoR feed.
        """
        if not token.chainlink_por_feed:
            logger.debug("%s has no PoR feed configured — skipping.", token.symbol)
            return None

        feed_addr = Web3.to_checksum_address(token.chainlink_por_feed)
        contract = self._w3.eth.contract(address=feed_addr, abi=_AGGREGATOR_ABI)

        try:
            decimals: int = contract.functions.decimals().call()
            (
                round_id,
                answer,
                _started_at,
                updated_at,
                _answered_in_round,
            ) = contract.functions.latestRoundData().call()
        except Exception as exc:
            logger.error("PoR feed call failed for %s (%s): %s", token.symbol, feed_addr, exc)
            return None

        # Chainlink PoR for gold reports total ounces × 10^decimals.
        reserve = Decimal(answer) / Decimal(10 ** decimals)

        import datetime
        answer_ts = datetime.datetime.utcfromtimestamp(updated_at).replace(
            tzinfo=datetime.timezone.utc
        )

        import time
        age_seconds = int(time.time()) - updated_at
        is_stale = age_seconds > _MAX_ANSWER_AGE_SECONDS

        if is_stale:
            logger.warning(
                "PoR feed for %s is stale (age=%ds > threshold=%ds)",
                token.symbol,
                age_seconds,
                _MAX_ANSWER_AGE_SECONDS,
            )

        logger.info(
            "%s PoR reserve = %s oz (round %d, updated %s, stale=%s)",
            token.symbol,
            reserve,
            round_id,
            answer_ts.isoformat(),
            is_stale,
        )

        return {
            "symbol": token.symbol,
            "feed_address": feed_addr,
            "on_chain_reserve": reserve,
            "round_id": round_id,
            "answer_timestamp": answer_ts,
            "is_stale": is_stale,
        }

    def get_all_reserves(self) -> list[dict]:
        """Query PoR feeds for all configured tokens that have one."""
        results = []
        for token in config.tokens:
            result = self.get_reserve(token)
            if result is not None:
                results.append(result)
        return results
