import { NextRequest, NextResponse } from "next/server";
import { TOKENS, MOCK_MARKET_DATA } from "@/lib/constants";
import type { TokenMarketData } from "@/types";

// 서버 사이드 인메모리 캐시 (Rate limit 대응)
let cache: { data: TokenMarketData[]; timestamp: number } | null = null;
const CACHE_TTL = 60_000; // 60초

export async function GET(_req: NextRequest) {
  // 캐시가 유효하면 즉시 반환
  if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
    return NextResponse.json({ data: cache.data, stale: false });
  }

  const ids = TOKENS.map((t) => t.coingeckoId).join(",");
  const apiKey = process.env.COINGECKO_API_KEY;
  const headers: HeadersInit = apiKey
    ? { "x-cg-demo-api-key": apiKey }
    : {};

  try {
    const url = new URL("https://api.coingecko.com/api/v3/coins/markets");
    url.searchParams.set("vs_currency", "usd");
    url.searchParams.set("ids", ids);
    url.searchParams.set("order", "market_cap_desc");
    url.searchParams.set("per_page", "10");
    url.searchParams.set("page", "1");
    url.searchParams.set("sparkline", "false");
    url.searchParams.set("price_change_percentage", "24h,7d");

    const res = await fetch(url.toString(), {
      headers,
      next: { revalidate: 60 },
    });

    if (!res.ok) throw new Error(`CoinGecko error: ${res.status}`);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw: any[] = await res.json();

    // CoinGecko 응답을 내부 포맷으로 매핑
    const data: TokenMarketData[] = raw.map((item) => {
      const token = TOKENS.find((t) => t.coingeckoId === item.id);
      return {
        symbol: token?.symbol ?? item.symbol.toUpperCase(),
        price: item.current_price ?? 0,
        marketCap: item.market_cap ?? 0,
        volume24h: item.total_volume ?? 0,
        circulatingSupply: item.circulating_supply ?? 0,
        priceChange24h: item.price_change_percentage_24h ?? 0,
        priceChange7d: item.price_change_percentage_7d_in_currency ?? 0,
      };
    });

    cache = { data, timestamp: Date.now() };
    return NextResponse.json({ data, stale: false });
  } catch (err) {
    console.error("[/api/prices]", err);
    // API 실패 시: 캐시 데이터 또는 mock 데이터로 fallback
    const fallback = cache?.data ?? MOCK_MARKET_DATA;
    return NextResponse.json(
      { data: fallback, stale: true, error: String(err) },
      { status: 200 }
    );
  }
}
