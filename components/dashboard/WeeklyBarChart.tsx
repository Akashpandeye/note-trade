"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { TradeForStats } from "@/lib/calcPnl";

interface WeeklyBarChartProps {
  trades: TradeForStats[];
  loading?: boolean;
}

function getWeekKey(dateStr: string): string {
  const d = new Date(dateStr);
  const start = new Date(d);
  start.setDate(d.getDate() - d.getDay());
  const y = start.getFullYear();
  const m = String(start.getMonth() + 1).padStart(2, "0");
  const day = String(start.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function buildWeeklyData(trades: TradeForStats[]): { week: string; pnl: number }[] {
  const byWeek = new Map<string, number>();
  for (const t of trades) {
    const date = (t.trade_date ?? t.executed_at ?? "").toString();
    if (!date) continue;
    const weekKey = getWeekKey(date);
    const pnl = t.net_pnl ?? t.pnl ?? 0;
    byWeek.set(weekKey, (byWeek.get(weekKey) ?? 0) + pnl);
  }
  return Array.from(byWeek.entries())
    .map(([week, pnl]) => ({ week, pnl }))
    .sort((a, b) => a.week.localeCompare(b.week));
}

export function WeeklyBarChart({ trades, loading }: WeeklyBarChartProps) {
  if (loading) {
    return (
      <div className="h-[280px] w-full rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/50 flex items-center justify-center text-gray-500">
        Loading…
      </div>
    );
  }

  const data = buildWeeklyData(trades);
  if (data.length === 0) {
    return (
      <div className="flex h-[280px] w-full items-center justify-center rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/50 text-gray-500">
        No weekly data yet.
      </div>
    );
  }

  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-800" />
          <XAxis dataKey="week" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${v}`} />
          <Tooltip
            formatter={(value: number) => [value.toFixed(2), "P&L"]}
            contentStyle={{ backgroundColor: "var(--background)", border: "1px solid var(--border)" }}
          />
          <Bar dataKey="pnl" fill="#16a34a" radius={[4, 4, 0, 0]} name="P&L" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
