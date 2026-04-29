import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const defaultData = [
  { date: "01 Mar", sales: 12400 },
  { date: "02 Mar", sales: 18200 },
  { date: "03 Mar", sales: 15600 },
  { date: "04 Mar", sales: 22100 },
  { date: "05 Mar", sales: 19800 },
  { date: "06 Mar", sales: 24500 },
  { date: "07 Mar", sales: 21300 },
];

export type SalesChartPoint = { date: string; sales: number };

export const SalesChart = ({ data }: { data?: SalesChartPoint[] }) => {
  const chartData = data?.length ? data : defaultData;
  return (
    <div className="rounded-xl border border-border bg-card p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-card-foreground">Sales Overview</h3>
          <p className="text-sm text-muted-foreground">Track your sales performance</p>
        </div>
        <select className="rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground">
          <option>This Week</option>
          <option>This Month</option>
          <option>This Quarter</option>
        </select>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(243 75% 59%)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(243 75% 59%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 91%)" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(220 10% 46%)" />
          <YAxis tick={{ fontSize: 12 }} stroke="hsl(220 10% 46%)" tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
          <Tooltip
            contentStyle={{
              borderRadius: "0.75rem",
              border: "1px solid hsl(220 13% 91%)",
              boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
            }}
            formatter={(value: number) => [`₹${value.toLocaleString()}`, "Sales"]}
          />
          <Area type="monotone" dataKey="sales" stroke="hsl(243 75% 59%)" strokeWidth={2.5} fill="url(#salesGradient)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
