-- ============================================================
--  Dune Analytics Query 2 — DEX Velocity (Uniswap V3)
--  Velocity = 24h Trading Volume / Market Cap
--
--  Covers all Uniswap V3 pools on Ethereum that contain
--  PAXG or XAUT as one leg of the swap.
--
--  Tables used:
--    uniswap_v3_ethereum.Pair_evt_Swap
--    uniswap_v3_ethereum.Factory_evt_PoolCreated
--    prices.usd
-- ============================================================

WITH

-- ── Token registry ────────────────────────────────────────────────────────────
tokens AS (
    SELECT *
    FROM (
        VALUES
            (0x45804880De22913dAFE09f4980848ECE6EcbAf78, 'PAXG', 18),
            (0x68749665FF8D2d112Fa859AA293F07A622782F38, 'XAUT',  6)
    ) AS t(contract_address, symbol, decimals)
),

-- ── All Uniswap V3 pools that contain a gold token ────────────────────────────
gold_pools AS (
    SELECT
        pc.pool,
        pc.token0,
        pc.token1,
        CASE
            WHEN pc.token0 IN (SELECT contract_address FROM tokens) THEN pc.token0
            ELSE pc.token1
        END AS gold_token_address
    FROM uniswap_v3_ethereum.Factory_evt_PoolCreated pc
    WHERE pc.token0 IN (SELECT contract_address FROM tokens)
       OR pc.token1 IN (SELECT contract_address FROM tokens)
),

-- ── Latest price per token ────────────────────────────────────────────────────
latest_prices AS (
    SELECT DISTINCT ON (contract_address)
        contract_address,
        price
    FROM prices.usd
    WHERE blockchain = 'ethereum'
      AND contract_address IN (SELECT contract_address FROM tokens)
    ORDER BY contract_address, minute DESC
),

-- ── 24h swap volume (amount0 or amount1 depending on which side is gold) ──────
-- Uniswap V3 amounts are signed: positive = in, negative = out.
-- We sum absolute values to capture total throughput (buys + sells).
volume_24h AS (
    SELECT
        gp.gold_token_address,
        SUM(
            CASE
                WHEN gp.token0 = gp.gold_token_address
                THEN ABS(CAST(s.amount0 AS DOUBLE)) / POWER(10, tk.decimals)
                ELSE ABS(CAST(s.amount1 AS DOUBLE)) / POWER(10, tk.decimals)
            END
        ) AS volume_tokens
    FROM uniswap_v3_ethereum.Pair_evt_Swap s
    INNER JOIN gold_pools gp ON gp.pool = s.contract_address
    INNER JOIN tokens tk     ON tk.contract_address = gp.gold_token_address
    WHERE s.evt_block_time >= NOW() - INTERVAL '24' HOUR
    GROUP BY gp.gold_token_address
),

-- ── Circulating supply approximation (total Transfer volume is not ideal;
--    in a real dashboard connect to your off-chain token_supply table or
--    a token-holder snapshot API. Here we estimate via known supply values.) ───
supply_approx AS (
    SELECT *
    FROM (
        VALUES
            -- PAXG ≈ 330,000 oz outstanding (update periodically)
            (0x45804880De22913dAFE09f4980848ECE6EcbAf78, 330000.0),
            -- XAUT ≈ 260,000 oz outstanding
            (0x68749665FF8D2d112Fa859AA293F07A622782F38, 260000.0)
    ) AS s(contract_address, circulating_supply)
)

-- ── Final output ──────────────────────────────────────────────────────────────
SELECT
    tk.symbol,
    ROUND(v.volume_tokens, 4)                           AS volume_24h_tokens,
    ROUND(v.volume_tokens * p.price, 2)                 AS volume_24h_usd,
    ROUND(sa.circulating_supply * p.price, 2)           AS market_cap_usd,
    -- Velocity = Volume / Market Cap
    ROUND(
        (v.volume_tokens * p.price)
        / NULLIF(sa.circulating_supply * p.price, 0),
        6
    )                                                   AS velocity,
    p.price                                             AS token_price_usd
FROM volume_24h v
INNER JOIN tokens        tk ON tk.contract_address = v.gold_token_address
INNER JOIN latest_prices  p ON  p.contract_address = v.gold_token_address
INNER JOIN supply_approx sa ON sa.contract_address = v.gold_token_address
ORDER BY volume_24h_usd DESC
;
