"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { parseZerodhaCsvToMatchedTrades } from "@/lib/parseCsv";
import type { TradeInsert, MatchedTrade } from "@/types";
import { CsvUploader } from "@/components/upload/CsvUploader";
import { PreviewTable } from "@/components/upload/PreviewTable";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";

export default function UploadPage() {
  const router = useRouter();
  const [preview, setPreview] = useState<MatchedTrade[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileAccepted = useCallback((text: string) => {
    setError(null);
    try {
      const matched = parseZerodhaCsvToMatchedTrades(text);
      setPreview(matched);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to parse CSV.");
      setPreview([]);
    }
  }, []);

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

    const { error: insertErr } = await import("@/lib/trades").then((m) =>
      m.insertTrades(supabase, user.id, rows)
    );

    if (insertErr) {
      const msg =
        typeof insertErr === "object" && insertErr !== null && "message" in insertErr
          ? String((insertErr as { message: unknown }).message)
          : "Failed to save trades.";
      setError(msg);
      setLoading(false);
      return;
    }
    setPreview([]);
    setLoading(false);
    router.push("/trades");
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Upload CSV</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Upload your Zerodha tradebook CSV. Trades are matched with FIFO and P&L is calculated.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select file</CardTitle>
        </CardHeader>
        <CardContent>
          <CsvUploader onFileAccepted={handleFileAccepted} />
        </CardContent>
      </Card>

      {error && <Alert variant="destructive">{error}</Alert>}

      {preview.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Preview ({preview.length} trades)</CardTitle>
            <Button onClick={handleConfirm} disabled={loading}>
              {loading ? "Saving…" : "Confirm & Save"}
            </Button>
          </CardHeader>
          <CardContent>
            <PreviewTable rows={preview} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
