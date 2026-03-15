"use client";

import type { TradeForStats } from "@/lib/calcPnl";

interface CalendarHeatmapProps {
  trades: TradeForStats[];
  loading?: boolean;
}

function buildDayPnlMap(trades: TradeForStats[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const t of trades) {
    const date = (t.trade_date ?? t.executed_at ?? "").toString().slice(0, 10);
    if (!date) continue;
    const pnl = t.net_pnl ?? t.pnl ?? 0;
    map.set(date, (map.get(date) ?? 0) + pnl);
  }
  return map;
}

export function CalendarHeatmap({ trades, loading }: CalendarHeatmapProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-7 gap-1 rounded-lg border border-gray-200 p-4 dark:border-gray-800">
        {Array.from({ length: 35 }, (_, i) => (
          <div
            key={i}
            className="aspect-square animate-pulse rounded bg-gray-200 dark:bg-gray-800"
          />
        ))}
      </div>
    );
  }

  const dayPnl = buildDayPnlMap(trades);
  if (dayPnl.size === 0) {
    return (
      <div className="flex min-h-[120px] items-center justify-center rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/50 text-gray-500">
        No trade data for calendar.
      </div>
    );
  }

  const dates = Array.from(dayPnl.keys()).sort();
  const min = Math.min(...Array.from(dayPnl.values()));
  const max = Math.max(...Array.from(dayPnl.values()));
  const scale = (pnl: number) => {
    if (pnl === 0) return "bg-gray-300 dark:bg-gray-600";
    if (pnl > 0) return "bg-green-500 dark:bg-green-600";
    return "bg-red-500 dark:bg-red-600";
  };

  return (
    <div className="space-y-2">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Daily P&L (green = profit, red = loss)
      </p>
      <div className="flex flex-wrap gap-1">
        {dates.slice(-60).map((date) => {
          const pnl = dayPnl.get(date) ?? 0;
          return (
            <div
              key={date}
              title={`${date}: ${pnl.toFixed(2)}`}
              className={`h-4 w-4 rounded-sm ${scale(pnl)}`}
            />
          );
        })}
      </div>
    </div>
  );
}
