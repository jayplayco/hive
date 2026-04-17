import type { YieldObject } from "@/types/yield";
import { getReferralLink } from "@/config/referrals";

export async function fetchTurtleYields(): Promise<YieldObject[]> {
  return [
    {
      id: "turtle-usdc",
      platform: "Turtle",
      asset: "USDC",
      type: "DeFi",
      apy: 18.5,
      baseApy: 5.0,
      incentiveApy: 13.5,
      riskScore: 4,
      referralUrl: getReferralLink("Turtle"),
      tags: ["Boosted", "$TURTLE Rewards", "Arbitrum"],
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
      asset: "USDT",
      type: "DeFi",
      apy: 16.8,
      baseApy: 4.5,
      incentiveApy: 12.3,
      riskScore: 4,
      referralUrl: getReferralLink("Turtle"),
      tags: ["Boosted", "$TURTLE Rewards", "Arbitrum"],
      riskFactors: [
        "Smart Contract Risk",
        "Token Incentive Volatility",
        "Protocol Concentration Risk",
        "Liquidity Risk",
      ],
    },
  ];
}
