"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { RefreshCw, Download } from "lucide-react";
import { toast } from "sonner";

import { Header } from "@/components/dashboard/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageLoader } from "@/components/shared/LoadingSpinner";
import { CoordinatedTradesList } from "@/components/coordinated/CoordinatedTradesList";

import { useCoordinatedTrades } from "@/lib/hooks/useTransfers";
import { exportToJson } from "@/lib/api/transfers";
import { cn } from "@/lib/utils";

export default function CoordinatedPage() {
  const { data: session, status } = useSession();
  const { trades, loading, fetchTrades } = useCoordinatedTrades();

  const [limit, setLimit] = useState("50");

  // Fetch coordinated trades on mount
  useEffect(() => {
    if (session?.accessToken) {
      fetchTrades(parseInt(limit)).catch((err) => {
        toast.error("Failed to load coordinated trades", {
          description: err.message,
        });
      });
    }
  }, [session, limit, fetchTrades]);

  const handleRefresh = () => {
    fetchTrades(parseInt(limit))
      .then(() => toast.success("Coordinated trades refreshed"))
      .catch((err) => toast.error("Failed to refresh", { description: err.message }));
  };

  const handleExport = () => {
    exportToJson(trades, `coordinated-trades-${Date.now()}`);
    toast.success("JSON exported successfully");
  };

  if (status === "loading" || (session && loading && trades.length === 0)) {
    return <PageLoader text="Loading coordinated trades..." />;
  }

  return (
    <div className="flex flex-col">
      <Header
        title="Coordinated Trades History"
        description="View detected coordinated trading patterns from the database"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={loading}
            >
              <RefreshCw
                className={cn("mr-2 h-4 w-4", loading && "animate-spin")}
              />
              Refresh
            </Button>
          </div>
        }
      />

      <div className="flex-1 space-y-4 p-4 md:p-6">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-lg">
                Database Records
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({trades.length} trades)
                </span>
              </CardTitle>

              <div className="flex items-center gap-2">
                {/* Limit */}
                <Select value={limit} onValueChange={setLimit}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="25">25 records</SelectItem>
                    <SelectItem value="50">50 records</SelectItem>
                    <SelectItem value="100">100 records</SelectItem>
                  </SelectContent>
                </Select>

                {/* Export */}
                <Button variant="outline" size="sm" onClick={handleExport}>
                  <Download className="mr-2 h-4 w-4" />
                  Export JSON
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <CoordinatedTradesList trades={trades} maxHeight="700px" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
