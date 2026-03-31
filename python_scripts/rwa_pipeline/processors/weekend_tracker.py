"""
Weekend Price Volatility Tracker.

CMX (COMEX) gold futures market hours (Eastern Time):
  Monday – Friday  06:00 – 17:00  (open)
  Friday  17:00    – Sunday 18:00  (closed)

This module:
  1. Detects whether the current moment falls inside a CMX weekend closure.
  2. Computes the session boundaries (Friday 17:00 EST → Sunday 18:00 EST).
  3. Builds weekend price log rows suitable for db insertion.
  4. Provides a basic intra-session volatility summary (min, max, std-dev).
"""

import datetime
import logging
import statistics
from decimal import Decimal
from typing import Optional
from zoneinfo import ZoneInfo

from rwa_pipeline.config import config

logger = logging.getLogger(__name__)

_EST = ZoneInfo("America/New_York")

# isoweekday(): Monday=1 … Sunday=7
_FRIDAY = 5
_SUNDAY = 7


def _now_est() -> datetime.datetime:
    return datetime.datetime.now(tz=_EST)


def is_cmx_weekend(dt: Optional[datetime.datetime] = None) -> bool:
    """
    Return True if *dt* (default: now) falls within a CMX weekend closure.

    Closure window:  Friday 17:00 EST  →  Sunday 18:00 EST
    """
    if dt is None:
        dt = _now_est()
    elif dt.tzinfo is None:
        dt = dt.replace(tzinfo=_EST)

    dt_est = dt.astimezone(_EST)
    weekday = dt_est.isoweekday()  # 1=Mon … 7=Sun
    hour = dt_est.hour

    if weekday == _FRIDAY and hour >= config.weekend_close_hour_est:
        return True
    if weekday == 6:  # Saturday — fully closed
        return True
    if weekday == _SUNDAY and hour < config.weekend_open_hour_est:
        return True

    return False


def get_current_session_bounds(
    dt: Optional[datetime.datetime] = None,
) -> tuple[datetime.datetime, datetime.datetime]:
    """
    Return (session_start, session_end) for the CMX weekend that contains *dt*.

    Raises ValueError if *dt* is not within a CMX weekend window.
    """
    if dt is None:
        dt = _now_est()
    elif dt.tzinfo is None:
        dt = dt.replace(tzinfo=_EST)

    dt_est = dt.astimezone(_EST)

    if not is_cmx_weekend(dt_est):
        raise ValueError(f"{dt_est.isoformat()} is not within a CMX weekend closure.")

    weekday = dt_est.isoweekday()

    # Find the preceding Friday
    if weekday == _FRIDAY:
        friday = dt_est.date()
    elif weekday == 6:  # Saturday
        friday = dt_est.date() - datetime.timedelta(days=1)
    else:  # Sunday before 18:00
        friday = dt_est.date() - datetime.timedelta(days=2)

    session_start = datetime.datetime(
        friday.year, friday.month, friday.day,
        config.weekend_close_hour_est, 0, 0,
        tzinfo=_EST,
    )

    sunday = friday + datetime.timedelta(days=2)
    session_end = datetime.datetime(
        sunday.year, sunday.month, sunday.day,
        config.weekend_open_hour_est, 0, 0,
        tzinfo=_EST,
    )

    return session_start, session_end


def build_weekend_log_row(
    symbol: str,
    price_usd: Decimal,
    gold_spot_usd: Optional[Decimal] = None,
    premium_pct: Optional[Decimal] = None,
    dt: Optional[datetime.datetime] = None,
) -> dict:
    """
    Build a row for the weekend_price_log table.

    Raises ValueError if called outside a CMX weekend window.
    """
    if dt is None:
        dt = _now_est()

    session_start, session_end = get_current_session_bounds(dt)

    return {
        "symbol": symbol,
        "price_usd": float(price_usd),
        "gold_spot_usd": float(gold_spot_usd) if gold_spot_usd is not None else None,
        "premium_pct": float(premium_pct) if premium_pct is not None else None,
        "session_start": session_start.isoformat(),
        "session_end": session_end.isoformat(),
    }


def compute_session_volatility(prices: list[Decimal]) -> dict:
    """
    Compute basic descriptive statistics for prices observed during a weekend session.

    Args:
        prices: List of Decimal token prices sampled during the session.

    Returns:
        {
            "count":     int,
            "min":       Decimal,
            "max":       Decimal,
            "mean":      Decimal,
            "std_dev":   Decimal | None,   # None when count < 2
            "range_pct": Decimal,          # (max − min) / min × 100
        }
    """
    if not prices:
        return {}

    floats = [float(p) for p in prices]
    mn = min(floats)
    mx = max(floats)
    mean = statistics.mean(floats)
    std = statistics.stdev(floats) if len(floats) >= 2 else None
    range_pct = ((mx - mn) / mn * 100) if mn != 0 else 0.0

    logger.info(
        "Weekend session volatility: count=%d min=%.4f max=%.4f mean=%.4f std=%.4f range_pct=%.4f%%",
        len(prices), mn, mx, mean, std or 0.0, range_pct,
    )

    return {
        "count": len(prices),
        "min": Decimal(str(mn)),
        "max": Decimal(str(mx)),
        "mean": Decimal(str(mean)),
        "std_dev": Decimal(str(std)) if std is not None else None,
        "range_pct": Decimal(str(range_pct)),
    }
