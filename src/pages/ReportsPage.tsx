import { useState } from "react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import {
  FileText, Download, Calendar, TrendingUp, TrendingDown,
  IndianRupee, ShoppingCart, Package, Filter, AlertTriangle,
  Clock, Zap, ArrowUpRight, Eye
} from "lucide-react";
import { DateRangeFilter } from "@/components/ui/date-range-filter";
import { InsightCard } from "@/components/reports/InsightCard";
import { AIReorderPanel } from "@/components/reports/AIReorderPanel";

const dailySales = [
  { date: "01 Mar", sales: 18200, returns: 800 },
  { date: "02 Mar", sales: 22400, returns: 1200 },
  { date: "03 Mar", sales: 15600, returns: 400 },
  { date: "04 Mar", sales: 28100, returns: 900 },
  { date: "05 Mar", sales: 24500, returns: 600 },
  { date: "06 Mar", sales: 31200, returns: 1500 },
  { date: "07 Mar", sales: 19800, returns: 700 },
];

const categoryData = [
  { name: "Antibiotics", value: 32 },
  { name: "Analgesics", value: 24 },
  { name: "Antacids", value: 16 },
  { name: "Antidiabetic", value: 12 },
  { name: "Vitamins", value: 9 },
  { name: "Others", value: 7 },
];

const PIE_COLORS = [
  "hsl(243 75% 59%)", "hsl(152 60% 40%)", "hsl(38 92% 50%)",
  "hsl(199 89% 48%)", "hsl(0 72% 51%)", "hsl(280 60% 50%)",
];

const gstSummary = [
  { label: "GST @5%", taxable: "₹42,300", cgst: "₹1,057", sgst: "₹1,057", total: "₹2,115" },
  { label: "GST @12%", taxable: "₹1,18,600", cgst: "₹7,116", sgst: "₹7,116", total: "₹14,232" },
  { label: "GST @18%", taxable: "₹28,400", cgst: "₹2,556", sgst: "₹2,556", total: "₹5,112" },
];

const topMedicines = [
  { name: "Dolo 650mg", qty: 420, revenue: "₹12,600", margin: "28%" },
  { name: "Azithromycin 500mg", qty: 285, revenue: "₹28,500", margin: "22%" },
  { name: "Pantoprazole 40mg", qty: 240, revenue: "₹14,400", margin: "35%" },
  { name: "Cetirizine 10mg", qty: 210, revenue: "₹6,300", margin: "40%" },
  { name: "Metformin 500mg", qty: 195, revenue: "₹4,875", margin: "32%" },
];

const hourlyTraffic = [
  { hour: "8AM", bills: 4 }, { hour: "9AM", bills: 12 }, { hour: "10AM", bills: 22 },
  { hour: "11AM", bills: 18 }, { hour: "12PM", bills: 14 }, { hour: "1PM", bills: 8 },
  { hour: "2PM", bills: 10 }, { hour: "3PM", bills: 15 }, { hour: "4PM", bills: 20 },
  { hour: "5PM", bills: 28 }, { hour: "6PM", bills: 35 }, { hour: "7PM", bills: 30 },
  { hour: "8PM", bills: 22 }, { hour: "9PM", bills: 12 },
];

const paymentBreakdown = [
  { method: "Cash", amount: "₹68,400", pct: "42%" },
  { method: "UPI", amount: "₹52,200", pct: "32%" },
  { method: "Card", amount: "₹24,300", pct: "15%" },
  { method: "Credit", amount: "₹17,900", pct: "11%" },
];

type TabKey = "overview" | "sales" | "gst" | "inventory";

const tabs: { key: TabKey; label: string; icon: any }[] = [
  { key: "overview", label: "Overview", icon: Eye },
  { key: "sales", label: "Sales Report", icon: TrendingUp },
  { key: "gst", label: "GST Report", icon: FileText },
  { key: "inventory", label: "Inventory Intelligence", icon: Package },
];

const ReportsPage = () => {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reports & Analytics</h1>
          <p className="text-sm text-muted-foreground">Actionable insights to grow your pharmacy</p>
        </div>
        <div className="flex items-center gap-3">
          <DateRangeFilter />
          <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity">
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
          description="Paracetamol 500mg sold 430 tablets this week. Stock will run out in 4 days at current velocity."
          metric="4 days"
          metricLabel="until stockout"
          actionLabel="Reorder now"
        />
        <InsightCard
          icon={<TrendingUp className="h-5 w-5" />}
          severity="success"
          title="Revenue Up 14%"
          description="Weekly revenue hit ₹1,59,800 — your best week this month. Antibiotics drove 32% of sales."
          metric="₹1.59L"
          metricLabel="this week"
          actionLabel="View breakdown"
        />
        <InsightCard
          icon={<Clock className="h-5 w-5" />}
          severity="warning"
          title="Peak Hour: 5–7 PM"
          description="65% of daily bills happen between 5–7 PM. Consider adding staff during these hours."
          metric="35"
          metricLabel="peak bills/hr"
          actionLabel="See hourly data"
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

      {activeTab === "overview" && <OverviewTab />}
      {activeTab === "sales" && <SalesTab />}
      {activeTab === "gst" && <GSTTab />}
      {activeTab === "inventory" && <InventoryTab />}
    </div>
  );
};

/* ────────── OVERVIEW ────────── */
const OverviewTab = () => (
  <div className="space-y-6 animate-fade-in">
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <KPICard title="Total Revenue" value="₹1,59,800" trend={14} icon={IndianRupee} />
      <KPICard title="Total Bills" value="312" trend={8} icon={ShoppingCart} />
      <KPICard title="Avg. Bill Value" value="₹512" trend={5} icon={FileText} />
      <KPICard title="Items Sold" value="1,486" trend={-2} icon={Package} />
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
              {categoryData.map((_, i) => (
                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => `${value}%`} />
          </PieChart>
        </ResponsiveContainer>
        <div className="mt-2 space-y-1.5">
          {categoryData.map((cat, i) => (
            <div key={i} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: PIE_COLORS[i] }} />
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
          {paymentBreakdown.map((p, i) => (
            <div key={i} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{p.method}</span>
                <span className="font-semibold text-card-foreground">{p.amount} ({p.pct})</span>
              </div>
              <div className="h-2 rounded-full bg-secondary overflow-hidden">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: p.pct, opacity: 1 - i * 0.15 }} />
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
            {topMedicines.map((m, i) => (
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

/* ────────── SALES ────────── */
const SalesTab = () => (
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
          {dailySales.map((d, i) => {
            const net = d.sales - d.returns;
            const profit = Math.round(net * 0.25);
            return (
              <tr key={i} className="border-b border-border/50 hover:bg-accent/30 transition-colors">
                <td className="px-4 py-3 font-medium text-card-foreground">{d.date}</td>
                <td className="px-4 py-3 text-right text-muted-foreground">{Math.round(d.sales / 500)}</td>
                <td className="px-4 py-3 text-right">₹{d.sales.toLocaleString()}</td>
                <td className="px-4 py-3 text-right text-muted-foreground">₹{Math.round(d.sales * 0.03).toLocaleString()}</td>
                <td className="px-4 py-3 text-right text-destructive">₹{d.returns.toLocaleString()}</td>
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

/* ────────── GST ────────── */
const GSTTab = () => (
  <div className="space-y-6 animate-fade-in">
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="rounded-xl border border-border bg-card p-5">
        <p className="text-sm text-muted-foreground">Total Taxable Value</p>
        <p className="text-2xl font-bold text-card-foreground mt-1">₹1,89,300</p>
      </div>
      <div className="rounded-xl border border-border bg-card p-5">
        <p className="text-sm text-muted-foreground">Total CGST + SGST</p>
        <p className="text-2xl font-bold text-primary mt-1">₹21,459</p>
      </div>
      <div className="rounded-xl border border-border bg-card p-5">
        <p className="text-sm text-muted-foreground">Total Collection (incl. GST)</p>
        <p className="text-2xl font-bold text-card-foreground mt-1">₹2,10,759</p>
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
          {gstSummary.map((row, i) => (
            <tr key={i} className="border-b border-border/50">
              <td className="px-4 py-3 font-semibold text-card-foreground">{row.label}</td>
              <td className="px-4 py-3 text-right">{row.taxable}</td>
              <td className="px-4 py-3 text-right text-muted-foreground">{row.cgst}</td>
              <td className="px-4 py-3 text-right text-muted-foreground">{row.sgst}</td>
              <td className="px-4 py-3 text-right font-semibold text-primary">{row.total}</td>
            </tr>
          ))}
          <tr className="bg-accent/30">
            <td className="px-4 py-3 font-bold text-card-foreground">Total</td>
            <td className="px-4 py-3 text-right font-bold">₹1,89,300</td>
            <td className="px-4 py-3 text-right font-bold">₹10,729</td>
            <td className="px-4 py-3 text-right font-bold">₹10,729</td>
            <td className="px-4 py-3 text-right font-bold text-primary">₹21,459</td>
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
          {[
            { hsn: "3004", desc: "Medicaments (mixed/unmixed)", qty: 820, taxable: "₹98,400", rate: "12%" },
            { hsn: "3003", desc: "Medicaments (not in dosage)", qty: 340, taxable: "₹42,300", rate: "5%" },
            { hsn: "3005", desc: "Bandages & dressings", qty: 120, taxable: "₹18,600", rate: "18%" },
            { hsn: "9018", desc: "Medical instruments", qty: 45, taxable: "₹9,800", rate: "12%" },
            { hsn: "2106", desc: "Food supplements", qty: 160, taxable: "₹20,200", rate: "18%" },
          ].map((row, i) => (
            <tr key={i} className="border-b border-border/50">
              <td className="px-4 py-3 font-mono text-xs font-semibold text-card-foreground">{row.hsn}</td>
              <td className="px-4 py-3 text-muted-foreground">{row.desc}</td>
              <td className="px-4 py-3 text-right">{row.qty}</td>
              <td className="px-4 py-3 text-right font-semibold">{row.taxable}</td>
              <td className="px-4 py-3 text-center">
                <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">{row.rate}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

/* ────────── INVENTORY INTELLIGENCE ────────── */
const InventoryTab = () => (
  <div className="space-y-6 animate-fade-in">
    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
      <div className="rounded-xl border border-border bg-card p-5">
        <p className="text-sm text-muted-foreground">Total SKUs</p>
        <p className="text-2xl font-bold text-card-foreground mt-1">1,247</p>
      </div>
      <div className="rounded-xl border border-border bg-card p-5">
        <p className="text-sm text-muted-foreground">Inventory Value</p>
        <p className="text-2xl font-bold text-card-foreground mt-1">₹8,45,000</p>
      </div>
      <div className="rounded-xl border border-warning/30 bg-warning/5 p-5">
        <p className="text-sm text-warning">Expiring (30 days)</p>
        <p className="text-2xl font-bold text-warning mt-1">23</p>
      </div>
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5">
        <p className="text-sm text-destructive">Dead Stock</p>
        <p className="text-2xl font-bold text-destructive mt-1">14</p>
      </div>
    </div>

    {/* AI Reorder Panel */}
    <AIReorderPanel />

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="text-base font-semibold text-card-foreground mb-4">Stock Movement (This Week)</h3>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={dailySales}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 91%)" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(220 10% 46%)" />
            <YAxis tick={{ fontSize: 11 }} stroke="hsl(220 10% 46%)" />
            <Tooltip contentStyle={{ borderRadius: "0.75rem", border: "1px solid hsl(220 13% 91%)" }} />
            <Legend />
            <Line type="monotone" dataKey="sales" stroke="hsl(243 75% 59%)" strokeWidth={2} name="Stock Out" dot={false} />
            <Line type="monotone" dataKey="returns" stroke="hsl(152 60% 40%)" strokeWidth={2} name="Stock In" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="text-base font-semibold text-card-foreground mb-4">Dead Stock (No sales in 90 days)</h3>
        <div className="space-y-2.5">
          {[
            { name: "Ranitidine 150mg", stock: 45, value: "₹1,350", days: 120 },
            { name: "Nimesulide 100mg", stock: 30, value: "₹900", days: 105 },
            { name: "Chloroquine 250mg", stock: 80, value: "₹4,000", days: 98 },
            { name: "Doxycycline 100mg", stock: 25, value: "₹1,250", days: 95 },
            { name: "Norfloxacin 400mg", stock: 18, value: "₹720", days: 92 },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between rounded-lg bg-secondary/50 p-3">
              <div>
                <p className="text-sm font-medium text-card-foreground">{item.name}</p>
                <p className="text-xs text-muted-foreground">{item.stock} units • {item.days} days unsold</p>
              </div>
              <span className="text-sm font-semibold text-destructive">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
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
