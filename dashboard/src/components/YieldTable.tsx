"use client";

import { Fragment, useState } from "react";
import type { YieldObject } from "@/types/yield";
import { RiskCard } from "./RiskCard";
import { YieldBreakdownTooltip } from "./YieldBreakdownTooltip";
import {
  ArrowUpDown,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";

type SortKey = "apy" | "riskScore" | "asset" | "platform" | "tvlUsd" | "apy7dChange";
type SortDir = "asc" | "desc";

interface Props {
  items: YieldObject[];
}

// ── Formatting helpers ──────────────────────────────────────────────────────

function formatTvl(v: number | null): string {
  if (v === null) return "—";
  if (v >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(2)}M`;
  if (v >= 1e3) return `$${(v / 1e3).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}

function ChangeCell({ value }: { value: number | null }) {
  if (value === null) return <span className="text-gray-600">—</span>;
  if (Math.abs(value) < 0.05)
    return <span className="text-gray-400 flex items-center gap-0.5"><Minus className="w-3 h-3" /> 0.0%</span>;
  const pos = value > 0;
  return (
    <span className={`flex items-center gap-0.5 font-medium ${pos ? "text-green-400" : "text-red-400"}`}>
      {pos ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {pos ? "+" : ""}{value.toFixed(1)}%
    </span>
  );
}

// ── Protocol logo with DeFiLlama CDN + letter fallback ────────────────────

const LOGO_COLORS = [
  "bg-blue-700", "bg-purple-700", "bg-emerald-700",
  "bg-orange-700", "bg-pink-700", "bg-indigo-700",
  "bg-red-700", "bg-teal-700", "bg-yellow-700",
];

function logoColor(name: string): string {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffff;
  return LOGO_COLORS[h % LOGO_COLORS.length];
}

function ProtocolLogo({ slug, name }: { slug: string; name: string }) {
  const [err, setErr] = useState(false);
  if (err) {
    return (
      <div className={`w-8 h-8 rounded-full ${logoColor(name)} flex items-center justify-center text-xs font-bold text-white shrink-0`}>
        {name.slice(0, 2).toUpperCase()}
      </div>
    );
  }
  return (
    <img
      src={`https://icons.llama.fi/icons/protocols/${slug}.png`}
      alt={name}
      width={32}
      height={32}
      className="w-8 h-8 rounded-full object-cover bg-gray-800 shrink-0"
      onError={() => setErr(true)}
    />
  );
}

// ── Category + tag badges ─────────────────────────────────────────────────

const TYPE_STYLE: Record<string, string> = {
  DeFi:    "bg-blue-500/15 text-blue-400 border border-blue-500/25",
  CEX:     "bg-purple-500/15 text-purple-400 border border-purple-500/25",
  RWA:     "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25",
  Options: "bg-pink-500/15 text-pink-400 border border-pink-500/25",
};

const HIGHLIGHT_TAGS = new Set(["Boosted", "T-Bill Backed", "Locked 30D", "Overcollateralized", "Incentivized", "Real-World Credit"]);
const TAG_STYLE: Record<string, string> = {
  "Boosted":            "bg-amber-500/15 text-amber-400 border border-amber-500/25",
  "Incentivized":       "bg-amber-500/15 text-amber-400 border border-amber-500/25",
  "T-Bill Backed":      "bg-green-500/15 text-green-400 border border-green-500/25",
  "Locked 30D":         "bg-orange-500/15 text-orange-400 border border-orange-500/25",
  "Overcollateralized": "bg-indigo-500/15 text-indigo-400 border border-indigo-500/25",
  "Real-World Credit":  "bg-teal-500/15 text-teal-400 border border-teal-500/25",
};

function CategoryBadges({ item }: { item: YieldObject }) {
  const highlight = item.tags.filter((t) => HIGHLIGHT_TAGS.has(t));
  return (
    <div className="flex flex-wrap gap-1 min-w-0">
      <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold whitespace-nowrap ${TYPE_STYLE[item.type] ?? "bg-gray-700 text-gray-300"}`}>
        {item.type}
      </span>
      {highlight.slice(0, 2).map((t) => (
        <span key={t} className={`px-1.5 py-0.5 rounded text-[10px] font-semibold whitespace-nowrap ${TAG_STYLE[t] ?? "bg-gray-700 text-gray-400"}`}>
          {t}
        </span>
      ))}
    </div>
  );
}

// ── Sort button ───────────────────────────────────────────────────────────

function SortBtn({ col, active, dir, onClick }: { col: SortKey; active: SortKey; dir: SortDir; onClick: (k: SortKey) => void }) {
  return (
    <button
      onClick={() => onClick(col)}
      className={`transition-colors ${active === col ? "text-indigo-400" : "text-gray-600 hover:text-gray-400"}`}
    >
      <ArrowUpDown className="w-3 h-3" />
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────

export function YieldTable({ items }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("apy");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir(key === "apy" || key === "tvlUsd" ? "desc" : "asc"); }
  };

  const sorted = [...items].sort((a, b) => {
    const va = a[sortKey] ?? -Infinity;
    const vb = b[sortKey] ?? -Infinity;
    const cmp = typeof va === "number" ? (va as number) - (vb as number) : String(va).localeCompare(String(vb));
    return sortDir === "asc" ? cmp : -cmp;
  });

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-gray-800 py-20 text-center text-gray-500">
        No results match your filters.
      </div>
    );
  }

  const th = "px-3 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap";

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-800">
      <table className="w-full text-sm">
        <thead className="bg-gray-900/60">
          <tr>
            <th className="w-8 px-3 py-3" />
            <th className={th}>
              <span className="flex items-center gap-1">Asset <SortBtn col="asset" active={sortKey} dir={sortDir} onClick={handleSort} /></span>
            </th>
            <th className={th}>Chain</th>
            <th className={th}>
              <span className="flex items-center gap-1">TVL <SortBtn col="tvlUsd" active={sortKey} dir={sortDir} onClick={handleSort} /></span>
            </th>
            <th className={th}>TVL 7d Δ</th>
            <th className={th}>Category</th>
            <th className={`${th} text-right`}>
              <span className="flex items-center justify-end gap-1">7d APY <SortBtn col="apy" active={sortKey} dir={sortDir} onClick={handleSort} /></span>
            </th>
            <th className={th}>APY 7d Δ</th>
            <th className={`${th} text-right`}>30d APY</th>
            <th className={`${th} text-center`}>Earn</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800/60">
          {sorted.map((item) => {
            const earnUrl = item.referralUrl ?? item.deepLink;
            return (
              <Fragment key={item.id}>
                <tr
                  className="bg-gray-950 hover:bg-gray-900/70 cursor-pointer transition-colors"
                  onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                >
                  {/* Expand toggle */}
                  <td className="px-3 py-3 text-gray-600">
                    {expandedId === item.id
                      ? <ChevronDown className="w-4 h-4" />
                      : <ChevronRight className="w-4 h-4" />}
                  </td>

                  {/* Asset */}
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2.5">
                      <ProtocolLogo slug={item.projectSlug} name={item.platform} />
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-100 leading-tight">{item.asset}</p>
                        <p className="text-xs text-gray-500 leading-tight truncate max-w-[120px]">{item.platform}</p>
                      </div>
                    </div>
                  </td>

                  {/* Chain */}
                  <td className="px-3 py-3">
                    <span className="text-xs text-gray-400 bg-gray-800 px-1.5 py-0.5 rounded whitespace-nowrap">
                      {item.chain}
                    </span>
                  </td>

                  {/* TVL */}
                  <td className="px-3 py-3 text-gray-300 tabular-nums whitespace-nowrap">
                    {formatTvl(item.tvlUsd)}
                  </td>

                  {/* TVL 7d Δ */}
                  <td className="px-3 py-3 tabular-nums">
                    <ChangeCell value={item.tvl7dChange} />
                  </td>

                  {/* Category */}
                  <td className="px-3 py-3">
                    <CategoryBadges item={item} />
                  </td>

                  {/* 7d APY */}
                  <td className="px-3 py-3 text-right">
                    <YieldBreakdownTooltip item={item} />
                  </td>

                  {/* APY 7d Δ */}
                  <td className="px-3 py-3 tabular-nums">
                    <ChangeCell value={item.apy7dChange} />
                  </td>

                  {/* 30d APY */}
                  <td className="px-3 py-3 text-right tabular-nums text-gray-300">
                    {item.apy30d !== null ? `${item.apy30d.toFixed(2)}%` : "—"}
                  </td>

                  {/* Earn */}
                  <td className="px-3 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                    {earnUrl ? (
                      <a
                        href={earnUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 hover:text-indigo-300 text-xs font-medium border border-indigo-600/30 transition-colors whitespace-nowrap"
                      >
                        Earn <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-gray-700 text-xs">—</span>
                    )}
                  </td>
                </tr>

                {/* Expanded detail row */}
                {expandedId === item.id && (
                  <tr className="bg-gray-900/40">
                    <td colSpan={10} className="px-6 py-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <RiskCard item={item} />
                        {item.tieredRates && item.tieredRates.length > 0 && (
                          <div className="rounded-lg border border-gray-700 p-3 bg-gray-900">
                            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
                              Tiered Rates
                            </p>
                            <div className="space-y-1.5">
                              {item.tieredRates.map((tier, i) => (
                                <div key={i} className="flex justify-between text-sm">
                                  <span className="text-gray-400">{tier.label}</span>
                                  <span className="font-semibold text-indigo-400">{tier.apy.toFixed(2)}%</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
