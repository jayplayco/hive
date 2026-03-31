"""Etherscan v2 API client — fetches ERC-20 total supply."""

import logging
from decimal import Decimal
from typing import Optional

import requests

from rwa_pipeline.config import TokenConfig, config

logger = logging.getLogger(__name__)

_BASE_URL = "https://api.etherscan.io/v2/api"
_CHAIN_ID = 1  # Ethereum mainnet


class EtherscanClient:
    def __init__(self, api_key: Optional[str] = None) -> None:
        self._api_key = api_key or config.etherscan_api_key
        self._session = requests.Session()
        self._session.headers.update({"Accept": "application/json"})

    def get_token_supply(self, token: TokenConfig) -> dict:
        """
        Return total supply (in human-readable units) for *token*.

        Etherscan returns the raw integer supply; we divide by 10^decimals.

        Returns:
            {
                "symbol": str,
                "contract_address": str,
                "total_supply_raw": Decimal,   # wei-level integer
                "total_supply": Decimal,        # human units
                "block_number": int | None,
            }
        """
        params = {
            "chainid": _CHAIN_ID,
            "module": "stats",
            "action": "tokensupply",
            "contractaddress": token.contract_address,
            "apikey": self._api_key,
        }

        resp = self._session.get(_BASE_URL, params=params, timeout=10)
        resp.raise_for_status()
        data = resp.json()

        if data.get("status") != "1":
            raise ValueError(
                f"Etherscan error for {token.symbol}: {data.get('message')} — {data.get('result')}"
            )

        raw_supply = Decimal(data["result"])
        human_supply = raw_supply / Decimal(10 ** token.decimals)

        logger.debug(
            "%s total supply: %s (raw=%s)", token.symbol, human_supply, raw_supply
        )

        # Optionally fetch the latest block number for the record.
        block_number = self._get_latest_block()

        return {
            "symbol": token.symbol,
            "contract_address": token.contract_address,
            "total_supply_raw": raw_supply,
            "total_supply": human_supply,
            "block_number": block_number,
        }

    def _get_latest_block(self) -> Optional[int]:
        """Return the current Ethereum block number (best-effort)."""
        try:
            params = {
                "chainid": _CHAIN_ID,
                "module": "proxy",
                "action": "eth_blockNumber",
                "apikey": self._api_key,
            }
            resp = self._session.get(_BASE_URL, params=params, timeout=5)
            resp.raise_for_status()
            hex_block = resp.json().get("result", "0x0")
            return int(hex_block, 16)
        except Exception as exc:
            logger.warning("Could not fetch block number: %s", exc)
            return None

    def get_all_token_supplies(self) -> list[dict]:
        """Fetch supplies for all configured tokens."""
        results = []
        for token in config.tokens:
            if not token.contract_address:
                logger.warning("Skipping %s — no contract address configured", token.symbol)
                continue
            try:
                results.append(self.get_token_supply(token))
            except Exception as exc:
                logger.error("Failed to fetch supply for %s: %s", token.symbol, exc)
        return results
