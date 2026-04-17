import type { YieldObject } from "@/types/yield";
import { getReferralLink } from "@/config/referrals";

export async function fetchBinanceYields(): Promise<YieldObject[]> {
  // Placeholder until Binance Simple Earn API credentials are configured
  return [
    {
      id: "binance-usdt-flex",
      platform: "Binance",
      asset: "USDT",
      type: "CEX",
      apy: 3.8,
      baseApy: 3.8,
      incentiveApy: 0,
      riskScore: 2,
      referralUrl: getReferralLink("Binance"),
      tags: ["Flexible", "Tiered"],
      riskFactors: ["CEX Solvency Risk", "Regulatory Risk", "Custodial Risk"],
      tieredRates: [
        { upToAmount: 500, apy: 10.5, label: "First $500" },
        { upToAmount: null, apy: 2.0, label: "Above $500" },
      ],
    },
    {
      id: "binance-usdc-flex",
      platform: "Binance",
      asset: "USDC",
      type: "CEX",
      apy: 3.5,
      baseApy: 3.5,
      incentiveApy: 0,
      riskScore: 2,
      referralUrl: getReferralLink("Binance"),
      tags: ["Flexible"],
      riskFactors: ["CEX Solvency Risk", "Regulatory Risk", "Custodial Risk"],
    },
    {
      id: "binance-usdt-locked-30d",
      platform: "Binance",
      asset: "USDT",
      type: "CEX",
      apy: 5.2,
      baseApy: 5.2,
      incentiveApy: 0,
      riskScore: 2,
      referralUrl: getReferralLink("Binance"),
      tags: ["Locked 30D", "Tiered"],
      riskFactors: [
        "CEX Solvency Risk",
        "Regulatory Risk",
        "Custodial Risk",
        "Liquidity Lock",
      ],
      tieredRates: [
        { upToAmount: 500, apy: 12.0, label: "First $500" },
        { upToAmount: null, apy: 4.5, label: "Above $500" },
      ],
    },
  ];
}
