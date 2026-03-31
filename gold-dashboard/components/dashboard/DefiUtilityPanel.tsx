"use client";

import { YieldComparisonChart } from "@/components/charts/YieldComparisonChart";
import { TOKENS } from "@/lib/constants";
import { formatUSD, formatNumber } from "@/lib/utils";
import type { DefiMetrics } from "@/types";

interface DefiUtilityPanelProps {
  defiMetrics: DefiMetrics[];
  isLoading?: boolean;
}

// 지원 프로토콜 체크매트릭스용 프로토콜 목록
const ALL_PROTOCOLS = ["Aave V3", "Compound", "Uniswap V3", "Curve", "Kinesis Exchange"];

export function DefiUtilityPanel({ defiMetrics, isLoading }: DefiUtilityPanelProps) {
  return (
    <div className="gold-card">
      <div className="border-b border-[--border] px-5 py-4">
        <h2 className="text-sm font-semibold text-[--text-primary]">DeFi Utility</h2>
        <p className="mt-0.5 text-xs text-[--text-secondary]">
          Annualized Organic Yield, LTV, and protocol support
        </p>
      </div>

      <div className="divide-y divide-[--border]">
        {/* AOY 차트 */}
        <div className="p-5">
          <p className="mb-3 text-xs font-medium text-[--text-secondary]">
            Annualized Organic Yield (AOY %)
          </p>
          {isLoading ? (
            <div className="skeleton h-56 rounded" />
          ) : (
            <YieldComparisonChart data={defiMetrics} />
          )}
        </div>

        {/* LTV 비교 */}
        <div className="p-5">
          <p className="mb-3 text-xs font-medium text-[--text-secondary]">
            Max LTV on Aave V3 (as collateral)
          </p>
          <div className="space-y-2">
            {defiMetrics.map((m) => {
              const token = TOKENS.find((t) => t.symbol === m.symbol);
              return (
                <div key={m.symbol} className="flex items-center gap-3">
                  <span
                    className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                    style={{ backgroundColor: token?.color ?? "#888" }}
                  />
                  <span className="w-14 font-mono text-xs text-[--text-primary]">{m.symbol}</span>
                  {m.ltv !== null ? (
                    <>
                      <div className="flex-1 overflow-hidden rounded-full bg-[--bg-hover]" style={{ height: 6 }}>
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${m.ltv}%`, backgroundColor: token?.color ?? "#888" }}
                        />
                      </div>
                      <span className="w-10 text-right font-mono text-xs text-[--text-primary]">
                        {m.ltv}%
                      </span>
                    </>
                  ) : (
                    <span className="text-xs text-[--text-secondary]">N/A</span>
                  )}
                  {m.totalDefiLocked > 0 && (
                    <span className="text-xs text-[--text-secondary]">
                      TVL {formatUSD(m.totalDefiLocked)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 프로토콜 지원 매트릭스 */}
        <div className="p-5">
          <p className="mb-3 text-xs font-medium text-[--text-secondary]">
            Protocol Support Matrix
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  <th className="py-1 pr-4 text-left font-medium text-[--text-secondary]">Token</th>
                  {ALL_PROTOCOLS.map((p) => (
                    <th key={p} className="px-2 py-1 text-center font-medium text-[--text-secondary]">
                      {p}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {defiMetrics.map((m) => {
                  const token = TOKENS.find((t) => t.symbol === m.symbol);
                  return (
                    <tr key={m.symbol} className="border-t border-[--border]">
                      <td className="py-2 pr-4">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: token?.color ?? "#888" }}
                          />
                          <span className="font-mono font-medium text-[--text-primary]">{m.symbol}</span>
                        </div>
                      </td>
                      {ALL_PROTOCOLS.map((p) => (
                        <td key={p} className="px-2 py-2 text-center">
                          {m.availableProtocols.includes(p) ? (
                            <span className="text-emerald-400">✓</span>
                          ) : (
                            <span className="text-[--text-secondary] opacity-30">—</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
