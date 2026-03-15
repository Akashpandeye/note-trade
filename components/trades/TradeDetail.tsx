"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import { updateTrade } from "@/lib/trades";
import type { Trade, TradeUpdate, StrategyTag, EmotionTag } from "@/types";
import { STRATEGY_TAGS, EMOTION_TAGS } from "@/types";
import { formatPnl, pnlColorClass } from "@/lib/calcPnl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";

interface TradeDetailProps {
  trade: Trade;
}

export function TradeDetail({ trade: initial }: TradeDetailProps) {
  const [trade, setTrade] = useState(initial);
  const [notes, setNotes] = useState(initial.notes ?? "");
  const [strategyTag, setStrategyTag] = useState<StrategyTag | "">(
    (initial.strategy_tag as StrategyTag) ?? ""
  );
  const [emotionTag, setEmotionTag] = useState<EmotionTag | "">(
    (initial.emotion_tag as EmotionTag) ?? ""
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const supabase = createClient();

  const handleSave = useCallback(async () => {
    setSaving(true);
    setError(null);
    const updates: TradeUpdate = {
      notes: notes || null,
      strategy_tag: strategyTag || null,
      emotion_tag: emotionTag || null,
    };
    const { data, error: err } = await updateTrade(supabase, trade.id, updates);
    if (err) {
      const msg =
        typeof err === "object" && err !== null && "message" in err
          ? String((err as { message: unknown }).message)
          : "Failed to save.";
      setError(msg);
      setSaving(false);
      return;
    }
    if (data) setTrade(data);
    setSaving(false);
  }, [supabase, trade.id, notes, strategyTag, emotionTag]);

  async function handleScreenshot(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("Not authenticated.");
      setUploading(false);
      return;
    }
    const ext = file.name.split(".").pop() ?? "png";
    const path = `${user.id}/${trade.id}.${ext}`;
    const { error: uploadErr } = await supabase.storage
      .from("screenshots")
      .upload(path, file, { upsert: true });
    if (uploadErr) {
      setError(uploadErr.message);
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("screenshots").getPublicUrl(path);
    const { data: updated, error: updateErr } = await updateTrade(supabase, trade.id, {
      screenshot_url: urlData.publicUrl,
    });
    if (updateErr) {
      const msg =
        typeof updateErr === "object" && updateErr !== null && "message" in updateErr
          ? String((updateErr as { message: unknown }).message)
          : "Failed to update.";
      setError(msg);
      setUploading(false);
      return;
    }
    if (updated) setTrade(updated);
    setUploading(false);
  }

  const netPnl = trade.net_pnl ?? trade.pnl ?? 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Trade details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p><span className="text-gray-500">Date:</span> {trade.trade_date}</p>
          <p><span className="text-gray-500">Symbol:</span> {trade.symbol}</p>
          <p><span className="text-gray-500">Segment:</span> {trade.segment ?? "—"}</p>
          <p><span className="text-gray-500">Type:</span> {trade.trade_type}</p>
          <p><span className="text-gray-500">Quantity:</span> {trade.quantity}</p>
          <p><span className="text-gray-500">Price:</span> {Number(trade.price).toFixed(2)}</p>
          <p><span className="text-gray-500">Fees:</span> {Number(trade.fees ?? 0).toFixed(2)}</p>
          <p className={pnlColorClass(netPnl)}><span className="text-gray-500">Net P&L:</span> {formatPnl(netPnl)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Edit</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <Alert variant="destructive">{error}</Alert>}
          <div className="space-y-2">
            <Label>Notes</Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes"
            />
          </div>
          <div className="space-y-2">
            <Label>Strategy</Label>
            <select
              className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-950"
              value={strategyTag}
              onChange={(e) => setStrategyTag((e.target.value || "") as StrategyTag | "")}
            >
              <option value="">—</option>
              {STRATEGY_TAGS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Emotion</Label>
            <select
              className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-950"
              value={emotionTag}
              onChange={(e) => setEmotionTag((e.target.value || "") as EmotionTag | "")}
            >
              <option value="">—</option>
              {EMOTION_TAGS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Screenshot</Label>
            <input
              type="file"
              accept="image/*"
              className="text-sm"
              onChange={handleScreenshot}
              disabled={uploading}
            />
            {trade.screenshot_url && (
              <div className="mt-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={trade.screenshot_url}
                  alt="Screenshot"
                  className="max-h-48 rounded border border-gray-200 object-contain dark:border-gray-800"
                />
              </div>
            )}
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
