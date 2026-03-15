import Papa from "papaparse";
import type { ZerodhaCsvRow, TradeLeg, MatchedTrade } from "@/types";

/** Normalize Zerodha trade_type to "buy" | "sell" */
function normalizeTradeType(raw: string): "buy" | "sell" {
  const lower = raw.trim().toLowerCase();
  if (lower === "buy" || lower === "b") return "buy";
  if (lower === "sell" || lower === "s") return "sell";
  return lower.includes("sell") ? "sell" : "buy";
}

/** Parse Zerodha tradebook CSV into typed legs. Dedup by trade_id. */
export function parseZerodhaCsv(csvText: string): TradeLeg[] {
  const parsed = Papa.parse<ZerodhaCsvRow>(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  if (parsed.errors.length > 0) {
    throw new Error(parsed.errors.map((e) => e.message).join("; "));
  }

  const seenTradeIds = new Set<string>();
  const legs: TradeLeg[] = [];

  for (const row of parsed.data) {
    const tradeId = (row.trade_id ?? "").trim();
    if (!tradeId || seenTradeIds.has(tradeId)) continue;
    seenTradeIds.add(tradeId);

    const qty = parseInt(row.quantity ?? "0", 10);
    const price = parseFloat(row.price ?? "0");
    if (isNaN(qty) || isNaN(price) || qty <= 0) continue;

    legs.push({
      symbol: (row.symbol ?? "").trim(),
      isin: (row.isin ?? "").trim(),
      trade_date: (row.trade_date ?? "").trim(),
      exchange: (row.exchange ?? "").trim(),
      segment: (row.segment ?? "").trim(),
      trade_type: normalizeTradeType(row.trade_type ?? ""),
      quantity: qty,
      price,
      trade_id: tradeId,
      order_id: (row.order_id ?? "").trim(),
      executed_at: (row.order_execution_time ?? "").trim(),
    });
  }

  return legs;
}

/**
 * Group legs by symbol, then match buys and sells with FIFO to compute P&L.
 * Returns closed trades only (each with entry/exit and pnl).
 */
export function matchTradesFifo(legs: TradeLeg[]): MatchedTrade[] {
  const bySymbol = new Map<string, TradeLeg[]>();
  for (const leg of legs) {
    const key = leg.symbol;
    if (!bySymbol.has(key)) bySymbol.set(key, []);
    bySymbol.get(key)!.push(leg);
  }

  const result: MatchedTrade[] = [];

  for (const [symbol, symbolLegs] of bySymbol) {
    const buys = symbolLegs
      .filter((l) => l.trade_type === "buy")
      .sort(
        (a, b) =>
          new Date(a.executed_at || a.trade_date).getTime() -
          new Date(b.executed_at || b.trade_date).getTime()
      );
    const sells = symbolLegs
      .filter((l) => l.trade_type === "sell")
      .sort(
        (a, b) =>
          new Date(a.executed_at || a.trade_date).getTime() -
          new Date(b.executed_at || b.trade_date).getTime()
      );

    let buyQueue: { leg: TradeLeg; qtyLeft: number }[] = buys.map((leg) => ({
      leg,
      qtyLeft: leg.quantity,
    }));

    for (const sell of sells) {
      let sellQtyLeft = sell.quantity;
      const sellPrice = sell.price;
      const segment = sell.segment || "";
      const exitDate = sell.trade_date;

      while (sellQtyLeft > 0 && buyQueue.length > 0) {
        const first = buyQueue[0];
        const matchQty = Math.min(sellQtyLeft, first.qtyLeft);
        const entryPrice = first.leg.price;
        const pnl = (sellPrice - entryPrice) * matchQty;

        result.push({
          date: exitDate,
          symbol,
          segment,
          direction: "sell",
          quantity: matchQty,
          entryPrice,
          exitPrice: sellPrice,
          pnl,
          trade_id: `${first.leg.trade_id}-${sell.trade_id}`,
          legIds: [first.leg.trade_id, sell.trade_id],
        });

        first.qtyLeft -= matchQty;
        if (first.qtyLeft <= 0) buyQueue.shift();
        sellQtyLeft -= matchQty;
      }
    }
  }

  result.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  return result;
}

/**
 * Parse Zerodha CSV and return matched trades with P&L (FIFO).
 */
export function parseZerodhaCsvToMatchedTrades(csvText: string): MatchedTrade[] {
  const legs = parseZerodhaCsv(csvText);
  return matchTradesFifo(legs);
}
