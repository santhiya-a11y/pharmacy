import { StatCard } from "@/components/dashboard/StatCard";
import { SalesChart } from "@/components/dashboard/SalesChart";
import { AlertsPanel } from "@/components/dashboard/AlertsPanel";
import { TopSellingTable } from "@/components/dashboard/TopSellingTable";
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Welcome back, Admin</h1>
          <p className="text-sm text-muted-foreground">{today}</p>
        </div>
        <a
          href="/pos"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-md hover:opacity-90 transition-opacity"
        >
          <ShoppingCart className="h-4 w-4" />
          Start Billing →
        </a>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Today's Sales"
          value="₹24,500"
          trend={12}
          trendLabel="last 7 days"
          icon={<IndianRupee className="h-10 w-10 text-primary/20" />}
        />
        <StatCard
          title="Total Transactions"
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
          title="Today's Expenses"
          value="₹8,200"
          trend={-3}
          trendLabel="vs yesterday"
          icon={<Wallet className="h-10 w-10 text-destructive/20" />}
        />
      </div>

      {/* Charts */}
      <SalesChart />

      {/* Bottom Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <TopSellingTable />
        <AlertsPanel />
      </div>
    </div>
  );
};

export default Dashboard;
