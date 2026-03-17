"use client";

import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { Trade } from "@/types";

interface AnalyticsChartsProps {
  trades: Trade[];
}

function pnlBySymbol(trades: Trade[]): { symbol: string; pnl: number }[] {
  const map = new Map<string, number>();
  for (const t of trades) {
    const pnl = t.net_pnl ?? t.pnl ?? 0;
    map.set(t.symbol, (map.get(t.symbol) ?? 0) + pnl);
  }
  return Array.from(map.entries())
    .map(([symbol, pnl]) => ({ symbol, pnl }))
    .sort((a, b) => b.pnl - a.pnl)
    .slice(0, 10);
}

function pnlByDayOfWeek(trades: Trade[]): { day: string; pnl: number }[] {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const map = new Map<number, number>();
  for (let i = 0; i < 7; i++) map.set(i, 0);
  for (const t of trades) {
    const date = new Date(t.trade_date ?? t.executed_at ?? "");
    const day = date.getDay();
    const pnl = t.net_pnl ?? t.pnl ?? 0;
    map.set(day, (map.get(day) ?? 0) + pnl);
  }
  return days.map((day, i) => ({ day, pnl: map.get(i) ?? 0 }));
}

function pnlByTimeOfDay(trades: Trade[]): { period: string; pnl: number }[] {
  const morning: number[] = [];
  const afternoon: number[] = [];
  for (const t of trades) {
    const pnl = t.net_pnl ?? t.pnl ?? 0;
    const ts = t.executed_at ?? t.trade_date;
    if (!ts) {
      morning.push(pnl);
      continue;
    }
    const h = new Date(ts).getHours();
    if (h < 12) morning.push(pnl);
    else afternoon.push(pnl);
  }
  const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);
  return [
    { period: "Morning (before 12)", pnl: sum(morning) },
    { period: "Afternoon (12+)", pnl: sum(afternoon) },
  ];
}

function segmentBreakdown(trades: Trade[]): { segment: string; pnl: number }[] {
  const map = new Map<string, number>();
  for (const t of trades) {
    const seg = t.segment || "Other";
    const pnl = t.net_pnl ?? t.pnl ?? 0;
    map.set(seg, (map.get(seg) ?? 0) + pnl);
  }
  return Array.from(map.entries()).map(([segment, pnl]) => ({ segment, pnl }));
}

function currentStreak(trades: Trade[]): { wins: number; losses: number } {
  const sorted = [...trades].sort(
    (a, b) =>
      new Date(b.trade_date ?? "").getTime() - new Date(a.trade_date ?? "").getTime()
  );
  let wins = 0;
  let losses = 0;
  for (const t of sorted) {
    const pnl = t.net_pnl ?? t.pnl ?? 0;
    if (pnl > 0) {
      if (losses > 0) break;
      wins++;
    } else if (pnl < 0) {
      if (wins > 0) break;
      losses++;
    }
  }
  return { wins, losses };
}

function longShortStats(trades: Trade[]): {
  long: { total: number; wins: number; losses: number; winRate: number; avgPnl: number };
  short: { total: number; wins: number; losses: number; winRate: number; avgPnl: number };
} {
  const normSide = (t: Trade): "long" | "short" => {
    const raw = (t.trade_type ?? "").toString().trim().toLowerCase();
    // In this app, `trade_type` is stored as the *entry direction* from uploads/manual entry:
    // - "buy" => long
    // - "sell" => short
    // Anything else defaults to long.
    if (raw.startsWith("sell")) return "short";
    return "long";
  };
  const buckets = {
    long: [] as Trade[],
    short: [] as Trade[],
  };
  for (const t of trades) {
    buckets[normSide(t)].push(t);
  }
  const calc = (sideTrades: Trade[]) => {
    const total = sideTrades.length;
    if (total === 0) {
      return { total: 0, wins: 0, losses: 0, winRate: 0, avgPnl: 0 };
    }
    let wins = 0;
    let losses = 0;
    let pnlSum = 0;
    for (const t of sideTrades) {
      const pnl = t.net_pnl ?? t.pnl ?? 0;
      pnlSum += pnl;
      if (pnl > 0) wins++;
      else if (pnl < 0) losses++;
    }
    const winRate = (wins / total) * 100;
    const avgPnl = pnlSum / total;
    return { total, wins, losses, winRate, avgPnl };
  };

  return {
    long: calc(buckets.long),
    short: calc(buckets.short),
  };
}

const WIN_COLOR = "#16a34a";
const LOSS_COLOR = "#dc2626";

export function AnalyticsCharts({ trades }: AnalyticsChartsProps) {
  const wins = trades.filter((t) => (t.net_pnl ?? t.pnl ?? 0) > 0).length;
  const lossCount = trades.filter((t) => (t.net_pnl ?? t.pnl ?? 0) < 0).length;
  const winLossData = [
    { name: "Wins", value: wins, color: WIN_COLOR },
    { name: "Losses", value: lossCount, color: LOSS_COLOR },
  ];

  const avgWinner =
    wins > 0
      ? trades
          .filter((t) => (t.net_pnl ?? t.pnl ?? 0) > 0)
          .reduce((s, t) => s + (t.net_pnl ?? t.pnl ?? 0), 0) / wins
      : 0;
  const avgLoser =
    lossCount > 0
      ? trades
          .filter((t) => (t.net_pnl ?? t.pnl ?? 0) < 0)
          .reduce((s, t) => s + (t.net_pnl ?? t.pnl ?? 0), 0) / lossCount
      : 0;
  const avgCompare = [
    { name: "Avg Winner", value: avgWinner, fill: WIN_COLOR },
    { name: "Avg Loser", value: avgLoser, fill: LOSS_COLOR },
  ];

  const bySymbol = pnlBySymbol(trades);
  const byDay = pnlByDayOfWeek(trades);
  const byTime = pnlByTimeOfDay(trades);
  const bySegment = segmentBreakdown(trades);
  const streak = currentStreak(trades);
  const longShort = longShortStats(trades);

  if (trades.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center dark:border-gray-800 dark:bg-gray-900">
        <p className="text-gray-500 dark:text-gray-400">
          No trade data yet. Upload a CSV to see analytics.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
        <div className="rounded-2xl border border-green-200 bg-green-50 p-5 shadow-sm dark:border-green-900 dark:bg-green-950/50 md:col-span-3">
          <p className="text-xs font-medium uppercase tracking-wide text-green-800 dark:text-green-200">Win streak</p>
          <p className="mt-2 text-3xl font-bold text-green-700 dark:text-green-300">{streak.wins}</p>
        </div>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm dark:border-red-900 dark:bg-red-950/50 md:col-span-3">
          <p className="text-xs font-medium uppercase tracking-wide text-red-800 dark:text-red-200">Loss streak</p>
          <p className="mt-2 text-3xl font-bold text-red-700 dark:text-red-300">{streak.losses}</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 md:col-span-3">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Long</h3>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Buy first</p>
          <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div><dt className="text-gray-500 dark:text-gray-400">Total</dt><dd className="font-semibold text-gray-900 dark:text-white">{longShort.long.total}</dd></div>
            <div><dt className="text-gray-500 dark:text-gray-400">Win</dt><dd className="font-semibold text-green-600 dark:text-green-400">{longShort.long.wins}</dd></div>
            <div><dt className="text-gray-500 dark:text-gray-400">Loss</dt><dd className="font-semibold text-red-600 dark:text-red-400">{longShort.long.losses}</dd></div>
            <div><dt className="text-gray-500 dark:text-gray-400">Win%</dt><dd className="font-semibold text-gray-900 dark:text-white">{longShort.long.winRate.toFixed(1)}%</dd></div>
          </dl>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 md:col-span-3">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Short</h3>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Sell first</p>
          <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div><dt className="text-gray-500 dark:text-gray-400">Total</dt><dd className="font-semibold text-gray-900 dark:text-white">{longShort.short.total}</dd></div>
            <div><dt className="text-gray-500 dark:text-gray-400">Win</dt><dd className="font-semibold text-green-600 dark:text-green-400">{longShort.short.wins}</dd></div>
            <div><dt className="text-gray-500 dark:text-gray-400">Loss</dt><dd className="font-semibold text-red-600 dark:text-red-400">{longShort.short.losses}</dd></div>
            <div><dt className="text-gray-500 dark:text-gray-400">Win%</dt><dd className="font-semibold text-gray-900 dark:text-white">{longShort.short.winRate.toFixed(1)}%</dd></div>
          </dl>
        </div>

        <div className="min-w-0 rounded-2xl border border-gray-200 bg-gray-50 p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 md:col-span-5">
          <h3 className="text-sm font-semibold">Win / Loss</h3>
          <div className="mt-4 h-72 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={winLossData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90}>
                  {winLossData.map((e, i) => (
                    <Cell key={i} fill={e.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="min-w-0 rounded-2xl border border-gray-200 bg-gray-50 p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 md:col-span-7">
          <h3 className="text-sm font-semibold">Avg Winner vs Avg Loser</h3>
          <div className="mt-4 h-72 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={avgCompare} layout="vertical" margin={{ left: 110, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-800" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={100} />
                <Tooltip formatter={(v: number) => [v.toFixed(2), "P&L"]} />
                <Bar dataKey="value" name="P&L" radius={[0, 6, 6, 0]}>
                  {avgCompare.map((e, i) => (
                    <Cell key={i} fill={e.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="min-w-0 rounded-2xl border border-gray-200 bg-gray-50 p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 md:col-span-7">
          <h3 className="text-sm font-semibold">P&L by symbol (top 10)</h3>
          <div className="mt-4 h-80 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bySymbol} layout="vertical" margin={{ left: 70, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-800" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="symbol" width={60} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v: number) => [v.toFixed(2), "P&L"]} />
                <Bar dataKey="pnl" name="P&L" radius={[0, 6, 6, 0]}>
                  {bySymbol.map((row, i) => (
                    <Cell key={i} fill={row.pnl < 0 ? LOSS_COLOR : WIN_COLOR} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="min-w-0 rounded-2xl border border-gray-200 bg-gray-50 p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 md:col-span-5">
          <h3 className="text-sm font-semibold">Segment breakdown</h3>
          <div className="mt-4 h-80 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bySegment} layout="vertical" margin={{ left: 90, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-800" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="segment" width={80} />
                <Tooltip formatter={(v: number) => [v.toFixed(2), "P&L"]} />
                <Bar dataKey="pnl" name="P&L" radius={[0, 6, 6, 0]}>
                  {bySegment.map((row, i) => (
                    <Cell key={i} fill={row.pnl < 0 ? LOSS_COLOR : WIN_COLOR} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="min-w-0 rounded-2xl border border-gray-200 bg-gray-50 p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 md:col-span-6">
          <h3 className="text-sm font-semibold">P&L by day of week</h3>
          <div className="mt-4 h-72 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byDay} margin={{ left: 10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-800" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip formatter={(v: number) => [v.toFixed(2), "P&L"]} />
                <Bar dataKey="pnl" radius={[6, 6, 0, 0]}>
                  {byDay.map((row, i) => (
                    <Cell key={i} fill={row.pnl < 0 ? LOSS_COLOR : WIN_COLOR} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="min-w-0 rounded-2xl border border-gray-200 bg-gray-50 p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 md:col-span-6">
          <h3 className="text-sm font-semibold">P&L by time of day</h3>
          <div className="mt-4 h-72 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byTime} margin={{ left: 10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-800" />
                <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip formatter={(v: number) => [v.toFixed(2), "P&L"]} />
                <Bar dataKey="pnl" radius={[6, 6, 0, 0]}>
                  {byTime.map((row, i) => (
                    <Cell key={i} fill={row.pnl < 0 ? LOSS_COLOR : WIN_COLOR} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
