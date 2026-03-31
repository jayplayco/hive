"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import { TOKENS } from "@/lib/constants";
import type { HistoricalDataPoint } from "@/types";

interface PriceDeviationChartProps {
  data: HistoricalDataPoint[];
}

// 날짜 포맷: "Mar 01" 형식
function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00Z");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

export function PriceDeviationChart({ data }: PriceDeviationChartProps) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#222530" />
        <XAxis
          dataKey="date"
          tickFormatter={formatDate}
          tick={{ fill: "#8B909A", fontSize: 11 }}
          axisLine={{ stroke: "#222530" }}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tickFormatter={(v: number) => `${v.toFixed(2)}%`}
          tick={{ fill: "#8B909A", fontSize: 11 }}
          axisLine={{ stroke: "#222530" }}
          tickLine={false}
          width={55}
        />
        <Tooltip
          contentStyle={{
            background: "#111318",
            border: "1px solid #222530",
            borderRadius: "6px",
            fontSize: "12px",
            color: "#E8EAF0",
          }}
          formatter={(value, name) => {
            const v = Number(value);
            return [`${v >= 0 ? "+" : ""}${v.toFixed(3)}%`, String(name)];
          }}
          labelFormatter={(label) => formatDate(String(label))}
        />
        <Legend
          wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }}
          formatter={(value) => (
            <span style={{ color: "#8B909A" }}>{value}</span>
          )}
        />
        {/* 기준선: 0% 괴리율 */}
        <ReferenceLine y={0} stroke="#F56565" strokeDasharray="4 4" strokeWidth={1.5} />
        {TOKENS.map((token) => (
          <Line
            key={token.symbol}
            type="monotone"
            dataKey={token.symbol}
            stroke={token.color}
            dot={false}
            strokeWidth={1.5}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
