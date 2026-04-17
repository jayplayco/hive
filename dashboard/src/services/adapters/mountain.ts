import type { YieldObject } from "@/types/yield";

export async function fetchMountainYields(): Promise<YieldObject[]> {
  return [
    {
      id: "mountain-usdm",
      platform: "Mountain",
      projectSlug: "mountain-protocol",
      asset: "USDM",
      type: "RWA",
      chain: "Ethereum",
      apy: 5.0,
      baseApy: 5.0,
      incentiveApy: 0,
      apy7dChange: null,
      apy30d: null,
      tvlUsd: 190_000_000,
      tvl7dChange: null,
      riskScore: 2,
      referralUrl: null,
      deepLink: "https://mountainprotocol.com/earn",
      tags: ["T-Bill Backed", "Non-US Users"],
      riskFactors: ["Counterparty Risk", "Regulatory Risk", "Redemption Delay"],
    },
  ];
}
