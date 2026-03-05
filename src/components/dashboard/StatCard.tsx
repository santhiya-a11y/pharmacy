import { ReactNode } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  trend: number;
  trendLabel: string;
  icon: ReactNode;
}

export const StatCard = ({ title, value, trend, trendLabel, icon }: StatCardProps) => {
  const isUp = trend >= 0;
  return (
    <div className="relative rounded-xl border border-border bg-card p-5 overflow-hidden animate-fade-in">
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className="mt-2 text-2xl font-bold text-card-foreground">{value}</p>
      <div className="mt-2 flex items-center gap-1.5 text-xs">
        {isUp ? (
          <TrendingUp className="h-3.5 w-3.5 trend-up" />
        ) : (
          <TrendingDown className="h-3.5 w-3.5 trend-down" />
        )}
        <span className={isUp ? "trend-up font-semibold" : "trend-down font-semibold"}>
          {isUp ? "+" : ""}{trend}%
        </span>
        <span className="text-muted-foreground">{trendLabel}</span>
      </div>
      <div className="stat-card-sparkline">{icon}</div>
    </div>
  );
};
