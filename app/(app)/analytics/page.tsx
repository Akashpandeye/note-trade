import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase";
import { getAllTradesForStats } from "@/lib/trades";
import { AnalyticsCharts } from "@/components/analytics/AnalyticsCharts";

export default async function AnalyticsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const trades = await getAllTradesForStats(supabase);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Win/loss, P&L by symbol, time, and streaks.
        </p>
      </div>
      <AnalyticsCharts trades={trades} />
    </div>
  );
}
