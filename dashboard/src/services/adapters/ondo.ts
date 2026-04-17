import type { YieldObject } from "@/types/yield";
import { getReferralLink } from "@/config/referrals";

export async function fetchOndoYields(): Promise<YieldObject[]> {
  return [
    {
      id: "ondo-usdy",
      platform: "Ondo",
      projectSlug: "ondo-finance",
      asset: "USDY",
      type: "RWA",
      chain: "Ethereum",
      apy: 5.35,
      baseApy: 5.35,
      incentiveApy: 0,
      apy7dChange: null,
      apy30d: null,
      tvlUsd: 640_000_000,
      tvl7dChange: null,
      riskScore: 2,
      referralUrl: getReferralLink("Ondo"),
      deepLink: "https://ondo.finance/usdy",
      tags: ["T-Bill Backed", "KYC Required"],
      riskFactors: ["Counterparty Risk", "Regulatory Risk", "Redemption Delay (2 days)"],
    },
    {
      id: "ondo-ousg",
      platform: "Ondo",
      projectSlug: "ondo-finance",
      asset: "OUSG",
      type: "RWA",
      chain: "Ethereum",
      apy: 5.1,
      baseApy: 5.1,
      incentiveApy: 0,
      apy7dChange: null,
      apy30d: null,
      tvlUsd: 280_000_000,
      tvl7dChange: null,
      riskScore: 2,
      referralUrl: getReferralLink("Ondo"),
      deepLink: "https://ondo.finance/ousg",
      tags: ["T-Bill Backed", "Institutional", "Accredited Investors"],
      riskFactors: ["Counterparty Risk", "Regulatory Risk", "Accredited Investors Only"],
    },
  ];
}
