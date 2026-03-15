"use client";

import type { MatchedTrade } from "@/types";
import { formatPnl, pnlColorClass } from "@/lib/calcPnl";

interface PreviewTableProps {
  rows: MatchedTrade[];
}

const COLUMNS = [
  "Date",
  "Symbol",
  "Segment",
  "Direction",
  "Quantity",
  "Entry Price",
  "Exit Price",
  "P&L",
] as const;

export function PreviewTable({ rows }: PreviewTableProps) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">
        No matched trades to preview.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/50">
            {COLUMNS.map((col) => (
              <th key={col} className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr
              key={`${r.trade_id}-${i}`}
              className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/50"
            >
              <td className="px-4 py-2">{r.date}</td>
              <td className="px-4 py-2">{r.symbol}</td>
              <td className="px-4 py-2">{r.segment}</td>
              <td className="px-4 py-2 capitalize">{r.direction}</td>
              <td className="px-4 py-2">{r.quantity}</td>
              <td className="px-4 py-2">{r.entryPrice.toFixed(2)}</td>
              <td className="px-4 py-2">{r.exitPrice.toFixed(2)}</td>
              <td className={`px-4 py-2 font-medium ${pnlColorClass(r.pnl)}`}>
                {formatPnl(r.pnl)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
