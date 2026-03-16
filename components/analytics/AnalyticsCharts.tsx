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
    const raw = (t.trade_type ?? "").toString().toUpperCase();
    if (raw.includes("SHORT") || raw === "SELL") return "short";
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
    <div className="space-y-8">
      <div className="flex flex-wrap gap-4">
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-2 dark:border-green-900 dark:bg-green-950/50">
          <span className="text-sm text-green-800 dark:text-green-200">Win streak</span>
          <p className="text-xl font-bold text-green-700 dark:text-green-300">{streak.wins}</p>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 dark:border-red-900 dark:bg-red-950/50">
          <span className="text-sm text-red-800 dark:text-red-200">Loss streak</span>
          <p className="text-xl font-bold text-red-700 dark:text-red-300">{streak.losses}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-800 dark:bg-gray-900">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
            Long performance
          </h3>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Trades where you were net long (buy first, sell later).
          </p>
          <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div>
              <dt className="text-gray-500 dark:text-gray-400">Total trades</dt>
              <dd className="font-semibold text-gray-900 dark:text-white">{longShort.long.total}</dd>
            </div>
            <div>
              <dt className="text-gray-500 dark:text-gray-400">Win trades</dt>
              <dd className="font-semibold text-green-600 dark:text-green-400">
                {longShort.long.wins}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500 dark:text-gray-400">Loss trades</dt>
              <dd className="font-semibold text-red-600 dark:text-red-400">
                {longShort.long.losses}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500 dark:text-gray-400">Win rate</dt>
              <dd className="font-semibold text-gray-900 dark:text-white">
                {longShort.long.winRate.toFixed(1)}%
              </dd>
            </div>
            <div>
              <dt className="text-gray-500 dark:text-gray-400">Avg P&L / trade</dt>
              <dd className="font-semibold text-gray-900 dark:text-white">
                {longShort.long.avgPnl.toFixed(2)}
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-800 dark:bg-gray-900">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
            Short performance
          </h3>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Trades where you were net short (sell/short first, buy back later).
          </p>
          <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div>
              <dt className="text-gray-500 dark:text-gray-400">Total trades</dt>
              <dd className="font-semibold text-gray-900 dark:text-white">
                {longShort.short.total}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500 dark:text-gray-400">Win trades</dt>
              <dd className="font-semibold text-green-600 dark:text-green-400">
                {longShort.short.wins}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500 dark:text-gray-400">Loss trades</dt>
              <dd className="font-semibold text-red-600 dark:text-red-400">
                {longShort.short.losses}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500 dark:text-gray-400">Win rate</dt>
              <dd className="font-semibold text-gray-900 dark:text-white">
                {longShort.short.winRate.toFixed(1)}%
              </dd>
            </div>
            <div>
              <dt className="text-gray-500 dark:text-gray-400">Avg P&L / trade</dt>
              <dd className="font-semibold text-gray-900 dark:text-white">
                {longShort.short.avgPnl.toFixed(2)}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
          <h3 className="mb-4 font-medium">Win / Loss</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={winLossData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {winLossData.map((e, i) => (
                    <Cell key={i} fill={e.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
          <h3 className="mb-4 font-medium">Avg Winner vs Avg Loser</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={avgCompare} layout="vertical" margin={{ left: 100 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={90} />
                <Tooltip formatter={(v: number) => [v.toFixed(2), "P&L"]} />
                <Bar dataKey="value" name="P&L" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
        <h3 className="mb-4 font-medium">P&L by symbol (top 10)</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={bySymbol} layout="vertical" margin={{ left: 60 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis type="category" dataKey="symbol" width={56} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v: number) => [v.toFixed(2), "P&L"]} />
              <Bar dataKey="pnl" name="P&L" fill="#16a34a" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
          <h3 className="mb-4 font-medium">P&L by day of week</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byDay}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip formatter={(v: number) => [v.toFixed(2), "P&L"]} />
                <Bar dataKey="pnl" fill="#16a34a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
          <h3 className="mb-4 font-medium">P&L by time of day</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byTime}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip formatter={(v: number) => [v.toFixed(2), "P&L"]} />
                <Bar dataKey="pnl" fill="#16a34a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
        <h3 className="mb-4 font-medium">Segment breakdown (EQ vs FO)</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={bySegment}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="segment" />
              <YAxis />
              <Tooltip formatter={(v: number) => [v.toFixed(2), "P&L"]} />
              <Bar dataKey="pnl" name="P&L" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
