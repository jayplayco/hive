import type { YieldObject } from "@/types/yield";

interface DeFiLlamaPool {
  pool: string;
  project: string;
  projectName?: string;
  symbol: string;
  chain: string;
  apy: number;
  apyBase: number;
  apyReward: number | null;
  tvlUsd: number;
}

export async function fetchAaveYields(): Promise<YieldObject[]> {
  try {
    const res = await fetch("https://yields.llama.fi/pools", {
      next: { revalidate: 300 },
    });
    if (!res.ok) throw new Error("DeFiLlama API error");
    const data = await res.json();

    const pools: DeFiLlamaPool[] = (data.data ?? [])
      .filter(
        (p: DeFiLlamaPool) =>
          p.project === "aave-v3" &&
          ["USDC", "USDT", "DAI"].includes(p.symbol) &&
          p.tvlUsd > 5_000_000
      )
      .sort((a: DeFiLlamaPool, b: DeFiLlamaPool) => b.apy - a.apy)
      .slice(0, 4);

    return pools.map((pool) => ({
      id: `aave-v3-${pool.symbol.toLowerCase()}-${pool.chain.toLowerCase()}`,
      platform: "Aave",
      asset: pool.symbol,
      type: "DeFi" as const,
      apy: pool.apy ?? 0,
      baseApy: pool.apyBase ?? 0,
      incentiveApy: pool.apyReward ?? 0,
      riskScore: 2 as const,
      referralUrl: null,
      tags: [
        pool.chain,
        "Overcollateralized",
        ...(pool.apyReward ? ["Incentivized"] : []),
      ],
      riskFactors: ["Smart Contract Risk", "Oracle Risk", "Liquidation Risk"],
    }));
  } catch {
    return [
      {
        id: "aave-v3-usdc-ethereum",
        platform: "Aave",
        asset: "USDC",
        type: "DeFi",
        apy: 4.8,
        baseApy: 4.8,
        incentiveApy: 0,
        riskScore: 2,
        referralUrl: null,
        tags: ["Ethereum", "Overcollateralized"],
        riskFactors: ["Smart Contract Risk", "Oracle Risk", "Liquidation Risk"],
      },
    ];
  }
}
