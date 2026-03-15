import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase";
import { getTradesForDashboard, getAllTradesForStats } from "@/lib/trades";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { DashboardUploadButton } from "@/components/dashboard/DashboardUploadButton";
import { CalendarHeatmap } from "@/components/dashboard/CalendarHeatmap";
import { MonthlyBarChart } from "@/components/dashboard/MonthlyBarChart";
import { LastTradesBarChart } from "@/components/dashboard/LastTradesBarChart";
import { RecentTrades } from "@/components/dashboard/RecentTrades";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [recentTrades, allTrades] = await Promise.all([
    getTradesForDashboard(supabase, 10),
    getAllTradesForStats(supabase),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400">Overview of your trading performance</p>
        </div>
        <DashboardUploadButton />
      </div>
      <StatsCards trades={allTrades} />
      {/* Flex: Last 7 Trades, Monthly P&L */}
      <div className="flex flex-wrap gap-4">
        <Card className="min-w-[260px] flex-1 overflow-hidden rounded-2xl border-gray-200/80 shadow-sm dark:border-gray-800/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Last 7 Trades — P&L</CardTitle>
          </CardHeader>
          <CardContent className="w-full pt-0">
            <LastTradesBarChart trades={recentTrades} />
          </CardContent>
        </Card>
        <Card className="min-w-[260px] flex-1 overflow-hidden rounded-2xl border-gray-200/80 shadow-sm dark:border-gray-800/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Monthly P&L</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <MonthlyBarChart trades={allTrades} />
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader><CardTitle>Daily P&L Heatmap</CardTitle></CardHeader>
        <CardContent><CalendarHeatmap trades={allTrades} /></CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Recent Trades</CardTitle></CardHeader>
        <CardContent><RecentTrades trades={recentTrades} /></CardContent>
      </Card>
    </div>
  );
}
