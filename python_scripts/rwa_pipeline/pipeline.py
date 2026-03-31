"""
Gold RWA Token Pipeline — main orchestrator.

Execution flow (each poll cycle):
  1. Open a pipeline_runs audit record.
  2. Fetch token total supplies from Etherscan.
  3. Fetch TVL snapshots from DeFiLlama.
  4. Fetch XAU/USD spot price (Alpha Vantage → AllTick fallback).
  5. Fetch token prices from CoinGecko (free tier — no API key required).
  6. Calculate premium/discount for each token.
  7. Verify on-chain reserves via Chainlink PoR.
  8. Detect weekend CMX closure → write weekend_price_log rows.
  9. Compute derived metrics (velocity, Gold-BTC ratio).
  10. Persist everything to PostgreSQL.
  11. Close the audit record.

Run as a one-shot job (e.g. from cron / Kubernetes CronJob) or as a
continuous daemon with --daemon flag:

    python -m rwa_pipeline.pipeline          # single run
    python -m rwa_pipeline.pipeline --daemon # loop every POLL_INTERVAL_SECONDS
"""

import argparse
import datetime
import logging
import sys
import time
from decimal import Decimal
from typing import Optional

import requests

from rwa_pipeline.clients.chainlink_por import ChainlinkPoRClient
from rwa_pipeline.clients.defillama import DeFiLlamaClient
from rwa_pipeline.clients.etherscan import EtherscanClient
from rwa_pipeline.clients.gold_price import GoldPriceClient
from rwa_pipeline.config import config
from rwa_pipeline.db import connection as db
from rwa_pipeline.processors import premium_calculator as calc
from rwa_pipeline.processors import weekend_tracker as weekend

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s  %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S",
)
logger = logging.getLogger(__name__)

# ── CoinGecko token IDs (free, no API key) ────────────────────────────────────
_COINGECKO_IDS: dict[str, str] = {
    "PAXG": "pax-gold",
    "XAUT": "tether-gold",
    "BTC":  "bitcoin",
    # AGX: add CoinGecko ID once listed
}
_COINGECKO_URL = "https://api.coingecko.com/api/v3/simple/price"


def _fetch_token_prices(symbols: list[str]) -> dict[str, dict]:
    """
    Fetch USD price, 24h volume, and market cap from CoinGecko.

    Returns: { "PAXG": {"price_usd": Decimal, "volume_24h_usd": Decimal,
                        "market_cap_usd": Decimal}, ... }
    """
    ids_needed = {sym: _COINGECKO_IDS[sym] for sym in symbols if sym in _COINGECKO_IDS}
    if not ids_needed:
        return {}

    params = {
        "ids": ",".join(ids_needed.values()),
        "vs_currencies": "usd",
        "include_market_cap": "true",
        "include_24hr_vol": "true",
    }
    resp = requests.get(_COINGECKO_URL, params=params, timeout=10)
    resp.raise_for_status()
    raw = resp.json()

    result: dict[str, dict] = {}
    for sym, cg_id in ids_needed.items():
        entry = raw.get(cg_id, {})
        result[sym] = {
            "price_usd":      Decimal(str(entry.get("usd", 0))),
            "volume_24h_usd": Decimal(str(entry.get("usd_24h_vol", 0))),
            "market_cap_usd": Decimal(str(entry.get("usd_market_cap", 0))),
        }
    return result


def run_once() -> int:
    """
    Execute one full pipeline cycle.

    Returns the number of DB rows written across all tables.
    """
    run_id = db.upsert_pipeline_run(None)
    records_written = 0
    now = datetime.datetime.now(tz=datetime.timezone.utc)

    try:
        # ── 1. Etherscan total supplies ───────────────────────────────────────
        logger.info("Fetching token supplies from Etherscan…")
        etherscan = EtherscanClient()
        supplies = etherscan.get_all_token_supplies()

        supply_rows = []
        for s in supplies:
            supply_rows.append({
                "symbol":           s["symbol"],
                "contract_address": s["contract_address"],
                "total_supply":     float(s["total_supply"]),
                "block_number":     s.get("block_number"),
            })
        records_written += db.insert_many("token_supply", supply_rows)

        # ── 2. DeFiLlama TVL ─────────────────────────────────────────────────
        logger.info("Fetching TVL from DeFiLlama…")
        defillama = DeFiLlamaClient()
        tvls = defillama.get_all_tvls()

        tvl_rows = [
            {"protocol": t["protocol"], "chain": t["chain"], "tvl_usd": t["tvl_usd"]}
            for t in tvls
        ]
        records_written += db.insert_many("tvl_snapshots", tvl_rows)

        # ── 3. Gold spot price ────────────────────────────────────────────────
        logger.info("Fetching XAU/USD spot price…")
        gold_client = GoldPriceClient()
        spot = gold_client.get_spot_price()
        xau_usd: Decimal = spot["xau_usd"]
        is_market_open = not weekend.is_cmx_weekend(now)

        records_written += db.insert_many("gold_spot_prices", [{
            "source":         spot["source"],
            "xau_usd":        float(xau_usd),
            "is_market_open": is_market_open,
        }])

        # ── 4. Token market prices (CoinGecko) ────────────────────────────────
        logger.info("Fetching token prices from CoinGecko…")
        price_symbols = ["PAXG", "XAUT", "BTC"]
        prices = _fetch_token_prices(price_symbols)

        token_price_rows = []
        for sym, data in prices.items():
            if sym == "BTC":
                continue  # BTC stored in derived_metrics, not token_prices
            token_price_rows.append({
                "symbol":         sym,
                "price_usd":      float(data["price_usd"]),
                "volume_24h_usd": float(data["volume_24h_usd"]),
                "market_cap_usd": float(data["market_cap_usd"]),
                "source":         "coingecko",
            })
        records_written += db.insert_many("token_prices", token_price_rows)

        # ── 5. Premium / Discount ─────────────────────────────────────────────
        logger.info("Calculating gold token premium/discount…")
        in_weekend = weekend.is_cmx_weekend(now)

        premium_rows = []
        for sym in ["PAXG", "XAUT"]:
            if sym not in prices:
                continue
            token_price = prices[sym]["price_usd"]
            try:
                row = calc.build_premium_row(sym, token_price, xau_usd, is_weekend=in_weekend)
                premium_rows.append(row)
                logger.info(
                    "%s premium = %.4f%% (token=$%.2f, spot=$%.2f)",
                    sym, row["premium_pct"], float(token_price), float(xau_usd),
                )
            except ZeroDivisionError as exc:
                logger.error("Premium calc failed for %s: %s", sym, exc)

        records_written += db.insert_many("gold_premium", premium_rows)

        # ── 6. Chainlink Proof of Reserve ─────────────────────────────────────
        logger.info("Checking Chainlink Proof-of-Reserve feeds…")
        por_client = ChainlinkPoRClient()
        reserves = por_client.get_all_reserves()

        supply_map = {s["symbol"]: s["total_supply"] for s in supplies}

        por_rows = []
        for r in reserves:
            sym = r["symbol"]
            on_chain = r["on_chain_reserve"]
            reported = supply_map.get(sym, Decimal("0"))
            por_rows.append({
                "symbol":           sym,
                "feed_address":     r["feed_address"],
                "on_chain_reserve": float(on_chain),
                "reported_supply":  float(reported),
                "round_id":         r.get("round_id"),
                "answer_timestamp": r.get("answer_timestamp"),
            })
            if float(on_chain) < float(reported):
                logger.warning(
                    "ALERT: %s is UNDER-COLLATERALISED! reserve=%s < supply=%s",
                    sym, on_chain, reported,
                )

        records_written += db.insert_many("por_verification", por_rows)

        # ── 7. Weekend volatility logging ─────────────────────────────────────
        if in_weekend:
            logger.info("CMX market is CLOSED — writing weekend price log…")
            weekend_rows = []
            for sym in ["PAXG", "XAUT"]:
                if sym not in prices:
                    continue
                token_price = prices[sym]["price_usd"]
                premium_pct = None
                for r in premium_rows:
                    if r["symbol"] == sym:
                        premium_pct = Decimal(str(r["premium_pct"]))
                        break
                try:
                    row = weekend.build_weekend_log_row(
                        symbol=sym,
                        price_usd=token_price,
                        gold_spot_usd=xau_usd,
                        premium_pct=premium_pct,
                        dt=now,
                    )
                    weekend_rows.append(row)
                except ValueError as exc:
                    logger.error("Weekend log skipped for %s: %s", sym, exc)

            records_written += db.insert_many("weekend_price_log", weekend_rows)

        # ── 8. Derived metrics ────────────────────────────────────────────────
        logger.info("Computing derived metrics…")
        btc_price: Optional[Decimal] = prices.get("BTC", {}).get("price_usd")
        paxg_price: Optional[Decimal] = prices.get("PAXG", {}).get("price_usd")

        derived_rows = []
        for sym in ["PAXG", "XAUT"]:
            if sym not in prices:
                continue
            p = prices[sym]
            row = calc.build_derived_metrics_row(
                symbol=sym,
                volume_24h_usd=p.get("volume_24h_usd"),
                market_cap_usd=p.get("market_cap_usd"),
                btc_price_usd=btc_price,
                paxg_price_usd=paxg_price if sym == "PAXG" else None,
            )
            derived_rows.append(row)

        records_written += db.insert_many("derived_metrics", derived_rows)

        # ── Finalise audit record ─────────────────────────────────────────────
        db.upsert_pipeline_run(
            run_id,
            finished_at=datetime.datetime.now(tz=datetime.timezone.utc),
            status="success",
            records_written=records_written,
        )
        logger.info("Pipeline run #%d complete. Records written: %d", run_id, records_written)

    except Exception as exc:
        logger.exception("Pipeline run #%d FAILED: %s", run_id, exc)
        db.upsert_pipeline_run(
            run_id,
            finished_at=datetime.datetime.now(tz=datetime.timezone.utc),
            status="error",
            error_message=str(exc),
            records_written=records_written,
        )
        raise

    return records_written


def main() -> None:
    parser = argparse.ArgumentParser(description="Gold RWA Token Pipeline")
    parser.add_argument(
        "--daemon",
        action="store_true",
        help=f"Run continuously, polling every {config.poll_interval_seconds}s",
    )
    args = parser.parse_args()

    logger.info("Initialising database connection pool…")
    db.init_pool()
    db.bootstrap_schema()

    if args.daemon:
        logger.info(
            "Starting daemon mode (interval=%ds)…", config.poll_interval_seconds
        )
        while True:
            try:
                run_once()
            except Exception:
                logger.error("Run failed — will retry in %ds.", config.poll_interval_seconds)
            time.sleep(config.poll_interval_seconds)
    else:
        try:
            run_once()
        except Exception:
            sys.exit(1)


if __name__ == "__main__":
    main()
