"use client";

import { formatUSD, formatNumber, deviationColorClass } from "@/lib/utils";

interface KpiCardProps {
  label: string;
  value: string;
  sub?: string;
  subClass?: string;
  isLoading?: boolean;
}

function KpiCard({ label, value, sub, subClass, isLoading }: KpiCardProps) {
  return (
    <div className="gold-card flex flex-col gap-1 p-5">
      <span className="text-xs font-medium uppercase tracking-wider text-[--text-secondary]">
        {label}
      </span>
      {isLoading ? (
        <div className="skeleton h-8 w-32 rounded" />
      ) : (
        <span className="font-mono text-2xl font-bold text-[--text-primary]">{value}</span>
      )}
      {sub && (
        <span className={`text-xs font-medium ${subClass ?? "text-[--text-secondary]"}`}>
          {sub}
        </span>
      )}
    </div>
  );
}

interface MarketOverviewProps {
  totalMarketCap: number;
  totalVolume24h: number;
  dominant: { symbol: string; marketCap: number } | undefined;
  dominantShare: number;
  avgDeviation: number;
  isLoading?: boolean;
}

export function MarketOverviewCard({
  totalMarketCap,
  totalVolume24h,
  dominant,
  dominantShare,
  avgDeviation,
  isLoading,
}: MarketOverviewProps) {
  const devClass = deviationColorClass(avgDeviation);

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <KpiCard
        label="Total Market Cap"
        value={formatUSD(totalMarketCap)}
        isLoading={isLoading}
      />
      <KpiCard
        label="24h Volume"
        value={formatUSD(totalVolume24h)}
        isLoading={isLoading}
      />
      <KpiCard
        label="Dominant Token"
        value={dominant?.symbol ?? "—"}
        sub={dominant ? `${formatNumber(dominantShare, 1)}% share` : undefined}
        isLoading={isLoading}
      />
      <KpiCard
        label="Avg Spot Deviation"
        value={`${formatNumber(Math.abs(avgDeviation), 3)}%`}
        sub={avgDeviation >= 0 ? "Premium to spot" : "Discount to spot"}
        subClass={devClass}
        isLoading={isLoading}
      />
    </div>
  );
}
