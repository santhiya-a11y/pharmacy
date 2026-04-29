import { useState, useMemo } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { format, subDays } from "date-fns";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import {
  FileText, Download, Calendar, TrendingUp, TrendingDown,
  IndianRupee, ShoppingCart, Package, Filter, AlertTriangle,
  Clock, Zap, ArrowUpRight, Eye, Loader2
} from "lucide-react";
import { DateRangeFilter, type DateRange } from "@/components/ui/date-range-filter";
import { InsightCard } from "@/components/reports/InsightCard";
import { AIReorderPanel } from "@/components/reports/AIReorderPanel";
import { useReportsOverview, useReportsSales, useReportsGst, useInventorySummary } from "@/hooks/api/useApi";

const PIE_COLORS = [
  "hsl(243 75% 59%)", "hsl(152 60% 40%)", "hsl(38 92% 50%)",
  "hsl(199 89% 48%)", "hsl(0 72% 51%)", "hsl(280 60% 50%)",
];

type TabKey = "overview" | "sales" | "gst" | "inventory";

const tabs: { key: TabKey; label: string; icon: any }[] = [
  { key: "overview", label: "Overview", icon: Eye },
  { key: "sales", label: "Sales Report", icon: TrendingUp },
  { key: "gst", label: "GST Report", icon: FileText },
  { key: "inventory", label: "Inventory Intelligence", icon: Package },
];

const ReportsPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 30),
    to: new Date()
  });

  const params = useMemo(() => ({
    from: format(dateRange.from, "yyyy-MM-dd"),
    to: format(dateRange.to, "yyyy-MM-dd"),
  }), [dateRange]);

  const { data: overview, isLoading: isOverviewLoading } = useReportsOverview(params);
  const { data: sales, isLoading: isSalesLoading } = useReportsSales(params);
  const { data: gst, isLoading: isGstLoading } = useReportsGst(params);
  const { data: inventorySummary, isLoading: isInvLoading } = useInventorySummary();

  const handleExport = (tab: TabKey) => {
    let csvContent = "";
    const timestamp = new Date().toISOString().slice(0, 10);
    let filename = `report_${tab}_${timestamp}`;

    if (tab === "overview" || tab === "sales") {
      const rows = (sales?.daily as any[]) || [];
      csvContent = "Date,Sales,Returns,Net Sales,Profit\n" +
        rows.map(d => {
          const s = Number(d.sales || 0);
          const r = Number(d.returns || 0);
          const net = s - r;
          const profit = Math.round(net * 0.25);
          return `${d.date},${s},${r},${net},${profit}`;
        }).join("\n");
    } else if (tab === "gst") {
      const rows = (gst?.slabs as any[]) || [];
      csvContent = "GST Slab,Taxable Amount,CGST,SGST,Total Tax\n" +
        rows.map(r => `${r.label},${r.taxable},${r.cgst},${r.sgst},${r.total}`).join("\n");
    } else if (tab === "inventory") {
      const catData = (overview?.categories as any[]) || [];
      csvContent = "Category,Value\n" +
        catData.map(c => `${c.name},${c.value}%`).join("\n");
    }

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${tab} report as CSV`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reports & Analytics</h1>
          <p className="text-sm text-muted-foreground">Actionable insights to grow your pharmacy</p>
        </div>
        <div className="flex items-center gap-3">
          <DateRangeFilter value={dateRange} onChange={setDateRange} />
          <button
            onClick={() => handleExport(activeTab)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
          >
            <Download className="h-4 w-4" /> Export
          </button>
        </div>
      </div>

      {/* Insight Cards — always visible */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <InsightCard
          icon={<Zap className="h-5 w-5" />}
          severity="critical"
          title="Stock Running Out"
          description={(overview as any)?.insights?.lowStockPrompt || "Paracetamol 500mg sold 430 tablets this week. Stock will run out in 4 days at current velocity."}
          metric={(overview as any)?.insights?.stockoutDays || "4 days"}
          metricLabel="until stockout"
          actionLabel="Reorder now"
          onAction={() => navigate("/purchases")}
        />
        <InsightCard
          icon={<TrendingUp className="h-5 w-5" />}
          severity="success"
          title={`Revenue Up ${(overview as any)?.trends?.revenueGrowth || "14"}%`}
          description={(overview as any)?.insights?.revenueDescription || "Weekly revenue hit ₹1,59,800 — your best week this month. Antibiotics drove 32% of sales."}
          metric={`₹${Number((overview as any)?.kpi?.totalRevenue || 0).toLocaleString()}`}
          metricLabel="this period"
          actionLabel="View breakdown"
          onAction={() => setActiveTab("sales")}
        />
        <InsightCard
          icon={<Clock className="h-5 w-5" />}
          severity="warning"
          title={`Peak Hour: ${(overview as any)?.insights?.peakHour || "5–7 PM"}`}
          description={(overview as any)?.insights?.peakHourDescription || "65% of daily bills happen between 5–7 PM. Consider adding staff during these hours."}
          metric={(overview as any)?.insights?.peakBills || "35"}
          metricLabel="peak bills/hr"
          actionLabel="See hourly data"
          onAction={() => setActiveTab("sales")}
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-secondary p-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "overview" && <OverviewTab data={overview} isLoading={isOverviewLoading} />}
      {activeTab === "sales" && <SalesTab data={sales} isLoading={isSalesLoading} />}
      {activeTab === "gst" && <GSTTab data={gst} isLoading={isGstLoading} />}
      {activeTab === "inventory" && <InventoryTab summary={inventorySummary} isLoading={isInvLoading} />}
    </div>
  );
};

/* ────────── OVERVIEW ────────── */
const OverviewTab = ({ data, isLoading }: { data: any; isLoading: boolean }) => {
  if (isLoading) return <LoadingPlaceholder />;
  
  const kpi = data?.kpi || {};
  const trends = data?.trends || {};
  const dailySales = data?.dailySales || [];
  const categoryData = data?.categories || [];
  const paymentBreakdown = data?.payments || [];
  const topMedicines = data?.topMedicines?.map((m: any) => ({
    ...m,
    revenue: `₹${Number(m.revenue).toLocaleString()}`,
    margin: `${m.margin}%`
  })) || [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total Revenue" value={`₹${Number(kpi.totalRevenue || 0).toLocaleString()}`} trend={trends.revenue || 0} icon={IndianRupee} />
        <KPICard title="Total Bills" value={String(kpi.totalBills || 0)} trend={trends.bills || 0} icon={ShoppingCart} />
        <KPICard title="Avg. Bill Value" value={`₹${Number(kpi.avgBill || 0).toLocaleString()}`} trend={trends.avgBill || 0} icon={FileText} />
        <KPICard title="Items Sold" value={Number(kpi.itemsSold || 0).toLocaleString()} trend={trends.itemsSold || 0} icon={Package} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-6">
          <h3 className="text-base font-semibold text-card-foreground mb-4">Daily Sales & Returns</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={dailySales} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 91%)" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(220 10% 46%)" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(220 10% 46%)" tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(value: number) => `₹${value.toLocaleString()}`} contentStyle={{ borderRadius: "0.75rem", border: "1px solid hsl(220 13% 91%)" }} />
              <Legend />
              <Bar dataKey="sales" fill="hsl(243 75% 59%)" radius={[4,4,0,0]} name="Sales" />
              <Bar dataKey="returns" fill="hsl(0 72% 51%)" radius={[4,4,0,0]} name="Returns" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="text-base font-semibold text-card-foreground mb-4">Sales by Category</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                {categoryData.map((_: any, i: number) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => `${value}%`} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 space-y-1.5">
            {categoryData.map((cat: any, i: number) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                  <span className="text-muted-foreground">{cat.name}</span>
                </div>
                <span className="font-semibold text-card-foreground">{cat.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="text-base font-semibold text-card-foreground mb-4">Payment Breakdown</h3>
          <div className="space-y-3">
            {paymentBreakdown.map((p: any, i: number) => (
              <div key={i} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{p.method}</span>
                  <span className="font-semibold text-card-foreground">₹{Number(p.amount).toLocaleString()} ({p.pct}%)</span>
                </div>
                <div className="h-2 rounded-full bg-secondary overflow-hidden">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${p.pct}%`, opacity: 1 - i * 0.15 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="text-base font-semibold text-card-foreground mb-4">Top Selling Medicines</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="pb-2 text-left font-medium text-muted-foreground">Medicine</th>
                <th className="pb-2 text-right font-medium text-muted-foreground">Qty</th>
                <th className="pb-2 text-right font-medium text-muted-foreground">Revenue</th>
                <th className="pb-2 text-right font-medium text-muted-foreground">Margin</th>
              </tr>
            </thead>
            <tbody>
              {topMedicines.map((m: any, i: number) => (
                <tr key={i} className="border-b border-border/50 last:border-0">
                  <td className="py-2.5 font-medium text-card-foreground">{m.name}</td>
                  <td className="py-2.5 text-right text-muted-foreground">{m.qty}</td>
                  <td className="py-2.5 text-right font-semibold">{m.revenue}</td>
                  <td className="py-2.5 text-right text-success font-semibold">{m.margin}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

/* ────────── SALES ────────── */
const SalesTab = ({ data, isLoading }: { data: any; isLoading: boolean }) => {
  if (isLoading) return <LoadingPlaceholder />;

  const hourlyTraffic = data?.hourly || [];
  const dailyLedger = data?.daily || [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="text-base font-semibold text-card-foreground mb-4">Peak Hours Analysis</h3>
        <p className="text-xs text-muted-foreground mb-4">Number of bills generated per hour — optimize staffing for peak times</p>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={hourlyTraffic}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 91%)" />
            <XAxis dataKey="hour" tick={{ fontSize: 11 }} stroke="hsl(220 10% 46%)" />
            <YAxis tick={{ fontSize: 11 }} stroke="hsl(220 10% 46%)" />
            <Tooltip contentStyle={{ borderRadius: "0.75rem", border: "1px solid hsl(220 13% 91%)" }} />
            <Bar dataKey="bills" fill="hsl(243 75% 59%)" radius={[4,4,0,0]} name="Bills" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-card-foreground">Daily Sales Ledger</h3>
          <button className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-secondary transition-colors">
            <Filter className="h-3.5 w-3.5" /> Filter
          </button>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-secondary/50 border-b border-border">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Bills</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Gross Sales</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Discounts</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Returns</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Net Sales</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Profit</th>
            </tr>
          </thead>
          <tbody>
            {dailyLedger.map((d: any, i: number) => {
              const net = Number(d.sales || 0) - Number(d.returns || 0);
              const profit = Math.round(net * 0.25);
              return (
                <tr key={i} className="border-b border-border/50 hover:bg-accent/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-card-foreground">{d.date}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">{d.bills}</td>
                  <td className="px-4 py-3 text-right">₹{Number(d.sales || 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">₹{Number(d.discounts || 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-destructive">₹{Number(d.returns || 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right font-semibold">₹{net.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-success font-semibold">₹{profit.toLocaleString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ────────── GST ────────── */
const GSTTab = ({ data, isLoading }: { data: any; isLoading: boolean }) => {
  if (isLoading) return <LoadingPlaceholder />;

  const stats = data?.stats || {};
  const slabs = data?.slabs || [];
  const hsnSummary = data?.hsn || [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Total Taxable Value</p>
          <p className="text-2xl font-bold text-card-foreground mt-1">₹{Number(stats.taxable || 0).toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Total CGST + SGST</p>
          <p className="text-2xl font-bold text-primary mt-1">₹{Number(stats.totalTax || 0).toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Total Collection (incl. GST)</p>
          <p className="text-2xl font-bold text-card-foreground mt-1">₹{Number(stats.totalAmount || 0).toLocaleString()}</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-card-foreground">GST Slab-wise Summary</h3>
          <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 transition-opacity">
            <Download className="h-3.5 w-3.5" /> Download GSTR-1
          </button>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-secondary/50 border-b border-border">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">GST Slab</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Taxable Amount</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">CGST</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">SGST</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Total Tax</th>
            </tr>
          </thead>
          <tbody>
            {slabs.map((row: any, i: number) => (
              <tr key={i} className="border-b border-border/50">
                <td className="px-4 py-3 font-semibold text-card-foreground">{row.label}</td>
                <td className="px-4 py-3 text-right">₹{Number(row.taxable).toLocaleString()}</td>
                <td className="px-4 py-3 text-right text-muted-foreground">₹{Number(row.cgst).toLocaleString()}</td>
                <td className="px-4 py-3 text-right text-muted-foreground">₹{Number(row.sgst).toLocaleString()}</td>
                <td className="px-4 py-3 text-right font-semibold text-primary">₹{Number(row.total).toLocaleString()}</td>
              </tr>
            ))}
            <tr className="bg-accent/30">
              <td className="px-4 py-3 font-bold text-card-foreground">Total</td>
              <td className="px-4 py-3 text-right font-bold">₹{Number(stats.taxable || 0).toLocaleString()}</td>
              <td className="px-4 py-3 text-right font-bold">₹{Number((stats.totalTax || 0) / 2).toLocaleString()}</td>
              <td className="px-4 py-3 text-right font-bold">₹{Number((stats.totalTax || 0) / 2).toLocaleString()}</td>
              <td className="px-4 py-3 text-right font-bold text-primary">₹{Number(stats.totalTax || 0).toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="text-base font-semibold text-card-foreground mb-4">HSN-wise Summary (Top 5)</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-secondary/50 border-b border-border">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">HSN Code</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Description</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Qty</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Taxable</th>
              <th className="px-4 py-3 text-center font-medium text-muted-foreground">Rate</th>
            </tr>
          </thead>
          <tbody>
            {hsnSummary.map((row: any, i: number) => (
              <tr key={i} className="border-b border-border/50">
                <td className="px-4 py-3 font-mono text-xs font-semibold text-card-foreground">{row.hsn}</td>
                <td className="px-4 py-3 text-muted-foreground">{row.desc}</td>
                <td className="px-4 py-3 text-right">{row.qty}</td>
                <td className="px-4 py-3 text-right font-semibold">₹{Number(row.taxable).toLocaleString()}</td>
                <td className="px-4 py-3 text-center">
                  <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">{row.rate}%</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ────────── INVENTORY INTELLIGENCE ────────── */
const InventoryTab = ({ summary, isLoading }: { summary: any; isLoading: boolean }) => {
  const deadStock = summary?.deadStock || [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Total SKUs</p>
          <p className="text-2xl font-bold text-card-foreground mt-1">
            {isLoading ? "…" : (summary?.totalSkus || 0).toLocaleString()}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Inventory Value</p>
          <p className="text-2xl font-bold text-card-foreground mt-1">
            {isLoading ? "…" : `₹${Number(summary?.inventoryValue || 0).toLocaleString()}`}
          </p>
        </div>
        <div className="rounded-xl border border-warning/30 bg-warning/5 p-5">
          <p className="text-sm text-warning">Expiring (30 days)</p>
          <p className="text-2xl font-bold text-warning mt-1">
            {isLoading ? "…" : summary?.expiringSoon || 0}
          </p>
        </div>
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5">
          <p className="text-sm text-destructive">Dead Stock</p>
          <p className="text-2xl font-bold text-destructive mt-1">
            {isLoading ? "…" : summary?.deadStockCount || 0}
          </p>
        </div>
      </div>

      {/* AI Reorder Panel */}
      <AIReorderPanel />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="text-base font-semibold text-card-foreground mb-4">Stock Movement (This Week)</h3>
          {isLoading ? (
            <div className="h-[260px] flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={summary?.movement || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 91%)" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(220 10% 46%)" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(220 10% 46%)" />
                <Tooltip contentStyle={{ borderRadius: "0.75rem", border: "1px solid hsl(220 13% 91%)" }} />
                <Legend />
                <Line type="monotone" dataKey="out" stroke="hsl(243 75% 59%)" strokeWidth={2} name="Stock Out" dot={false} />
                <Line type="monotone" dataKey="in" stroke="hsl(152 60% 40%)" strokeWidth={2} name="Stock In" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="text-base font-semibold text-card-foreground mb-4">Dead Stock (No sales in 90 days)</h3>
          <div className="space-y-2.5">
            {isLoading ? (
              <div className="space-y-2">
                {[1,2,3].map(i => <div key={i} className="h-14 rounded-lg bg-secondary/50 animate-pulse" />)}
              </div>
            ) : deadStock.length === 0 ? (
              <div className="text-center py-12 text-sm text-muted-foreground italic">No dead stock detected</div>
            ) : deadStock.map((item: any, i: number) => (
              <div key={i} className="flex items-center justify-between rounded-lg bg-secondary/50 p-3">
                <div>
                  <p className="text-sm font-medium text-card-foreground">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.stock} units • {item.days} days unsold</p>
                </div>
                <span className="text-sm font-semibold text-destructive">₹{Number(item.value).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const LoadingPlaceholder = () => (
  <div className="flex-1 flex flex-col items-center justify-center p-24 text-muted-foreground gap-3">
    <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
    <p className="text-sm font-medium animate-pulse">Computing intelligence reports...</p>
  </div>
);

/* ────────── KPI CARD ────────── */
const KPICard = ({ title, value, trend, icon: Icon }: { title: string; value: string; trend: number; icon: any }) => {
  const isUp = trend >= 0;
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{title}</p>
        <div className="rounded-lg bg-accent p-2">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </div>
      <p className="mt-2 text-2xl font-bold text-card-foreground">{value}</p>
      <div className="mt-1.5 flex items-center gap-1 text-xs">
        {isUp ? <TrendingUp className="h-3.5 w-3.5 trend-up" /> : <TrendingDown className="h-3.5 w-3.5 trend-down" />}
        <span className={isUp ? "trend-up font-semibold" : "trend-down font-semibold"}>{isUp ? "+" : ""}{trend}%</span>
        <span className="text-muted-foreground">vs last week</span>
      </div>
    </div>
  );
};

export default ReportsPage;
