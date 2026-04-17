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
  apyPct7D: number | null;
  apyMean30d: number | null;
  url: string;
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
      projectSlug: "aave-v3",
      asset: pool.symbol,
      type: "DeFi" as const,
      chain: pool.chain,
      apy: pool.apy ?? 0,
      baseApy: pool.apyBase ?? 0,
      incentiveApy: pool.apyReward ?? 0,
      apy7dChange: pool.apyPct7D ?? null,
      apy30d: pool.apyMean30d ?? null,
      tvlUsd: pool.tvlUsd ?? null,
      tvl7dChange: null,
      riskScore: 2 as const,
      referralUrl: null,
      deepLink: pool.url ?? "https://app.aave.com",
      tags: ["Overcollateralized", ...(pool.apyReward ? ["Incentivized"] : [])],
      riskFactors: ["Smart Contract Risk", "Oracle Risk", "Liquidation Risk"],
    }));
  } catch {
    return [
      {
        id: "aave-v3-usdc-ethereum",
        platform: "Aave",
        projectSlug: "aave-v3",
        asset: "USDC",
        type: "DeFi",
        chain: "Ethereum",
        apy: 4.8,
        baseApy: 4.8,
        incentiveApy: 0,
        apy7dChange: null,
        apy30d: null,
        tvlUsd: null,
        tvl7dChange: null,
        riskScore: 2,
        referralUrl: null,
        deepLink: "https://app.aave.com",
        tags: ["Overcollateralized"],
        riskFactors: ["Smart Contract Risk", "Oracle Risk", "Liquidation Risk"],
      },
    ];
  }
}
