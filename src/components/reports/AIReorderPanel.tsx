import { useState, useEffect, useMemo } from "react";
import { Brain, Package, TrendingUp, CheckCircle2, ShoppingCart, Sparkles, Loader2 } from "lucide-react";
import { useInventoryIntelligence } from "@/hooks/api/useApi";

interface ReorderItem {
  id?: string;
  name: string;
  currentStock: number;
  dailyAvg: number;
  daysLeft: number;
  recommended: number;
  unit: string;
  confidence: number;
  urgency: "high" | "medium" | "low";
}

const urgencyStyles = {
  high: "bg-destructive/10 text-destructive border-destructive/20",
  medium: "bg-warning/10 text-warning border-warning/20",
  low: "bg-success/10 text-success border-success/20",
};

export const AIReorderPanel = () => {
  const { data, isLoading } = useInventoryIntelligence();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const reorderData = useMemo(() => {
    const rawItems = (data?.items as any[]) || [];
    return rawItems.map((item) => ({
      id: item.id || item.name,
      name: item.name || "Unknown Item",
      currentStock: Number(item.stock ?? item.currentStock ?? 0),
      dailyAvg: Number(item.velocity ?? item.dailyAvg ?? 0),
      daysLeft: Number(item.runway ?? item.daysLeft ?? 0),
      recommended: Number(item.suggested ?? item.recommended ?? 0),
      unit: item.unit || "units",
      confidence: Number(item.score ?? item.confidence ?? 80),
      urgency: (item.urgency as "high" | "medium" | "low") || "medium",
    }));
  }, [data]);

  useEffect(() => {
    if (reorderData.length > 0 && selected.size === 0) {
      setSelected(new Set(reorderData.filter(i => i.urgency === "high").map(i => i.name)));
    }
  }, [reorderData]);

  const toggleItem = (name: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(reorderData.map(i => i.name)));

  return (
    <div className="rounded-xl border border-primary/20 bg-card overflow-hidden animate-fade-in transition-all hover:shadow-lg hover:shadow-primary/5">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6">
        <div className="flex items-start gap-4">
          <div className="rounded-xl bg-primary/10 p-3 ring-1 ring-primary/20">
            <Brain className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-card-foreground">AI Inventory Intelligence</h3>
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold text-primary uppercase tracking-wider">
                <Sparkles className="h-3 w-3" /> Smart Prediction
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Based on last 30 days sales velocity, here's what you should reorder
            </p>
          </div>
          <button
            onClick={selectAll}
            disabled={reorderData.length === 0}
            className="rounded-lg border border-border bg-secondary px-4 py-2 text-xs font-semibold text-foreground hover:bg-accent hover:border-primary/30 transition-all active:scale-95 disabled:opacity-50"
          >
            Select All
          </button>
        </div>
      </div>

      {/* Items */}
      <div className="divide-y divide-border min-h-[300px] flex flex-col">
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-muted-foreground gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
            <p className="text-sm font-medium animate-pulse">Analyzing inventory trends...</p>
          </div>
        ) : reorderData.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-muted-foreground gap-2">
            <CheckCircle2 className="h-10 w-10 text-success/40" />
            <p className="text-sm font-medium">Your inventory looks healthy!</p>
            <p className="text-xs">No reorder suggestions at this time.</p>
          </div>
        ) : (
          reorderData.map((item) => (
            <div
              key={item.name}
              onClick={() => toggleItem(item.name)}
              className={`flex items-center gap-4 px-6 py-4 cursor-pointer transition-all hover:bg-accent/40 ${selected.has(item.name) ? "bg-primary/5" : ""}`}
            >
              {/* Checkbox */}
              <div className={`h-5 w-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${selected.has(item.name) ? "bg-primary border-primary" : "border-border"}`}>
                {selected.has(item.name) && <CheckCircle2 className="h-3.5 w-3.5 text-primary-foreground" />}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-card-foreground">{item.name}</p>
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-tight ${urgencyStyles[item.urgency]}`}>
                    {item.urgency === "high" ? "Urgent" : item.urgency === "medium" ? "Soon" : "Planned"}
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-1.5 text-xs text-muted-foreground font-medium">
                  <span className="flex items-center gap-1">
                    <Package className="h-3.5 w-3.5 text-primary/60" /> Stock: <span className="text-card-foreground">{item.currentStock}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <TrendingUp className="h-3.5 w-3.5 text-success/60" /> <span className="text-card-foreground">{item.dailyAvg}</span>/day
                  </span>
                  <span className={`flex items-center gap-1 ${item.daysLeft <= 5 ? "text-destructive font-bold" : "text-muted-foreground"}`}>
                    <Clock className="h-3.5 w-3.5" /> ≈ {item.daysLeft} days left
                  </span>
                </div>
              </div>

              {/* Recommendation */}
              <div className="text-right flex-shrink-0 bg-secondary/30 rounded-lg px-3 py-2 border border-border/50">
                <p className="text-base font-black text-primary">{item.recommended} <span className="text-[10px] font-bold text-muted-foreground uppercase">{item.unit}</span></p>
                <div className="flex items-center justify-end gap-1 mt-0.5">
                  <div className="h-1 w-12 rounded-full bg-border overflow-hidden">
                    <div className="h-full bg-primary transition-all" style={{ width: `${item.confidence}%` }} />
                  </div>
                  <p className="text-[9px] font-bold text-muted-foreground">{item.confidence}%</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-border bg-secondary/30 px-6 py-4">
        <p className="text-sm text-muted-foreground">
          <span className="font-bold text-card-foreground">{selected.size}</span> items selected for reorder
        </p>
        <button 
          disabled={selected.size === 0}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90 hover:scale-[1.02] transition-all active:scale-95 disabled:opacity-50 disabled:scale-100 disabled:shadow-none"
        >
          <ShoppingCart className="h-4 w-4" /> Generate Purchase Order
        </button>
      </div>
    </div>
  );
};

// Import Clock from lucide-react if needed, or define it
import { Clock } from "lucide-react";

