export interface TokenMetadata {
  id: string;
  symbol: string;
  name: string;
  chain: string[];
  regulation: string;
  color: string;
  coingeckoId: string;
  porUrl?: string;
}

export interface TokenMarketData {
  symbol: string;
  price: number;
  marketCap: number;
  volume24h: number;
  circulatingSupply: number;
  priceChange24h: number;
  priceChange7d: number;
}

export interface FidelityMetrics {
  symbol: string;
  spotDeviation: number;   // %: (tokenPrice - goldSpot) / goldSpot * 100
  trackingAccuracy30d: number;
  maxDeviation30d: number;
}

export interface DefiMetrics {
  symbol: string;
  aoy: number | null;      // Annualized Organic Yield %
  ltv: number | null;      // Loan-to-Value %
  availableProtocols: string[];
  totalDefiLocked: number;
}

export interface TrustMetrics {
  symbol: string;
  hasPoR: boolean;
  porProvider: string;
  porLastVerified: string;
  redemptionRate: number;
  custodian: string;
  regulation: string;
  auditFrequency: string;
}

export interface GoldSpotData {
  price: number;
  timestamp: string;
  change24h: number;
}

export interface HistoricalDataPoint {
  date: string;
  [symbol: string]: number | string;
}

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  stale?: boolean;
}
