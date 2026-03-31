"use client";

import { TOKENS } from "@/lib/constants";
import { formatTimestamp } from "@/lib/utils";
import type { TrustMetrics } from "@/types";

interface TrustPanelProps {
  trustMetrics: TrustMetrics[];
  isLoading?: boolean;
}

export function TrustPanel({ trustMetrics, isLoading }: TrustPanelProps) {
  return (
    <div className="gold-card">
      <div className="border-b border-[--border] px-5 py-4">
        <h2 className="text-sm font-semibold text-[--text-primary]">Trust & Compliance</h2>
        <p className="mt-0.5 text-xs text-[--text-secondary]">
          Proof of Reserve, custodian, and regulatory information
        </p>
      </div>

      <div className="divide-y divide-[--border]">
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-5">
                <div className="skeleton mb-2 h-5 w-24 rounded" />
                <div className="skeleton h-16 rounded" />
              </div>
            ))
          : trustMetrics.map((m) => {
              const token = TOKENS.find((t) => t.symbol === m.symbol);
              return (
                <div key={m.symbol} className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    {/* Left: token info */}
                    <div className="flex items-center gap-2">
                      <span
                        className="h-3 w-3 flex-shrink-0 rounded-full"
                        style={{ backgroundColor: token?.color ?? "#888" }}
                      />
                      <span className="font-mono text-sm font-semibold text-[--text-primary]">
                        {m.symbol}
                      </span>
                      <span className="text-xs text-[--text-secondary]">{token?.name}</span>
                    </div>

                    {/* PoR badge */}
                    {m.hasPoR ? (
                      <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-400">
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        PoR Verified
                      </span>
                    ) : (
                      <span className="rounded-full bg-[--bg-hover] px-2 py-0.5 text-xs text-[--text-secondary]">
                        No PoR
                      </span>
                    )}
                  </div>

                  {/* Details grid */}
                  <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 text-xs sm:grid-cols-4">
                    <div>
                      <span className="text-[--text-secondary]">Custodian</span>
                      <p className="mt-0.5 font-medium text-[--text-primary]">{m.custodian}</p>
                    </div>
                    <div>
                      <span className="text-[--text-secondary]">Regulation</span>
                      <p className="mt-0.5 font-medium text-[--text-primary]">{m.regulation}</p>
                    </div>
                    <div>
                      <span className="text-[--text-secondary]">Audit Frequency</span>
                      <p className="mt-0.5 font-medium text-[--text-primary]">{m.auditFrequency}</p>
                    </div>
                    <div>
                      <span className="text-[--text-secondary]">30d Redemptions</span>
                      <p className="mt-0.5 font-mono font-medium text-[--text-primary]">{m.redemptionRate}</p>
                    </div>
                    {m.hasPoR && m.porLastVerified && (
                      <div className="col-span-2">
                        <span className="text-[--text-secondary]">PoR Provider</span>
                        <p className="mt-0.5 font-medium text-[--text-primary]">
                          {m.porProvider}
                          <span className="ml-2 text-[--text-secondary]">
                            — last verified {formatTimestamp(m.porLastVerified)}
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
      </div>
    </div>
  );
}
