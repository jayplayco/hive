import { NextRequest, NextResponse } from "next/server";
import { MOCK_GOLD_SPOT } from "@/lib/constants";
import type { GoldSpotData } from "@/types";

// 서버 사이드 인메모리 캐시
let cache: { data: GoldSpotData; timestamp: number } | null = null;
const CACHE_TTL = 300_000; // 5분

export async function GET(_req: NextRequest) {
  if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
    return NextResponse.json({ data: cache.data, stale: false });
  }

  // Metals-API (metals.live 무료 티어) 시도
  const metalsApiKey = process.env.METALS_API_KEY;

  if (metalsApiKey) {
    try {
      const res = await fetch(
        `https://metals-api.com/api/latest?access_key=${metalsApiKey}&base=USD&symbols=XAU`,
        { next: { revalidate: 300 } }
      );
      if (res.ok) {
        const json = await res.json();
        // XAU는 1 troy oz당 USD 역수
        const xauRate = json.rates?.XAU;
        if (xauRate) {
          const price = 1 / xauRate;
          const data: GoldSpotData = {
            price,
            timestamp: new Date().toISOString(),
            change24h: 0, // metals-api 무료 tier는 변화율 미제공
          };
          cache = { data, timestamp: Date.now() };
          return NextResponse.json({ data, stale: false });
        }
      }
    } catch (err) {
      console.error("[/api/gold-spot] metals-api error:", err);
    }
  }

  // Fallback: CoinGecko에서 실물 금 ETF 가격 사용 (XAU/USD 근사)
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=tether-gold&vs_currencies=usd&include_24hr_change=true",
      { next: { revalidate: 300 } }
    );
    if (res.ok) {
      const json = await res.json();
      // XAUT ≈ 1 troy oz XAU (근사치로 사용)
      const price = json["tether-gold"]?.usd ?? MOCK_GOLD_SPOT.price;
      const change24h = json["tether-gold"]?.usd_24h_change ?? 0;
      const data: GoldSpotData = {
        price,
        timestamp: new Date().toISOString(),
        change24h,
      };
      cache = { data, timestamp: Date.now() };
      return NextResponse.json({ data, stale: false });
    }
  } catch (err) {
    console.error("[/api/gold-spot] coingecko fallback error:", err);
  }

  // 최종 fallback: mock 데이터
  const fallback = cache?.data ?? MOCK_GOLD_SPOT;
  return NextResponse.json({ data: fallback, stale: true });
}
