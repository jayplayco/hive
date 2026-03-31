import { NextRequest, NextResponse } from "next/server";

export interface PoRData {
  symbol: string;
  hasPoR: boolean;
  goldOz?: number;
  lastUpdated?: string;
  source?: string;
}

// 서버 사이드 캐시 (1시간)
let cache: { data: PoRData[]; timestamp: number } | null = null;
const CACHE_TTL = 3_600_000;

// 정적 기본값 (API 연동 전 / 연동 실패 시)
const STATIC_POR: PoRData[] = [
  { symbol: "XAUT",  hasPoR: true,  goldOz: 775800,  lastUpdated: "2025-03-28", source: "https://gold.tether.to/transparency" },
  { symbol: "PAXG",  hasPoR: true,  goldOz: 685200,  lastUpdated: "2025-03-30", source: "https://paxos.com/paxgold/transparency/" },
  { symbol: "KAU",   hasPoR: false },
  { symbol: "VNXAU", hasPoR: false },
  { symbol: "XAUM",  hasPoR: false },
];

export async function GET(_req: NextRequest) {
  if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
    return NextResponse.json({ data: cache.data, stale: false });
  }

  // TODO: 실제 Paxos / Tether PoR API 연동
  // 현재는 정적 데이터 반환 (공개 API가 스크래핑 없이 접근 가능할 경우 추가)
  cache = { data: STATIC_POR, timestamp: Date.now() };
  return NextResponse.json({ data: STATIC_POR, stale: false });
}
