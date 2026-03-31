"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from "recharts";
import { TOKEN_MAP } from "@/lib/constants";
import { formatUSD } from "@/lib/utils";
import type { TokenMarketData } from "@/types";

interface MarketCapChartProps {
  data: TokenMarketData[];
}

export function MarketCapChart({ data }: MarketCapChartProps) {
  const chartData = [...data]
    .sort((a, b) => b.marketCap - a.marketCap)
    .map((t) => ({
      symbol: t.symbol,
      marketCap: t.marketCap,
      color: TOKEN_MAP[t.symbol]?.color ?? "#888",
    }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#222530" vertical={false} />
        <XAxis
          dataKey="symbol"
          tick={{ fill: "#8B909A", fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(v: number) => formatUSD(v)}
          tick={{ fill: "#8B909A", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={70}
        />
        <Tooltip
          contentStyle={{
            background: "#111318",
            border: "1px solid #222530",
            borderRadius: "6px",
            fontSize: "12px",
            color: "#E8EAF0",
          }}
          formatter={(value) => [formatUSD(Number(value)), "Market Cap"]}
          cursor={{ fill: "rgba(255,255,255,0.04)" }}
        />
        <Bar dataKey="marketCap" radius={[4, 4, 0, 0]}>
          {chartData.map((entry) => (
            <Cell key={entry.symbol} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
