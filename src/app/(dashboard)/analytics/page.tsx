"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { format, subHours, startOfHour, startOfDay, differenceInHours } from "date-fns";
import {
  RefreshCw,
  TrendingUp,
  Users,
  Activity,
  Database,
  ArrowUpRight,
  ArrowDownRight,
  Copy,
  Check,
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
  ScatterChart,
  Scatter,
  ZAxis,
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

  // Handle copying addresses to clipboard
  const handleCopyAddress = async (address: string, type: "wallet" | "token") => {
    try {
      await navigator.clipboard.writeText(address);
      toast.success(`${type === "wallet" ? "Wallet" : "Token"} address copied to clipboard`);
    } catch (err) {
      toast.error("Failed to copy address");
    }
  };

  // Fetch data on mount
  useEffect(() => {
    if (session?.accessToken) {
      fetchStats().catch(console.error);
      
      // Fetch transfers from last 24 hours for comprehensive analytics
      const now = new Date();
      const twentyFourHoursAgo = subHours(now, 24);
      fetchTransfers({
        startTime: twentyFourHoursAgo.toISOString(),
        endTime: now.toISOString(),
      }).catch(console.error);
    }
  }, [session, fetchStats, fetchTransfers]);

  // Calculate analytics data
  const analyticsData = useMemo(() => {
    const buys = transfers.filter((t) => t.side === "BUY");
    const sells = transfers.filter((t) => t.side === "SELL");

    // Group by hour for timeline (last 12 hours for main chart)
    const hourlyMap = new Map<number, { timestamp: Date; buys: number; sells: number; total: number }>();
    const now = new Date();
    const twelveHoursAgo = subHours(now, 12);

    // Initialize last 12 hours with proper timestamps
    for (let i = 11; i >= 0; i--) {
      const hourDate = startOfHour(subHours(now, i));
      const key = hourDate.getTime();
      hourlyMap.set(key, { timestamp: hourDate, buys: 0, sells: 0, total: 0 });
    }

    // Filter transfers from last 12 hours only for main timeline
    const recentTransfers = transfers.filter((t) => {
      const transferDate = new Date(t.timestamp);
      return transferDate >= twelveHoursAgo && transferDate <= now;
    });

    // Count transfers per hour
    recentTransfers.forEach((t) => {
      const hourDate = startOfHour(new Date(t.timestamp));
      const key = hourDate.getTime();
      if (hourlyMap.has(key)) {
        const current = hourlyMap.get(key)!;
        if (t.side === "BUY") current.buys++;
        else current.sells++;
        current.total++;
      }
    });

    const hourlyData = Array.from(hourlyMap.values())
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
      .map((data) => ({
        hour: format(data.timestamp, "MMM d HH:mm"),
        buys: data.buys,
        sells: data.sells,
        total: data.total,
      }));

    // Top wallets by activity (all 24h data)
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

    // Top tokens by activity (all 24h data)
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

    // NEW: Top tokens by unique wallets
    const tokenToWallets = new Map<string, Set<string>>();
    transfers.forEach((t) => {
      if (!tokenToWallets.has(t.tokenAddress)) {
        tokenToWallets.set(t.tokenAddress, new Set());
      }
      tokenToWallets.get(t.tokenAddress)!.add(t.walletAddress);
    });
    const topTokensByUniqueWallets = Array.from(tokenToWallets.entries())
      .map(([token, wallets]) => ({
        tokenAddress: token,
        shortAddress: `${token.slice(0, 6)}...${token.slice(-4)}`,
        uniqueWalletCount: wallets.size,
      }))
      .sort((a, b) => b.uniqueWalletCount - a.uniqueWalletCount)
      .slice(0, 8);

    // NEW: Wallet performance metrics
    const walletStats = new Map<string, {
      buyCount: number;
      sellCount: number;
      tokens: Set<string>;
    }>();
    
    transfers.forEach((t) => {
      if (!walletStats.has(t.walletAddress)) {
        walletStats.set(t.walletAddress, {
          buyCount: 0,
          sellCount: 0,
          tokens: new Set(),
        });
      }
      const stats = walletStats.get(t.walletAddress)!;
      if (t.side === "BUY") stats.buyCount++;
      else stats.sellCount++;
      stats.tokens.add(t.tokenAddress);
    });

    const walletPerformance = Array.from(walletStats.entries())
      .map(([wallet, stats]) => ({
        walletAddress: wallet,
        shortAddress: `${wallet.slice(0, 6)}...${wallet.slice(-4)}`,
        totalTransactions: stats.buyCount + stats.sellCount,
        buyCount: stats.buyCount,
        sellCount: stats.sellCount,
        uniqueTokensTraded: stats.tokens.size,
        buyToSellRatio: stats.sellCount > 0 
          ? (stats.buyCount / stats.sellCount).toFixed(2)
          : stats.buyCount.toString(),
      }))
      .sort((a, b) => b.totalTransactions - a.totalTransactions)
      .slice(0, 10);

    // NEW: Transaction distribution over time (hourly for last 12h)
    const transactionDistribution = Array.from(hourlyMap.values())
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
      .map((data) => ({
        timestamp: data.timestamp.toISOString(),
        time: format(data.timestamp, "HH:mm"),
        buy: data.buys,
        sell: data.sells,
        total: data.total,
      }));

    // NEW: Token diversity over time (tokens traded per hour)
    const tokenDiversityMap = new Map<number, Set<string>>();
    for (let i = 11; i >= 0; i--) {
      const hourDate = startOfHour(subHours(now, i));
      const key = hourDate.getTime();
      tokenDiversityMap.set(key, new Set());
    }
    
    recentTransfers.forEach((t) => {
      const hourDate = startOfHour(new Date(t.timestamp));
      const key = hourDate.getTime();
      if (tokenDiversityMap.has(key)) {
        tokenDiversityMap.get(key)!.add(t.tokenAddress);
      }
    });

    const tokenDiversity = Array.from(tokenDiversityMap.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([timestamp, tokens]) => ({
        time: format(new Date(timestamp), "HH:mm"),
        uniqueTokens: tokens.size,
      }));

    return {
      buyCount: buys.length,
      sellCount: sells.length,
      buyRatio: transfers.length > 0 ? (buys.length / transfers.length) * 100 : 0,
      hourlyData,
      topWallets,
      topTokens,
      topTokensByUniqueWallets,
      walletPerformance,
      transactionDistribution,
      tokenDiversity,
    };
  }, [transfers]);

  const pieData = [
    { name: "BUY", value: analyticsData.buyCount, color: CHART_COLORS.buy },
    { name: "SELL", value: analyticsData.sellCount, color: CHART_COLORS.sell },
  ];

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const now = new Date();
      const twentyFourHoursAgo = subHours(now, 24);
      await Promise.all([
        fetchStats(),
        fetchTransfers({
          startTime: twentyFourHoursAgo.toISOString(),
          endTime: now.toISOString(),
        }),
      ]);
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
              <CardTitle>Activity Timeline (Last 12 Hours)</CardTitle>
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
                    wrapperStyle={{ pointerEvents: "auto" }}
                    allowEscapeViewBox={{ x: true, y: true }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-card border rounded-lg p-3 shadow-lg pointer-events-auto">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <p className="font-mono text-xs break-all max-w-xs">{data.fullWallet}</p>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopyAddress(data.fullWallet, "wallet");
                                }}
                                className="p-1 hover:bg-muted rounded transition-colors flex-shrink-0"
                              >
                                <Copy className="h-3 w-3" />
                              </button>
                            </div>
                            <p className="text-sm font-medium">{data.count} transactions</p>
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
                    wrapperStyle={{ pointerEvents: "auto" }}
                    allowEscapeViewBox={{ x: true, y: true }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-card border rounded-lg p-3 shadow-lg pointer-events-auto">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <p className="font-mono text-xs break-all max-w-xs">{data.fullToken}</p>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopyAddress(data.fullToken, "token");
                                }}
                                className="p-1 hover:bg-muted rounded transition-colors flex-shrink-0"
                              >
                                <Copy className="h-3 w-3" />
                              </button>
                            </div>
                            <p className="text-sm font-medium">{data.count} transactions</p>
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

        {/* Charts Row 3 - Token Diversity Over Time */}
        <Card>
          <CardHeader>
            <CardTitle>Token Diversity (Last 12 Hours)</CardTitle>
            <CardDescription>Number of unique tokens traded per hour</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analyticsData.tokenDiversity}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="time"
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
                <Line
                  type="monotone"
                  dataKey="uniqueTokens"
                  name="Unique Tokens"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Charts Row 4 - Transaction Distribution & Top Tokens */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Transaction Distribution Over Time */}
          <Card>
            <CardHeader>
              <CardTitle>Transaction Distribution (Last 12 Hours)</CardTitle>
              <CardDescription>Buy vs Sell volume over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={analyticsData.transactionDistribution}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="time"
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
                    dataKey="buy"
                    name="Buy Orders"
                    stackId="1"
                    stroke={CHART_COLORS.buy}
                    fill={CHART_COLORS.buy}
                    fillOpacity={0.6}
                  />
                  <Area
                    type="monotone"
                    dataKey="sell"
                    name="Sell Orders"
                    stackId="1"
                    stroke={CHART_COLORS.sell}
                    fill={CHART_COLORS.sell}
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top Tokens by Unique Wallets */}
          <Card>
            <CardHeader>
              <CardTitle>Top Tokens by Unique Traders</CardTitle>
              <CardDescription>Tokens with most unique wallet interactions</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analyticsData.topTokensByUniqueWallets} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis
                    dataKey="shortAddress"
                    type="category"
                    tick={{ fontSize: 9, fontFamily: "monospace" }}
                    width={85}
                  />
                  <RechartsTooltip
                    wrapperStyle={{ pointerEvents: "auto" }}
                    allowEscapeViewBox={{ x: true, y: true }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-card border rounded-lg p-3 shadow-lg pointer-events-auto">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <p className="font-mono text-xs break-all max-w-xs">{data.tokenAddress}</p>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopyAddress(data.tokenAddress, "token");
                                }}
                                className="p-1 hover:bg-muted rounded transition-colors flex-shrink-0"
                              >
                                <Copy className="h-3 w-3" />
                              </button>
                            </div>
                            <p className="text-sm font-medium">{data.uniqueWalletCount} unique wallets</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar
                    dataKey="uniqueWalletCount"
                    name="Unique Wallets"
                    fill="#10b981"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 5 - Wallet Performance Scatter */}
        <Card>
          <CardHeader>
            <CardTitle>Wallet Performance Analysis</CardTitle>
            <CardDescription>
              Top wallets by activity - bubble size represents total transactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <ScatterChart
                margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  type="number"
                  dataKey="buyCount"
                  name="Buy Orders"
                  tick={{ fontSize: 12 }}
                  label={{ value: "Buy Orders", position: "insideBottom", offset: -10 }}
                />
                <YAxis
                  type="number"
                  dataKey="sellCount"
                  name="Sell Orders"
                  tick={{ fontSize: 12 }}
                  label={{ value: "Sell Orders", angle: -90, position: "insideLeft" }}
                />
                <ZAxis
                  type="number"
                  dataKey="totalTransactions"
                  range={[50, 400]}
                  name="Total Txns"
                />
                <RechartsTooltip
                  cursor={{ strokeDasharray: "3 3" }}
                  wrapperStyle={{ pointerEvents: "auto" }}
                  allowEscapeViewBox={{ x: true, y: true }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-card border rounded-lg p-3 shadow-lg pointer-events-auto">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <p className="font-mono text-xs break-all max-w-xs">{data.walletAddress}</p>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyAddress(data.walletAddress, "wallet");
                              }}
                              className="p-1 hover:bg-muted rounded transition-colors flex-shrink-0"
                            >
                              <Copy className="h-3 w-3" />
                            </button>
                          </div>
                          <div className="space-y-1 text-sm">
                            <p><span className="text-green-600">Buy:</span> {data.buyCount}</p>
                            <p><span className="text-red-600">Sell:</span> {data.sellCount}</p>
                            <p><span className="font-medium">Total:</span> {data.totalTransactions}</p>
                            <p><span className="font-medium">Tokens:</span> {data.uniqueTokensTraded}</p>
                            <p><span className="font-medium">Ratio:</span> {parseFloat(data.buyToSellRatio).toFixed(2)}</p>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Scatter
                  name="Wallets"
                  data={analyticsData.walletPerformance}
                  fill="#8b5cf6"
                  fillOpacity={0.6}
                />
              </ScatterChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
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
