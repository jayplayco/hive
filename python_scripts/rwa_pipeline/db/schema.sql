-- ============================================================
--  Gold RWA Pipeline — PostgreSQL Time-Series Schema
--  Designed for append-only writes; reads via time-range queries.
--  Compatible with vanilla Postgres 14+ and TimescaleDB hypertables.
-- ============================================================

-- Enable TimescaleDB extension (no-op on plain Postgres).
-- CREATE EXTENSION IF NOT EXISTS timescaledb;

-- ────────────────────────────────────────────────────────────
-- 1. Token supply snapshots  (Etherscan totalSupply)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS token_supply (
    id              BIGSERIAL PRIMARY KEY,
    captured_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    symbol          TEXT        NOT NULL,                   -- PAXG | XAUT | AGX
    contract_address TEXT       NOT NULL,
    total_supply    NUMERIC(38, 18) NOT NULL,               -- raw token units
    total_supply_usd NUMERIC(24, 6),                        -- supply × token_price_usd
    block_number    BIGINT
);

CREATE INDEX IF NOT EXISTS idx_token_supply_symbol_time
    ON token_supply (symbol, captured_at DESC);

-- TimescaleDB hypertable (uncomment when extension is enabled):
-- SELECT create_hypertable('token_supply', 'captured_at', if_not_exists => TRUE);

-- ────────────────────────────────────────────────────────────
-- 2. TVL snapshots  (DeFiLlama RWA/gold category)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tvl_snapshots (
    id              BIGSERIAL PRIMARY KEY,
    captured_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    protocol        TEXT        NOT NULL,   -- e.g. "paxos", "tether-gold"
    chain           TEXT        NOT NULL DEFAULT 'ethereum',
    tvl_usd         NUMERIC(24, 6) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tvl_protocol_time
    ON tvl_snapshots (protocol, captured_at DESC);

-- ────────────────────────────────────────────────────────────
-- 3. Gold spot price ticks  (Alpha Vantage / AllTick XAU/USD)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gold_spot_prices (
    id              BIGSERIAL PRIMARY KEY,
    captured_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    source          TEXT        NOT NULL,   -- "alpha_vantage" | "alltick"
    xau_usd         NUMERIC(12, 6) NOT NULL,
    is_market_open  BOOLEAN     NOT NULL DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_gold_price_time
    ON gold_spot_prices (captured_at DESC);

-- ────────────────────────────────────────────────────────────
-- 4. Token market prices  (from DEX or CoinGecko / CoinMarketCap)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS token_prices (
    id              BIGSERIAL PRIMARY KEY,
    captured_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    symbol          TEXT        NOT NULL,
    price_usd       NUMERIC(20, 8) NOT NULL,
    volume_24h_usd  NUMERIC(24, 6),
    market_cap_usd  NUMERIC(24, 6),
    source          TEXT        NOT NULL DEFAULT 'coingecko'
);

CREATE INDEX IF NOT EXISTS idx_token_price_symbol_time
    ON token_prices (symbol, captured_at DESC);

-- ────────────────────────────────────────────────────────────
-- 5. Premium / Discount calculations
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gold_premium (
    id              BIGSERIAL PRIMARY KEY,
    captured_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    symbol          TEXT        NOT NULL,
    token_price_usd NUMERIC(20, 8) NOT NULL,
    gold_spot_usd   NUMERIC(12, 6) NOT NULL,
    -- Premium formula: ((token_price - gold_spot) / gold_spot) * 100
    premium_pct     NUMERIC(10, 6) NOT NULL,
    is_premium      BOOLEAN     NOT NULL GENERATED ALWAYS AS (premium_pct >= 0) STORED,
    is_weekend      BOOLEAN     NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_premium_symbol_time
    ON gold_premium (symbol, captured_at DESC);

-- ────────────────────────────────────────────────────────────
-- 6. Chainlink Proof-of-Reserve verification
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS por_verification (
    id                  BIGSERIAL PRIMARY KEY,
    captured_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    symbol              TEXT        NOT NULL,
    feed_address        TEXT        NOT NULL,
    on_chain_reserve    NUMERIC(38, 18) NOT NULL,   -- from Chainlink PoR feed
    reported_supply     NUMERIC(38, 18) NOT NULL,   -- from token_supply table
    -- Positive means reserves exceed supply (over-collateralised).
    -- Negative means under-collateralised — critical alert.
    reserve_delta       NUMERIC(38, 18) NOT NULL GENERATED ALWAYS AS
                            (on_chain_reserve - reported_supply) STORED,
    is_backed           BOOLEAN     NOT NULL GENERATED ALWAYS AS
                            (on_chain_reserve >= reported_supply) STORED,
    round_id            BIGINT,
    answer_timestamp    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_por_symbol_time
    ON por_verification (symbol, captured_at DESC);

-- ────────────────────────────────────────────────────────────
-- 7. Weekend volatility log
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS weekend_price_log (
    id              BIGSERIAL PRIMARY KEY,
    captured_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    symbol          TEXT        NOT NULL,
    price_usd       NUMERIC(20, 8) NOT NULL,
    gold_spot_usd   NUMERIC(12, 6),             -- last known spot before market close
    premium_pct     NUMERIC(10, 6),
    session_start   TIMESTAMPTZ NOT NULL,       -- Friday 17:00 EST of that weekend
    session_end     TIMESTAMPTZ NOT NULL        -- Sunday 18:00 EST of that weekend
);

CREATE INDEX IF NOT EXISTS idx_weekend_symbol_session
    ON weekend_price_log (symbol, session_start DESC);

-- ────────────────────────────────────────────────────────────
-- 8. Derived metrics (velocity, gold-BTC ratio)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS derived_metrics (
    id              BIGSERIAL PRIMARY KEY,
    captured_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    symbol          TEXT        NOT NULL,
    -- Velocity = 24h_volume / market_cap
    velocity        NUMERIC(10, 8),
    -- Gold-BTC Ratio = btc_price / (paxg_price * 100)  [only relevant for PAXG]
    gold_btc_ratio  NUMERIC(14, 8),
    btc_price_usd   NUMERIC(20, 8)
);

CREATE INDEX IF NOT EXISTS idx_derived_symbol_time
    ON derived_metrics (symbol, captured_at DESC);

-- ────────────────────────────────────────────────────────────
-- 9. Pipeline run audit log
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pipeline_runs (
    id              BIGSERIAL PRIMARY KEY,
    started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finished_at     TIMESTAMPTZ,
    status          TEXT        NOT NULL DEFAULT 'running',  -- running | success | error
    error_message   TEXT,
    records_written INT         NOT NULL DEFAULT 0
);
