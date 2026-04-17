export type AssetType = "CEX" | "DeFi" | "RWA" | "Options";
export type RiskScore = 1 | 2 | 3 | 4 | 5;

export interface TieredRate {
  upToAmount: number | null; // null = unlimited
  apy: number;
  label: string;
}

export interface YieldObject {
  id: string;
  platform: string;
  asset: string;
  type: AssetType;
  apy: number;
  baseApy: number;
  incentiveApy: number;
  riskScore: RiskScore;
  referralUrl: string | null;
  tags: string[];
  riskFactors: string[];
  tieredRates?: TieredRate[];
}
