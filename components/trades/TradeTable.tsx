"use client";

import Link from "next/link";
import type { Trade } from "@/types";
import { formatPnl, pnlColorClass } from "@/lib/calcPnl";

interface TradeTableProps {
  trades: Trade[];
  loading?: boolean;
}

const COLS = [
  "Date",
  "Symbol",
  "Segment",
  "Direction",
  "Qty",
  "Entry Price",
  "Exit Price",
  "Fees",
  "Net P&L",
] as const;

export function TradeTable({ trades, loading }: TradeTableProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="h-12 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
        ))}
      </div>
    );
  }

  if (trades.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center dark:border-gray-800 dark:bg-gray-900">
        <p className="text-gray-500 dark:text-gray-400">No trades match your filters.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white/95 shadow-sm dark:border-gray-800 dark:bg-gray-900/90">
      <table className="w-full text-left text-sm text-gray-900 dark:text-gray-100">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/70">
            {COLS.map((c) => (
              <th key={c} className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {trades.map((t) => {
            const netPnl = t.net_pnl ?? t.pnl ?? 0;
            const direction = (t.trade_type ?? "").toLowerCase().startsWith("sell") ? "Sell" : "Buy";
            const entryPrice = Number(t.price);
            const exitPrice =
              t.quantity && (t.pnl != null || t.net_pnl != null)
                ? entryPrice + (netPnl / t.quantity)
                : null;
            return (
              <tr
                key={t.id}
                className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/50"
              >
            <td className="px-4 py-2">
                  <Link href={`/trades/${t.id}`} className="text-green-700 hover:underline dark:text-green-400">
                    {t.trade_date}
                  </Link>
                </td>
                <td className="px-4 py-2">{t.symbol}</td>
                <td className="px-4 py-2">{t.segment ?? "—"}</td>
                <td className="px-4 py-2">{direction}</td>
                <td className="px-4 py-2">{t.quantity}</td>
                <td className="px-4 py-2">{entryPrice.toFixed(2)}</td>
                <td className="px-4 py-2">{exitPrice != null ? exitPrice.toFixed(2) : "—"}</td>
                <td className="px-4 py-2">{Number(t.fees ?? 0).toFixed(2)}</td>
                <td className={`px-4 py-2 font-medium ${pnlColorClass(netPnl)}`}>
                  {formatPnl(netPnl)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
