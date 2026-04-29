import { AlertTriangle, TrendingUp, Clock, Package, ArrowRight, Loader2 } from "lucide-react";
import { useDashboardSummary } from "@/hooks/api/useApi";

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
  const { data: summary, isLoading } = useDashboardSummary();
  
  const insights = (summary?.alerts as any[]) || [];

  const getIcon = (type: string) => {
    switch (type) {
      case "trending": return TrendingUp;
      case "clock": return Clock;
      case "package": return Package;
      default: return AlertTriangle;
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5 animate-fade-in min-h-[200px] flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="h-5 w-5 text-destructive" />
        <h3 className="text-base font-bold text-card-foreground">Critical Alerts</h3>
        {!isLoading && insights.length > 0 && (
          <span className="ml-auto rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-bold text-destructive">
            {insights.length} active
          </span>
        )}
      </div>
      
      <div className="space-y-2.5 flex-1">
        {isLoading ? (
          <div className="h-full flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : insights.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center text-muted-foreground italic gap-2">
            <div className="rounded-full bg-success/10 p-2">
              <Package className="h-5 w-5 text-success" />
            </div>
            <p className="text-sm">No critical alerts today.</p>
          </div>
        ) : (
          insights.map((item: any, i: number) => {
            const Icon = getIcon(item.type);
            const s = (severityMap as any)[item.severity || "warning"];
            return (
              <div key={i} className={`flex items-start gap-3 rounded-lg border p-3 ${s.border} ${s.bg}`}>
                <div className={`rounded-md p-1.5 flex-shrink-0 ${s.iconBg}`}>
                  <Icon className={`h-4 w-4 ${s.iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-card-foreground leading-relaxed">{item.text}</p>
                  <button className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                    {item.action || "View more"} <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

