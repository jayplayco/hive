"use client";

import { useCallback } from "react";
import { changeColorClass, formatUSD, formatNumber } from "@/lib/utils";
import type { GoldSpotData } from "@/types";

interface HeaderProps {
  goldSpot: GoldSpotData;
  lastUpdated: Date | null;
  isStale?: boolean;
  onRefresh: () => void;
  isDark: boolean;
  onToggleDark: () => void;
}

export function Header({
  goldSpot,
  lastUpdated,
  isStale,
  onRefresh,
  isDark,
  onToggleDark,
}: HeaderProps) {
  const changeClass = changeColorClass(goldSpot.change24h);

  const handleRefresh = useCallback(() => {
    onRefresh();
  }, [onRefresh]);

  return (
    <header className="sticky top-0 z-50 border-b border-[--border] bg-[--bg-card]/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-screen-2xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <span className="text-2xl leading-none text-[--gold-primary]">⬡</span>
          <span className="font-semibold tracking-tight text-[--text-primary]">
            Gold Token Monitor
          </span>
        </div>

        {/* XAU/USD spot + controls */}
        <div className="flex items-center gap-4">
          {/* Stale badge */}
          {isStale && (
            <span className="rounded-full bg-yellow-500/20 px-2 py-0.5 text-xs font-medium text-yellow-400">
              Stale data
            </span>
          )}

          {/* Gold spot price */}
          <div className="hidden items-center gap-2 sm:flex">
            <span className="text-xs text-[--text-secondary]">XAU/USD</span>
            <span className="font-mono text-sm font-semibold text-[--gold-light]">
              {formatUSD(goldSpot.price, 2)}
            </span>
            <span className={`font-mono text-xs ${changeClass}`}>
              {goldSpot.change24h >= 0 ? "▲" : "▼"}{" "}
              {formatNumber(Math.abs(goldSpot.change24h), 2)}%
            </span>
          </div>

          {/* Last updated */}
          {lastUpdated && (
            <span className="hidden text-xs text-[--text-secondary] lg:block">
              Updated {lastUpdated.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>
          )}

          {/* Refresh button */}
          <button
            onClick={handleRefresh}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-[--border] text-[--text-secondary] transition-colors hover:border-[--gold-primary] hover:text-[--gold-primary]"
            title="Refresh data"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>

          {/* Dark mode toggle */}
          <button
            onClick={onToggleDark}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-[--border] text-[--text-secondary] transition-colors hover:border-[--gold-primary] hover:text-[--gold-primary]"
            title="Toggle dark mode"
          >
            {isDark ? (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
