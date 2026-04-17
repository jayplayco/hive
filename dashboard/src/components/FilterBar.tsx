"use client";

import type { AssetType } from "@/types/yield";

export type FilterOption = "All" | AssetType;

const FILTERS: FilterOption[] = ["All", "DeFi", "CEX", "RWA", "Options"];

interface FilterBarProps {
  active: FilterOption;
  onChange: (filter: FilterOption) => void;
}

export function FilterBar({ active, onChange }: FilterBarProps) {
  return (
    <div className="flex gap-2 flex-wrap">
      {FILTERS.map((f) => (
        <button
          key={f}
          onClick={() => onChange(f)}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            active === f
              ? "bg-indigo-600 text-white shadow-sm"
              : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
          }`}
        >
          {f}
        </button>
      ))}
    </div>
  );
}
