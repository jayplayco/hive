import type { YieldObject } from "@/types/yield";

export async function fetchOpenEdenYields(): Promise<YieldObject[]> {
  return [
    {
      id: "openeden-tbill",
      platform: "OpenEden",
      asset: "TBILL",
      type: "RWA",
      apy: 5.2,
      baseApy: 5.2,
      incentiveApy: 0,
      riskScore: 2,
      referralUrl: null,
      tags: ["T-Bill Backed", "Institutional", "KYC Required"],
      riskFactors: ["Counterparty Risk", "Regulatory Risk"],
    },
  ];
}
