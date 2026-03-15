"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase";
import { insertTrades } from "@/lib/trades";
import type { TradeInsert } from "@/types";
import { STRATEGY_TAGS, EMOTION_TAGS } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";

const manualTradeSchema = z.object({
  symbol: z.string().min(1, "Symbol is required"),
  trade_date: z.string().min(1, "Date is required"),
  segment: z.string().min(1, "Segment is required"),
  trade_type: z.enum(["buy", "sell"]),
  quantity: z.coerce.number().int().positive("Quantity must be positive"),
  price: z.coerce.number().positive("Price must be positive"),
  fees: z.coerce.number().min(0).default(0),
  net_pnl: z.coerce.number().optional(),
  notes: z.string().optional(),
  strategy_tag: z.string().optional(),
  emotion_tag: z.string().optional(),
});

type ManualTradeForm = z.infer<typeof manualTradeSchema>;

export default function BookPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ManualTradeForm>({
    resolver: zodResolver(manualTradeSchema),
    defaultValues: {
      segment: "EQ",
      trade_type: "sell",
      fees: 0,
      strategy_tag: "",
      emotion_tag: "",
    },
  });

  async function onSubmit(data: ManualTradeForm) {
    setError(null);
    setSuccess(false);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("Not authenticated.");
      return;
    }

    const pnl = data.net_pnl ?? 0;
    const row: TradeInsert = {
      user_id: user.id,
      symbol: data.symbol.trim(),
      isin: null,
      trade_date: data.trade_date,
      exchange: null,
      segment: data.segment,
      trade_type: data.trade_type,
      quantity: data.quantity,
      price: data.price,
      order_id: null,
      trade_id: `manual-${Date.now()}`,
      executed_at: null,
      pnl,
      fees: data.fees,
      net_pnl: pnl,
      is_open: false,
      strategy_tag: data.strategy_tag && STRATEGY_TAGS.includes(data.strategy_tag as (typeof STRATEGY_TAGS)[number]) ? (data.strategy_tag as (typeof STRATEGY_TAGS)[number]) : null,
      emotion_tag: data.emotion_tag && EMOTION_TAGS.includes(data.emotion_tag as (typeof EMOTION_TAGS)[number]) ? (data.emotion_tag as (typeof EMOTION_TAGS)[number]) : null,
      notes: data.notes?.trim() || null,
      screenshot_url: null,
    };

    const { error: insertErr } = await insertTrades(supabase, user.id, [row]);

    if (insertErr) {
      const msg =
        typeof insertErr === "object" && insertErr !== null && "message" in insertErr
          ? String((insertErr as { message: unknown }).message)
          : "Failed to save trade.";
      setError(msg);
      return;
    }

    setSuccess(true);
    reset();
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Book</h1>
        <p className="text-gray-500 dark:text-gray-400">Add a trade manually</p>
      </div>

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Manual trade entry</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && <Alert variant="destructive">{error}</Alert>}
            {success && <Alert>Trade saved. You can add another below.</Alert>}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="symbol">Symbol</Label>
                <Input id="symbol" {...register("symbol")} placeholder="e.g. RELIANCE" />
                {errors.symbol && (
                  <p className="text-xs text-red-600 dark:text-red-400">{errors.symbol.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="trade_date">Trade date</Label>
                <Input id="trade_date" type="date" {...register("trade_date")} />
                {errors.trade_date && (
                  <p className="text-xs text-red-600 dark:text-red-400">{errors.trade_date.message}</p>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="segment">Segment</Label>
                <select
                  id="segment"
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-950"
                  {...register("segment")}
                >
                  <option value="EQ">EQ</option>
                  <option value="FO">FO</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="trade_type">Type</Label>
                <select
                  id="trade_type"
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-950"
                  {...register("trade_type")}
                >
                  <option value="buy">Buy</option>
                  <option value="sell">Sell</option>
                </select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input id="quantity" type="number" min={1} {...register("quantity")} />
                {errors.quantity && (
                  <p className="text-xs text-red-600 dark:text-red-400">{errors.quantity.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price</Label>
                <Input id="price" type="number" step="0.01" min="0" {...register("price")} />
                {errors.price && (
                  <p className="text-xs text-red-600 dark:text-red-400">{errors.price.message}</p>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fees">Fees</Label>
                <Input id="fees" type="number" step="0.01" min="0" {...register("fees")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="net_pnl">Net P&L (optional)</Label>
                <Input id="net_pnl" type="number" step="0.01" {...register("net_pnl")} placeholder="0" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Input id="notes" {...register("notes")} placeholder="Optional notes" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="strategy_tag">Strategy</Label>
                <select
                  id="strategy_tag"
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-950"
                  {...register("strategy_tag")}
                >
                  <option value="">—</option>
                  {STRATEGY_TAGS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="emotion_tag">Emotion</Label>
                <select
                  id="emotion_tag"
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-950"
                  {...register("emotion_tag")}
                >
                  <option value="">—</option>
                  {EMOTION_TAGS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving…" : "Save trade"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.push("/trades")}>
                View trades
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
