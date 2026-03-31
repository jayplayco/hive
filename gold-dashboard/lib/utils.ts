import { KAU_TROY_OZ_FACTOR } from "./constants";

// 숫자를 USD 통화 형식으로 포맷
export function formatUSD(value: number, decimals = 2): string {
  if (value >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(2)}B`;
  }
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`;
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

// 숫자를 소수 표시 (금액 등)
export function formatNumber(value: number, decimals = 2): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

// 괴리율 계산: (tokenPrice - goldSpot) / goldSpot * 100
// KAU는 1g 기준이므로 troy oz 가격으로 정규화
export function calcSpotDeviation(
  tokenPrice: number,
  goldSpotPrice: number,
  symbol: string
): number {
  let normalizedPrice = tokenPrice;
  if (symbol === "KAU") {
    // 1 KAU = 1g → troy oz 가격으로 변환
    normalizedPrice = tokenPrice * KAU_TROY_OZ_FACTOR;
  }
  return ((normalizedPrice - goldSpotPrice) / goldSpotPrice) * 100;
}

// 괴리율에 따른 색상 클래스 반환
export function deviationColorClass(deviation: number): string {
  const abs = Math.abs(deviation);
  if (abs <= 0.1) return "text-green-400";
  if (abs <= 0.5) return "text-yellow-400";
  return "text-red-400";
}

// 가격 변화율에 따른 색상 클래스
export function changeColorClass(change: number): string {
  return change >= 0 ? "text-emerald-400" : "text-red-400";
}

// ISO 타임스탬프를 로컬 시간 문자열로 포맷
export function formatTimestamp(iso: string): string {
  if (!iso) return "N/A";
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// 30일 히스토리 mock 데이터 생성 (API 연동 전 개발용)
export function generateMockHistory(
  symbol: string,
  baseDeviation: number,
  days = 30
): Array<{ date: string; deviation: number }> {
  const result = [];
  const now = Date.now();
  for (let i = days; i >= 0; i--) {
    const d = new Date(now - i * 24 * 60 * 60 * 1000);
    const noise = (Math.random() - 0.5) * 0.6;
    result.push({
      date: d.toISOString().split("T")[0],
      deviation: parseFloat((baseDeviation + noise).toFixed(3)),
    });
  }
  return result;
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}
