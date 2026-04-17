import type { YieldObject, RiskScore } from "@/types/yield";

const RISK_LABELS: Record<RiskScore, string> = {
  1: "Very Low",
  2: "Low",
  3: "Medium",
  4: "High",
  5: "Very High",
};

const RISK_COLORS: Record<RiskScore, { text: string; dot: string; wrapper: string }> = {
  1: {
    text: "text-green-700 dark:text-green-400",
    dot: "bg-green-500",
    wrapper: "bg-green-50 border-green-200 dark:bg-green-950/40 dark:border-green-800",
  },
  2: {
    text: "text-emerald-700 dark:text-emerald-400",
    dot: "bg-emerald-500",
    wrapper: "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800",
  },
  3: {
    text: "text-yellow-700 dark:text-yellow-400",
    dot: "bg-yellow-500",
    wrapper: "bg-yellow-50 border-yellow-200 dark:bg-yellow-950/40 dark:border-yellow-800",
  },
  4: {
    text: "text-orange-700 dark:text-orange-400",
    dot: "bg-orange-500",
    wrapper: "bg-orange-50 border-orange-200 dark:bg-orange-950/40 dark:border-orange-800",
  },
  5: {
    text: "text-red-700 dark:text-red-400",
    dot: "bg-red-500",
    wrapper: "bg-red-50 border-red-200 dark:bg-red-950/40 dark:border-red-800",
  },
};

interface Props {
  item: YieldObject;
}

export function RiskCard({ item }: Props) {
  const score = item.riskScore;
  const colors = RISK_COLORS[score];

  return (
    <div className={`rounded-lg border p-3 ${colors.wrapper}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className={`font-semibold text-sm ${colors.text}`}>
          {RISK_LABELS[score]} Risk
        </span>
        <div className="flex gap-0.5 ml-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-colors ${
                i < score ? colors.dot : "bg-gray-200 dark:bg-gray-700"
              }`}
            />
          ))}
        </div>
      </div>
      <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
        {item.riskFactors.map((factor) => (
          <li key={factor} className="flex items-start gap-1.5">
            <span className="mt-0.5 shrink-0">•</span>
            <span>{factor}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
