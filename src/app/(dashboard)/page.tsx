"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { RefreshCw, Pause, Play } from "lucide-react";
import { toast } from "sonner";

import { Header } from "@/components/dashboard/Header";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { TransfersList } from "@/components/transfers/TransfersList";
import { CoordinatedTradesList } from "@/components/coordinated/CoordinatedTradesList";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ConnectionStatus } from "@/components/shared/ConnectionStatus";

import { useSSE } from "@/lib/hooks/useSSE";
import { useStats } from "@/lib/hooks/useTransfers";
import type { TransferEvent } from "@/lib/types/transfer";
import type { CoordinatedTrade } from "@/lib/types/coordinated";
import { getTradeTimestamp, getWalletCount } from "@/lib/types/coordinated";

const MAX_LIVE_TRANSFERS = 50;
const MAX_LIVE_COORDINATED = 20;

export default function DashboardPage() {
  const { data: session } = useSession();
  const { stats, loading: statsLoading, fetchStats, setStats } = useStats();

  const [recentTransfers, setRecentTransfers] = useState<TransferEvent[]>([]);
  const [recentCoordinated, setRecentCoordinated] = useState<CoordinatedTrade[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  
  // Track seen coordinated trades to prevent duplicates
  const seenCoordinatedRef = useRef<Set<string>>(new Set());

  // Load stats on mount if authenticated
  useEffect(() => {
    if (session?.accessToken) {
      fetchStats().catch((err) => {
        console.error("Failed to fetch stats:", err);
      });
    }
  }, [session, fetchStats]);

  // SSE callbacks - memoized to prevent unnecessary re-renders
  const handleTransfer = useCallback(
    (data: TransferEvent) => {
      if (isPaused) return;
      setRecentTransfers((prev) => [data, ...prev.slice(0, MAX_LIVE_TRANSFERS - 1)]);
      setStats((s) => ({ ...s, transferCount: s.transferCount + 1 }));
    },
    [isPaused, setStats]
  );

  const handleCoordinated = useCallback(
    (data: CoordinatedTrade) => {
      if (isPaused) return;
      
      // Create a unique key for this coordinated trade
      const tradeKey = `${data.tokenAddress}-${getTradeTimestamp(data)}`;
      
      // Check for duplicate using ref (synchronous, no delay)
      if (seenCoordinatedRef.current.has(tradeKey)) {
        return; // Silently ignore duplicates
      }
      
      // Mark as seen immediately
      seenCoordinatedRef.current.add(tradeKey);
      
      // Cleanup old entries to prevent memory leak (keep last 100)
      if (seenCoordinatedRef.current.size > 100) {
        const entries = Array.from(seenCoordinatedRef.current);
        seenCoordinatedRef.current = new Set(entries.slice(-50));
      }
      
      // Show toast immediately (before state update)
      toast.warning(`Coordinated Trade Detected`, {
        description: `${getWalletCount(data)} wallets trading ${data.tokenAddress.slice(0, 8)}...`,
        duration: 5000,
      });
      
      // Update stats immediately
      setStats((s) => ({ ...s, coordinatedCount: s.coordinatedCount + 1 }));
      
      // Add to list (React will batch this efficiently)
      setRecentCoordinated((prev) => [data, ...prev.slice(0, MAX_LIVE_COORDINATED - 1)]);
    },
    [isPaused, setStats]
  );

  const handleSSEError = useCallback(() => {
    toast.error("Connection lost", {
      description: "Attempting to reconnect...",
    });
  }, []);

  // Connect to SSE stream (public - no auth needed)
  const { connected, reconnect } = useSSE({
    onTransfer: handleTransfer,
    onCoordinated: handleCoordinated,
    onError: handleSSEError,
  });

  const handleClearLive = () => {
    setRecentTransfers([]);
    setRecentCoordinated([]);
    toast.success("Live feed cleared");
  };

  return (
    <div className="flex flex-col">
      <Header
        title="Dashboard"
        description="Real-time wallet monitoring"
        connected={connected}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPaused(!isPaused)}
            >
              {isPaused ? (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Resume
                </>
              ) : (
                <>
                  <Pause className="mr-2 h-4 w-4" />
                  Pause
                </>
              )}
            </Button>
            {!connected && (
              <Button variant="outline" size="sm" onClick={reconnect}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Reconnect
              </Button>
            )}
          </div>
        }
      />

      <div className="flex-1 space-y-6 p-4 md:p-6">
        {/* Auth notice for stats */}
        {!session && (
          <Alert variant="info" className="bg-blue-50 border-blue-200">
            <AlertDescription className="text-blue-800">
              <strong>Tip:</strong> Sign in to view database statistics and access 
              protected features like transfers history, analytics, and configuration.
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <StatsCards
          stats={stats}
          liveTransfers={recentTransfers.length}
          liveCoordinated={recentCoordinated.length}
          loading={session ? statsLoading : false}
        />

        {/* Live Feeds */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Live Transfers */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-lg">Live Transfers</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Real-time transfer activity
                </p>
              </div>
              <div className="flex items-center gap-2">
                <ConnectionStatus connected={connected} size="sm" />
                <span className="text-sm font-medium text-muted-foreground">
                  ({recentTransfers.length})
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <TransfersList
                transfers={recentTransfers}
                limit={20}
                maxHeight="350px"
                isLive
              />
            </CardContent>
          </Card>

          {/* Coordinated Trades Alerts */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-lg">Coordinated Trades</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Detected pattern alerts
                </p>
              </div>
              <div className="flex items-center gap-2">
                <ConnectionStatus connected={connected} size="sm" />
                <span className="text-sm font-medium text-muted-foreground">
                  ({recentCoordinated.length})
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <CoordinatedTradesList
                trades={recentCoordinated}
                limit={10}
                maxHeight="350px"
                isLive
              />
            </CardContent>
          </Card>
        </div>

        {/* Clear button */}
        {(recentTransfers.length > 0 || recentCoordinated.length > 0) && (
          <div className="flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearLive}
              className="text-muted-foreground"
            >
              Clear live feed
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
