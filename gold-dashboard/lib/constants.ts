import type { TokenMetadata, TokenMarketData, GoldSpotData, DefiMetrics, TrustMetrics } from "@/types";

export const TOKENS: TokenMetadata[] = [
  {
    id: "tether-gold",
    symbol: "XAUT",
    name: "Tether Gold",
    chain: ["ETH", "AVAX"],
    regulation: "British Virgin Islands",
    color: "#F5A623",
    coingeckoId: "tether-gold",
    porUrl: "https://gold.tether.to/transparency",
  },
  {
    id: "pax-gold",
    symbol: "PAXG",
    name: "PAX Gold",
    chain: ["ETH"],
    regulation: "NYDFS",
    color: "#4A90D9",
    coingeckoId: "pax-gold",
    porUrl: "https://paxos.com/paxgold/transparency/",
  },
  {
    id: "kinesis-gold",
    symbol: "KAU",
    name: "Kinesis Gold",
    chain: ["Kinesis"],
    regulation: "ADGM",
    color: "#7ED321",
    coingeckoId: "kinesis-gold",
  },
  {
    id: "vnx-gold",
    symbol: "VNXAU",
    name: "VNX Gold",
    chain: ["ETH", "Q"],
    regulation: "Liechtenstein TVTG",
    color: "#9B59B6",
    coingeckoId: "vnx-gold",
  },
  {
    id: "matrixdock-gold",
    symbol: "XAUM",
    name: "Matrixdock Gold",
    chain: ["ETH", "BNB", "SUI"],
    regulation: "Singapore MAS",
    color: "#E74C3C",
    coingeckoId: "matrixdock-gold",
  },
];

export const TOKEN_MAP = Object.fromEntries(TOKENS.map((t) => [t.symbol, t]));

// KAU 단위 정규화: 1 KAU = 1 gram gold, 1 troy oz = 31.1035g
export const KAU_TROY_OZ_FACTOR = 31.1035;

export const MOCK_MARKET_DATA: TokenMarketData[] = [
  { symbol: "XAUT",  price: 3285.40, marketCap: 2550000000, volume24h: 28500000, circulatingSupply: 775800,  priceChange24h: 0.42, priceChange7d: 1.85 },
  { symbol: "PAXG",  price: 3284.10, marketCap: 2250000000, volume24h: 31200000, circulatingSupply: 685200,  priceChange24h: 0.38, priceChange7d: 1.79 },
  { symbol: "KAU",   price: 105.60,  marketCap: 375000000,  volume24h: 4200000,  circulatingSupply: 3552632, priceChange24h: 0.35, priceChange7d: 1.72 },
  { symbol: "VNXAU", price: 3281.50, marketCap: 52000000,   volume24h: 820000,   circulatingSupply: 15847,  priceChange24h: 0.29, priceChange7d: 1.65 },
  { symbol: "XAUM",  price: 3280.20, marketCap: 66000000,   volume24h: 1100000,  circulatingSupply: 20121,  priceChange24h: 0.31, priceChange7d: 1.70 },
];

export const MOCK_GOLD_SPOT: GoldSpotData = {
  price: 3278.80,
  timestamp: new Date().toISOString(),
  change24h: 0.37,
};

// 정적 DeFi 메트릭 (DefiLlama / 공식 프로토콜 데이터 기반)
export const STATIC_DEFI_METRICS: DefiMetrics[] = [
  { symbol: "XAUT",  aoy: 0.82, ltv: 75, availableProtocols: ["Aave V3", "Uniswap V3", "Curve"],   totalDefiLocked: 48000000 },
  { symbol: "PAXG",  aoy: 1.10, ltv: 70, availableProtocols: ["Aave V3", "Uniswap V3", "Compound"], totalDefiLocked: 62000000 },
  { symbol: "KAU",   aoy: 0.45, ltv: null, availableProtocols: ["Kinesis Exchange"],                totalDefiLocked: 5200000 },
  { symbol: "VNXAU", aoy: null, ltv: null, availableProtocols: [],                                  totalDefiLocked: 0 },
  { symbol: "XAUM",  aoy: null, ltv: null, availableProtocols: [],                                  totalDefiLocked: 0 },
];

// 정적 Trust 메트릭
export const STATIC_TRUST_METRICS: TrustMetrics[] = [
  { symbol: "XAUT",  hasPoR: true,  porProvider: "Internal",  porLastVerified: "2025-03-28T00:00:00Z", redemptionRate: 42,  custodian: "Tether Ltd (BVI)",    regulation: "BVI",              auditFrequency: "Monthly" },
  { symbol: "PAXG",  hasPoR: true,  porProvider: "Withum",    porLastVerified: "2025-03-30T00:00:00Z", redemptionRate: 78,  custodian: "Brinks / Loomis",     regulation: "NYDFS",            auditFrequency: "Monthly" },
  { symbol: "KAU",   hasPoR: false, porProvider: "N/A",       porLastVerified: "",                     redemptionRate: 15,  custodian: "Kinesis Money",        regulation: "ADGM",             auditFrequency: "Quarterly" },
  { symbol: "VNXAU", hasPoR: false, porProvider: "N/A",       porLastVerified: "",                     redemptionRate: 3,   custodian: "MnF Swiss AG",         regulation: "Liechtenstein",    auditFrequency: "Annual" },
  { symbol: "XAUM",  hasPoR: false, porProvider: "N/A",       porLastVerified: "",                     redemptionRate: 5,   custodian: "Matrixport / Brinks",  regulation: "Singapore MAS",    auditFrequency: "Monthly" },
];

export const REFRESH_INTERVAL = Number(process.env.NEXT_PUBLIC_REFRESH_INTERVAL ?? 60) * 1000;
