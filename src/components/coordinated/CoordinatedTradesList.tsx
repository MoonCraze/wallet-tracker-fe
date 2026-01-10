"use client";

import { memo, useState, useMemo } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { ExternalLink, Users, Clock, ChevronDown, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn, truncateAddress, getSolscanUrl, copyToClipboard } from "@/lib/utils";
import type { CoordinatedTrade } from "@/lib/types/coordinated";
import {
  parseWalletAddresses,
} from "@/lib/types/coordinated";
import { EmptyState } from "@/components/shared/ErrorDisplay";

interface CoordinatedTradesListProps {
  trades: CoordinatedTrade[];
  limit?: number;
  maxHeight?: string;
  isLive?: boolean;
}

export function CoordinatedTradesList({
  trades,
  limit,
  maxHeight = "500px",
  isLive = false,
}: CoordinatedTradesListProps) {
  const displayTrades = limit ? trades.slice(0, limit) : trades;

  if (displayTrades.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No coordinated trades"
        description={
          isLive
            ? "Waiting for coordinated trade alerts..."
            : "No coordinated trades detected"
        }
      />
    );
  }

  return (
    <div className="overflow-auto pr-4" style={{ maxHeight }}>
      <div className="space-y-3">
        {displayTrades.map((trade, idx) => (
          <CoordinatedTradeCard
            key={trade.id || idx}
            trade={trade}
            isNew={isLive && idx === 0}
          />
        ))}
      </div>
    </div>
  );
}

interface CoordinatedTradeCardProps {
  trade: CoordinatedTrade;
  isNew?: boolean;
}

export const CoordinatedTradeCard = memo(function CoordinatedTradeCard({ trade, isNew }: CoordinatedTradeCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Memoize expensive computations
  const wallets = useMemo(() => parseWalletAddresses(trade), [trade]);

  return (
    <Card
      className={cn(
        "overflow-hidden transition-all border-2",
        isNew && "card-highlight-new animate-slide-in-right"
      )}
    >
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer pb-3 hover:bg-muted/50 transition-colors">
            <div className="flex items-start gap-3">

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <CardTitle className="text-sm font-mono break-all">
                    {trade.tokenAddress}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(
                        getSolscanUrl(trade.tokenAddress, "token"),
                        "_blank"
                      );
                    }}
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    <span className="font-semibold text-foreground">
                      {trade.uniqueWalletCount}
                    </span>
                    wallets
                  </span>

                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(new Date(trade.triggeredAt), {
                      addSuffix: true,
                    })}
                  </span>

                  <Badge variant="outline" className="text-xs">
                    {format(new Date(trade.windowStart), "HH:mm")} -{" "}
                    {format(new Date(trade.windowEnd), "HH:mm")}
                  </Badge>
                </div>
              </div>

              <ChevronDown
                className={cn(
                  "h-4 w-4 text-muted-foreground transition-transform",
                  isExpanded && "rotate-180"
                )}
              />
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="rounded-lg bg-muted/50 p-4">
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Participating Wallets ({wallets.length})
              </h4>
              <div className="flex flex-col gap-2">
                {wallets.map((wallet, i) => (
                  <WalletButton key={i} wallet={wallet} />
                ))}
              </div>
            </div>

            {/* Additional details */}
            <div className="mt-3 grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-muted-foreground">Window Start:</span>
                <p className="font-medium">
                  {format(new Date(trade.windowStart), "MMM dd, HH:mm:ss")}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Window End:</span>
                <p className="font-medium">
                  {format(new Date(trade.windowEnd), "MMM dd, HH:mm:ss")}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Triggered At:</span>
                <p className="font-medium">
                  {format(new Date(trade.triggeredAt), "MMM dd, HH:mm:ss")}
                </p>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
});

interface WalletsListProps {
  wallets: string[];
  maxDisplay?: number;
}

export function WalletsList({ wallets, maxDisplay = 8 }: WalletsListProps) {
  const [showAll, setShowAll] = useState(false);
  const displayWallets = showAll ? wallets : wallets.slice(0, maxDisplay);
  const hasMore = wallets.length > maxDisplay;

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-2">
        {displayWallets.map((wallet, i) => (
          <Badge
            key={i}
            variant="secondary"
            className="cursor-pointer font-mono text-xs hover:bg-secondary/80 break-all whitespace-normal text-left py-2"
            onClick={() =>
              window.open(getSolscanUrl(wallet, "account"), "_blank")
            }
          >
            {wallet}
          </Badge>
        ))}
      </div>
      {hasMore && (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-xs"
          onClick={() => setShowAll(!showAll)}
        >
          {showAll ? "Show less" : `+${wallets.length - maxDisplay} more`}
        </Button>
      )}
    </div>
  );
}

function WalletButton({ wallet }: { wallet: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const success = await copyToClipboard(wallet);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-auto py-2 justify-start font-mono text-xs gap-1 w-full"
      onClick={handleCopy}
    >
      <span className="break-all text-left flex-1">{wallet}</span>
      {copied ? (
        <Check className="h-3 w-3 text-green-500 shrink-0" />
      ) : (
        <Copy className="h-3 w-3 opacity-50 shrink-0" />
      )}
      <ExternalLink
        className="h-3 w-3 shrink-0"
        onClick={(e) => {
          e.stopPropagation();
          window.open(getSolscanUrl(wallet, "account"), "_blank");
        }}
      />
    </Button>
  );
}
