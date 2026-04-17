"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { YieldTable } from "@/components/YieldTable";
import type { AssetType, YieldObject } from "@/types/yield";
import { RefreshCw, TrendingUp, Search, AlertTriangle, ChevronDown } from "lucide-react";

type FilterType = "All" | AssetType;

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

// ── Small helpers ──────────────────────────────────────────────────────────

const CATEGORY_FILTERS: FilterType[] = ["All", "DeFi", "CEX", "RWA", "Options"];

function FilterPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
        active
          ? "bg-indigo-600/20 border-indigo-500/50 text-indigo-300"
          : "bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-600 hover:text-gray-300"
      }`}
    >
      {label}
      <ChevronDown className="w-3 h-3 opacity-60" />
    </button>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<FilterType>("All");
  const [chainFilter, setChainFilter] = useState("All");

  const { data, isLoading, error, refetch, isFetching } = useQuery<ApiResponse>({
    queryKey: ["yields"],
    queryFn: fetchYields,
  });

  const allYields = data?.yields ?? [];

  const chains = useMemo(() => {
    const s = new Set(allYields.map((y) => y.chain));
    return ["All", ...Array.from(s).sort()];
  }, [allYields]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return allYields.filter((y) => {
      if (typeFilter !== "All" && y.type !== typeFilter) return false;
      if (chainFilter !== "All" && y.chain !== chainFilter) return false;
      if (q && !y.asset.toLowerCase().includes(q) && !y.platform.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [allYields, typeFilter, chainFilter, search]);

  const topApy = filtered.length ? Math.max(...filtered.map((y) => y.apy)) : null;
  const avgApy = filtered.length
    ? filtered.reduce((s, y) => s + y.apy, 0) / filtered.length
    : null;
  const highVolCount = filtered.filter((y) => y.incentiveApy > 0 && y.incentiveApy > y.apy * 0.5).length;

  return (
    <main className="min-h-screen bg-[#0d0d0d] p-4 md:p-6">
      <div className="max-w-[1400px] mx-auto space-y-5">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2.5">
            <TrendingUp className="w-6 h-6 text-indigo-500 shrink-0" />
            <div>
              <h1 className="text-xl font-bold text-white leading-tight">Yield-Hub 2026</h1>
              <p className="text-xs text-gray-500">Multi-asset stablecoin yield aggregator</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {data?.lastUpdated && (
              <span className="text-xs text-gray-600 hidden sm:block">
                Updated {new Date(data.lastUpdated).toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Opportunities" value={isLoading ? "…" : String(filtered.length)} />
          <StatCard label="Top APY" value={isLoading ? "…" : topApy ? `${topApy.toFixed(2)}%` : "—"} accent />
          <StatCard label="Avg APY" value={isLoading ? "…" : avgApy ? `${avgApy.toFixed(2)}%` : "—"} />
          <StatCard label="⚡ High Volatility" value={isLoading ? "…" : String(highVolCount)} warn={highVolCount > 0} />
        </div>

        {/* Search + filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Filter by token or protocol…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-gray-900 border border-gray-700 rounded-xl text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            {/* Chain filter */}
            <div className="relative">
              <select
                value={chainFilter}
                onChange={(e) => setChainFilter(e.target.value)}
                className="appearance-none pl-3 pr-7 py-1.5 bg-gray-900 border border-gray-700 rounded-lg text-sm text-gray-400 hover:border-gray-600 focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
              >
                {chains.map((c) => (
                  <option key={c} value={c}>{c === "All" ? "All Chains" : c}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500 pointer-events-none" />
            </div>

            {/* Category filter */}
            <div className="flex gap-1.5">
              {CATEGORY_FILTERS.map((f) => (
                <button
                  key={f}
                  onClick={() => setTypeFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    typeFilter === f
                      ? "bg-indigo-600/20 border-indigo-500/50 text-indigo-300"
                      : "bg-gray-900 border-gray-700 text-gray-500 hover:border-gray-600 hover:text-gray-300"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Adapter error banner */}
        {data?.errors && data.errors.length > 0 && (
          <div className="flex items-center gap-2 bg-amber-950/40 border border-amber-800/50 rounded-lg px-3 py-2 text-xs text-amber-400">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {data.errors.length} data source(s) unavailable — showing partial results.
          </div>
        )}

        {/* Table */}
        {isLoading ? (
          <LoadingSkeleton />
        ) : error ? (
          <div className="rounded-xl border border-red-900/50 py-16 text-center text-red-500 text-sm">
            Failed to load yield data. Check the API route or network connection.
          </div>
        ) : (
          <YieldTable items={filtered} />
        )}

        {/* Legend */}
        <div className="flex flex-wrap gap-5 text-xs text-gray-600 pb-4 border-t border-gray-800/60 pt-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />
            Organic base yield
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
            Token incentive yield
          </span>
          <span>⚡ Incentives &gt;50% of APY = High Volatility Reward</span>
          <span>Click any row to see risk breakdown</span>
        </div>
      </div>
    </main>
  );
}

function StatCard({ label, value, accent, warn }: { label: string; value: string; accent?: boolean; warn?: boolean }) {
  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
      <p className="text-xs text-gray-500 truncate">{label}</p>
      <p className={`text-2xl font-bold mt-1 tabular-nums ${warn ? "text-amber-400" : accent ? "text-indigo-400" : "text-gray-100"}`}>
        {value}
      </p>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="rounded-xl border border-gray-800 overflow-hidden">
      <div className="bg-gray-900/60 h-10" />
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={i}
          className="h-14 border-t border-gray-800/60 bg-gray-950 animate-pulse"
          style={{ opacity: 1 - i * 0.08 }}
        />
      ))}
    </div>
  );
}
