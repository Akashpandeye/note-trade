import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase";
import { getTradeById } from "@/lib/trades";
import { TradeDetail } from "@/components/trades/TradeDetail";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function TradeDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const trade = await getTradeById(supabase, id);
  if (!trade) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/trades"
          className="inline-flex h-10 items-center justify-center rounded-md border border-gray-300 bg-transparent px-4 text-sm font-medium hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
        >
          ← Back to Trades
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Trade: {trade.symbol}
        </h1>
      </div>
      <TradeDetail trade={trade} />
    </div>
  );
}
