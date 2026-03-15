"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { totalPnl, type TradeForStats } from "@/lib/calcPnl";

interface EquityCurveProps {
  trades: TradeForStats[];
  loading?: boolean;
}

function buildEquityData(trades: TradeForStats[]): { date: string; cumulativePnl: number }[] {
  const byDate = new Map<string, number>();
  const sorted = [...trades].sort(
    (a, b) =>
      new Date((a.trade_date ?? a.executed_at ?? "")).getTime() -
      new Date((b.trade_date ?? b.executed_at ?? "")).getTime()
  );
  let cum = 0;
  for (const t of sorted) {
    const date = t.trade_date ?? t.executed_at ?? "";
    if (date) {
      cum += t.net_pnl ?? t.pnl ?? 0;
      byDate.set(date, cum);
    }
  }
  return Array.from(byDate.entries()).map(([date, cumulativePnl]) => ({
    date: date.slice(0, 10),
    cumulativePnl,
  }));
}

export function EquityCurve({ trades, loading }: EquityCurveProps) {
  if (loading) {
    return (
      <div className="h-[300px] w-full rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/50">
        <div className="flex h-full items-center justify-center text-gray-500">
          Loading chart…
        </div>
      </div>
    );
  }

  const data = buildEquityData(trades);
  if (data.length === 0) {
    return (
      <div className="flex h-[300px] w-full items-center justify-center rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/50 text-gray-500">
        No trade data yet. Upload a CSV to see your equity curve.
      </div>
    );
  }

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-800" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${v}`} />
          <Tooltip
            formatter={(value: number) => [value.toFixed(2), "Cumulative P&L"]}
            labelFormatter={(label) => `Date: ${label}`}
          />
          <Line
            type="monotone"
            dataKey="cumulativePnl"
            stroke="#16a34a"
            strokeWidth={2}
            dot={false}
            name="Cumulative P&L"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
