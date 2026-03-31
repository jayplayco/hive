-- ============================================================
--  Dune Analytics Query 3 — Whale Tracking
--  Top 100 holder concentration + exchange inflow / outflow.
--
--  Tables used:
--    erc20_ethereum.evt_Transfer
--    labels.addresses          (Dune address labels — exchange wallets, etc.)
--    prices.usd
-- ============================================================

-- ── Parameters (set in Dune dashboard UI) ────────────────────────────────────
-- {{token_symbol}}   : PAXG | XAUT   (default: PAXG)
-- {{top_n_holders}}  : integer         (default: 100)

WITH

-- ── Token metadata ────────────────────────────────────────────────────────────
token_meta AS (
    SELECT *
    FROM (
        VALUES
            ('PAXG', 0x45804880De22913dAFE09f4980848ECE6EcbAf78, 18),
            ('XAUT', 0x68749665FF8D2d112Fa859AA293F07A622782F38,  6)
    ) AS t(symbol, contract_address, decimals)
    WHERE symbol = '{{token_symbol}}'
),

-- ── Latest token price ────────────────────────────────────────────────────────
token_price AS (
    SELECT DISTINCT ON (contract_address)
        price
    FROM prices.usd
    INNER JOIN token_meta USING (contract_address)
    WHERE blockchain = 'ethereum'
    ORDER BY contract_address, minute DESC
),

-- ── Net balance per address (all-time transfers) ──────────────────────────────
balances AS (
    SELECT
        "to"                                                          AS holder,
        SUM(CAST(value AS DOUBLE) / POWER(10, tm.decimals))           AS balance
    FROM erc20_ethereum.evt_Transfer t
    INNER JOIN token_meta tm ON tm.contract_address = t.contract_address
    WHERE "to"   != 0x0000000000000000000000000000000000000000   -- exclude burn
    GROUP BY "to"

    UNION ALL

    SELECT
        "from"                                                        AS holder,
        -SUM(CAST(value AS DOUBLE) / POWER(10, tm.decimals))          AS balance
    FROM erc20_ethereum.evt_Transfer t
    INNER JOIN token_meta tm ON tm.contract_address = t.contract_address
    WHERE "from" != 0x0000000000000000000000000000000000000000   -- exclude mint
    GROUP BY "from"
),

net_balances AS (
    SELECT
        holder,
        SUM(balance) AS net_balance
    FROM balances
    GROUP BY holder
    HAVING SUM(balance) > 0.001   -- dust filter
),

-- ── Total circulating supply (sum of all positive balances) ───────────────────
total_supply AS (
    SELECT SUM(net_balance) AS supply FROM net_balances
),

-- ── Top N holders by balance ──────────────────────────────────────────────────
top_holders AS (
    SELECT
        nb.holder,
        nb.net_balance,
        nb.net_balance / ts.supply * 100                             AS pct_supply,
        COALESCE(la.name, 'Unknown')                                 AS label,
        COALESCE(la.category, 'unknown')                             AS category
    FROM net_balances nb
    CROSS JOIN total_supply ts
    LEFT JOIN labels.addresses la
        ON la.blockchain = 'ethereum'
       AND la.address    = nb.holder
    ORDER BY nb.net_balance DESC
    LIMIT {{top_n_holders}}
),

-- ── Concentration metric ──────────────────────────────────────────────────────
concentration AS (
    SELECT
        COUNT(*)                         AS holder_count,
        SUM(net_balance)                 AS top_n_balance,
        SUM(pct_supply)                  AS top_n_pct_of_supply,
        MAX(pct_supply)                  AS largest_holder_pct
    FROM top_holders
),

-- ── Exchange inflow / outflow (last 7 days) ───────────────────────────────────
exchange_flows AS (
    SELECT
        CASE
            WHEN la_to.category   = 'cex' THEN 'inflow'
            WHEN la_from.category = 'cex' THEN 'outflow'
        END                                                          AS direction,
        SUM(CAST(t.value AS DOUBLE) / POWER(10, tm.decimals))        AS tokens
    FROM erc20_ethereum.evt_Transfer t
    INNER JOIN token_meta tm ON tm.contract_address = t.contract_address
    LEFT JOIN labels.addresses la_to
        ON la_to.blockchain = 'ethereum' AND la_to.address = t."to"
    LEFT JOIN labels.addresses la_from
        ON la_from.blockchain = 'ethereum' AND la_from.address = t."from"
    WHERE t.evt_block_time >= NOW() - INTERVAL '7' DAY
      AND (la_to.category = 'cex' OR la_from.category = 'cex')
    GROUP BY direction
)

-- ── Output section 1: top holders ────────────────────────────────────────────
SELECT
    ROW_NUMBER() OVER (ORDER BY net_balance DESC)                    AS rank,
    holder,
    label,
    category,
    ROUND(net_balance, 4)                                            AS balance_tokens,
    ROUND(net_balance * (SELECT price FROM token_price), 2)          AS balance_usd,
    ROUND(pct_supply, 4)                                             AS pct_of_supply
FROM top_holders

UNION ALL

-- ── Output section 2: concentration summary (appended as labelled rows) ───────
SELECT
    NULL                                                             AS rank,
    'SUMMARY: top_' || {{top_n_holders}} || '_holders'              AS holder,
    NULL, NULL,
    ROUND(top_n_balance, 4),
    ROUND(top_n_balance * (SELECT price FROM token_price), 2),
    ROUND(top_n_pct_of_supply, 4)
FROM concentration

UNION ALL

-- ── Output section 3: exchange flows (last 7 days) ────────────────────────────
SELECT
    NULL,
    'EXCHANGE_' || UPPER(COALESCE(direction, 'unknown')),
    NULL, NULL,
    ROUND(tokens, 4),
    ROUND(tokens * (SELECT price FROM token_price), 2),
    NULL
FROM exchange_flows

ORDER BY rank NULLS LAST
;
