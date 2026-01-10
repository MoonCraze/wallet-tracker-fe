"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { format, subHours, startOfHour } from "date-fns";
import {
  RefreshCw,
  TrendingUp,
  Users,
  Activity,
  Database,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { toast } from "sonner";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
  Area,
  AreaChart,
} from "recharts";

import { Header } from "@/components/dashboard/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PageLoader } from "@/components/shared/LoadingSpinner";

import { useStats, useTransfers } from "@/lib/hooks/useTransfers";
import { cn, formatCompactNumber } from "@/lib/utils";
import type { TransferEvent } from "@/lib/types/transfer";

const CHART_COLORS = {
  buy: "#22c55e",
  sell: "#ef4444",
  primary: "#3b82f6",
  secondary: "#8b5cf6",
};

export default function AnalyticsPage() {
  const { data: session, status } = useSession();
  const { stats, loading: statsLoading, fetchStats } = useStats();
  const { transfers, loading: transfersLoading, fetchTransfers } = useTransfers();

  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch data on mount
  useEffect(() => {
    if (session?.accessToken) {
      fetchStats().catch(console.error);
      fetchTransfers(500).catch(console.error);
    }
  }, [session, fetchStats, fetchTransfers]);

  // Calculate analytics data
  const analyticsData = useMemo(() => {
    const buys = transfers.filter((t) => t.side === "BUY");
    const sells = transfers.filter((t) => t.side === "SELL");

    // Group by hour for timeline
    const hourlyMap = new Map<string, { buys: number; sells: number; total: number }>();
    const now = new Date();

    // Initialize last 24 hours
    for (let i = 23; i >= 0; i--) {
      const hour = startOfHour(subHours(now, i));
      const key = format(hour, "HH:mm");
      hourlyMap.set(key, { buys: 0, sells: 0, total: 0 });
    }

    // Count transfers per hour
    transfers.forEach((t) => {
      const hour = format(startOfHour(new Date(t.timestamp)), "HH:mm");
      if (hourlyMap.has(hour)) {
        const current = hourlyMap.get(hour)!;
        if (t.side === "BUY") current.buys++;
        else current.sells++;
        current.total++;
      }
    });

    const hourlyData = Array.from(hourlyMap.entries()).map(([hour, data]) => ({
      hour,
      ...data,
    }));

    // Top wallets by activity
    const walletActivity = new Map<string, number>();
    transfers.forEach((t) => {
      walletActivity.set(
        t.walletAddress,
        (walletActivity.get(t.walletAddress) || 0) + 1
      );
    });
    const topWallets = Array.from(walletActivity.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([wallet, count]) => ({
        wallet: `${wallet.slice(0, 6)}...${wallet.slice(-4)}`,
        fullWallet: wallet,
        count,
      }));

    // Top tokens by activity
    const tokenActivity = new Map<string, number>();
    transfers.forEach((t) => {
      tokenActivity.set(
        t.tokenAddress,
        (tokenActivity.get(t.tokenAddress) || 0) + 1
      );
    });
    const topTokens = Array.from(tokenActivity.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([token, count]) => ({
        token: `${token.slice(0, 6)}...${token.slice(-4)}`,
        fullToken: token,
        count,
      }));

    return {
      buyCount: buys.length,
      sellCount: sells.length,
      buyRatio: transfers.length > 0 ? (buys.length / transfers.length) * 100 : 0,
      hourlyData,
      topWallets,
      topTokens,
    };
  }, [transfers]);

  const pieData = [
    { name: "BUY", value: analyticsData.buyCount, color: CHART_COLORS.buy },
    { name: "SELL", value: analyticsData.sellCount, color: CHART_COLORS.sell },
  ];

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([fetchStats(), fetchTransfers(500)]);
      toast.success("Analytics refreshed");
    } catch (err) {
      toast.error("Failed to refresh analytics");
    } finally {
      setIsRefreshing(false);
    }
  };

  const loading = statsLoading || transfersLoading;

  if (status === "loading" || (session && loading && transfers.length === 0)) {
    return <PageLoader text="Loading analytics..." />;
  }

  return (
    <div className="flex flex-col">
      <Header
        title="Analytics"
        description="Charts and statistics from transfer data"
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={cn("mr-2 h-4 w-4", isRefreshing && "animate-spin")}
            />
            Refresh
          </Button>
        }
      />

      <div className="flex-1 space-y-6 p-4 md:p-6">
        {/* Summary Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Transfers"
            value={stats.transferCount}
            icon={Database}
            description="All time records"
          />
          <StatsCard
            title="Coordinated Trades"
            value={stats.coordinatedCount}
            icon={Users}
            description="Detected patterns"
            variant="warning"
          />
          <StatsCard
            title="Buy Orders"
            value={analyticsData.buyCount}
            icon={TrendingUp}
            description={`${analyticsData.buyRatio.toFixed(1)}% of total`}
            variant="success"
            trend={{ value: analyticsData.buyRatio, isPositive: true }}
          />
          <StatsCard
            title="Sell Orders"
            value={analyticsData.sellCount}
            icon={Activity}
            description={`${(100 - analyticsData.buyRatio).toFixed(1)}% of total`}
            variant="danger"
            trend={{ value: 100 - analyticsData.buyRatio, isPositive: false }}
          />
        </div>

        {/* Charts Row 1 */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Activity Timeline */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Activity Timeline (Last 24 Hours)</CardTitle>
              <CardDescription>Buy and sell orders per hour</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={analyticsData.hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="hour"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                  />
                  <YAxis tick={{ fontSize: 12 }} tickLine={false} />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="buys"
                    name="Buys"
                    stroke={CHART_COLORS.buy}
                    fill={CHART_COLORS.buy}
                    fillOpacity={0.3}
                  />
                  <Area
                    type="monotone"
                    dataKey="sells"
                    name="Sells"
                    stroke={CHART_COLORS.sell}
                    fill={CHART_COLORS.sell}
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Buy/Sell Ratio Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Buy/Sell Distribution</CardTitle>
              <CardDescription>Overall ratio breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Top Wallets */}
          <Card>
            <CardHeader>
              <CardTitle>Most Active Wallets</CardTitle>
              <CardDescription>Top 5 wallets by transaction count</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analyticsData.topWallets} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis
                    dataKey="wallet"
                    type="category"
                    tick={{ fontSize: 9, fontFamily: "monospace" }}
                    width={100}
                  />
                  <RechartsTooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-card border rounded-lg p-3 shadow-lg">
                            <p className="font-mono text-xs break-all max-w-xs">{data.fullWallet}</p>
                            <p className="text-sm font-medium mt-1">{data.count} transactions</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar
                    dataKey="count"
                    name="Transactions"
                    fill={CHART_COLORS.primary}
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top Tokens */}
          <Card>
            <CardHeader>
              <CardTitle>Most Traded Tokens</CardTitle>
              <CardDescription>Top 5 tokens by transaction count</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analyticsData.topTokens} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis
                    dataKey="token"
                    type="category"
                    tick={{ fontSize: 9, fontFamily: "monospace" }}
                    width={100}
                  />
                  <RechartsTooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-card border rounded-lg p-3 shadow-lg">
                            <p className="font-mono text-xs break-all max-w-xs">{data.fullToken}</p>
                            <p className="text-sm font-medium mt-1">{data.count} transactions</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar
                    dataKey="count"
                    name="Transactions"
                    fill={CHART_COLORS.secondary}
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

interface StatsCardProps {
  title: string;
  value: number;
  icon: React.ElementType;
  description: string;
  variant?: "default" | "success" | "warning" | "danger";
  trend?: { value: number; isPositive: boolean };
}

function StatsCard({
  title,
  value,
  icon: Icon,
  description,
  variant = "default",
  trend,
}: StatsCardProps) {
  const variantColors = {
    default: "text-foreground",
    success: "text-green-600",
    warning: "text-yellow-600",
    danger: "text-red-600",
  };

  return (
    <Card className="card-hover">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className={cn("h-4 w-4", variantColors[variant])} />
      </CardHeader>
      <CardContent>
        <div className={cn("text-2xl font-bold", variantColors[variant])}>
          {formatCompactNumber(value)}
        </div>
        <div className="mt-1 flex items-center gap-2">
          {trend && (
            <span
              className={cn(
                "flex items-center text-xs font-medium",
                trend.isPositive ? "text-green-600" : "text-red-600"
              )}
            >
              {trend.isPositive ? (
                <ArrowUpRight className="h-3 w-3" />
              ) : (
                <ArrowDownRight className="h-3 w-3" />
              )}
            </span>
          )}
          <span className="text-xs text-muted-foreground">{description}</span>
        </div>
      </CardContent>
    </Card>
  );
}
