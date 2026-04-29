import { useState } from "react";
import { InventoryHealthBar } from "@/components/dashboard/InventoryHealthBar";
import { CriticalAlerts } from "@/components/dashboard/CriticalAlerts";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { StatCard } from "@/components/dashboard/StatCard";
import { SalesChart } from "@/components/dashboard/SalesChart";
import { TopSellingTable } from "@/components/dashboard/TopSellingTable";
import { DateRangeFilter } from "@/components/ui/date-range-filter";
import { IndianRupee, ShoppingCart, Package, Wallet, Clock } from "lucide-react";
import { useDashboardSummary, useDashboardCharts } from "@/hooks/api/useApi";
import { subDays, format } from "date-fns";

const Dashboard = () => {
  const [dateRange, setDateRange] = useState<{ from: string; to: string }>({
    from: format(subDays(new Date(), 30), "yyyy-MM-dd"),
    to: format(new Date(), "yyyy-MM-dd"),
  });

  const todayStr = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const { data: dash, isLoading: dashLoading } = useDashboardSummary(dateRange);
  const { data: charts } = useDashboardCharts(30);

  const today = dash?.today as any;
  const inv = dash?.inventory as any;
  const topSelling = dash?.topSelling as any;
  const trends = dash?.trends as any;

  const chartSeries = charts?.series?.map((p: any) => ({ date: p.date, sales: p.sales }));

  const topRows = topSelling?.map((t: any) => ({
    name: t.name,
    sold: t.sold,
    revenue: `₹${Number(t.revenue).toLocaleString("en-IN")}`,
    profit: `₹${Number(t.profit).toLocaleString("en-IN")}`,
    margin: t.margin,
  }));

  const lowN = inv?.lowStockSkus ?? inv?.lowStock ?? 0;
  const healthItems =
    inv && today
      ? [
          {
            label: "Low Stock",
            value: String(lowN),
            sublabel: "SKUs",
            icon: Package,
            color: "text-destructive",
            bg: "bg-destructive/10",
          },
          {
            label: "Expiry Risk",
            value: `₹${(inv.expiringValueApprox ?? 0).toLocaleString("en-IN")}`,
            sublabel: "next 30 days (approx.)",
            icon: Clock,
            color: "text-warning",
            bg: "bg-warning/10",
          },
          {
            label: "Reorder Needed",
            value: String(inv.reorderSuggested ?? 0),
            sublabel: "suggested",
            icon: ShoppingCart,
            color: "text-primary",
            bg: "bg-primary/10",
          },
          {
            label: "Today's Profit",
            value: `₹${(today.revenue ?? 0).toLocaleString("en-IN")}`,
            sublabel: `${today.bills ?? 0} bills`,
            icon: IndianRupee,
            color: "text-success",
            bg: "bg-success/10",
          },
        ]
      : undefined;

  const fmtMoney = (n: number) => `₹${n.toLocaleString("en-IN")}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">{todayStr}</p>
        </div>
        <div className="flex items-center gap-3">
          <DateRangeFilter 
            onChange={(r) => setDateRange({ 
              from: format(r.from, "yyyy-MM-dd"), 
              to: format(r.to, "yyyy-MM-dd") 
            })} 
          />
          <QuickActions />
        </div>
      </div>

      <InventoryHealthBar items={healthItems} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Today's Sales"
          value={dashLoading ? "…" : fmtMoney(today?.sales ?? 0)}
          trend={trends?.sales || 0}
          trendLabel="vs yesterday"
          icon={<IndianRupee className="h-10 w-10 text-primary/20" />}
        />
        <StatCard
          title="Transactions"
          value={dashLoading ? "…" : String(today?.bills ?? 0)}
          trend={trends?.bills || 0}
          trendLabel="vs yesterday"
          icon={<ShoppingCart className="h-10 w-10 text-chart-5/20" />}
        />
        <StatCard
          title="Items Sold"
          value={dashLoading ? "…" : String(today?.itemsSold ?? 0)}
          trend={trends?.itemsSold || 0}
          trendLabel="vs yesterday"
          icon={<Package className="h-10 w-10 text-success/20" />}
        />
        <StatCard
          title="Expenses"
          value={dashLoading ? "…" : fmtMoney(today?.expenses ?? 0)}
          trend={trends?.expenses || 0}
          trendLabel="vs yesterday"
          icon={<Wallet className="h-10 w-10 text-destructive/20" />}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <SalesChart data={chartSeries} />
        </div>
        <div className="lg:col-span-2">
          <TopSellingTable rows={topRows} />
        </div>
      </div>

      <CriticalAlerts />
    </div>
  );
};

export default Dashboard;
