import { Brain, Sparkles, ShoppingCart, Package, TrendingUp, CheckCircle2 } from "lucide-react";
import { useState } from "react";

interface ReorderItem {
  name: string;
  currentStock: number;
  dailyAvg: number;
  daysLeft: number;
  recommended: number;
  unit: string;
}

const reorderItems: ReorderItem[] = [
  { name: "Paracetamol 500mg", currentStock: 80, dailyAvg: 18, daysLeft: 4, recommended: 200, unit: "strips" },
  { name: "Amoxicillin 250mg", currentStock: 8, dailyAvg: 5, daysLeft: 1, recommended: 60, unit: "strips" },
  { name: "Azithromycin 500mg", currentStock: 45, dailyAvg: 8, daysLeft: 5, recommended: 100, unit: "strips" },
  { name: "Insulin Glargine", currentStock: 12, dailyAvg: 4, daysLeft: 3, recommended: 20, unit: "units" },
  { name: "Metformin 500mg", currentStock: 36, dailyAvg: 12, daysLeft: 3, recommended: 150, unit: "strips" },
];

export const ReorderSuggestions = () => {
  const [selected, setSelected] = useState<Set<string>>(new Set(reorderItems.map(i => i.name)));

  const toggle = (name: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  return (
    <div className="rounded-xl border border-primary/20 bg-card overflow-hidden animate-fade-in">
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-5 py-4">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          <h3 className="text-base font-bold text-card-foreground">AI Reorder Suggestions</h3>
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
            <Sparkles className="h-3 w-3" /> Smart
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">Based on last 30 days sales velocity</p>
      </div>

      <div className="divide-y divide-border">
        {reorderItems.map((item) => (
          <div
            key={item.name}
            onClick={() => toggle(item.name)}
            className={`flex items-center gap-3 px-5 py-3 cursor-pointer transition-all hover:bg-accent/30 ${selected.has(item.name) ? "bg-accent/20" : ""}`}
          >
            <div className={`h-4 w-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${selected.has(item.name) ? "bg-primary border-primary" : "border-border"}`}>
              {selected.has(item.name) && <CheckCircle2 className="h-3 w-3 text-primary-foreground" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-card-foreground">{item.name}</p>
              <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Package className="h-3 w-3" /> {item.currentStock}</span>
                <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3" /> {item.dailyAvg}/day</span>
                <span className={item.daysLeft <= 3 ? "text-destructive font-semibold" : ""}>
                  ≈ {item.daysLeft}d left
                </span>
              </div>
            </div>
            <p className="text-sm font-bold text-primary flex-shrink-0">{item.recommended} {item.unit}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between border-t border-border bg-secondary/30 px-5 py-3">
        <p className="text-xs text-muted-foreground">
          <span className="font-semibold text-card-foreground">{selected.size}</span> items selected
        </p>
        <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow hover:opacity-90 transition-opacity">
          <ShoppingCart className="h-3.5 w-3.5" /> Generate PO
        </button>
      </div>
    </div>
  );
};
