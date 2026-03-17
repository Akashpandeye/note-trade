import Papa from "papaparse";
import type { TradeLeg, MatchedTrade } from "@/types";

/** Normalize header to lowercase with underscores (e.g. "Trade ID" -> "trade_id") */
function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/\s+/g, "_");
}

/** Get value from row using multiple possible header names */
function getCol(row: Record<string, string>, ...keys: string[]): string {
  for (const k of keys) {
    const v = row[k];
    if (v !== undefined && v !== null && String(v).trim() !== "") return String(v).trim();
  }
  return "";
}

/** Normalize Zerodha trade_type to "buy" | "sell" */
function normalizeTradeType(raw: string): "buy" | "sell" {
  const lower = raw.trim().toLowerCase();
  if (lower === "buy" || lower === "b") return "buy";
  if (lower === "sell" || lower === "s") return "sell";
  return lower.includes("sell") ? "sell" : "buy";
}

/** Parse Zerodha tradebook CSV into typed legs. Dedup by trade_id. Accepts flexible column names and delimiter. */
export function parseZerodhaCsv(csvText: string, delimiter = ","): TradeLeg[] {
  const trimmed = csvText.replace(/^\uFEFF/, ""); // strip BOM
  const parsed = Papa.parse<Record<string, string>>(trimmed, {
    header: true,
    skipEmptyLines: true,
    delimiter,
  });

  if (parsed.errors.length > 0) {
    throw new Error(parsed.errors.map((e) => e.message).join("; "));
  }

  if (!parsed.data || parsed.data.length === 0) {
    throw new Error("CSV has no data rows. Check that the file is a Zerodha tradebook export.");
  }

  const normalizedData = parsed.data.map((row: Record<string, unknown>) => {
    const out: Record<string, string> = {};
    for (const key of Object.keys(row)) {
      out[normalizeHeader(key)] = row[key] == null ? "" : String(row[key]);
    }
    return out;
  });

  const seenTradeIds = new Set<string>();
  const legs: TradeLeg[] = [];

  for (const row of normalizedData) {
    const tradeId = getCol(row, "trade_id", "tradeid", "trade id") || getCol(row, "order_id", "orderid", "order id");
    if (!tradeId || seenTradeIds.has(tradeId)) continue;
    seenTradeIds.add(tradeId);

    const qtyStr = getCol(row, "quantity", "qty", "qty.");
    const priceStr = getCol(row, "price", "avg price", "avg_price");
    const qty = parseInt(qtyStr || "0", 10);
    const price = parseFloat(priceStr || "0");
    if (isNaN(qty) || isNaN(price) || qty <= 0) continue;

    legs.push({
      symbol: getCol(row, "symbol", "instrument", "tradingsymbol"),
      isin: getCol(row, "isin"),
      trade_date: getCol(row, "trade_date", "trade date", "date", "order_date", "order date"),
      exchange: getCol(row, "exchange"),
      segment: getCol(row, "segment"),
      trade_type: normalizeTradeType(getCol(row, "trade_type", "trade type", "transaction type", "type")),
      quantity: qty,
      price,
      trade_id: tradeId,
      order_id: getCol(row, "order_id", "orderid", "order id"),
      executed_at: getCol(row, "order_execution_time", "order execution time", "execution_time", "execution time", "time"),
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

    const buyQueue: { leg: TradeLeg; qtyLeft: number }[] = buys.map((leg) => ({
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
          // Entry direction for this matched (closed) trade.
          // Current matcher supports long trades (buy -> sell), so direction is "buy".
          direction: "buy",
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

/** Parse numeric value that may contain commas (e.g. "1,03,061.00") */
function parseNum(s: string): number {
  const cleaned = String(s).replace(/,/g, "").trim();
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

/** Find header row index and delimiter. Zerodha P&L has title lines then a row with Symbol, Quantity, etc. */
function findHeaderRowAndDelimiter(csvText: string): { headerRowIndex: number; delimiter: string } {
  const lines = csvText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  for (let i = 0; i < Math.min(lines.length, 50); i++) {
    const line = lines[i];
    const hasSeparator = line.includes(",") || line.includes("\t");
    const lower = line.toLowerCase();
    const hasSymbolCol = /\b(symbol|script|scrip|instrument|tradingsymbol)\b/.test(lower);
    const hasQuantityCol = /\b(quantity|qty)\b/.test(lower);
    const hasDataCol = /\b(buy\s*value|sell\s*value|realized\s*p&l|realized\s*pnl)\b/.test(lower);
    if (hasSeparator && hasSymbolCol && hasQuantityCol && (hasDataCol || lower.includes("buy") || lower.includes("sell") || lower.includes("realized"))) {
      const tabCount = (line.match(/\t/g) || []).length;
      const commaCount = (line.match(/,/g) || []).length;
      const delimiter = tabCount >= commaCount ? "\t" : ",";
      return { headerRowIndex: i, delimiter };
    }
  }
  return { headerRowIndex: 0, delimiter: "," };
}

/**
 * Parse Zerodha summary/P&L format: Symbol, Quantity, Buy Value, Sell Value, Realized P&L.
 * One row per script with aggregated values.
 * Supports tab- or comma-delimited; optional delimiter when CSV is already sliced to header row.
 */
export function parseZerodhaSummaryFormat(csvText: string, delimiter?: string): MatchedTrade[] {
  const trimmed = csvText.replace(/^\uFEFF/, "");
  let csvToParse = trimmed;
  let delim = delimiter;
  if (delim === undefined) {
    const { headerRowIndex, delimiter: d } = findHeaderRowAndDelimiter(trimmed);
    delim = d;
    const lines = trimmed.split(/\r?\n/).filter((l) => l.trim() !== "");
    csvToParse = lines.slice(headerRowIndex).join("\n");
  }
  const parsed = Papa.parse<Record<string, string>>(csvToParse, {
    header: true,
    skipEmptyLines: true,
    delimiter: delim,
  });

  if (parsed.errors.length > 0) {
    throw new Error(parsed.errors.map((e) => e.message).join("; "));
  }

  if (!parsed.data || parsed.data.length === 0) {
    throw new Error("CSV has no data rows.");
  }

  const normalizedData = parsed.data.map((row: Record<string, unknown>) => {
    const out: Record<string, string> = {};
    for (const key of Object.keys(row)) {
      out[normalizeHeader(key)] = row[key] == null ? "" : String(row[key]);
    }
    return out;
  });

  const result: MatchedTrade[] = [];
  const reportDate = new Date().toISOString().slice(0, 10);

  for (let i = 0; i < normalizedData.length; i++) {
    const row = normalizedData[i];
    const symbol = getCol(row, "script", "symbol", "instrument", "tradingsymbol", "scrip");
    if (!symbol) continue;

    const qty = parseNum(getCol(row, "quantity", "qty", "qty."));
    const buyValue = parseNum(getCol(row, "buy_value", "buy value", "total_buy", "total buy"));
    const sellValue = parseNum(getCol(row, "sell_value", "sell value", "total_sell", "total sell"));
    const realizedPnl = parseNum(
      getCol(row, "realized_p&l", "realized_pnl", "realized p&l", "realized pnl", "realized_p_l", "p&l", "pnl", "realized_pl")
    );

    if (qty <= 0 && realizedPnl === 0 && buyValue === 0 && sellValue === 0) continue;

    const entryPrice = qty > 0 ? buyValue / qty : 0;
    const exitPrice = qty > 0 ? sellValue / qty : 0;

    result.push({
      date: reportDate,
      symbol,
      segment: getCol(row, "segment", "exchange") || "EQ",
      // Summary format is aggregated realized P&L (typically long buy->sell for delivery/positions).
      // We store direction as entry-side for analytics consistency.
      direction: "buy",
      quantity: qty > 0 ? qty : 1,
      entryPrice,
      exitPrice,
      pnl: realizedPnl,
      trade_id: `summary-${symbol}-${i}`,
    });
  }

  return result;
}

/**
 * Parse Zerodha CSV and return matched trades.
 * Tries summary format first (Symbol, Quantity, Buy/Sell Value, Realized P&L), then tradebook (Trade ID, etc.).
 * Handles tab- or comma-delimited files and skips title lines (P&L Statement, Client ID, etc.).
 */
export function parseZerodhaCsvToMatchedTrades(csvText: string): MatchedTrade[] {
  const trimmed = csvText.replace(/^\uFEFF/, "");
  const { headerRowIndex, delimiter } = findHeaderRowAndDelimiter(trimmed);
  const lines = trimmed.split(/\r?\n/).filter((l) => l.trim() !== "");
  const csvFromHeader = lines.slice(headerRowIndex).join("\n");
  const parsed = Papa.parse<Record<string, string>>(csvFromHeader, {
    header: true,
    skipEmptyLines: true,
    delimiter,
  });

  if (parsed.errors.length > 0) {
    throw new Error(parsed.errors.map((e) => e.message).join("; "));
  }

  if (!parsed.data || parsed.data.length === 0) {
    throw new Error("CSV has no data rows.");
  }

  const normalizedData = parsed.data.map((row: Record<string, unknown>) => {
    const out: Record<string, string> = {};
    for (const key of Object.keys(row)) {
      out[normalizeHeader(key)] = row[key] == null ? "" : String(row[key]);
    }
    return out;
  });

  const firstRow = normalizedData[0];
  const hasScriptOrSymbol = firstRow && ["script", "symbol", "instrument", "tradingsymbol", "scrip"].some((k) => firstRow[k] !== undefined && String(firstRow[k]).trim() !== "");

  if (hasScriptOrSymbol) {
    const summaryResult = parseZerodhaSummaryFormat(csvFromHeader, delimiter);
    if (summaryResult.length > 0) return summaryResult;
  }

  const legs = parseZerodhaCsv(csvFromHeader, delimiter);
  if (legs.length === 0) {
    const summaryFallback = parseZerodhaSummaryFormat(csvFromHeader, delimiter);
    if (summaryFallback.length > 0) return summaryFallback;
    const sampleKeys = firstRow ? Object.keys(firstRow).slice(0, 12).join(", ") : "none";
    throw new Error(
      `No valid trade rows found. Your CSV columns (sample): ${sampleKeys}. For tradebook CSV we need: Symbol, Trade Date, Quantity, Price, Trade Type, Trade ID or Order ID. For summary CSV we need: Script/Symbol and at least one of Quantity, Buy Value, Sell Value, Realized P&L.`
    );
  }

  return matchTradesFifo(legs);
}
