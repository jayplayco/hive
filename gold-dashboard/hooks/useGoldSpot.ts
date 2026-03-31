"use client";

import useSWR from "swr";
import { fetchGoldSpot } from "@/lib/api";
import { REFRESH_INTERVAL, MOCK_GOLD_SPOT } from "@/lib/constants";
import type { GoldSpotData } from "@/types";

export function useGoldSpot() {
  const { data, error, isLoading, mutate } = useSWR<GoldSpotData>(
    "/api/gold-spot",
    fetchGoldSpot,
    {
      refreshInterval: REFRESH_INTERVAL,
      revalidateOnFocus: false,
      fallbackData: MOCK_GOLD_SPOT,
      onErrorRetry: (err, _key, _config, revalidate, { retryCount }) => {
        if (retryCount >= 3) return;
        setTimeout(() => revalidate({ retryCount }), 5000);
      },
    }
  );

  return {
    goldSpot: data ?? MOCK_GOLD_SPOT,
    isLoading,
    isError: !!error,
    refresh: mutate,
  };
}
