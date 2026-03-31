"""
Premium / Discount calculator and derived-metric engine.

Key formulas
────────────
Gold Token Premium (%)
    Premium = ((Token Price − Gold Spot) / Gold Spot) × 100

Velocity of Circulation (Daily)
    Velocity = 24h Trading Volume / Current Market Cap

Gold-to-BTC Ratio (Digital Scarcity Index)
    Ratio = BTC Price / (PAXG Price × 100)
"""

import logging
from decimal import Decimal, ROUND_HALF_UP
from typing import Optional

logger = logging.getLogger(__name__)

_PRECISION = Decimal("0.000001")


def calculate_premium(token_price_usd: Decimal, gold_spot_usd: Decimal) -> Decimal:
    """
    Return the premium (positive) or discount (negative) of a gold token
    relative to the XAU/USD spot price, expressed as a percentage.

    Args:
        token_price_usd: Current token price in USD.
        gold_spot_usd:   XAU/USD spot price (1 troy oz).

    Returns:
        Premium percentage; negative value means the token trades at a discount.

    Raises:
        ZeroDivisionError: if gold_spot_usd is zero.
    """
    if gold_spot_usd == 0:
        raise ZeroDivisionError("Gold spot price is zero — cannot calculate premium.")

    premium = ((token_price_usd - gold_spot_usd) / gold_spot_usd) * Decimal("100")
    return premium.quantize(_PRECISION, rounding=ROUND_HALF_UP)


def calculate_velocity(volume_24h_usd: Decimal, market_cap_usd: Decimal) -> Optional[Decimal]:
    """
    Velocity = 24h Trading Volume / Market Cap.

    High velocity → token is actively circulating in DeFi / trading.
    Low velocity  → token is held as a store of value (low turnover).

    Returns None if market_cap_usd is zero.
    """
    if market_cap_usd == 0:
        logger.warning("Market cap is zero; cannot compute velocity.")
        return None

    velocity = volume_24h_usd / market_cap_usd
    return velocity.quantize(_PRECISION, rounding=ROUND_HALF_UP)


def calculate_gold_btc_ratio(
    btc_price_usd: Decimal, paxg_price_usd: Decimal
) -> Optional[Decimal]:
    """
    Gold-to-BTC Ratio (Digital Scarcity Index).

    Ratio = BTC Price / (PAXG Price × 100)

    Interpretation:
      > 1  → BTC is more expensive than 100 oz of gold (BTC premium)
      < 1  → 100 oz of gold costs more than 1 BTC (gold premium)

    Returns None if paxg_price_usd is zero.
    """
    if paxg_price_usd == 0:
        logger.warning("PAXG price is zero; cannot compute Gold-BTC ratio.")
        return None

    ratio = btc_price_usd / (paxg_price_usd * Decimal("100"))
    return ratio.quantize(_PRECISION, rounding=ROUND_HALF_UP)


def build_premium_row(
    symbol: str,
    token_price_usd: Decimal,
    gold_spot_usd: Decimal,
    is_weekend: bool = False,
) -> dict:
    """
    Convenience wrapper — returns a dict ready for db.insert_many('gold_premium', ...).
    """
    premium_pct = calculate_premium(token_price_usd, gold_spot_usd)
    return {
        "symbol": symbol,
        "token_price_usd": float(token_price_usd),
        "gold_spot_usd": float(gold_spot_usd),
        "premium_pct": float(premium_pct),
        "is_weekend": is_weekend,
    }


def build_derived_metrics_row(
    symbol: str,
    volume_24h_usd: Optional[Decimal],
    market_cap_usd: Optional[Decimal],
    btc_price_usd: Optional[Decimal],
    paxg_price_usd: Optional[Decimal],
) -> dict:
    """Return a dict ready for db.insert_many('derived_metrics', ...)."""
    velocity = None
    if volume_24h_usd is not None and market_cap_usd is not None:
        velocity = calculate_velocity(volume_24h_usd, market_cap_usd)

    gold_btc_ratio = None
    if btc_price_usd is not None and paxg_price_usd is not None:
        gold_btc_ratio = calculate_gold_btc_ratio(btc_price_usd, paxg_price_usd)

    return {
        "symbol": symbol,
        "velocity": float(velocity) if velocity is not None else None,
        "gold_btc_ratio": float(gold_btc_ratio) if gold_btc_ratio is not None else None,
        "btc_price_usd": float(btc_price_usd) if btc_price_usd is not None else None,
    }
