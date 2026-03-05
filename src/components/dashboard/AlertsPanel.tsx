import { AlertTriangle, Package, Clock } from "lucide-react";

const alerts = [
  { type: "expiry", label: "Paracetamol 500mg (Batch B102)", detail: "Expires in 15 days", icon: AlertTriangle, color: "text-warning" },
  { type: "low-stock", label: "Amoxicillin 250mg", detail: "Only 8 units left", icon: Package, color: "text-destructive" },
  { type: "expiry", label: "Cetirizine 10mg (Batch C45)", detail: "Expires in 28 days", icon: Clock, color: "text-warning" },
  { type: "low-stock", label: "Azithromycin 500mg", detail: "Only 3 units left", icon: Package, color: "text-destructive" },
];

export const AlertsPanel = () => {
  return (
    <div className="rounded-xl border border-border bg-card p-6 animate-fade-in">
      <h3 className="text-lg font-semibold text-card-foreground mb-4">Alerts & Notifications</h3>
      <div className="space-y-3">
        {alerts.map((alert, i) => (
          <div key={i} className="flex items-start gap-3 rounded-lg bg-secondary/50 p-3">
            <alert.icon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${alert.color}`} />
            <div>
              <p className="text-sm font-medium text-card-foreground">{alert.label}</p>
              <p className="text-xs text-muted-foreground">{alert.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
