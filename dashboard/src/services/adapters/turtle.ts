import type { YieldObject } from "@/types/yield";
import { getReferralLink } from "@/config/referrals";

export async function fetchTurtleYields(): Promise<YieldObject[]> {
  return [
    {
      id: "turtle-usdc",
      platform: "Turtle",
      projectSlug: "turtle-club",
      asset: "USDC",
      type: "DeFi",
      chain: "Arbitrum",
      apy: 18.5,
      baseApy: 5.0,
      incentiveApy: 13.5,
      apy7dChange: null,
      apy30d: null,
      tvlUsd: 38_000_000,
      tvl7dChange: null,
      riskScore: 4,
      referralUrl: getReferralLink("Turtle"),
      deepLink: "https://app.turtle.club",
      tags: ["Boosted", "$TURTLE Rewards"],
      riskFactors: [
        "Smart Contract Risk",
        "Token Incentive Volatility",
        "Protocol Concentration Risk",
        "Liquidity Risk",
      ],
    },
    {
      id: "turtle-usdt",
      platform: "Turtle",
      projectSlug: "turtle-club",
      asset: "USDT",
      type: "DeFi",
      chain: "Arbitrum",
      apy: 16.8,
      baseApy: 4.5,
      incentiveApy: 12.3,
      apy7dChange: null,
      apy30d: null,
      tvlUsd: 22_000_000,
      tvl7dChange: null,
      riskScore: 4,
      referralUrl: getReferralLink("Turtle"),
      deepLink: "https://app.turtle.club",
      tags: ["Boosted", "$TURTLE Rewards"],
      riskFactors: [
        "Smart Contract Risk",
        "Token Incentive Volatility",
        "Protocol Concentration Risk",
        "Liquidity Risk",
      ],
    },
  ];
}
