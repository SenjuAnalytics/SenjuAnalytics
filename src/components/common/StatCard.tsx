import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  subValue?: string;
  icon?: LucideIcon;
  trend?: number;
  isLoading?: boolean;
  accentColor?: string;
}

export function StatCard({ title, value, subValue, icon: Icon, trend, isLoading, accentColor = "#14d4e8" }: StatCardProps) {
  if (isLoading) {
    return (
      <Card className="bg-card border-border/50">
        <CardContent className="p-4">
          <Skeleton className="h-4 w-24 mb-3" />
          <Skeleton className="h-7 w-32 mb-1" />
          <Skeleton className="h-3 w-20" />
        </CardContent>
      </Card>
    );
  }

  const trendPositive = trend !== undefined && trend >= 0;

  return (
    <Card className="bg-card border-border/50 hover:border-border transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{title}</p>
          {Icon && (
            <div
              className="flex h-7 w-7 items-center justify-center rounded-md opacity-80"
              style={{ backgroundColor: `${accentColor}20` }}
            >
              <Icon className="h-3.5 w-3.5" style={{ color: accentColor }} />
            </div>
          )}
        </div>
        <p className="text-xl font-bold text-white tabular-nums">{value}</p>
        <div className="mt-1 flex items-center gap-2">
          {trend !== undefined && (
            <span
              className={`text-xs font-medium ${trendPositive ? "text-[#14d4e8]" : "text-red-400"}`}
            >
              {trendPositive ? "▲" : "▼"} {Math.abs(trend).toFixed(2)}%
            </span>
          )}
          {subValue && <span className="text-xs text-muted-foreground">{subValue}</span>}
        </div>
      </CardContent>
    </Card>
  );
}
