import type { YieldObject, AssetType } from "@/types/yield";
import { fetchBinanceYields } from "./adapters/binance";
import { fetchBybitYields } from "./adapters/bybit";
import { fetchBitgetYields } from "./adapters/bitget";
import { fetchAaveYields } from "./adapters/aave";
import { fetchOndoYields } from "./adapters/ondo";
import { fetchMountainYields } from "./adapters/mountain";
import { fetchOpenEdenYields } from "./adapters/openeden";
import { fetchHumaYields } from "./adapters/huma";
import { fetchTurtleYields } from "./adapters/turtle";
import { fetchDeFiLlamaYields } from "./adapters/defillama";

export interface YieldProviderResult {
  yields: YieldObject[];
  lastUpdated: string;
  errors: string[];
}

const ADAPTER_REGISTRY = [
  { name: "Binance", fn: fetchBinanceYields },
  { name: "Bybit", fn: fetchBybitYields },
  { name: "Bitget", fn: fetchBitgetYields },
  { name: "Aave", fn: fetchAaveYields },
  { name: "Ondo", fn: fetchOndoYields },
  { name: "Mountain", fn: fetchMountainYields },
  { name: "OpenEden", fn: fetchOpenEdenYields },
  { name: "Huma", fn: fetchHumaYields },
  { name: "Turtle", fn: fetchTurtleYields },
  { name: "DeFiLlama", fn: fetchDeFiLlamaYields },
] as const;

export async function aggregateYields(): Promise<YieldProviderResult> {
  const results = await Promise.allSettled(
    ADAPTER_REGISTRY.map(({ fn }) => fn())
  );

  const yields: YieldObject[] = [];
  const errors: string[] = [];

  results.forEach((result, i) => {
    if (result.status === "fulfilled") {
      yields.push(...result.value);
    } else {
      errors.push(
        `${ADAPTER_REGISTRY[i].name} adapter failed: ${result.reason}`
      );
    }
  });

  return { yields, lastUpdated: new Date().toISOString(), errors };
}

export type { YieldObject, AssetType };
