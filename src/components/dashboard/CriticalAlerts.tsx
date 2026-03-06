import { AlertTriangle, TrendingUp, Clock, Package, ArrowRight } from "lucide-react";

const insights = [
  {
    icon: TrendingUp,
    text: "Paracetamol demand increased 28% this week. Stock will run out in 4 days.",
    action: "Reorder now",
    severity: "destructive" as const,
  },
  {
    icon: Clock,
    text: "₹12,450 worth of inventory expiring within 30 days across 6 medicines.",
    action: "View expiring stock",
    severity: "warning" as const,
  },
  {
    icon: Package,
    text: "Amoxicillin 250mg has only 3 units left — daily average is 5 units/day.",
    action: "Create PO",
    severity: "destructive" as const,
  },
  {
    icon: TrendingUp,
    text: "Metformin demand increased 40% this week. Stock will run out in 3 days. Suggested order: 120 strips.",
    action: "Auto-order",
    severity: "warning" as const,
  },
];

const severityMap = {
  destructive: {
    border: "border-destructive/30",
    bg: "bg-destructive/5",
    iconBg: "bg-destructive/10",
    iconColor: "text-destructive",
  },
  warning: {
    border: "border-warning/30",
    bg: "bg-warning/5",
    iconBg: "bg-warning/10",
    iconColor: "text-warning",
  },
};

export const CriticalAlerts = () => {
  return (
    <div className="rounded-xl border border-border bg-card p-5 animate-fade-in">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="h-5 w-5 text-destructive" />
        <h3 className="text-base font-bold text-card-foreground">Critical Alerts</h3>
        <span className="ml-auto rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-bold text-destructive">
          {insights.length} active
        </span>
      </div>
      <div className="space-y-2.5">
        {insights.map((item, i) => {
          const s = severityMap[item.severity];
          return (
            <div key={i} className={`flex items-start gap-3 rounded-lg border p-3 ${s.border} ${s.bg}`}>
              <div className={`rounded-md p-1.5 flex-shrink-0 ${s.iconBg}`}>
                <item.icon className={`h-4 w-4 ${s.iconColor}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-card-foreground leading-relaxed">{item.text}</p>
                <button className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                  {item.action} <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
