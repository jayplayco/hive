import type { YieldObject } from "@/types/yield";

const TRACKED_PROJECTS = [
  "compound-v3",
  "morpho",
  "spark",
  "fluid",
  "euler",
] as const;

type TrackedProject = (typeof TRACKED_PROJECTS)[number];

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

export async function fetchDeFiLlamaYields(): Promise<YieldObject[]> {
  try {
    const res = await fetch("https://yields.llama.fi/pools", {
      next: { revalidate: 300 },
    });
    if (!res.ok) throw new Error("DeFiLlama API error");
    const data = await res.json();

    const pools: DeFiLlamaPool[] = (data.data ?? [])
      .filter(
        (p: DeFiLlamaPool) =>
          TRACKED_PROJECTS.includes(p.project as TrackedProject) &&
          ["USDC", "USDT", "DAI", "USDC.e"].includes(p.symbol) &&
          p.tvlUsd > 2_000_000
      )
      .sort((a: DeFiLlamaPool, b: DeFiLlamaPool) => b.apy - a.apy)
      .slice(0, 8);

    return pools.map((pool) => ({
      id: `defillama-${pool.project}-${pool.symbol.toLowerCase()}-${pool.chain.toLowerCase()}`,
      platform: pool.projectName ?? pool.project,
      projectSlug: pool.project,
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
      riskScore: 3 as const,
      referralUrl: null,
      deepLink: pool.url ?? null,
      tags: [...(pool.apyReward ? ["Incentivized"] : [])],
      riskFactors: ["Smart Contract Risk", "Oracle Risk"],
    }));
  } catch {
    return [];
  }
}
