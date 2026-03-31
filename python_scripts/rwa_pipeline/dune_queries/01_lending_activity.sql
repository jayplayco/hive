-- ============================================================
--  Dune Analytics Query 1 — Lending Activity
--  Total value of PAXG / XAUT deposited as collateral in
--  Aave V3 and Compound V3 (Ethereum mainnet).
--
--  Tables used:
--    aave_v3_ethereum.AToken_evt_Transfer
--    aave_v3_ethereum.Pool_evt_Supply
--    aave_v3_ethereum.Pool_evt_Withdraw
--    compound_v3_ethereum.CometExt_evt_Supply
--    compound_v3_ethereum.CometExt_evt_Withdraw
--    prices.usd   (Dune's native price table)
-- ============================================================

WITH

-- ── Token metadata ────────────────────────────────────────────────────────────
tokens AS (
    SELECT
        contract_address,
        symbol,
        decimals
    FROM (
        VALUES
            (0x45804880De22913dAFE09f4980848ECE6EcbAf78, 'PAXG', 18),
            (0x68749665FF8D2d112Fa859AA293F07A622782F38, 'XAUT',  6)
    ) AS t(contract_address, symbol, decimals)
),

-- ── Aave V3 — net deposit (Supply − Withdraw) per token ──────────────────────
aave_supply AS (
    SELECT
        s.reserve                                  AS token_address,
        SUM(CAST(s.amount AS DOUBLE) / POWER(10, tk.decimals))  AS deposited_raw
    FROM aave_v3_ethereum.Pool_evt_Supply  s
    INNER JOIN tokens tk ON tk.contract_address = s.reserve
    GROUP BY s.reserve
),

aave_withdraw AS (
    SELECT
        w.reserve                                  AS token_address,
        SUM(CAST(w.amount AS DOUBLE) / POWER(10, tk.decimals))  AS withdrawn_raw
    FROM aave_v3_ethereum.Pool_evt_Withdraw w
    INNER JOIN tokens tk ON tk.contract_address = w.reserve
    GROUP BY w.reserve
),

aave_net AS (
    SELECT
        tk.symbol,
        tk.contract_address,
        COALESCE(s.deposited_raw,  0) - COALESCE(w.withdrawn_raw, 0) AS net_tokens,
        'Aave V3'                                                      AS protocol
    FROM tokens tk
    LEFT JOIN aave_supply   s ON s.token_address = tk.contract_address
    LEFT JOIN aave_withdraw w ON w.token_address = tk.contract_address
),

-- ── Compound V3 — net deposit per token ──────────────────────────────────────
compound_supply AS (
    SELECT
        s.asset                                    AS token_address,
        SUM(CAST(s.amount AS DOUBLE) / POWER(10, tk.decimals)) AS deposited_raw
    FROM compound_v3_ethereum.CometExt_evt_Supply s
    INNER JOIN tokens tk ON tk.contract_address = s.asset
    GROUP BY s.asset
),

compound_withdraw AS (
    SELECT
        w.asset                                    AS token_address,
        SUM(CAST(w.amount AS DOUBLE) / POWER(10, tk.decimals)) AS withdrawn_raw
    FROM compound_v3_ethereum.CometExt_evt_Withdraw w
    INNER JOIN tokens tk ON tk.contract_address = w.asset
    GROUP BY w.asset
),

compound_net AS (
    SELECT
        tk.symbol,
        tk.contract_address,
        COALESCE(s.deposited_raw,  0) - COALESCE(w.withdrawn_raw, 0) AS net_tokens,
        'Compound V3'                                                  AS protocol
    FROM tokens tk
    LEFT JOIN compound_supply   s ON s.token_address = tk.contract_address
    LEFT JOIN compound_withdraw w ON w.token_address = tk.contract_address
),

-- ── Latest USD prices ─────────────────────────────────────────────────────────
latest_prices AS (
    SELECT DISTINCT ON (contract_address)
        contract_address,
        price
    FROM prices.usd
    WHERE blockchain = 'ethereum'
      AND contract_address IN (
          SELECT contract_address FROM tokens
      )
    ORDER BY contract_address, minute DESC
),

-- ── Combine Aave + Compound ───────────────────────────────────────────────────
combined AS (
    SELECT * FROM aave_net
    UNION ALL
    SELECT * FROM compound_net
)

-- ── Final output ─────────────────────────────────────────────────────────────
SELECT
    c.protocol,
    c.symbol,
    ROUND(c.net_tokens, 4)                               AS net_collateral_tokens,
    ROUND(c.net_tokens * COALESCE(p.price, 0), 2)        AS collateral_value_usd,
    COALESCE(p.price, 0)                                 AS token_price_usd
FROM combined c
LEFT JOIN latest_prices p
    ON p.contract_address = c.contract_address
ORDER BY collateral_value_usd DESC
;
