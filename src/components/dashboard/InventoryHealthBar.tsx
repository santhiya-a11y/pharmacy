import { AlertTriangle, Package, Clock, ShoppingCart } from "lucide-react";

const healthItems = [
  { label: "Low Stock", value: "8", sublabel: "medicines", icon: Package, color: "text-destructive", bg: "bg-destructive/10" },
  { label: "Expiry Risk", value: "₹12,400", sublabel: "in 30 days", icon: Clock, color: "text-warning", bg: "bg-warning/10" },
  { label: "Reorder Needed", value: "12", sublabel: "items today", icon: ShoppingCart, color: "text-primary", bg: "bg-primary/10" },
  { label: "Pending Rx", value: "6", sublabel: "prescriptions", icon: AlertTriangle, color: "text-chart-5", bg: "bg-chart-5/10" },
];

export const InventoryHealthBar = () => {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {healthItems.map((item) => (
        <div
          key={item.label}
          className="group relative flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-all hover:shadow-md hover:border-primary/20 cursor-pointer animate-fade-in"
        >
          <div className={`rounded-lg p-2.5 ${item.bg} flex-shrink-0`}>
            <item.icon className={`h-5 w-5 ${item.color}`} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground">{item.label}</p>
            <p className={`text-xl font-bold ${item.color}`}>{item.value}</p>
            <p className="text-[10px] text-muted-foreground">{item.sublabel}</p>
          </div>
        </div>
      ))}
    </div>
  );
};
