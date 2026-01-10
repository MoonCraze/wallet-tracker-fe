import { memo } from "react";
import { format } from "date-fns";
import { ExternalLink, TrendingUp, TrendingDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn, truncateAddress, formatTokenAmount, getSolscanUrl, copyToClipboard } from "@/lib/utils";
import type { TransferEvent } from "@/lib/types/transfer";
import { EmptyState } from "@/components/shared/ErrorDisplay";
import { ArrowLeftRight, Copy, Check } from "lucide-react";
import { useState } from "react";

interface TransfersListProps {
  transfers: TransferEvent[];
  limit?: number;
  showHeader?: boolean;
  maxHeight?: string;
  isLive?: boolean;
  onRowClick?: (transfer: TransferEvent) => void;
}

export function TransfersList({
  transfers,
  limit,
  showHeader = true,
  maxHeight = "400px",
  isLive = false,
  onRowClick,
}: TransfersListProps) {
  const displayTransfers = limit ? transfers.slice(0, limit) : transfers;

  if (displayTransfers.length === 0) {
    return (
      <EmptyState
        icon={ArrowLeftRight}
        title="No transfers yet"
        description={
          isLive
            ? "Waiting for live transfer events..."
            : "No transfer records found"
        }
      />
    );
  }

  return (
    <div className="w-full overflow-auto" style={{ maxHeight }}>
      <Table>
        {showHeader && (
          <TableHeader>
            <TableRow>
              <TableHead className="w-[140px]">Time</TableHead>
              <TableHead>Wallet</TableHead>
              <TableHead>Token</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="w-[80px]">Side</TableHead>
              <TableHead className="w-[100px]">Tx</TableHead>
            </TableRow>
          </TableHeader>
        )}
        <TableBody>
          {displayTransfers.map((transfer, idx) => (
            <TransferRow
              key={transfer.signature || idx}
              transfer={transfer}
              isNew={isLive && idx === 0}
              onClick={() => onRowClick?.(transfer)}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

interface TransferRowProps {
  transfer: TransferEvent;
  isNew?: boolean;
  onClick?: () => void;
}

export const TransferRow = memo(function TransferRow({ transfer, isNew, onClick }: TransferRowProps) {
  const isBuy = transfer.side === "BUY";
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = async (text: string, field: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  return (
    <TableRow
      className={cn(
        "cursor-pointer transition-colors hover:bg-muted/50",
        isNew && (isBuy ? "row-highlight-buy" : "row-highlight-sell"),
        isBuy ? "hover:bg-green-50/50 dark:hover:bg-green-950/30" : "hover:bg-red-50/50 dark:hover:bg-red-950/30"
      )}
      onClick={onClick}
    >
      <TableCell className="text-xs text-muted-foreground">
        {format(new Date(transfer.timestamp), "MMM dd, HH:mm:ss")}
      </TableCell>
      <TableCell>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={(e) => handleCopy(transfer.walletAddress, 'wallet', e)}
              className="font-mono text-xs flex items-center gap-1 hover:text-primary"
            >
              {truncateAddress(transfer.walletAddress, 4, 3)}
              {copiedField === 'wallet' ? (
                <Check className="h-3 w-3 text-green-500" />
              ) : (
                <Copy className="h-3 w-3 opacity-50" />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-md">
            <p className="font-mono text-xs break-all">{transfer.walletAddress}</p>
            <p className="text-xs text-muted-foreground mt-1">Click to copy</p>
          </TooltipContent>
        </Tooltip>
      </TableCell>
      <TableCell>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={(e) => handleCopy(transfer.tokenAddress, 'token', e)}
              className="font-mono text-xs flex items-center gap-1 hover:text-primary"
            >
              {truncateAddress(transfer.tokenAddress, 4, 3)}
              {copiedField === 'token' ? (
                <Check className="h-3 w-3 text-green-500" />
              ) : (
                <Copy className="h-3 w-3 opacity-50" />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-md">
            <p className="font-mono text-xs break-all">{transfer.tokenAddress}</p>
            <p className="text-xs text-muted-foreground mt-1">Click to copy</p>
          </TooltipContent>
        </Tooltip>
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
});

interface TransferCardProps {
  transfer: TransferEvent;
  isNew?: boolean;
}

export const TransferCard = memo(function TransferCard({ transfer, isNew }: TransferCardProps) {
  const isBuy = transfer.side === "BUY";

  return (
    <Card
      className={cn(
        "transition-all",
        isNew && "animate-slide-in-right",
        isBuy ? "border-l-4 border-l-green-500" : "border-l-4 border-l-red-500"
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge
                variant={isBuy ? "default" : "destructive"}
                className={cn(
                  isBuy
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                )}
              >
                {isBuy ? (
                  <TrendingUp className="mr-1 h-3 w-3" />
                ) : (
                  <TrendingDown className="mr-1 h-3 w-3" />
                )}
                {transfer.side}
              </Badge>
              <span className="text-sm font-medium">
                {formatTokenAmount(transfer.amount)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-mono">
                {truncateAddress(transfer.walletAddress)}
              </span>
              <span>→</span>
              <span className="font-mono">
                {truncateAddress(transfer.tokenAddress)}
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">
              {format(new Date(transfer.timestamp), "HH:mm:ss")}
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2"
              onClick={() =>
                window.open(getSolscanUrl(transfer.signature, "tx"), "_blank")
              }
            >
              <ExternalLink className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
