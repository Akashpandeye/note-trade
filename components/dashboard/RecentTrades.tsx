import Link from "next/link";
import type { Trade } from "@/types";
import { formatPnl, pnlColorClass } from "@/lib/calcPnl";

interface RecentTradesProps {
  trades: Trade[];
  loading?: boolean;
}

export function RecentTrades({ trades, loading }: RecentTradesProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-10 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
        ))}
      </div>
    );
  }

  if (trades.length === 0) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">
        No trades yet. Upload a CSV to get started.
      </p>
    );
  }

  return (
    <div className="space-y-1">
      {trades.slice(0, 10).map((t) => {
        const pnl = t.net_pnl ?? t.pnl ?? 0;
        return (
          <Link
            key={t.id}
            href={`/trades/${t.id}`}
            className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <span className="truncate">
              {t.trade_date} — {t.symbol} ({t.segment ?? "—"})
            </span>
            <span className={pnlColorClass(pnl)}>{formatPnl(pnl)}</span>
          </Link>
        );
      })}
    </div>
  );
}
