"use client";

import { Fragment, useState } from "react";
import type { YieldObject } from "@/types/yield";
import { RiskCard } from "./RiskCard";
import { YieldBreakdownTooltip } from "./YieldBreakdownTooltip";
import { ArrowUpDown, ExternalLink, ChevronDown, ChevronRight } from "lucide-react";

type SortKey = "apy" | "riskScore" | "asset" | "platform" | "type";
type SortDir = "asc" | "desc";

interface Props {
  items: YieldObject[];
}

const TYPE_BADGE: Record<string, string> = {
  DeFi: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
  CEX: "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300",
  RWA: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
  Options: "bg-pink-100 text-pink-700 dark:bg-pink-900/50 dark:text-pink-300",
};

const RISK_BADGE: Record<number, string> = {
  1: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  2: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  3: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
  4: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  5: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

const RISK_LABELS: Record<number, string> = {
  1: "1 — Very Low",
  2: "2 — Low",
  3: "3 — Medium",
  4: "4 — High",
  5: "5 — Very High",
};

function SortButton({
  col,
  active,
  dir,
  onClick,
}: {
  col: SortKey;
  active: SortKey;
  dir: SortDir;
  onClick: (key: SortKey) => void;
}) {
  return (
    <button
      onClick={() => onClick(col)}
      className={`inline-flex items-center transition-colors ${
        active === col
          ? "text-indigo-600 dark:text-indigo-400"
          : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
      }`}
      aria-label={`Sort by ${col}`}
    >
      <ArrowUpDown className="w-3 h-3" />
      {active === col && (
        <span className="text-[10px] ml-0.5">{dir === "asc" ? "↑" : "↓"}</span>
      )}
    </button>
  );
}

export function YieldTable({ items }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("apy");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "apy" ? "desc" : "asc");
    }
  };

  const sorted = [...items].sort((a, b) => {
    const va = a[sortKey];
    const vb = b[sortKey];
    const cmp =
      typeof va === "number"
        ? (va as number) - (vb as number)
        : String(va).localeCompare(String(vb));
    return sortDir === "asc" ? cmp : -cmp;
  });

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 py-16 text-center text-gray-400 dark:text-gray-500">
        No yield opportunities match the current filter.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 dark:bg-gray-800/80 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
          <tr>
            <th className="px-4 py-3 w-8" />
            <th className="px-4 py-3 text-left">
              <span className="flex items-center gap-1.5">
                Asset
                <SortButton col="asset" active={sortKey} dir={sortDir} onClick={handleSort} />
              </span>
            </th>
            <th className="px-4 py-3 text-left">
              <span className="flex items-center gap-1.5">
                Platform
                <SortButton col="platform" active={sortKey} dir={sortDir} onClick={handleSort} />
              </span>
            </th>
            <th className="px-4 py-3 text-left">
              <span className="flex items-center gap-1.5">
                Type
                <SortButton col="type" active={sortKey} dir={sortDir} onClick={handleSort} />
              </span>
            </th>
            <th className="px-4 py-3 text-right">
              <span className="flex items-center justify-end gap-1.5">
                APY
                <SortButton col="apy" active={sortKey} dir={sortDir} onClick={handleSort} />
              </span>
            </th>
            <th className="px-4 py-3 text-left">
              <span className="flex items-center gap-1.5">
                Risk
                <SortButton col="riskScore" active={sortKey} dir={sortDir} onClick={handleSort} />
              </span>
            </th>
            <th className="px-4 py-3 text-left">Tags</th>
            <th className="px-4 py-3 text-center">Link</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {sorted.map((item) => (
            <Fragment key={item.id}>
              <tr
                className="bg-white dark:bg-gray-900 hover:bg-gray-50/70 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
                onClick={() =>
                  setExpandedId(expandedId === item.id ? null : item.id)
                }
              >
                <td className="px-4 py-3 text-gray-400 dark:text-gray-600">
                  {expandedId === item.id ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </td>
                <td className="px-4 py-3 font-semibold text-gray-900 dark:text-gray-100">
                  {item.asset}
                </td>
                <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                  {item.platform}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      TYPE_BADGE[item.type] ?? "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {item.type}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <YieldBreakdownTooltip item={item} />
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
                      RISK_BADGE[item.riskScore]
                    }`}
                  >
                    {RISK_LABELS[item.riskScore]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {item.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  {item.referralUrl ? (
                    <a
                      href={item.referralUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 text-xs font-medium transition-colors"
                    >
                      Open <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="text-gray-300 dark:text-gray-700 text-xs">
                      —
                    </span>
                  )}
                </td>
              </tr>

              {expandedId === item.id && (
                <tr className="bg-gray-50/50 dark:bg-gray-800/30">
                  <td colSpan={8} className="px-6 py-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <RiskCard item={item} />
                      {item.tieredRates && item.tieredRates.length > 0 && (
                        <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 bg-white dark:bg-gray-900">
                          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                            Tiered Rates
                          </p>
                          <div className="space-y-1.5">
                            {item.tieredRates.map((tier, i) => (
                              <div
                                key={i}
                                className="flex justify-between items-center text-sm"
                              >
                                <span className="text-gray-600 dark:text-gray-400">
                                  {tier.label}
                                </span>
                                <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                                  {tier.apy.toFixed(2)}%
                                </span>
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
          ))}
        </tbody>
      </table>
    </div>
  );
}
