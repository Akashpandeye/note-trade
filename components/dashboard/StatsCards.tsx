import {
  totalPnl,
  winRate,
  avgPnlPerTrade,
  biggestWin,
  biggestLoss,
  formatPnl,
  pnlColorClass,
  type TradeForStats,
} from "@/lib/calcPnl";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface StatsCardsProps {
  trades: TradeForStats[];
  loading?: boolean;
}

const statLabels: { key: string; label: string; fn: (t: TradeForStats[]) => number; format: (n: number) => string }[] = [
  { key: "total", label: "Total P&L", fn: totalPnl, format: (n) => formatPnl(n) },
  { key: "winrate", label: "Win Rate %", fn: winRate, format: (n) => `${n.toFixed(1)}%` },
  { key: "count", label: "Total Trades", fn: (t) => t.length, format: (n) => String(Math.round(n)) },
  { key: "avg", label: "Avg P&L / Trade", fn: avgPnlPerTrade, format: (n) => formatPnl(n) },
  { key: "bigwin", label: "Biggest Win", fn: biggestWin, format: (n) => formatPnl(n) },
  { key: "bigloss", label: "Biggest Loss", fn: biggestLoss, format: (n) => formatPnl(n) },
];

export function StatsCards({ trades, loading }: StatsCardsProps) {
  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {statLabels.map(({ key }) => (
          <Card key={key}>
            <CardContent className="pt-6">
              <Skeleton className="mb-2 h-4 w-24" />
              <Skeleton className="h-8 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {statLabels.map(({ key, label, fn, format }) => {
        const value = fn(trades);
        const isPnl = ["total", "avg", "bigwin", "bigloss"].includes(key);
        const colorClass = isPnl ? pnlColorClass(key === "bigloss" ? value : value) : "";
        return (
          <Card key={key}>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
              <p className={`text-xl font-semibold ${colorClass}`}>
                {format(value)}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
