"use client";

import { useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { parseZerodhaCsvToMatchedTrades } from "@/lib/parseCsv";
import { insertTrades } from "@/lib/trades";
import type { TradeInsert, MatchedTrade } from "@/types";
import { PreviewTable } from "@/components/upload/PreviewTable";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

export function DashboardUploadButton() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<MatchedTrade[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const readFile = useCallback((file: File) => {
    setError(null);
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError("Please select a CSV file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      if (!text) return;
      try {
        const matched = parseZerodhaCsvToMatchedTrades(text);
        setPreview(matched);
        setOpen(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to parse CSV.");
      }
    };
    reader.onerror = () => setError("Failed to read file.");
    reader.readAsText(file, "UTF-8");
  }, []);

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) readFile(file);
      e.target.value = "";
    },
    [readFile]
  );

  async function handleConfirm() {
    if (preview.length === 0) return;
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("Not authenticated.");
      setLoading(false);
      return;
    }

    const rows: TradeInsert[] = preview.map((p) => ({
      user_id: user.id,
      symbol: p.symbol,
      isin: null,
      trade_date: p.date,
      exchange: null,
      segment: p.segment || null,
      trade_type: p.direction,
      quantity: p.quantity,
      price: p.entryPrice,
      order_id: null,
      trade_id: p.trade_id,
      executed_at: null,
      pnl: p.pnl,
      fees: 0,
      net_pnl: p.pnl,
      is_open: false,
      strategy_tag: null,
      emotion_tag: null,
      notes: null,
      screenshot_url: null,
    }));

    const { error: insertErr } = await insertTrades(supabase, user.id, rows);

    if (insertErr) {
      const msg =
        typeof insertErr === "object" && insertErr !== null && "message" in insertErr
          ? String((insertErr as { message: unknown }).message)
          : "Failed to save trades.";
      setError(msg);
      setLoading(false);
      return;
    }
    setOpen(false);
    setPreview([]);
    setLoading(false);
    router.refresh();
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={onInputChange}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="inline-flex shrink-0 items-center justify-center rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-green-500"
      >
        Upload CSV
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="upload-dialog-title"
        >
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => !loading && setOpen(false)}
            aria-hidden
          />
          <div className="relative max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-900">
            <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-800">
              <h2 id="upload-dialog-title" className="text-lg font-semibold">
                Preview ({preview.length} trades)
              </h2>
            </div>
            <div className="max-h-[60vh] overflow-auto px-6 py-4">
              {error && (
                <Alert variant="destructive" className="mb-4">
                  {error}
                </Alert>
              )}
              <PreviewTable rows={preview} />
            </div>
            <div className="flex justify-end gap-2 border-t border-gray-200 px-6 py-4 dark:border-gray-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => !loading && setOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button onClick={handleConfirm} disabled={loading}>
                {loading ? "Saving…" : "Confirm & Save"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
