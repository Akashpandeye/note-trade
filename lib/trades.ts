import type { SupabaseClient } from "@supabase/supabase-js";
import type { Trade, TradeInsert, TradeUpdate, TradeFilters } from "@/types";

const TABLE = "trades";

export async function getTrades(
  supabase: SupabaseClient,
  opts: {
    filters?: TradeFilters;
    sortBy?: string;
    sortDir?: "asc" | "desc";
    page?: number;
    pageSize?: number;
  } = {}
): Promise<{ data: Trade[]; total: number }> {
  const {
    filters = {},
    sortBy = "trade_date",
    sortDir = "desc",
    page = 1,
    pageSize = 20,
  } = opts;

  let query = supabase
    .from(TABLE)
    .select("*", { count: "exact" });

  if (filters.dateFrom) {
    query = query.gte("trade_date", filters.dateFrom);
  }
  if (filters.dateTo) {
    query = query.lte("trade_date", filters.dateTo);
  }
  if (filters.symbol?.trim()) {
    query = query.ilike("symbol", `%${filters.symbol.trim()}%`);
  }
  if (filters.segment && filters.segment !== "all") {
    query = query.eq("segment", filters.segment);
  }
  if (filters.winLoss === "win") {
    query = query.gt("net_pnl", 0);
  }
  if (filters.winLoss === "loss") {
    query = query.lt("net_pnl", 0);
  }

  const orderCol = sortBy === "net_pnl" ? "net_pnl" : sortBy;
  query = query.order(orderCol, { ascending: sortDir === "asc" });

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) throw error;
  return { data: (data ?? []) as Trade[], total: count ?? 0 };
}

export async function getTradeById(
  supabase: SupabaseClient,
  id: string
): Promise<Trade | null> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data as Trade;
}

export async function getTradesForDashboard(
  supabase: SupabaseClient,
  limit = 10
): Promise<Trade[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .order("trade_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as Trade[];
}

export async function getAllTradesForStats(
  supabase: SupabaseClient
): Promise<Trade[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .order("trade_date", { ascending: true });

  if (error) throw error;
  return (data ?? []) as Trade[];
}

export async function getExistingTradeIds(
  supabase: SupabaseClient,
  userId: string
): Promise<Set<string>> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("trade_id")
    .eq("user_id", userId)
    .not("trade_id", "is", null);
  if (error) return new Set();
  const ids = new Set<string>();
  for (const row of data ?? []) {
    if (row.trade_id) ids.add(row.trade_id);
  }
  return ids;
}

export async function insertTrades(
  supabase: SupabaseClient,
  userId: string,
  rows: TradeInsert[]
): Promise<{ data: Trade[] | null; error: unknown }> {
  const existing = await getExistingTradeIds(supabase, userId);
  const toInsert = rows
    .filter((r) => r.trade_id && !existing.has(r.trade_id))
    .map((r) => ({ ...r, user_id: userId }));
  if (toInsert.length === 0) {
    return { data: [], error: null };
  }
  const { data, error } = await supabase
    .from(TABLE)
    .insert(toInsert)
    .select();
  if (error) return { data: null, error };
  return { data: data as Trade[], error: null };
}

export async function updateTrade(
  supabase: SupabaseClient,
  id: string,
  updates: TradeUpdate
): Promise<{ data: Trade | null; error: unknown }> {
  const { data, error } = await supabase
    .from(TABLE)
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return { data: null, error };
  return { data: data as Trade, error: null };
}
