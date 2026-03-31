"use client";

import useSWR from "swr";
import { fetchTokenPrices } from "@/lib/api";
import { REFRESH_INTERVAL, MOCK_MARKET_DATA, STATIC_DEFI_METRICS, STATIC_TRUST_METRICS, TOKENS } from "@/lib/constants";
import { calcSpotDeviation, generateMockHistory } from "@/lib/utils";
import type { TokenMarketData, FidelityMetrics, HistoricalDataPoint } from "@/types";

export function useTokenData(goldSpotPrice: number) {
  const { data, error, isLoading, mutate, isValidating } = useSWR<TokenMarketData[]>(
    "/api/prices",
    fetchTokenPrices,
    {
      refreshInterval: REFRESH_INTERVAL,
      revalidateOnFocus: false,
      fallbackData: MOCK_MARKET_DATA,
      onErrorRetry: (err, _key, _config, revalidate, { retryCount }) => {
        if (retryCount >= 3) return;
        setTimeout(() => revalidate({ retryCount }), 5000);
      },
    }
  );

  const marketData = data ?? MOCK_MARKET_DATA;

  // 괴리율 계산
  const fidelityMetrics: FidelityMetrics[] = marketData.map((token) => {
    const deviation = calcSpotDeviation(token.price, goldSpotPrice, token.symbol);
    return {
      symbol: token.symbol,
      spotDeviation: deviation,
      trackingAccuracy30d: Math.max(0, 100 - Math.abs(deviation) * 10),
      maxDeviation30d: Math.abs(deviation) * 1.8,
    };
  });

  // 30일 히스토리 mock 생성 (Recharts 차트용)
  const historicalData: HistoricalDataPoint[] = (() => {
    const days = 30;
    const baseDeviations: Record<string, number> = {
      XAUT: 0.20, PAXG: 0.16, KAU: 0.28, VNXAU: 0.09, XAUM: 0.04,
    };
    // 날짜 기준 배열 생성
    const dateMap: Record<string, HistoricalDataPoint> = {};
    for (const token of TOKENS) {
      const history = generateMockHistory(token.symbol, baseDeviations[token.symbol] ?? 0, days);
      for (const point of history) {
        if (!dateMap[point.date]) dateMap[point.date] = { date: point.date };
        dateMap[point.date][token.symbol] = point.deviation;
      }
    }
    return Object.values(dateMap).sort((a, b) => a.date.localeCompare(b.date));
  })();

  // 요약 통계
  const totalMarketCap = marketData.reduce((acc, t) => acc + t.marketCap, 0);
  const totalVolume24h = marketData.reduce((acc, t) => acc + t.volume24h, 0);
  const dominant = marketData.reduce((a, b) => (a.marketCap > b.marketCap ? a : b), marketData[0]);
  const avgDeviation =
    fidelityMetrics.reduce((acc, m) => acc + Math.abs(m.spotDeviation), 0) / fidelityMetrics.length;

  return {
    marketData,
    fidelityMetrics,
    defiMetrics: STATIC_DEFI_METRICS,
    trustMetrics: STATIC_TRUST_METRICS,
    historicalData,
    summary: {
      totalMarketCap,
      totalVolume24h,
      dominant,
      dominantShare: totalMarketCap > 0 ? (dominant?.marketCap / totalMarketCap) * 100 : 0,
      avgDeviation,
    },
    isLoading,
    isError: !!error,
    isValidating,
    refresh: mutate,
  };
}
