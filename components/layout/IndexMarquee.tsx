"use client";

import { useEffect, useState } from "react";

const TICKER_NAMES = [
  "NIFTY 50",
  "SENSEX",
  "BANK NIFTY",
  "NIFTY MIDCAP",
  "GOLD",
  "SILVER",
  "CRUDE OIL",
  "NATURAL GAS",
  "COPPER",
  "ZINC",
  "NICKEL",
  "ALUMINIUM",
];

const initialPrices: Record<string, string> = {};
TICKER_NAMES.forEach((name) => (initialPrices[name] = "..."));

export function IndexMarquee() {
  const [prices, setPrices] = useState<Record<string, string>>(initialPrices);

  useEffect(() => {
    let cancelled = false;
    async function fetchPrices() {
      try {
        const res = await fetch("/api/marquee-prices");
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (!cancelled) setPrices(data);
      } catch {
        if (!cancelled) setPrices(initialPrices);
      }
    }
    fetchPrices();
    return () => {
      cancelled = true;
    };
  }, []);

  const item = (name: string) => (
    <span
      key={name}
      className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap border-r border-white/20 py-0.5 pr-4 pl-1 text-sm"
      style={{ color: "#fff" }}
    >
      <span className="font-semibold">{name}</span>
      <span
        className={`tabular-nums font-medium ${
          String(prices[name] ?? "").trim().startsWith("-") ? "text-red-400" : "text-emerald-400"
        }`}
      >
        {prices[name] ?? "—"}
      </span>
    </span>
  );

  return (
    <div className="relative w-full overflow-hidden border-b border-white/10 bg-black py-2" aria-hidden>
      <div className="marquee-infinite flex w-max flex-nowrap gap-0">
        {TICKER_NAMES.map(item)}
        {TICKER_NAMES.map((name) => (
          <span
            key={`dup-${name}`}
            className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap border-r border-white/20 py-0.5 pr-4 pl-1 text-sm"
            style={{ color: "#fff" }}
          >
            <span className="font-semibold">{name}</span>
            <span
              className={`tabular-nums font-medium ${
                String(prices[name] ?? "").trim().startsWith("-") ? "text-red-400" : "text-emerald-400"
              }`}
            >
              {prices[name] ?? "—"}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
