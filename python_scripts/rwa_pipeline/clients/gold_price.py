"""Gold spot price client — Alpha Vantage primary, AllTick fallback."""

import logging
from decimal import Decimal
from typing import Optional

import requests

from rwa_pipeline.config import config

logger = logging.getLogger(__name__)

# ── Alpha Vantage ─────────────────────────────────────────────────────────────
_AV_BASE = "https://www.alphavantage.co/query"
_AV_FOREX_SYMBOL = "XAU"        # "from" currency  (gold)
_AV_FOREX_MARKET  = "USD"       # "to" currency

# ── AllTick ───────────────────────────────────────────────────────────────────
_ALLTICK_BASE = "https://quote.alltick.co/quote-b-api/kline"
_ALLTICK_SYMBOL = "XAUUSD"


class GoldPriceClient:
    """Fetches XAU/USD spot price, with automatic fallback between sources."""

    def __init__(
        self,
        av_api_key: Optional[str] = None,
        alltick_api_key: Optional[str] = None,
    ) -> None:
        self._av_key = av_api_key or config.alpha_vantage_api_key
        self._alltick_key = alltick_api_key or config.alltick_api_key
        self._session = requests.Session()
        self._session.headers.update({"Accept": "application/json"})

    # ── Public API ────────────────────────────────────────────────────────────

    def get_spot_price(self) -> dict:
        """
        Return the current XAU/USD spot price.

        Tries Alpha Vantage first; falls back to AllTick on failure.

        Returns:
            {
                "xau_usd": Decimal,
                "source":  str,   # "alpha_vantage" | "alltick"
            }
        """
        if self._av_key:
            try:
                return self._fetch_alpha_vantage()
            except Exception as exc:
                logger.warning("Alpha Vantage failed (%s), trying AllTick…", exc)

        if self._alltick_key:
            try:
                return self._fetch_alltick()
            except Exception as exc:
                logger.error("AllTick also failed: %s", exc)

        raise RuntimeError(
            "All gold price sources failed. Configure ALPHA_VANTAGE_API_KEY or ALLTICK_API_KEY."
        )

    # ── Private helpers ───────────────────────────────────────────────────────

    def _fetch_alpha_vantage(self) -> dict:
        """
        Uses the CURRENCY_EXCHANGE_RATE endpoint.

        XAU is treated as a currency (troy ounce) in Alpha Vantage.
        """
        params = {
            "function": "CURRENCY_EXCHANGE_RATE",
            "from_currency": _AV_FOREX_SYMBOL,
            "to_currency": _AV_FOREX_MARKET,
            "apikey": self._av_key,
        }
        resp = self._session.get(_AV_BASE, params=params, timeout=10)
        resp.raise_for_status()
        data = resp.json()

        rate_info = data.get("Realtime Currency Exchange Rate")
        if not rate_info:
            raise ValueError(f"Unexpected Alpha Vantage response: {data}")

        price = Decimal(rate_info["5. Exchange Rate"])
        logger.debug("Alpha Vantage XAU/USD = %s", price)
        return {"xau_usd": price, "source": "alpha_vantage"}

    def _fetch_alltick(self) -> dict:
        """
        AllTick REST quote endpoint for XAUUSD.

        AllTick uses a bearer token in the Authorization header.
        """
        headers = {"Authorization": f"Bearer {self._alltick_key}"}
        params = {
            "symbol": _ALLTICK_SYMBOL,
            "type": "1",   # 1-minute candle (most recent close ≈ spot)
            "count": "1",
        }
        resp = self._session.get(
            _ALLTICK_BASE, params=params, headers=headers, timeout=10
        )
        resp.raise_for_status()
        data = resp.json()

        # AllTick wraps candles in data.klines[0].close
        candles = data.get("data", {}).get("klines", [])
        if not candles:
            raise ValueError(f"No kline data from AllTick: {data}")

        price = Decimal(str(candles[0]["close"]))
        logger.debug("AllTick XAU/USD = %s", price)
        return {"xau_usd": price, "source": "alltick"}
