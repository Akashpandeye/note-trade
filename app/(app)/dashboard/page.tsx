import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase";
import { getTradesForDashboard, getAllTradesForStats } from "@/lib/trades";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { EquityCurve } from "@/components/dashboard/EquityCurve";
import { CalendarHeatmap } from "@/components/dashboard/CalendarHeatmap";
import { MonthlyBarChart } from "@/components/dashboard/MonthlyBarChart";
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400">Overview of your trading performance</p>
      </div>
      <StatsCards trades={allTrades} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Equity Curve</CardTitle></CardHeader>
          <CardContent><EquityCurve trades={allTrades} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Monthly P&L</CardTitle></CardHeader>
          <CardContent><MonthlyBarChart trades={allTrades} /></CardContent>
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
