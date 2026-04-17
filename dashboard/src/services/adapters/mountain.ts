import type { YieldObject } from "@/types/yield";

export async function fetchMountainYields(): Promise<YieldObject[]> {
  return [
    {
      id: "mountain-usdm",
      platform: "Mountain",
      asset: "USDM",
      type: "RWA",
      apy: 5.0,
      baseApy: 5.0,
      incentiveApy: 0,
      riskScore: 2,
      referralUrl: null,
      tags: ["T-Bill Backed", "Non-US Users"],
      riskFactors: [
        "Counterparty Risk",
        "Regulatory Risk",
        "Redemption Delay",
      ],
    },
  ];
}
