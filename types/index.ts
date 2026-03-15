/** Strategy tags for trade classification */
export const STRATEGY_TAGS = [
  "Scalp",
  "Swing",
  "Breakout",
  "Positional",
  "Reversal",
] as const;
export type StrategyTag = (typeof STRATEGY_TAGS)[number];

/** Emotion tags for trade reflection */
export const EMOTION_TAGS = [
  "Disciplined",
  "FOMO",
  "Revenge Trade",
  "Hesitated",
  "Overconfident",
] as const;
export type EmotionTag = (typeof EMOTION_TAGS)[number];

/** Segment filter / display */
export type Segment = "EQ" | "FO" | string;

/** Trade row as stored in Supabase */
export interface Trade {
  id: string;
  user_id: string;
  symbol: string;
  isin: string | null;
  trade_date: string;
  exchange: string | null;
  segment: string | null;
  trade_type: string;
  quantity: number;
  price: number;
  order_id: string | null;
  trade_id: string | null;
  executed_at: string | null;
  pnl: number | null;
  fees: number | null;
  net_pnl: number | null;
  is_open: boolean;
  strategy_tag: StrategyTag | null;
  emotion_tag: EmotionTag | null;
  notes: string | null;
  screenshot_url: string | null;
  created_at: string;
}

/** Insert payload for trades table (id, user_id, created_at can be omitted/defaulted) */
export type TradeInsert = Omit<Trade, "id" | "created_at"> & {
  id?: string;
  created_at?: string;
};

/** Partial update for trade detail edits (notes, strategy_tag, emotion_tag, screenshot_url) */
export type TradeUpdate = Partial<
  Pick<Trade, "notes" | "strategy_tag" | "emotion_tag" | "screenshot_url">
>;

/** Raw row from Zerodha tradebook CSV */
export interface ZerodhaCsvRow {
  symbol: string;
  isin: string;
  trade_date: string;
  exchange: string;
  segment: string;
  series: string;
  trade_type: string;
  quantity: string;
  price: string;
  trade_id: string;
  order_id: string;
  order_execution_time: string;
}

/** Single leg (buy or sell) used for FIFO matching */
export interface TradeLeg {
  symbol: string;
  isin: string;
  trade_date: string;
  exchange: string;
  segment: string;
  trade_type: "buy" | "sell";
  quantity: number;
  price: number;
  trade_id: string;
  order_id: string;
  executed_at: string;
}

/** Matched trade after FIFO P&L calculation — for upload preview and display */
export interface MatchedTrade {
  date: string;
  symbol: string;
  segment: string;
  direction: "buy" | "sell";
  quantity: number;
  entryPrice: number;
  exitPrice: number;
  pnl: number;
  trade_id: string;
  /** For dedup and bulk insert: one row per closed trade pair */
  legIds?: string[];
}

/** Filters for /trades list */
export interface TradeFilters {
  dateFrom?: string;
  dateTo?: string;
  symbol?: string;
  segment?: Segment;
  winLoss?: "win" | "loss" | "all";
}

/** Sort config for trade table */
export interface TradeSort {
  column: keyof Trade | "net_pnl" | "trade_date";
  direction: "asc" | "desc";
}
