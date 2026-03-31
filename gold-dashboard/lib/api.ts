import type { TokenMarketData, GoldSpotData } from "@/types";
import { MOCK_MARKET_DATA, MOCK_GOLD_SPOT } from "./constants";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "";

// 클라이언트 사이드 API 래퍼 (SWR 훅에서 사용)
export async function fetchTokenPrices(): Promise<TokenMarketData[]> {
  const res = await fetch(`${BASE_URL}/api/prices`);
  if (!res.ok) throw new Error("Failed to fetch token prices");
  const json = await res.json();
  return json.data ?? MOCK_MARKET_DATA;
}

export async function fetchGoldSpot(): Promise<GoldSpotData> {
  const res = await fetch(`${BASE_URL}/api/gold-spot`);
  if (!res.ok) throw new Error("Failed to fetch gold spot price");
  const json = await res.json();
  return json.data ?? MOCK_GOLD_SPOT;
}

export async function fetchPoR(): Promise<Record<string, unknown>> {
  const res = await fetch(`${BASE_URL}/api/por`);
  if (!res.ok) throw new Error("Failed to fetch PoR data");
  return res.json();
}
