"use client";

import { useState, useCallback } from "react";
import { Header } from "@/components/layout/Header";
import { useTheme } from "@/components/layout/ThemeProvider";
import { MarketOverviewCard } from "@/components/dashboard/MarketOverviewCard";
import { TokenTable } from "@/components/dashboard/TokenTable";
import { FidelityPanel } from "@/components/dashboard/FidelityPanel";
import { DefiUtilityPanel } from "@/components/dashboard/DefiUtilityPanel";
import { TrustPanel } from "@/components/dashboard/TrustPanel";
import { MarketCapChart } from "@/components/charts/MarketCapChart";
import { useGoldSpot } from "@/hooks/useGoldSpot";
import { useTokenData } from "@/hooks/useTokenData";

export function Dashboard() {
  const { theme, toggle } = useTheme();
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const { goldSpot, isLoading: goldLoading, isError: goldError, refresh: refreshGold } = useGoldSpot();

  const {
    marketData,
    fidelityMetrics,
    defiMetrics,
    trustMetrics,
    historicalData,
    summary,
    isLoading: tokenLoading,
    isError: tokenError,
    refresh: refreshTokens,
  } = useTokenData(goldSpot.price);

  const isLoading = goldLoading || tokenLoading;
  const isStale = goldError || tokenError;

  const handleRefresh = useCallback(async () => {
    setLastUpdated(new Date());
    await Promise.all([refreshGold(), refreshTokens()]);
  }, [refreshGold, refreshTokens]);

  // 첫 데이터 로드 완료 시 업데이트 시각 기록
  if (!isLoading && !lastUpdated) {
    setLastUpdated(new Date());
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header
        goldSpot={goldSpot}
        lastUpdated={lastUpdated}
        isStale={isStale}
        onRefresh={handleRefresh}
        isDark={theme === "dark"}
        onToggleDark={toggle}
      />

      <main className="flex-1 px-4 py-6 sm:px-6">
        <div className="mx-auto max-w-screen-2xl space-y-6">
          {/* KPI 카드 4개 */}
          <MarketOverviewCard
            totalMarketCap={summary.totalMarketCap}
            totalVolume24h={summary.totalVolume24h}
            dominant={summary.dominant}
            dominantShare={summary.dominantShare}
            avgDeviation={summary.avgDeviation}
            isLoading={isLoading}
          />

          {/* 토큰 비교 테이블 */}
          <section>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[--text-secondary]">
              Token Comparison
            </h2>
            <TokenTable
              marketData={marketData}
              fidelityMetrics={fidelityMetrics}
              trustMetrics={trustMetrics}
              goldSpotPrice={goldSpot.price}
              isLoading={isLoading}
            />
          </section>

          {/* 차트 + Fidelity — 2컬럼 lg 이상 */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Market Cap Chart */}
            <div className="gold-card">
              <div className="border-b border-[--border] px-5 py-4">
                <h2 className="text-sm font-semibold text-[--text-primary]">Market Cap Distribution</h2>
              </div>
              <div className="p-5">
                {isLoading ? (
                  <div className="skeleton h-72 rounded" />
                ) : (
                  <MarketCapChart data={marketData} />
                )}
              </div>
            </div>

            {/* Fidelity Panel */}
            <FidelityPanel
              fidelityMetrics={fidelityMetrics}
              historicalData={historicalData}
              isLoading={isLoading}
            />
          </div>

          {/* DeFi + Trust — 2컬럼 lg 이상 */}
          <div className="grid gap-6 lg:grid-cols-2">
            <DefiUtilityPanel defiMetrics={defiMetrics} isLoading={isLoading} />
            <TrustPanel trustMetrics={trustMetrics} isLoading={isLoading} />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[--border] px-6 py-4 text-center text-xs text-[--text-secondary]">
        Data sources: CoinGecko, Metals-API &nbsp;·&nbsp; Auto-refresh every 60s &nbsp;·&nbsp;
        Spot deviation formula: (Token Price − XAU/USD) ÷ XAU/USD × 100
      </footer>
    </div>
  );
}
