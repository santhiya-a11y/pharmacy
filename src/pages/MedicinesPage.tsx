import { useState, useMemo } from "react";
import { Search, Filter, Plus, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import AddMedicineDialog from "@/components/medicines/AddMedicineDialog";
import { useMedicines } from "@/hooks/api/useApi";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

const MedicinesPage = () => {
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);

  const { data: stockData, isLoading, isFetching } = useMedicines({
    q: debouncedSearch.trim() || undefined,
    page: 1,
    pageSize: 100,
  });

  const medicines = useMemo(() => {
    return (stockData?.rows as any[]) || [];
  }, [stockData]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Medicine Master</h1>
          <p className="text-sm text-muted-foreground">Manage your medicine database</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-md hover:opacity-90 transition-opacity">
          <Plus className="h-4 w-4" /> Add Medicine
        </button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input 
            placeholder="Search medicines..." 
            className="pl-10 bg-card border-border" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm hover:bg-secondary transition-colors">
          <Filter className="h-4 w-4" /> Filter
        </button>
        {isFetching && !isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground self-center" />}
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-24 text-muted-foreground gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
            <p className="text-sm font-medium animate-pulse">Loading medicine master...</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-secondary/50 border-b border-border text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                <th className="px-4 py-3 text-left">S.No</th>
                <th className="px-4 py-3 text-left">Item</th>
                <th className="px-4 py-3 text-left">Generic</th>
                <th className="px-4 py-3 text-left">MFR</th>
                <th className="px-4 py-3 text-left">HSN</th>
                <th className="px-4 py-3 text-right">MRP</th>
                <th className="px-4 py-3 text-right">Stock</th>
                <th className="px-4 py-3 text-right">SGST%</th>
                <th className="px-4 py-3 text-right">CGST%</th>
                <th className="px-4 py-3 text-center">Schedule</th>
              </tr>
            </thead>
            <tbody>
              {medicines.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-4 py-12 text-center text-muted-foreground italic">
                    No medicines found.
                  </td>
                </tr>
              ) : (
                medicines.map((med, i) => (
                  <tr key={med.id || i} className="border-b border-border/50 hover:bg-accent/30 transition-colors cursor-pointer">
                    <td className="px-4 py-3 text-muted-foreground">{i + 1}</td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-card-foreground">{med.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium text-accent-foreground">{med.category || "General"}</span>
                          {med.dosageForm !== "---" && <span className="text-[10px] text-muted-foreground border-l border-border pl-1.5">{med.dosageForm}</span>}
                          {med.packSize !== "---" && <span className="text-[10px] text-muted-foreground border-l border-border pl-1.5">{med.packSize}</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{med.generic || med.mfr}</td>
                    <td className="px-4 py-3 text-muted-foreground">{med.mfr}</td>
                    <td className="px-4 py-3 font-mono text-muted-foreground">{med.hsn}</td>
                    <td className="px-4 py-3 text-right font-semibold">₹{med.mrp}</td>
                    <td className={`px-4 py-3 text-right font-semibold ${med.stock < 10 ? "text-destructive" : ""}`}>{med.stock}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{med.sgst}%</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{med.cgst}%</td>
                    <td className="px-4 py-3 text-center">
                      <span className="rounded bg-secondary px-2 py-0.5 text-xs font-medium">{med.schedule}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
      <AddMedicineDialog open={showAdd} onClose={() => setShowAdd(false)} />
    </div>
  );
};

export default MedicinesPage;
