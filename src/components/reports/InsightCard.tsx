import { ReactNode } from "react";
import { Lightbulb, ArrowRight } from "lucide-react";

interface InsightCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  severity: "info" | "warning" | "critical" | "success";
  metric?: string;
  metricLabel?: string;
}

const severityStyles = {
  info: "border-primary/30 bg-primary/5",
  warning: "border-warning/30 bg-warning/5",
  critical: "border-destructive/30 bg-destructive/5",
  success: "border-success/30 bg-success/5",
};

const severityIconBg = {
  info: "bg-primary/10 text-primary",
  warning: "bg-warning/10 text-warning",
  critical: "bg-destructive/10 text-destructive",
  success: "bg-success/10 text-success",
};

export const InsightCard = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  severity,
  metric,
  metricLabel,
}: InsightCardProps) => {
  return (
    <div className={`rounded-xl border p-5 transition-all hover:shadow-md animate-fade-in ${severityStyles[severity]}`}>
      <div className="flex items-start gap-4">
        <div className={`rounded-lg p-2.5 flex-shrink-0 ${severityIconBg[severity]}`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h4 className="text-sm font-semibold text-card-foreground">{title}</h4>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{description}</p>
            </div>
            {metric && (
              <div className="text-right flex-shrink-0">
                <p className="text-lg font-bold text-card-foreground">{metric}</p>
                {metricLabel && <p className="text-[10px] text-muted-foreground">{metricLabel}</p>}
              </div>
            )}
          </div>
          {actionLabel && (
            <button
              onClick={onAction}
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline transition-all"
            >
              {actionLabel} <ArrowRight className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
