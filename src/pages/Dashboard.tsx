import { InventoryHealthBar } from "@/components/dashboard/InventoryHealthBar";
import { CriticalAlerts } from "@/components/dashboard/CriticalAlerts";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { StatCard } from "@/components/dashboard/StatCard";
import { SalesChart } from "@/components/dashboard/SalesChart";
import { TopSellingTable } from "@/components/dashboard/TopSellingTable";
import { DateRangeFilter } from "@/components/ui/date-range-filter";
import { IndianRupee, ShoppingCart, Package, Wallet } from "lucide-react";

const Dashboard = () => {
  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-6">
      {/* Header + Quick Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">{today}</p>
        </div>
        <QuickActions />
      </div>

      {/* Primary: Inventory Health — immediate operational awareness */}
      <InventoryHealthBar />

      {/* Secondary: Business metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Today's Sales"
          value="₹24,500"
          trend={12}
          trendLabel="last 7 days"
          icon={<IndianRupee className="h-10 w-10 text-primary/20" />}
        />
        <StatCard
          title="Transactions"
          value="48"
          trend={8}
          trendLabel="last 7 days"
          icon={<ShoppingCart className="h-10 w-10 text-chart-5/20" />}
        />
        <StatCard
          title="Items Sold"
          value="186"
          trend={5}
          trendLabel="last 7 days"
          icon={<Package className="h-10 w-10 text-success/20" />}
        />
        <StatCard
          title="Expenses"
          value="₹8,200"
          trend={-3}
          trendLabel="vs yesterday"
          icon={<Wallet className="h-10 w-10 text-destructive/20" />}
        />
      </div>

      {/* Tertiary: Chart + Top Sellers side by side */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <SalesChart />
        </div>
        <div className="lg:col-span-2">
          <TopSellingTable />
        </div>
      </div>

      {/* Bottom: Alerts — reference, not primary focus */}
      <CriticalAlerts />
    </div>
  );
};

export default Dashboard;
