"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { YieldTable } from "@/components/YieldTable";
import { FilterBar, type FilterOption } from "@/components/FilterBar";
import type { YieldObject } from "@/types/yield";
import { RefreshCw, TrendingUp, AlertTriangle } from "lucide-react";

interface ApiResponse {
  yields: YieldObject[];
  lastUpdated: string;
  errors: string[];
}

async function fetchYields(): Promise<ApiResponse> {
  const res = await fetch("/api/yields");
  if (!res.ok) throw new Error("Failed to fetch yields");
  return res.json();
}

export default function DashboardPage() {
  const [filter, setFilter] = useState<FilterOption>("All");

  const { data, isLoading, error, refetch, isFetching } =
    useQuery<ApiResponse>({
      queryKey: ["yields"],
      queryFn: fetchYields,
    });

  const allYields = data?.yields ?? [];
  const filtered =
    filter === "All" ? allYields : allYields.filter((y) => y.type === filter);

  const avgApy =
    filtered.length > 0
      ? (filtered.reduce((s, y) => s + y.apy, 0) / filtered.length).toFixed(2)
      : null;

  const highVolCount = filtered.filter(
    (y) => y.incentiveApy > 0 && y.incentiveApy > y.apy * 0.5
  ).length;

  const topApy = filtered.length > 0
    ? Math.max(...filtered.map((y) => y.apy)).toFixed(2)
    : null;

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
              <TrendingUp className="w-7 h-7 text-indigo-600 shrink-0" />
              Yield-Hub 2026
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              Multi-asset stablecoin yield aggregator &mdash; DeFi · CEX · RWA
            </p>
          </div>

          <div className="flex items-center gap-3">
            {data?.lastUpdated && (
              <span className="text-xs text-gray-400 dark:text-gray-500">
                Updated {new Date(data.lastUpdated).toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-60 transition-colors shadow-sm"
            >
              <RefreshCw
                className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Opportunities"
            value={isLoading ? "…" : String(filtered.length)}
          />
          <StatCard
            label="Top APY"
            value={isLoading ? "…" : topApy ? `${topApy}%` : "—"}
            highlight
          />
          <StatCard
            label="Avg APY"
            value={isLoading ? "…" : avgApy ? `${avgApy}%` : "—"}
          />
          <StatCard
            label="⚡ High Volatility"
            value={isLoading ? "…" : String(highVolCount)}
            warning={highVolCount > 0}
          />
        </div>

        {/* Filters */}
        <FilterBar active={filter} onChange={setFilter} />

        {/* Adapter error banner */}
        {data?.errors && data.errors.length > 0 && (
          <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-sm text-amber-700 dark:text-amber-400">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              {data.errors.length} data source(s) unavailable — showing partial
              results.
            </span>
          </div>
        )}

        {/* Main table */}
        {isLoading ? (
          <LoadingSkeleton />
        ) : error ? (
          <div className="rounded-xl border border-red-200 dark:border-red-800 py-16 text-center text-red-500 dark:text-red-400">
            Failed to load yield data. Check the API route or network
            connection.
          </div>
        ) : (
          <YieldTable items={filtered} />
        )}

        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-xs text-gray-400 dark:text-gray-500 pt-2 border-t border-gray-200 dark:border-gray-800">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-green-500 inline-block" />
            Organic / Base yield
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-400 inline-block" />
            Token incentive yield
          </span>
          <span className="flex items-center gap-1.5">
            ⚡ Incentives &gt; 50% of APY — High Volatility Reward
          </span>
        </div>
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
  highlight,
  warning,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  warning?: boolean;
}) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{label}</p>
      <p
        className={`text-2xl font-bold mt-1 tabular-nums ${
          warning
            ? "text-amber-500"
            : highlight
            ? "text-indigo-600 dark:text-indigo-400"
            : "text-gray-900 dark:text-white"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="bg-gray-50 dark:bg-gray-800 h-10" />
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="h-14 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 animate-pulse"
          style={{ opacity: 1 - i * 0.1 }}
        />
      ))}
    </div>
  );
}
