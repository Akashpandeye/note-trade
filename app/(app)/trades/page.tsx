"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import { getTrades } from "@/lib/trades";
import type { Trade, TradeFilters as TradeFiltersType } from "@/types";
import { TradeTable } from "@/components/trades/TradeTable";
import { TradeFilters } from "@/components/trades/TradeFilters";
import { Button } from "@/components/ui/button";

const PAGE_SIZE = 20;

export default function TradesPage() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<TradeFiltersType>({});
  const [sortBy] = useState("trade_date");
  const [sortDir] = useState<"asc" | "desc">("desc");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, total: count } = await getTrades(supabase, {
        filters,
        sortBy,
        sortDir,
        page,
        pageSize: PAGE_SIZE,
      });
      setTrades(data);
      setTotal(count);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load trades.");
    } finally {
      setLoading(false);
    }
  }, [supabase, filters, sortBy, sortDir, page]);

  useEffect(() => {
    load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Trades</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Paginated list. Click a row to view or edit.
        </p>
      </div>

      <TradeFilters
        filters={filters}
        onFiltersChange={setFilters}
        onReset={() => setFilters({})}
      />

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200">
          {error}
        </div>
      )}

      <TradeTable trades={trades} loading={loading} />

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Page {page} of {totalPages} ({total} trades)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
