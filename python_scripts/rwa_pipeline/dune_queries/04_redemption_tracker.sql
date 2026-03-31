-- ============================================================
--  Dune Analytics Query 4 — Redemption Tracker
--  Monitor Burn events on-chain to estimate physical gold
--  redemption momentum for PAXG and XAUT.
--
--  How redemptions work:
--    PAXG:  holder calls redeem() → tokens sent to 0x000...dead (burn address)
--           OR Transfer event to address(0) triggers burn.
--    XAUT:  Tether mints/burns via Transfer to/from 0x000...000.
--
--  Tables used:
--    erc20_ethereum.evt_Transfer
--    prices.usd
-- ============================================================

-- ── Parameters ────────────────────────────────────────────────────────────────
-- {{lookback_days}}  : integer (default: 30)
-- {{granularity}}    : 'day' | 'week' | 'month'  (default: 'day')

WITH

-- ── Token registry ────────────────────────────────────────────────────────────
tokens AS (
    SELECT *
    FROM (
        VALUES
            ('PAXG', 0x45804880De22913dAFE09f4980848ECE6EcbAf78, 18),
            ('XAUT', 0x68749665FF8D2d112Fa859AA293F07A622782F38,  6)
    ) AS t(symbol, contract_address, decimals)
),

-- ── Latest USD price per token ────────────────────────────────────────────────
latest_prices AS (
    SELECT DISTINCT ON (contract_address)
        contract_address,
        price
    FROM prices.usd
    WHERE blockchain = 'ethereum'
      AND contract_address IN (SELECT contract_address FROM tokens)
    ORDER BY contract_address, minute DESC
),

-- ── Raw burn transfers ────────────────────────────────────────────────────────
-- Burn = Transfer to 0x000...000 (address zero) or canonical burn address.
burn_events AS (
    SELECT
        t.evt_block_time                                               AS burned_at,
        tk.symbol,
        tk.contract_address,
        tk.decimals,
        CAST(t.value AS DOUBLE) / POWER(10, tk.decimals)              AS burned_tokens,
        t.transaction_hash                                             AS tx_hash,
        t."from"                                                       AS redeemer
    FROM erc20_ethereum.evt_Transfer t
    INNER JOIN tokens tk ON tk.contract_address = t.contract_address
    WHERE t."to" IN (
        0x0000000000000000000000000000000000000000,
        0x000000000000000000000000000000000000dEaD
    )
      AND t.evt_block_time >= NOW() - INTERVAL '{{lookback_days}}' DAY
),

-- ── Aggregate by time bucket and symbol ──────────────────────────────────────
burn_by_period AS (
    SELECT
        DATE_TRUNC('{{granularity}}', burned_at)                      AS period,
        symbol,
        COUNT(*)                                                       AS burn_tx_count,
        SUM(burned_tokens)                                             AS total_burned_tokens
    FROM burn_events
    GROUP BY period, symbol
),

-- ── Running totals (cumulative redemptions over the window) ───────────────────
cumulative AS (
    SELECT
        period,
        symbol,
        burn_tx_count,
        total_burned_tokens,
        SUM(total_burned_tokens)
            OVER (PARTITION BY symbol ORDER BY period)                AS cumulative_burned_tokens
    FROM burn_by_period
),

-- ── Attach USD value ──────────────────────────────────────────────────────────
enriched AS (
    SELECT
        c.period,
        c.symbol,
        c.burn_tx_count,
        ROUND(c.total_burned_tokens, 6)                               AS burned_tokens,
        ROUND(c.total_burned_tokens * p.price, 2)                     AS burned_usd,
        ROUND(c.cumulative_burned_tokens, 6)                          AS cumulative_burned_tokens,
        ROUND(c.cumulative_burned_tokens * p.price, 2)                AS cumulative_burned_usd,
        p.price                                                        AS token_price_usd
    FROM cumulative c
    INNER JOIN latest_prices p ON p.contract_address = (
        SELECT contract_address FROM tokens WHERE symbol = c.symbol
    )
),

-- ── Overall summary for the full lookback window ──────────────────────────────
summary AS (
    SELECT
        symbol,
        SUM(burn_tx_count)                                            AS total_tx,
        ROUND(SUM(total_burned_tokens), 6)                            AS total_burned_tokens,
        ROUND(SUM(total_burned_tokens) * MAX(token_price_usd), 2)     AS total_burned_usd,
        -- Average daily redemption rate
        ROUND(SUM(total_burned_tokens) / {{lookback_days}}, 6)        AS avg_daily_burn_tokens
    FROM enriched
    GROUP BY symbol
)

-- ── Final output: time-series + summary appended ─────────────────────────────
SELECT
    TO_CHAR(period, 'YYYY-MM-DD')                                     AS period,
    symbol,
    burn_tx_count,
    burned_tokens,
    burned_usd,
    cumulative_burned_tokens,
    cumulative_burned_usd,
    token_price_usd,
    NULL::NUMERIC                                                      AS total_tx,
    NULL::NUMERIC                                                      AS total_burned_usd_summary,
    NULL::NUMERIC                                                      AS avg_daily_burn_tokens
FROM enriched

UNION ALL

SELECT
    'SUMMARY (last {{lookback_days}} days)' AS period,
    symbol,
    NULL, NULL, NULL, NULL, NULL, NULL,
    total_tx,
    total_burned_usd,
    avg_daily_burn_tokens
FROM summary

ORDER BY
    CASE WHEN period LIKE 'SUMMARY%' THEN 1 ELSE 0 END,
    period,
    symbol
;
