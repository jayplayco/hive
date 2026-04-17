import type { YieldObject } from "@/types/yield";
import { getReferralLink } from "@/config/referrals";

export async function fetchHumaYields(): Promise<YieldObject[]> {
  return [
    {
      id: "huma-usdc-arf",
      platform: "Huma",
      projectSlug: "huma-finance",
      asset: "USDC",
      type: "RWA",
      chain: "Solana",
      apy: 15.2,
      baseApy: 10.0,
      incentiveApy: 5.2,
      apy7dChange: null,
      apy30d: null,
      tvlUsd: 55_000_000,
      tvl7dChange: null,
      riskScore: 4,
      referralUrl: getReferralLink("Huma"),
      deepLink: "https://app.huma.finance",
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
