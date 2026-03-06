import { useState } from "react";
import { Brain, Package, TrendingUp, CheckCircle2, ShoppingCart, Sparkles } from "lucide-react";

interface ReorderItem {
  name: string;
  currentStock: number;
  dailyAvg: number;
  daysLeft: number;
  recommended: number;
  unit: string;
  confidence: number;
  urgency: "high" | "medium" | "low";
}

const reorderData: ReorderItem[] = [
  { name: "Paracetamol 500mg", currentStock: 80, dailyAvg: 18, daysLeft: 4, recommended: 200, unit: "strips", confidence: 94, urgency: "high" },
  { name: "Azithromycin 500mg", currentStock: 45, dailyAvg: 8, daysLeft: 5, recommended: 100, unit: "strips", confidence: 91, urgency: "high" },
  { name: "Metformin 500mg", currentStock: 300, dailyAvg: 12, daysLeft: 25, recommended: 150, unit: "strips", confidence: 88, urgency: "low" },
  { name: "Pantoprazole 40mg", currentStock: 92, dailyAvg: 6, daysLeft: 15, recommended: 80, unit: "strips", confidence: 85, urgency: "medium" },
  { name: "Cetirizine 10mg", currentStock: 180, dailyAvg: 10, daysLeft: 18, recommended: 120, unit: "strips", confidence: 87, urgency: "medium" },
  { name: "Amoxicillin 250mg", currentStock: 8, dailyAvg: 5, daysLeft: 1, recommended: 60, unit: "strips", confidence: 96, urgency: "high" },
];

const urgencyStyles = {
  high: "bg-destructive/10 text-destructive border-destructive/20",
  medium: "bg-warning/10 text-warning border-warning/20",
  low: "bg-success/10 text-success border-success/20",
};

export const AIReorderPanel = () => {
  const [selected, setSelected] = useState<Set<string>>(new Set(reorderData.filter(i => i.urgency === "high").map(i => i.name)));

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
    <div className="rounded-xl border border-primary/20 bg-card overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-primary/10 p-3">
            <Brain className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-card-foreground">AI Inventory Intelligence</h3>
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                <Sparkles className="h-3 w-3" /> Smart
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Based on last 30 days sales velocity, here's what you should reorder
            </p>
          </div>
          <button
            onClick={selectAll}
            className="rounded-lg border border-border bg-secondary px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent transition-colors"
          >
            Select All
          </button>
        </div>
      </div>

      {/* Items */}
      <div className="divide-y divide-border">
        {reorderData.map((item) => (
          <div
            key={item.name}
            onClick={() => toggleItem(item.name)}
            className={`flex items-center gap-4 px-6 py-4 cursor-pointer transition-all hover:bg-accent/30 ${selected.has(item.name) ? "bg-accent/20" : ""}`}
          >
            {/* Checkbox */}
            <div className={`h-5 w-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${selected.has(item.name) ? "bg-primary border-primary" : "border-border"}`}>
              {selected.has(item.name) && <CheckCircle2 className="h-3.5 w-3.5 text-primary-foreground" />}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-card-foreground">{item.name}</p>
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${urgencyStyles[item.urgency]}`}>
                  {item.urgency === "high" ? "Urgent" : item.urgency === "medium" ? "Soon" : "Planned"}
                </span>
              </div>
              <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Package className="h-3 w-3" /> Stock: {item.currentStock}
                </span>
                <span className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" /> {item.dailyAvg}/day
                </span>
                <span className={item.daysLeft <= 5 ? "text-destructive font-semibold" : ""}>
                  ≈ {item.daysLeft} days left
                </span>
              </div>
            </div>

            {/* Recommendation */}
            <div className="text-right flex-shrink-0">
              <p className="text-base font-bold text-primary">{item.recommended} {item.unit}</p>
              <p className="text-[10px] text-muted-foreground">{item.confidence}% confidence</p>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-border bg-secondary/30 px-6 py-4">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-card-foreground">{selected.size}</span> items selected for reorder
        </p>
        <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-md hover:opacity-90 transition-opacity">
          <ShoppingCart className="h-4 w-4" /> Generate Purchase Order
        </button>
      </div>
    </div>
  );
};
