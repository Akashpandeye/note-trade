/**
 * P&L and stats helpers for dashboard and analytics.
 * All monetary values in number (e.g. net_pnl from DB).
 */

export function formatPnl(value: number): string {
  const n = Number(value);
  if (isNaN(n)) return "0.00";
  const sign = n >= 0 ? "" : "-";
  return `${sign}${Math.abs(n).toFixed(2)}`;
}

export function pnlColorClass(value: number): "pnl-positive" | "pnl-negative" | "pnl-zero" {
  const n = Number(value);
  if (n > 0) return "pnl-positive";
  if (n < 0) return "pnl-negative";
  return "pnl-zero";
}

export interface TradeForStats {
  net_pnl: number | null;
  pnl: number | null;
  trade_date?: string;
  executed_at?: string | null;
}

export function totalPnl(trades: TradeForStats[]): number {
  return trades.reduce((sum, t) => sum + (t.net_pnl ?? t.pnl ?? 0), 0);
}

export function winRate(trades: TradeForStats[]): number {
  if (trades.length === 0) return 0;
  const wins = trades.filter((t) => (t.net_pnl ?? t.pnl ?? 0) > 0).length;
  return (wins / trades.length) * 100;
}

export function avgPnlPerTrade(trades: TradeForStats[]): number {
  if (trades.length === 0) return 0;
  return totalPnl(trades) / trades.length;
}

export function biggestWin(trades: TradeForStats[]): number {
  if (trades.length === 0) return 0;
  return Math.max(...trades.map((t) => t.net_pnl ?? t.pnl ?? 0), 0);
}

export function biggestLoss(trades: TradeForStats[]): number {
  if (trades.length === 0) return 0;
  const losses = trades.map((t) => t.net_pnl ?? t.pnl ?? 0).filter((n) => n < 0);
  return losses.length === 0 ? 0 : Math.min(...losses);
}
