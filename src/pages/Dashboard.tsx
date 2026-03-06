import { InventoryHealthBar } from "@/components/dashboard/InventoryHealthBar";
import { CriticalAlerts } from "@/components/dashboard/CriticalAlerts";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { ReorderSuggestions } from "@/components/dashboard/ReorderSuggestions";
import { StatCard } from "@/components/dashboard/StatCard";
import { SalesChart } from "@/components/dashboard/SalesChart";
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
      {/* Header + Quick Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Good Morning, Admin</h1>
          <p className="text-sm text-muted-foreground">{today}</p>
        </div>
        <QuickActions />
      </div>

      {/* 1. Inventory Health — above the fold */}
      <InventoryHealthBar />

      {/* 2. Critical Alerts + AI Reorder — the operational core */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <CriticalAlerts />
        <ReorderSuggestions />
      </div>

      {/* 3. Sales Metrics — secondary */}
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

      {/* 4. Sales Chart — compact */}
      <SalesChart />

      {/* 5. Top Medicines with Profit */}
      <TopSellingTable />
    </div>
  );
};

export default Dashboard;
