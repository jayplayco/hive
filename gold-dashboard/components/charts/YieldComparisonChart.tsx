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
import type { DefiMetrics } from "@/types";

interface YieldComparisonChartProps {
  data: DefiMetrics[];
}

export function YieldComparisonChart({ data }: YieldComparisonChartProps) {
  const chartData = data
    .filter((d) => d.aoy !== null)
    .map((d) => ({
      symbol: d.symbol,
      aoy: d.aoy!,
      color: TOKEN_MAP[d.symbol]?.color ?? "#888",
    }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#222530" vertical={false} />
        <XAxis
          dataKey="symbol"
          tick={{ fill: "#8B909A", fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(v: number) => `${v.toFixed(2)}%`}
          tick={{ fill: "#8B909A", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={50}
        />
        <Tooltip
          contentStyle={{
            background: "#111318",
            border: "1px solid #222530",
            borderRadius: "6px",
            fontSize: "12px",
            color: "#E8EAF0",
          }}
          formatter={(value) => [`${Number(value).toFixed(2)}%`, "AOY"]}
          cursor={{ fill: "rgba(255,255,255,0.04)" }}
        />
        <Bar dataKey="aoy" radius={[4, 4, 0, 0]}>
          {chartData.map((entry) => (
            <Cell key={entry.symbol} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
