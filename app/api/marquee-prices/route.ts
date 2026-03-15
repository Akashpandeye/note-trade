import { NextResponse } from "next/server";
import yahooFinance from "yahoo-finance2";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

const TICKERS: { name: string; symbol: string }[] = [
  { name: "NIFTY 50", symbol: "^NSEI" },
  { name: "SENSEX", symbol: "^BSESN" },
  { name: "BANK NIFTY", symbol: "^NSEBANK" },
  { name: "NIFTY MIDCAP", symbol: "^CNXMID" },
  { name: "GOLD", symbol: "GC=F" },
  { name: "SILVER", symbol: "SI=F" },
  { name: "CRUDE OIL", symbol: "CL=F" },
  { name: "NATURAL GAS", symbol: "NG=F" },
  { name: "COPPER", symbol: "HG=F" },
  { name: "ZINC", symbol: "ZI=F" },
  { name: "NICKEL", symbol: "NICKEL.F" },
  { name: "ALUMINIUM", symbol: "ALI=F" },
];

export async function GET() {
  const prices: Record<string, string> = {};
  TICKERS.forEach(({ name }) => {
    prices[name] = "—";
  });

  try {
    const results = await Promise.allSettled(
      TICKERS.map(async ({ name, symbol }) => {
        try {
          const raw = await yahooFinance.quote(symbol);
          const quote = raw as unknown as
            | { regularMarketPrice?: number; regularMarketOpen?: number }
            | null
            | undefined;
          const price = quote?.regularMarketPrice ?? quote?.regularMarketOpen ?? null;
          return { name, symbol, price: price != null ? formatPrice(price) : null };
        } catch {
          return { name, symbol, price: null };
        }
      })
    );

    results.forEach((result, i) => {
      const { name } = TICKERS[i];
      if (result.status === "fulfilled" && result.value.price != null) {
        prices[name] = result.value.price;
      }
    });
  } catch {
    // keep placeholders on API error
  }

  return NextResponse.json(prices);
}

function formatPrice(n: number): string {
  if (n >= 1e6) return (n / 1e6).toFixed(2) + "M";
  if (n >= 1e3) return n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
  return n.toFixed(2);
}
