import type { YieldObject } from "@/types/yield";
import { getReferralLink } from "@/config/referrals";

export async function fetchBitgetYields(): Promise<YieldObject[]> {
  return [
    {
      id: "bitget-usdt-flex",
      platform: "Bitget",
      asset: "USDT",
      type: "CEX",
      apy: 4.0,
      baseApy: 4.0,
      incentiveApy: 0,
      riskScore: 3,
      referralUrl: getReferralLink("Bitget"),
      tags: ["Flexible"],
      riskFactors: ["CEX Solvency Risk", "Regulatory Risk", "Custodial Risk"],
    },
    {
      id: "bitget-usdc-flex",
      platform: "Bitget",
      asset: "USDC",
      type: "CEX",
      apy: 3.8,
      baseApy: 3.8,
      incentiveApy: 0,
      riskScore: 3,
      referralUrl: getReferralLink("Bitget"),
      tags: ["Flexible"],
      riskFactors: ["CEX Solvency Risk", "Regulatory Risk", "Custodial Risk"],
    },
  ];
}
