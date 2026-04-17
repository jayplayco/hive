export type AssetType = "CEX" | "DeFi" | "RWA" | "Options";
export type RiskScore = 1 | 2 | 3 | 4 | 5;

export interface TieredRate {
  upToAmount: number | null;
  apy: number;
  label: string;
}

export interface YieldObject {
  id: string;
  platform: string;
  projectSlug: string;    // used for logo lookup
  asset: string;
  type: AssetType;
  chain: string;
  // APY
  apy: number;
  baseApy: number;
  incentiveApy: number;
  apy7dChange: number | null;
  apy30d: number | null;
  // TVL
  tvlUsd: number | null;
  tvl7dChange: number | null;
  // Risk
  riskScore: RiskScore;
  riskFactors: string[];
  tags: string[];
  tieredRates?: TieredRate[];
  // Links
  deepLink: string | null;
  referralUrl: string | null;
}
