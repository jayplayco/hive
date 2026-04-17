import type { YieldObject } from "@/types/yield";

export async function fetchOpenEdenYields(): Promise<YieldObject[]> {
  return [
    {
      id: "openeden-tbill",
      platform: "OpenEden",
      projectSlug: "openeden",
      asset: "TBILL",
      type: "RWA",
      chain: "Ethereum",
      apy: 5.2,
      baseApy: 5.2,
      incentiveApy: 0,
      apy7dChange: null,
      apy30d: null,
      tvlUsd: 120_000_000,
      tvl7dChange: null,
      riskScore: 2,
      referralUrl: null,
      deepLink: "https://app.openeden.com",
      tags: ["T-Bill Backed", "Institutional", "KYC Required"],
      riskFactors: ["Counterparty Risk", "Regulatory Risk"],
    },
  ];
}
