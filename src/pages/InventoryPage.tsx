import { useState } from "react";
import { Search, Filter, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import AddStockDialog from "@/components/inventory/AddStockDialog";
import ItemDetailSheet from "@/components/inventory/ItemDetailSheet";
import PurchaseOrderBuilder from "@/components/inventory/PurchaseOrderBuilder";
import type { InventoryItem } from "@/components/inventory/ItemDetailSheet";
import type { ReorderEntry } from "@/components/inventory/PurchaseOrderBuilder";

const inventory: InventoryItem[] = [
  { name: "Dolo 650mg", mfr: "Micro Labs", batch: "B102", expiry: "08/2026", hsn: "3004", mrp: 30, stock: 250, sgst: 6, cgst: 6, rack: "A1-03", status: "safe", purchasePrice: 22, supplier: "Micro Labs" },
  { name: "Azithromycin 500mg", mfr: "Cipla Ltd", batch: "A45", expiry: "12/2026", hsn: "3004", mrp: 100, stock: 45, sgst: 6, cgst: 6, rack: "B2-01", status: "safe", purchasePrice: 68, supplier: "Cipla Ltd" },
  { name: "Cetirizine 10mg", mfr: "Dr. Reddy's", batch: "C78", expiry: "04/2026", hsn: "3004", mrp: 30, stock: 180, sgst: 6, cgst: 6, rack: "A2-05", status: "expiring", purchasePrice: 18, supplier: "Dr. Reddy's" },
  { name: "Amoxicillin 250mg", mfr: "GSK Pharma", batch: "AM33", expiry: "05/2026", hsn: "3004", mrp: 50, stock: 8, sgst: 6, cgst: 6, rack: "C1-02", status: "low", purchasePrice: 32, supplier: "GSK Pharma" },
  { name: "Metformin 500mg", mfr: "USV Ltd", batch: "M90", expiry: "11/2026", hsn: "3004", mrp: 25, stock: 300, sgst: 2.5, cgst: 2.5, rack: "A3-01", status: "safe", purchasePrice: 15, supplier: "USV Ltd" },
  { name: "Pantoprazole 40mg", mfr: "Sun Pharma", batch: "P12", expiry: "06/2026", hsn: "3004", mrp: 60, stock: 92, sgst: 6, cgst: 6, rack: "B1-04", status: "expiring", purchasePrice: 38, supplier: "Sun Pharma" },
];

const statusStyles: Record<string, string> = {
  safe: "bg-chart-2/10 text-chart-2",
  expiring: "bg-warning/10 text-warning",
  low: "bg-destructive/10 text-destructive",
  expired: "bg-destructive text-destructive-foreground",
};

const InventoryPage = () => {
  const [showAdd, setShowAdd] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [reorderEntries, setReorderEntries] = useState<ReorderEntry[]>([]);

  const handleAddToReorder = (item: InventoryItem) => {
    if (reorderEntries.some(e => e.item.name === item.name)) return;
    const suggestedQty = item.stock < 10 ? 100 : item.stock < 50 ? 50 : 30;
    setReorderEntries(prev => [...prev, { item, qty: suggestedQty }]);
  };

  const handleUpdateQty = (itemName: string, qty: number) => {
    setReorderEntries(prev => prev.map(e => e.item.name === itemName ? { ...e, qty } : e));
  };

  const handleRemove = (itemName: string) => {
    setReorderEntries(prev => prev.filter(e => e.item.name !== itemName));
  };

  const isInReorder = (name: string) => reorderEntries.some(e => e.item.name === name);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Inventory Management</h1>
          <p className="text-sm text-muted-foreground">Track stock, batches, and expiry dates</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-md hover:opacity-90 transition-opacity">
          <Plus className="h-4 w-4" /> Add Stock
        </button>
      </div>

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
            <tr className="bg-secondary/50 border-b border-border text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              <th className="px-4 py-3 text-left">S.No</th>
              <th className="px-4 py-3 text-left">Item</th>
              <th className="px-4 py-3 text-left">MFR</th>
              <th className="px-4 py-3 text-left">Batch</th>
              <th className="px-4 py-3 text-left">Expiry</th>
              <th className="px-4 py-3 text-left">HSN</th>
              <th className="px-4 py-3 text-right">MRP</th>
              <th className="px-4 py-3 text-right">Stock</th>
              <th className="px-4 py-3 text-right">SGST%</th>
              <th className="px-4 py-3 text-right">CGST%</th>
              <th className="px-4 py-3 text-left">Rack</th>
              <th className="px-4 py-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {inventory.map((item, i) => (
              <tr
                key={i}
                onClick={() => setSelectedItem(item)}
                className="border-b border-border/50 hover:bg-accent/30 transition-colors cursor-pointer"
              >
                <td className="px-4 py-3 text-muted-foreground">{i + 1}</td>
                <td className="px-4 py-3 font-medium text-card-foreground">{item.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{item.mfr}</td>
                <td className="px-4 py-3 font-mono text-muted-foreground">{item.batch}</td>
                <td className="px-4 py-3 text-muted-foreground">{item.expiry}</td>
                <td className="px-4 py-3 font-mono text-muted-foreground">{item.hsn}</td>
                <td className="px-4 py-3 text-right font-semibold">₹{item.mrp}</td>
                <td className={`px-4 py-3 text-right font-semibold ${item.stock < 10 ? "text-destructive" : ""}`}>{item.stock}</td>
                <td className="px-4 py-3 text-right text-muted-foreground">{item.sgst}%</td>
                <td className="px-4 py-3 text-right text-muted-foreground">{item.cgst}%</td>
                <td className="px-4 py-3 text-muted-foreground">{item.rack}</td>
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

      <AddStockDialog open={showAdd} onClose={() => setShowAdd(false)} />
      <ItemDetailSheet
        item={selectedItem}
        open={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        onAddToReorder={handleAddToReorder}
        isInReorder={selectedItem ? isInReorder(selectedItem.name) : false}
      />
      <PurchaseOrderBuilder
        entries={reorderEntries}
        onUpdateQty={handleUpdateQty}
        onRemove={handleRemove}
        onClear={() => setReorderEntries([])}
      />
    </div>
  );
};

export default InventoryPage;
