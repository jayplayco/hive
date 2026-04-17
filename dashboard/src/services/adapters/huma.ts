import type { YieldObject } from "@/types/yield";
import { getReferralLink } from "@/config/referrals";

export async function fetchHumaYields(): Promise<YieldObject[]> {
  return [
    {
      id: "huma-usdc-arf",
      platform: "Huma",
      asset: "USDC",
      type: "RWA",
      apy: 15.2,
      baseApy: 10.0,
      incentiveApy: 5.2,
      riskScore: 4,
      referralUrl: getReferralLink("Huma"),
      tags: ["Real-World Credit", "Boosted", "$HUMA Rewards"],
      riskFactors: [
        "Credit Default Risk",
        "Smart Contract Risk",
        "Token Incentive Volatility",
        "Liquidity Risk",
        "Counterparty Risk",
      ],
    },
  ];
}
