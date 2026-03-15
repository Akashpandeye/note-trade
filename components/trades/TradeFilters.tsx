"use client";

import { useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { TradeFilters as TradeFiltersType } from "@/types";

interface TradeFiltersProps {
  filters: TradeFiltersType;
  onFiltersChange: (f: TradeFiltersType) => void;
  onReset: () => void;
}

export function TradeFilters({ filters, onFiltersChange, onReset }: TradeFiltersProps) {
  const set = useCallback(
    (key: keyof TradeFiltersType, value: string | undefined) => {
      onFiltersChange({ ...filters, [key]: value || undefined });
    },
    [filters, onFiltersChange]
  );

  return (
    <div className="flex flex-wrap items-end gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
      <div className="space-y-1">
        <Label>From date</Label>
        <Input
          type="date"
          value={filters.dateFrom ?? ""}
          onChange={(e) => set("dateFrom", e.target.value)}
          className="w-40"
        />
      </div>
      <div className="space-y-1">
        <Label>To date</Label>
        <Input
          type="date"
          value={filters.dateTo ?? ""}
          onChange={(e) => set("dateTo", e.target.value)}
          className="w-40"
        />
      </div>
      <div className="space-y-1">
        <Label>Symbol</Label>
        <Input
          type="text"
          placeholder="Search symbol"
          value={filters.symbol ?? ""}
          onChange={(e) => set("symbol", e.target.value)}
          className="w-36"
        />
      </div>
      <div className="space-y-1">
        <Label>Segment</Label>
        <select
          className="flex h-10 w-28 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-950"
          value={filters.segment ?? "all"}
          onChange={(e) => set("segment", e.target.value === "all" ? undefined : e.target.value)}
        >
          <option value="all">All</option>
          <option value="EQ">EQ</option>
          <option value="FO">FO</option>
        </select>
      </div>
      <div className="space-y-1">
        <Label>Win / Loss</Label>
        <select
          className="flex h-10 w-28 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-950"
          value={filters.winLoss ?? "all"}
          onChange={(e) =>
            set("winLoss", e.target.value === "all" ? undefined : (e.target.value as "win" | "loss"))
          }
        >
          <option value="all">All</option>
          <option value="win">Wins</option>
          <option value="loss">Losses</option>
        </select>
      </div>
      <Button variant="outline" size="sm" onClick={onReset}>
        Reset
      </Button>
    </div>
  );
}
