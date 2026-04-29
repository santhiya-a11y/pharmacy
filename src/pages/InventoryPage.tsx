import { useState, useMemo } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Search, Filter, Plus } from "lucide-react";
import { DateRangeFilter } from "@/components/ui/date-range-filter";
import { Input } from "@/components/ui/input";
import AddStockDialog from "@/components/inventory/AddStockDialog";
import ItemDetailSheet from "@/components/inventory/ItemDetailSheet";
import type { InventoryItem } from "@/components/inventory/ItemDetailSheet";
import ImportExportMenu from "@/components/shared/ImportExportMenu";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useInventoryStock, useInventorySummary } from "@/hooks/api/useApi";
import { inventoryApi } from "@/lib/api/endpoints";
import { parseApiError } from "@/lib/api/errors";
import { normalizeExpiryDisplay } from "@/lib/expiry";

function mapRow(r: Record<string, unknown>): InventoryItem {
  return {
    id: r.id != null ? String(r.id) : undefined,
    name: String(r.name ?? ""),
    mfr: String(r.mfr ?? ""),
    batch: String(r.batch ?? ""),
    expiry: normalizeExpiryDisplay(r.expiry),
    hsn: String(r.hsn ?? ""),
    mrp: Number(r.mrp ?? 0),
    stock: Number(r.stock ?? 0),
    sgst: Number(r.sgst ?? 0),
    cgst: Number(r.cgst ?? 0),
    rack: String(r.rack ?? ""),
    status: String(r.status ?? "safe"),
    purchasePrice: r.purchasePrice != null ? Number(r.purchasePrice) : undefined,
    supplier: r.supplier != null ? String(r.supplier) : undefined,
  };
}

const statusStyles: Record<string, string> = {
  safe: "bg-chart-2/10 text-chart-2",
  expiring: "bg-warning/10 text-warning",
  low: "bg-destructive/10 text-destructive",
  expired: "bg-destructive text-destructive-foreground",
};

const InventoryPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [search, setSearch] = useState("");
  const debouncedQ = useDebouncedValue(search, 300);

  const { data: stockData, isLoading, isFetching } = useInventoryStock({
    q: debouncedQ.trim() || undefined,
    page: 1,
    pageSize: 100,
    sort: "createdAt:desc",
  });
  const { data: summary } = useInventorySummary();

  const inventory = useMemo(() => {
    const rows = stockData?.rows ?? [];
    return rows.map((r) => mapRow(r as unknown as Record<string, unknown>));
  }, [stockData]);

  const handleAddToPO = (item: InventoryItem) => {
    setSelectedItem(null);
    const suggestedQty = item.stock < 10 ? 100 : item.stock < 50 ? 50 : 30;
    navigate("/purchases", {
      state: {
        newPOItem: {
          drug: item.name,
          qty: suggestedQty,
          rate: item.purchasePrice || item.mrp,
          supplier: item.supplier || item.mfr,
          batch: item.batch,
          expiry: item.expiry,
        },
      },
    });
  };

  const onImport = async (rows: Record<string, unknown>[]) => {
    try {
      await inventoryApi.importRows(rows);
      toast.success(`${rows.length} rows accepted for import`);
      void queryClient.invalidateQueries({ queryKey: ["inventory"] });
    } catch (e) {
      toast.error(parseApiError(e).message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Inventory Management</h1>
          <p className="text-sm text-muted-foreground">Track stock, batches, and expiry dates</p>
        </div>
        <div className="flex items-center gap-2">
          <ImportExportMenu
            data={inventory}
            columns={[
              { key: "name", label: "Item Name" },
              { key: "mfr", label: "Manufacturer" },
              { key: "batch", label: "Batch" },
              { key: "expiry", label: "Expiry" },
              { key: "hsn", label: "HSN" },
              { key: "mrp", label: "MRP" },
              { key: "stock", label: "Stock" },
              { key: "sgst", label: "SGST%" },
              { key: "cgst", label: "CGST%" },
              { key: "rack", label: "Rack" },
              { key: "status", label: "Status" },
            ]}
            filenamePrefix="inventory_stock"
            onImport={onImport}
          />
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            disabled={isFetching}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-md hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <Plus className="h-4 w-4" /> Add Stock
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total Items</p>
          <p className="text-2xl font-bold text-card-foreground mt-1">
            {summary ? summary.totalSkus : isLoading ? "…" : "—"}
          </p>
        </div>
        <div className="rounded-xl border border-warning/30 bg-warning/5 p-4">
          <p className="text-sm text-warning">Expiring Soon</p>
          <p className="text-2xl font-bold text-warning mt-1">
            {summary ? summary.expiringSoon : isLoading ? "…" : "—"}
          </p>
        </div>
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
          <p className="text-sm text-destructive">Low Stock</p>
          <p className="text-2xl font-bold text-destructive mt-1">
            {summary ? summary.lowStock : isLoading ? "…" : "—"}
          </p>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search inventory..."
            className="pl-10 bg-card border-border"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <DateRangeFilter />
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm hover:bg-secondary transition-colors"
        >
          <Filter className="h-4 w-4" /> Filter
        </button>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-sm text-muted-foreground">Loading inventory…</div>
        ) : (
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
                  key={item.id ?? `${item.batch}-${item.name}-${i}`}
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
                  <td className={`px-4 py-3 text-right font-semibold ${item.stock < 10 ? "text-destructive" : ""}`}>
                    {item.stock}
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground">{item.sgst}%</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">{item.cgst}%</td>
                  <td className="px-4 py-3 text-muted-foreground">{item.rack}</td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusStyles[item.status] ?? statusStyles.safe}`}
                    >
                      {item.status === "low" ? "Low Stock" : item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <AddStockDialog open={showAdd} onClose={() => setShowAdd(false)} />
      <ItemDetailSheet
        item={selectedItem}
        open={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        onAddToReorder={handleAddToPO}
        isInReorder={false}
      />
    </div>
  );
};

export default InventoryPage;
