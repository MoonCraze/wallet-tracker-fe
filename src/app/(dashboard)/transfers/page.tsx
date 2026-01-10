"use client";

import { useState, useEffect, useMemo, useDeferredValue } from "react";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import {
  RefreshCw,
  Search,
  Download,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  Filter,
} from "lucide-react";
import { toast } from "sonner";

import { Header } from "@/components/dashboard/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageLoader } from "@/components/shared/LoadingSpinner";
import { EmptyState } from "@/components/shared/ErrorDisplay";
import { AddressDisplay } from "@/components/shared/AddressDisplay";

import { useTransfers } from "@/lib/hooks/useTransfers";
import { exportToCsv, exportToJson } from "@/lib/api/transfers";
import { cn, truncateAddress, formatTokenAmount, getSolscanUrl } from "@/lib/utils";
import type { TransferEvent } from "@/lib/types/transfer";

export default function TransfersPage() {
  const { data: session, status } = useSession();
  const { transfers, loading, error, fetchTransfers } = useTransfers();

  const [search, setSearch] = useState("");
  const [selectedTransfer, setSelectedTransfer] = useState<TransferEvent | null>(null);
  const deferredSearch = useDeferredValue(search); // Defer search to avoid blocking renders
  const [limit, setLimit] = useState("100");
  const [sideFilter, setSideFilter] = useState<"ALL" | "BUY" | "SELL">("ALL");

  // Fetch transfers on mount
  useEffect(() => {
    if (session?.accessToken) {
      fetchTransfers(parseInt(limit)).catch((err) => {
        toast.error("Failed to load transfers", {
          description: err.message,
        });
      });
    }
  }, [session, limit, fetchTransfers]);

  // Filter transfers based on search and side
  const filteredTransfers = useMemo(() => {
    return transfers.filter((t) => {
      const searchLower = deferredSearch.toLowerCase();
      const matchesSearch =
        !deferredSearch ||
        t.walletAddress.toLowerCase().includes(searchLower) ||
        t.tokenAddress.toLowerCase().includes(searchLower) ||
        t.signature.toLowerCase().includes(searchLower);

      const matchesSide = sideFilter === "ALL" || t.side === sideFilter;

      return matchesSearch && matchesSide;
    });
  }, [transfers, deferredSearch, sideFilter]);

  const handleRefresh = () => {
    fetchTransfers(parseInt(limit))
      .then(() => toast.success("Transfers refreshed"))
      .catch((err) => toast.error("Failed to refresh", { description: err.message }));
  };

  const handleExportCsv = () => {
    exportToCsv(filteredTransfers, `transfers-${Date.now()}`);
    toast.success("CSV exported successfully");
  };

  const handleExportJson = () => {
    exportToJson(filteredTransfers, `transfers-${Date.now()}`);
    toast.success("JSON exported successfully");
  };

  if (status === "loading" || (session && loading && transfers.length === 0)) {
    return <PageLoader text="Loading transfers..." />;
  }

  return (
    <div className="flex flex-col">
      <Header
        title="Transfer History"
        description="View historical transfer records from the database"
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
                  ({filteredTransfers.length} of {transfers.length})
                </span>
              </CardTitle>

              <div className="flex flex-wrap items-center gap-2">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search wallet, token, signature..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-64 pl-8"
                  />
                </div>

                {/* Side filter */}
                <Select
                  value={sideFilter}
                  onValueChange={(v) => setSideFilter(v as "ALL" | "BUY" | "SELL")}
                >
                  <SelectTrigger className="w-28">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All</SelectItem>
                    <SelectItem value="BUY">Buy</SelectItem>
                    <SelectItem value="SELL">Sell</SelectItem>
                  </SelectContent>
                </Select>

                {/* Limit */}
                <Select value={limit} onValueChange={setLimit}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="50">50 records</SelectItem>
                    <SelectItem value="100">100 records</SelectItem>
                    <SelectItem value="250">250 records</SelectItem>
                    <SelectItem value="500">500 records</SelectItem>
                  </SelectContent>
                </Select>

                {/* Export */}
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="sm" onClick={handleExportCsv}>
                    <Download className="mr-2 h-4 w-4" />
                    CSV
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleExportJson}>
                    JSON
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {filteredTransfers.length === 0 ? (
              <EmptyState
                title="No transfers found"
                description={
                  search
                    ? "Try adjusting your search filters"
                    : "No transfer records in the database"
                }
              />
            ) : (
              <div className="h-[600px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[160px]">Timestamp</TableHead>
                      <TableHead>Wallet Address</TableHead>
                      <TableHead>Token Address</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="w-[90px]">Side</TableHead>
                      <TableHead className="w-[130px]">Transaction</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransfers.map((transfer, idx) => (
                      <TransferTableRow
                        key={transfer.id || transfer.signature || idx}
                        transfer={transfer}
                        onClick={() => setSelectedTransfer(transfer)}
                      />
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Transfer Detail Dialog */}
      <Dialog open={!!selectedTransfer} onOpenChange={(open) => !open && setSelectedTransfer(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Transfer Details
              {selectedTransfer && (
                <Badge
                  variant={selectedTransfer.side === "BUY" ? "default" : "destructive"}
                  className={cn(
                    selectedTransfer.side === "BUY"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  )}
                >
                  {selectedTransfer.side}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          {selectedTransfer && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Timestamp</p>
                <p className="font-medium">
                  {format(new Date(selectedTransfer.timestamp), "MMM dd, yyyy HH:mm:ss")}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Amount</p>
                <p className="font-medium text-lg">{formatTokenAmount(selectedTransfer.amount)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Wallet Address</p>
                <AddressDisplay address={selectedTransfer.walletAddress} truncate={false} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Token Address</p>
                <AddressDisplay address={selectedTransfer.tokenAddress} type="token" truncate={false} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Transaction Signature</p>
                <AddressDisplay address={selectedTransfer.signature} type="tx" truncate={false} />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TransferTableRow({ transfer, onClick }: { transfer: TransferEvent; onClick: () => void }) {
  const isBuy = transfer.side === "BUY";

  return (
    <TableRow className="hover:bg-muted/50 cursor-pointer" onClick={onClick}>
      <TableCell className="text-sm text-muted-foreground">
        {format(new Date(transfer.timestamp), "MMM dd, HH:mm:ss")}
      </TableCell>
      <TableCell>
        <AddressDisplay address={transfer.walletAddress} truncate={true} showLink={false} />
      </TableCell>
      <TableCell>
        <AddressDisplay address={transfer.tokenAddress} type="token" truncate={false} showLink={false} />
      </TableCell>
      <TableCell className="text-right font-medium">
        {formatTokenAmount(transfer.amount)}
      </TableCell>
      <TableCell>
        <Badge
          variant={isBuy ? "default" : "destructive"}
          className={cn(
            "flex w-16 items-center justify-center gap-1",
            isBuy
              ? "bg-green-100 text-green-700 hover:bg-green-100"
              : "bg-red-100 text-red-700 hover:bg-red-100"
          )}
        >
          {isBuy ? (
            <TrendingUp className="h-3 w-3" />
          ) : (
            <TrendingDown className="h-3 w-3" />
          )}
          {transfer.side}
        </Badge>
      </TableCell>
      <TableCell>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2"
          onClick={(e) => {
            e.stopPropagation();
            window.open(getSolscanUrl(transfer.signature, "tx"), "_blank");
          }}
        >
          <span className="font-mono text-xs">
            {truncateAddress(transfer.signature, 4, 4)}
          </span>
          <ExternalLink className="ml-1 h-3 w-3" />
        </Button>
      </TableCell>
    </TableRow>
  );
}
