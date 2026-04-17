import type { YieldObject } from "@/types/yield";
import { getReferralLink } from "@/config/referrals";

export async function fetchBitgetYields(): Promise<YieldObject[]> {
  return [
    {
      id: "bitget-usdt-flex",
      platform: "Bitget",
      projectSlug: "bitget",
      asset: "USDT",
      type: "CEX",
      chain: "CEX",
      apy: 4.0,
      baseApy: 4.0,
      incentiveApy: 0,
      apy7dChange: null,
      apy30d: null,
      tvlUsd: null,
      tvl7dChange: null,
      riskScore: 3,
      referralUrl: getReferralLink("Bitget"),
      deepLink: "https://www.bitget.com/earn",
      tags: ["Flexible"],
      riskFactors: ["CEX Solvency Risk", "Regulatory Risk", "Custodial Risk"],
    },
    {
      id: "bitget-usdc-flex",
      platform: "Bitget",
      projectSlug: "bitget",
      asset: "USDC",
      type: "CEX",
      chain: "CEX",
      apy: 3.8,
      baseApy: 3.8,
      incentiveApy: 0,
      apy7dChange: null,
      apy30d: null,
      tvlUsd: null,
      tvl7dChange: null,
      riskScore: 3,
      referralUrl: getReferralLink("Bitget"),
      deepLink: "https://www.bitget.com/earn",
      tags: ["Flexible"],
      riskFactors: ["CEX Solvency Risk", "Regulatory Risk", "Custodial Risk"],
    },
  ];
}
