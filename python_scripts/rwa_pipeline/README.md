# Gold RWA Token Pipeline

Python data pipeline that tracks **PAXG**, **XAUT**, and **AGX** gold-backed RWA tokens and persists time-series data to PostgreSQL for analysis.

## Architecture

```
rwa_pipeline/
├── config.py                  # Environment-driven configuration
├── pipeline.py                # Main orchestrator (single-run or daemon)
├── clients/
│   ├── etherscan.py           # ERC-20 total supply (Etherscan v2 API)
│   ├── defillama.py           # Gold RWA TVL (DeFiLlama)
│   ├── gold_price.py          # XAU/USD spot (Alpha Vantage → AllTick fallback)
│   └── chainlink_por.py       # On-chain Proof-of-Reserve (web3.py)
├── processors/
│   ├── premium_calculator.py  # Premium/Discount %, Velocity, Gold-BTC Ratio
│   └── weekend_tracker.py     # CMX weekend detection & volatility stats
├── db/
│   ├── schema.sql             # PostgreSQL DDL (TimescaleDB-compatible)
│   └── connection.py          # Connection pool, bootstrap, bulk insert helpers
└── dune_queries/
    ├── 01_lending_activity.sql  # PAXG/XAUT collateral in Aave V3 + Compound V3
    ├── 02_dex_velocity.sql      # 24h Volume / Market Cap on Uniswap V3
    ├── 03_whale_tracking.sql    # Top 100 holders + exchange inflow/outflow
    └── 04_redemption_tracker.sql # Burn events → physical gold redemption momentum
```

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `ETHERSCAN_API_KEY` | Yes | Etherscan v2 API key |
| `ALPHA_VANTAGE_API_KEY` | Yes* | Alpha Vantage key (XAU/USD) |
| `ALLTICK_API_KEY` | Yes* | AllTick key (fallback XAU/USD) |
| `ETH_RPC_URL` | Yes | Ethereum JSON-RPC endpoint (Infura/Alchemy) |
| `DATABASE_URL` | Yes | PostgreSQL DSN |
| `AGX_CONTRACT_ADDRESS` | No | Custom AGX token contract address |
| `POLL_INTERVAL_SECONDS` | No | Daemon poll interval (default: 300) |

*At least one of Alpha Vantage or AllTick is required.

## Quickstart

```bash
# 1. Install dependencies
pip install -r python_scripts/rwa_pipeline/requirements.txt

# 2. Set environment variables
export ETHERSCAN_API_KEY=your_key
export ALPHA_VANTAGE_API_KEY=your_key
export ETH_RPC_URL=https://mainnet.infura.io/v3/your_key
export DATABASE_URL=postgresql://user:pass@localhost:5432/rwa_pipeline

# 3. Run once
python -m rwa_pipeline.pipeline

# 4. Run as daemon (poll every 5 minutes)
python -m rwa_pipeline.pipeline --daemon
```

## Key Formulas

**Gold Token Premium (%)**
```
Premium = ((Token Price − Gold Spot) / Gold Spot) × 100
```

**Velocity of Circulation (Daily)**
```
Velocity = 24h Trading Volume / Market Cap
```

**Gold-to-BTC Ratio (Digital Scarcity Index)**
```
Ratio = BTC Price / (PAXG Price × 100)
```

## Database Schema

9 tables optimised for time-series queries:

| Table | Description |
|---|---|
| `token_supply` | Etherscan total supply snapshots |
| `tvl_snapshots` | DeFiLlama TVL per protocol |
| `gold_spot_prices` | XAU/USD ticks with market-open flag |
| `token_prices` | CoinGecko token prices + volume + market cap |
| `gold_premium` | Calculated premium/discount per token |
| `por_verification` | Chainlink PoR on-chain reserve vs. reported supply |
| `weekend_price_log` | CMX-closure price ticks for volatility analysis |
| `derived_metrics` | Velocity and Gold-BTC ratio |
| `pipeline_runs` | Audit log for each run |

## Dune Analytics Queries

Import the `.sql` files from `dune_queries/` directly into [dune.com](https://dune.com).

Each query supports parameterisation via Dune's `{{parameter}}` syntax:

- **Q3 Whale Tracking**: `{{token_symbol}}` (PAXG/XAUT), `{{top_n_holders}}`
- **Q4 Redemption**: `{{lookback_days}}`, `{{granularity}}` (day/week/month)

## Chainlink PoR Feeds

| Token | Feed Address (Ethereum) |
|---|---|
| PAXG | `0x54a0A96C41f77B1Bb92e21d6Ad69Bd7c7b70F94c` |
| XAUT | `0x214eD9Da11D2fbe465a6fc601a91E62EbEc1a0D6` |

The pipeline raises a `WARNING` log if reserves fall below reported supply (under-collateralisation alert).
