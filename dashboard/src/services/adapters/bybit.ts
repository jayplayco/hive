import type { YieldObject } from "@/types/yield";
import { getReferralLink } from "@/config/referrals";

export async function fetchBybitYields(): Promise<YieldObject[]> {
  return [
    {
      id: "bybit-usdt-flex",
      platform: "Bybit",
      projectSlug: "bybit",
      asset: "USDT",
      type: "CEX",
      chain: "CEX",
      apy: 4.5,
      baseApy: 4.5,
      incentiveApy: 0,
      apy7dChange: null,
      apy30d: null,
      tvlUsd: null,
      tvl7dChange: null,
      riskScore: 2,
      referralUrl: getReferralLink("Bybit"),
      deepLink: "https://www.bybit.com/earn/home",
      tags: ["Flexible"],
      riskFactors: ["CEX Solvency Risk", "Regulatory Risk", "Custodial Risk"],
    },
    {
      id: "bybit-usdc-flex",
      platform: "Bybit",
      projectSlug: "bybit",
      asset: "USDC",
      type: "CEX",
      chain: "CEX",
      apy: 4.2,
      baseApy: 4.2,
      incentiveApy: 0,
      apy7dChange: null,
      apy30d: null,
      tvlUsd: null,
      tvl7dChange: null,
      riskScore: 2,
      referralUrl: getReferralLink("Bybit"),
      deepLink: "https://www.bybit.com/earn/home",
      tags: ["Flexible"],
      riskFactors: ["CEX Solvency Risk", "Regulatory Risk", "Custodial Risk"],
    },
  ];
}
