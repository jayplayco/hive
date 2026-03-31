"use client";

import { useState, useMemo } from "react";
import { TOKEN_MAP } from "@/lib/constants";
import { formatUSD, formatNumber, changeColorClass, deviationColorClass, calcSpotDeviation } from "@/lib/utils";
import type { TokenMarketData, FidelityMetrics, TrustMetrics } from "@/types";

type SortKey = "marketCap" | "price" | "spotDeviation" | "volume24h";
type SortDir = "asc" | "desc";

interface TokenTableProps {
  marketData: TokenMarketData[];
  fidelityMetrics: FidelityMetrics[];
  trustMetrics: TrustMetrics[];
  goldSpotPrice: number;
  isLoading?: boolean;
}

function ChainBadge({ chain }: { chain: string }) {
  return (
    <span className="rounded-sm bg-[--bg-hover] px-1.5 py-0.5 text-[10px] font-medium text-[--text-secondary]">
      {chain}
    </span>
  );
}

function SkeletonRow() {
  return (
    <tr>
      {Array.from({ length: 8 }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="skeleton h-4 w-full rounded" />
        </td>
      ))}
    </tr>
  );
}

export function TokenTable({
  marketData,
  fidelityMetrics,
  trustMetrics,
  goldSpotPrice,
  isLoading,
}: TokenTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("marketCap");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const fidelityMap = useMemo(
    () => Object.fromEntries(fidelityMetrics.map((m) => [m.symbol, m])),
    [fidelityMetrics]
  );
  const trustMap = useMemo(
    () => Object.fromEntries(trustMetrics.map((m) => [m.symbol, m])),
    [trustMetrics]
  );

  const sorted = useMemo(() => {
    return [...marketData].sort((a, b) => {
      let va: number, vb: number;
      if (sortKey === "spotDeviation") {
        va = Math.abs(fidelityMap[a.symbol]?.spotDeviation ?? 0);
        vb = Math.abs(fidelityMap[b.symbol]?.spotDeviation ?? 0);
      } else {
        va = a[sortKey];
        vb = b[sortKey];
      }
      return sortDir === "desc" ? vb - va : va - vb;
    });
  }, [marketData, sortKey, sortDir, fidelityMap]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return <span className="ml-1 text-[--text-secondary] opacity-40">↕</span>;
    return <span className="ml-1 text-[--gold-primary]">{sortDir === "desc" ? "↓" : "↑"}</span>;
  }

  function ColHeader({ label, sortK }: { label: string; sortK?: SortKey }) {
    return (
      <th
        className={`whitespace-nowrap px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[--text-secondary] ${sortK ? "cursor-pointer select-none hover:text-[--gold-primary]" : ""}`}
        onClick={sortK ? () => toggleSort(sortK) : undefined}
      >
        {label}
        {sortK && <SortIcon k={sortK} />}
      </th>
    );
  }

  return (
    <div className="gold-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-[--border]">
              <ColHeader label="Token" />
              <ColHeader label="Price (USD)" sortK="price" />
              <ColHeader label="Market Cap" sortK="marketCap" />
              <ColHeader label="24h Volume" sortK="volume24h" />
              <ColHeader label="Supply" />
              <ColHeader label="Spot Dev." sortK="spotDeviation" />
              <ColHeader label="PoR" />
              <ColHeader label="Regulation" />
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              : sorted.map((token) => {
                  const meta = TOKEN_MAP[token.symbol];
                  const fidelity = fidelityMap[token.symbol];
                  const trust = trustMap[token.symbol];
                  const deviation = fidelity?.spotDeviation ?? calcSpotDeviation(token.price, goldSpotPrice, token.symbol);
                  const devClass = deviationColorClass(deviation);
                  const changeClass = changeColorClass(token.priceChange24h);

                  return (
                    <tr
                      key={token.symbol}
                      className="border-b border-[--border] transition-colors hover:bg-[--bg-hover]"
                    >
                      {/* Token */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-3 w-3 flex-shrink-0 rounded-full"
                            style={{ backgroundColor: meta?.color ?? "#888" }}
                          />
                          <div className="flex flex-col">
                            <span className="font-mono text-sm font-semibold text-[--text-primary]">
                              {token.symbol}
                            </span>
                            <span className="text-xs text-[--text-secondary]">
                              {meta?.name}
                            </span>
                          </div>
                          <div className="ml-1 flex flex-wrap gap-1">
                            {meta?.chain.map((c) => <ChainBadge key={c} chain={c} />)}
                          </div>
                        </div>
                      </td>

                      {/* Price */}
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="font-mono text-sm text-[--text-primary]">
                            {formatUSD(token.price, token.symbol === "KAU" ? 2 : 2)}
                          </span>
                          <span className={`font-mono text-xs ${changeClass}`}>
                            {token.priceChange24h >= 0 ? "+" : ""}
                            {formatNumber(token.priceChange24h, 2)}%
                          </span>
                        </div>
                      </td>

                      {/* Market Cap */}
                      <td className="px-4 py-3 font-mono text-sm text-[--text-primary]">
                        {formatUSD(token.marketCap)}
                      </td>

                      {/* Volume */}
                      <td className="px-4 py-3 font-mono text-sm text-[--text-primary]">
                        {formatUSD(token.volume24h)}
                      </td>

                      {/* Supply */}
                      <td className="px-4 py-3 font-mono text-sm text-[--text-secondary]">
                        {formatNumber(token.circulatingSupply, 0)}
                        {token.symbol === "KAU" && <span className="ml-1 text-[10px]">g</span>}
                        {token.symbol !== "KAU" && <span className="ml-1 text-[10px]">oz</span>}
                      </td>

                      {/* Spot Deviation */}
                      <td className="px-4 py-3">
                        <span
                          className={`font-mono text-sm font-medium ${devClass}`}
                          title="계산식: (Token Price - XAU/USD) / XAU/USD × 100"
                        >
                          {deviation >= 0 ? "+" : ""}
                          {formatNumber(deviation, 3)}%
                        </span>
                      </td>

                      {/* PoR */}
                      <td className="px-4 py-3">
                        {trust?.hasPoR ? (
                          <span className="inline-flex items-center gap-1 text-emerald-400">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-xs">{trust.porProvider}</span>
                          </span>
                        ) : (
                          <span className="text-xs text-[--text-secondary]">—</span>
                        )}
                      </td>

                      {/* Regulation */}
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-[--bg-hover] px-2 py-0.5 text-xs text-[--text-secondary]">
                          {meta?.regulation ?? "—"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
