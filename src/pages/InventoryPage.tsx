import { Search, Filter, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";

const inventory = [
  { medicine: "Dolo 650mg", batch: "B102", expiry: "08/2026", stock: 250, rack: "A1-03", purchased: "₹22", mrp: "₹30", status: "safe" },
  { medicine: "Azithromycin 500mg", batch: "A45", expiry: "12/2026", stock: 45, rack: "B2-01", purchased: "₹72", mrp: "₹100", status: "safe" },
  { medicine: "Cetirizine 10mg", batch: "C78", expiry: "04/2026", stock: 180, rack: "A2-05", purchased: "₹18", mrp: "₹30", status: "expiring" },
  { medicine: "Amoxicillin 250mg", batch: "AM33", expiry: "05/2026", stock: 8, rack: "C1-02", purchased: "₹35", mrp: "₹50", status: "low" },
  { medicine: "Metformin 500mg", batch: "M90", expiry: "11/2026", stock: 300, rack: "A3-01", purchased: "₹15", mrp: "₹25", status: "safe" },
  { medicine: "Pantoprazole 40mg", batch: "P12", expiry: "06/2026", stock: 92, rack: "B1-04", purchased: "₹38", mrp: "₹60", status: "expiring" },
];

const statusStyles: Record<string, string> = {
  safe: "bg-success/10 text-success",
  expiring: "bg-warning/10 text-warning",
  low: "bg-destructive/10 text-destructive",
  expired: "bg-destructive text-destructive-foreground",
};

const InventoryPage = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Inventory Management</h1>
          <p className="text-sm text-muted-foreground">Track stock, batches, and expiry dates</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-md hover:opacity-90 transition-opacity">
          <Plus className="h-4 w-4" /> Add Stock
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total Items</p>
          <p className="text-2xl font-bold text-card-foreground mt-1">1,247</p>
        </div>
        <div className="rounded-xl border border-warning/30 bg-warning/5 p-4">
          <p className="text-sm text-warning">Expiring Soon</p>
          <p className="text-2xl font-bold text-warning mt-1">23</p>
        </div>
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
          <p className="text-sm text-destructive">Low Stock</p>
          <p className="text-2xl font-bold text-destructive mt-1">8</p>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search inventory..." className="pl-10 bg-card border-border" />
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm hover:bg-secondary transition-colors">
          <Filter className="h-4 w-4" /> Filter
        </button>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-secondary/50 border-b border-border">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Medicine</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Batch</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Expiry</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Stock</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Rack</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Purchase</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">MRP</th>
              <th className="px-4 py-3 text-center font-medium text-muted-foreground">Status</th>
            </tr>
          </thead>
          <tbody>
            {inventory.map((item, i) => (
              <tr key={i} className="border-b border-border/50 hover:bg-accent/30 transition-colors">
                <td className="px-4 py-3 font-medium text-card-foreground">{item.medicine}</td>
                <td className="px-4 py-3 text-muted-foreground">{item.batch}</td>
                <td className="px-4 py-3 text-muted-foreground">{item.expiry}</td>
                <td className={`px-4 py-3 text-right font-semibold ${item.stock < 10 ? "text-destructive" : ""}`}>{item.stock}</td>
                <td className="px-4 py-3 text-muted-foreground">{item.rack}</td>
                <td className="px-4 py-3 text-right text-muted-foreground">{item.purchased}</td>
                <td className="px-4 py-3 text-right font-semibold">{item.mrp}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusStyles[item.status]}`}>
                    {item.status === "low" ? "Low Stock" : item.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InventoryPage;
