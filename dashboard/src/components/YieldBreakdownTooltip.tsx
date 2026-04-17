"use client";

import { useState } from "react";
import type { YieldObject } from "@/types/yield";

interface Props {
  item: YieldObject;
}

export function YieldBreakdownTooltip({ item }: Props) {
  const [open, setOpen] = useState(false);

  const isHighVolatility = item.incentiveApy > 0 && item.incentiveApy > item.apy * 0.5;
  const basePercent = item.apy > 0 ? (item.baseApy / item.apy) * 100 : 100;
  const incentivePercent = item.apy > 0 ? (item.incentiveApy / item.apy) * 100 : 0;

  return (
    <div className="relative inline-block">
      <button
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-right"
      >
        <span className="font-semibold text-indigo-600 dark:text-indigo-400">
          {item.apy.toFixed(2)}%
        </span>
        {isHighVolatility && (
          <span className="text-amber-500 text-xs" title="High Volatility Reward">
            ⚡
          </span>
        )}
      </button>

      {open && (
        <div className="absolute z-50 right-0 top-full mt-2 w-60 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl p-4">
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
            Yield Breakdown
          </p>

          <div className="space-y-2.5">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-green-600 dark:text-green-400 font-medium">
                  Base APY
                </span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">
                  {item.baseApy.toFixed(2)}%
                </span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all"
                  style={{ width: `${basePercent}%` }}
                />
              </div>
            </div>

            {item.incentiveApy > 0 && (
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-amber-600 dark:text-amber-400 font-medium">
                    Incentive APY
                  </span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">
                    {item.incentiveApy.toFixed(2)}%
                  </span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2">
                  <div
                    className="bg-amber-400 h-2 rounded-full transition-all"
                    style={{ width: `${incentivePercent}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {isHighVolatility && (
            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
              <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                ⚡ High Volatility Reward
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Token incentives exceed 50% of total yield — rate may fluctuate sharply.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
