"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { Trade } from "@/types";

interface LastTradesBarChartProps {
  trades: Trade[];
}

const WIN_COLOR = "#16a34a";
const LOSS_COLOR = "#dc2626";

export function LastTradesBarChart({ trades }: LastTradesBarChartProps) {
  const last7 = trades.slice(0, 7).map((t) => {
    const pnl = t.net_pnl ?? t.pnl ?? 0;
    return {
      label: `${t.symbol} (${t.trade_date.slice(0, 7)})`,
      pnl,
      fill: pnl >= 0 ? WIN_COLOR : LOSS_COLOR,
    };
  }).reverse();

  if (last7.length === 0) {
    return (
      <div className="flex h-[240px] w-full items-center justify-center rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/50 text-gray-500">
        No trades yet. Add trades to see the chart.
      </div>
    );
  }

  return (
    <div className="h-[280px] w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={last7} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-800" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}`} />
          <Tooltip
            formatter={(value: number) => [value.toFixed(2), "P&L"]}
            contentStyle={{ backgroundColor: "var(--background)", border: "1px solid var(--border)" }}
          />
          <Bar dataKey="pnl" name="P&L" radius={[4, 4, 0, 0]}>
            {last7.map((_, i) => (
              <Cell key={i} fill={last7[i].fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
