"use client";

import { memo } from "react";
import {
  ArrowUpRight,
  ArrowDownRight,
  Users,
  Activity,
  Database,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatCompactNumber } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: number | string;
  description?: string;
  icon?: React.ElementType;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  loading?: boolean;
  variant?: "default" | "success" | "warning" | "danger";
}

export const StatsCard = memo(function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  loading = false,
  variant = "default",
}: StatsCardProps) {
  const variantStyles = {
    default: "text-foreground",
    success: "text-green-600",
    warning: "text-yellow-600",
    danger: "text-red-600",
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-4" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-32 mb-1" />
          <Skeleton className="h-3 w-20" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-hover">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {Icon && (
          <Icon className={cn("h-4 w-4", variantStyles[variant])} />
        )}
      </CardHeader>
      <CardContent>
        <div className={cn("text-2xl font-bold", variantStyles[variant])}>
          {typeof value === "number" ? formatCompactNumber(value) : value}
        </div>
        <div className="flex items-center gap-2 mt-1">
          {trend && (
            <span
              className={cn(
                "flex items-center text-xs font-medium",
                trend.isPositive ? "text-green-600" : "text-red-600"
              )}
            >
              {trend.isPositive ? (
                <ArrowUpRight className="h-3 w-3 mr-0.5" />
              ) : (
                <ArrowDownRight className="h-3 w-3 mr-0.5" />
              )}
              {Math.abs(trend.value)}%
            </span>
          )}
          {description && (
            <span className="text-xs text-muted-foreground">{description}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

interface StatsCardsProps {
  stats: {
    transferCount: number;
    coordinatedCount: number;
  };
  liveTransfers?: number;
  liveCoordinated?: number;
  loading?: boolean;
}

export function StatsCards({
  stats,
  liveTransfers = 0,
  liveCoordinated = 0,
  loading = false,
}: StatsCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatsCard
        title="Total Transfers"
        value={stats.transferCount}
        description="All time"
        icon={Database}
        loading={loading}
      />
      <StatsCard
        title="Coordinated Trades"
        value={stats.coordinatedCount}
        description="Detected patterns"
        icon={Users}
        variant="warning"
        loading={loading}
      />
      <StatsCard
        title="Live Transfers"
        value={liveTransfers}
        description="In session"
        icon={Activity}
        variant="success"
        loading={loading}
      />
      <StatsCard
        title="Live Alerts"
        value={liveCoordinated}
        description="In session"
        icon={TrendingUp}
        variant="danger"
        loading={loading}
      />
    </div>
  );
}

export default StatsCards;
