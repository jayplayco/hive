"use client";

import { useState } from "react";
import { PriceDeviationChart } from "@/components/charts/PriceDeviationChart";
import { TOKENS } from "@/lib/constants";
import { formatNumber, deviationColorClass } from "@/lib/utils";
import type { FidelityMetrics, HistoricalDataPoint } from "@/types";

type Tab = "deviation" | "accuracy";

interface FidelityPanelProps {
  fidelityMetrics: FidelityMetrics[];
  historicalData: HistoricalDataPoint[];
  isLoading?: boolean;
}

export function FidelityPanel({ fidelityMetrics, historicalData, isLoading }: FidelityPanelProps) {
  const [tab, setTab] = useState<Tab>("deviation");

  return (
    <div className="gold-card">
      <div className="flex items-center justify-between border-b border-[--border] px-5 py-4">
        <h2 className="text-sm font-semibold text-[--text-primary]">
          Price Fidelity
        </h2>
        {/* Tabs */}
        <div className="flex rounded-md border border-[--border] p-0.5">
          {([["deviation", "Deviation Chart"], ["accuracy", "Tracking Accuracy"]] as [Tab, string][]).map(
            ([key, label]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
                  tab === key
                    ? "bg-[--gold-primary] text-black"
                    : "text-[--text-secondary] hover:text-[--text-primary]"
                }`}
              >
                {label}
              </button>
            )
          )}
        </div>
      </div>

      <div className="p-5">
        {tab === "deviation" && (
          <div>
            <p className="mb-4 text-xs text-[--text-secondary]">
              30-day spot deviation per token — 실물 금 대비 괴리율 (%). 기준선(빨강 점선) = 0%
            </p>
            {isLoading ? (
              <div className="skeleton h-80 rounded" />
            ) : (
              <PriceDeviationChart data={historicalData} />
            )}
          </div>
        )}

        {tab === "accuracy" && (
          <div className="space-y-3">
            <p className="text-xs text-[--text-secondary]">
              30-day average tracking accuracy (higher is better)
            </p>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="skeleton h-10 rounded" />
                ))
              : fidelityMetrics.map((m) => {
                  const token = TOKENS.find((t) => t.symbol === m.symbol);
                  const devClass = deviationColorClass(m.spotDeviation);
                  return (
                    <div key={m.symbol} className="flex items-center gap-3">
                      <span
                        className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                        style={{ backgroundColor: token?.color ?? "#888" }}
                      />
                      <span className="w-14 font-mono text-xs font-medium text-[--text-primary]">
                        {m.symbol}
                      </span>
                      {/* Accuracy bar */}
                      <div className="flex-1 overflow-hidden rounded-full bg-[--bg-hover]" style={{ height: 8 }}>
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${m.trackingAccuracy30d}%`,
                            backgroundColor: token?.color ?? "#888",
                          }}
                        />
                      </div>
                      <span className="w-12 text-right font-mono text-xs text-[--text-primary]">
                        {formatNumber(m.trackingAccuracy30d, 1)}%
                      </span>
                      <span className={`w-16 text-right font-mono text-xs ${devClass}`}>
                        {m.spotDeviation >= 0 ? "+" : ""}
                        {formatNumber(m.spotDeviation, 3)}%
                      </span>
                    </div>
                  );
                })}
          </div>
        )}
      </div>
    </div>
  );
}
