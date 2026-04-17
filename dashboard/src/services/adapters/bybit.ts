import type { YieldObject } from "@/types/yield";
import { getReferralLink } from "@/config/referrals";

export async function fetchBybitYields(): Promise<YieldObject[]> {
  return [
    {
      id: "bybit-usdt-flex",
      platform: "Bybit",
      asset: "USDT",
      type: "CEX",
      apy: 4.5,
      baseApy: 4.5,
      incentiveApy: 0,
      riskScore: 2,
      referralUrl: getReferralLink("Bybit"),
      tags: ["Flexible"],
      riskFactors: ["CEX Solvency Risk", "Regulatory Risk", "Custodial Risk"],
    },
    {
      id: "bybit-usdc-flex",
      platform: "Bybit",
      asset: "USDC",
      type: "CEX",
      apy: 4.2,
      baseApy: 4.2,
      incentiveApy: 0,
      riskScore: 2,
      referralUrl: getReferralLink("Bybit"),
      tags: ["Flexible"],
      riskFactors: ["CEX Solvency Risk", "Regulatory Risk", "Custodial Risk"],
    },
  ];
}
