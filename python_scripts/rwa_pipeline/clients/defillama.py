"""DeFiLlama API client — fetches Gold RWA TVL data."""

import logging
from typing import Optional

import requests

logger = logging.getLogger(__name__)

_RWA_GOLD_URL = "https://api.defillama.com/rwa/category/gold"
_PROTOCOL_BASE = "https://api.defillama.com/protocol"

# Map our token symbols to DeFiLlama protocol slugs
_PROTOCOL_SLUGS: dict[str, str] = {
    "PAXG": "paxos",
    "XAUT": "tether-gold",
    "AGX": "agx",  # placeholder — update when listed on DeFiLlama
}


class DeFiLlamaClient:
    def __init__(self) -> None:
        self._session = requests.Session()
        self._session.headers.update({"Accept": "application/json"})

    def get_gold_rwa_category(self) -> list[dict]:
        """
        Fetch the entire Gold RWA category from DeFiLlama.

        Returns a list of protocol dicts, each containing at minimum:
            { "name": str, "tvl": float, "chain": str, ... }
        """
        resp = self._session.get(_RWA_GOLD_URL, timeout=15)
        resp.raise_for_status()
        data = resp.json()

        # DeFiLlama returns {"protocols": [...]} or a plain list depending on version.
        protocols = data.get("protocols", data) if isinstance(data, dict) else data

        logger.debug("DeFiLlama returned %d gold RWA protocols", len(protocols))
        return protocols

    def get_protocol_tvl(self, symbol: str) -> Optional[dict]:
        """
        Fetch detailed TVL breakdown for a single protocol by symbol.

        Returns:
            {
                "protocol": str,
                "chain": str,
                "tvl_usd": float,
                "chains": dict[str, float],
            }
        """
        slug = _PROTOCOL_SLUGS.get(symbol.upper())
        if not slug:
            logger.warning("No DeFiLlama slug for symbol %s", symbol)
            return None

        try:
            resp = self._session.get(f"{_PROTOCOL_BASE}/{slug}", timeout=15)
            resp.raise_for_status()
            data = resp.json()
        except Exception as exc:
            logger.error("DeFiLlama protocol fetch failed for %s: %s", symbol, exc)
            return None

        # Extract the most recent TVL value
        chain_tvls = data.get("chainTvls", {})
        total_tvl = data.get("tvl", [])
        latest_tvl = total_tvl[-1]["totalLiquidityUSD"] if total_tvl else 0.0

        chain_breakdown: dict[str, float] = {}
        for chain_name, series in chain_tvls.items():
            if isinstance(series, dict) and "tvl" in series:
                tvl_series = series["tvl"]
                if tvl_series:
                    chain_breakdown[chain_name] = tvl_series[-1].get(
                        "totalLiquidityUSD", 0.0
                    )

        logger.debug("%s TVL = $%.2f", symbol, latest_tvl)

        return {
            "protocol": slug,
            "chain": "ethereum",  # primary chain
            "tvl_usd": latest_tvl,
            "chains": chain_breakdown,
        }

    def get_all_tvls(self) -> list[dict]:
        """Return TVL snapshots for PAXG, XAUT, and AGX."""
        results = []
        for symbol in _PROTOCOL_SLUGS:
            row = self.get_protocol_tvl(symbol)
            if row:
                results.append(row)
        return results
