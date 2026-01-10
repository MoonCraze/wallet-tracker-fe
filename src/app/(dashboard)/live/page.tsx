"use client";

import { useState, useRef, useEffect } from "react";
import { format } from "date-fns";
import {
  Play,
  Pause,
  Trash2,
  Filter,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  ArrowDownCircle,
  Users,
  Activity,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

import { Header } from "@/components/dashboard/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { ConnectionStatus } from "@/components/shared/ConnectionStatus";
import { AddressDisplay } from "@/components/shared/AddressDisplay";

import {
  useSSE,
  useTransferStream,
  useCoordinatedStream,
} from "@/lib/hooks/useSSE";
import { cn, formatCurrency, formatTimeAgo, getSolscanUrl } from "@/lib/utils";
import type { TransferEvent } from "@/lib/types/transfer";
import type { CoordinatedTrade } from "@/lib/types/coordinated";
import { parseWalletAddresses } from "@/lib/types/coordinated";

type StreamType = "all" | "transfers" | "coordinated";
type FeedItem =
  | { type: "transfer"; data: TransferEvent }
  | { type: "coordinated"; data: CoordinatedTrade };

const MAX_FEED_ITEMS = 500;

export default function LiveFeedPage() {
  const [streamType, setStreamType] = useState<StreamType>("all");
  const [isPaused, setIsPaused] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [filterSide, setFilterSide] = useState<"ALL" | "BUY" | "SELL">("ALL");
  const [selectedItem, setSelectedItem] = useState<FeedItem | null>(null);

  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // All stream - only connect when streamType is "all"
  const allStream = useSSE(
    {
      onTransfer: (event: TransferEvent) => {
        if (!isPaused) {
          addFeedItem({ type: "transfer", data: event });
        }
      },
      onCoordinated: (event: CoordinatedTrade) => {
        if (!isPaused) {
          addFeedItem({ type: "coordinated", data: event });
        }
      },
    },
    { autoReconnect: true, enabled: streamType === "all" }
  );

  // Transfers stream - only connect when streamType is "transfers"
  const transfersStream = useTransferStream(
    (event: TransferEvent) => {
      if (!isPaused) {
        addFeedItem({ type: "transfer", data: event });
      }
    },
    { autoReconnect: true, enabled: streamType === "transfers" }
  );

  // Coordinated stream - only connect when streamType is "coordinated"
  const coordinatedStream = useCoordinatedStream(
    (event: CoordinatedTrade) => {
      if (!isPaused) {
        addFeedItem({ type: "coordinated", data: event });
      }
    },
    { autoReconnect: true, enabled: streamType === "coordinated" }
  );

  const addFeedItem = (item: FeedItem) => {
    setFeedItems((prev) => {
      // Check for duplicate coordinated trades
      if (item.type === "coordinated") {
        const tradeKey = `${item.data.tokenAddress}-${item.data.triggeredAt}`;
        const isDuplicate = prev.some(
          (i) => i.type === "coordinated" && 
            `${i.data.tokenAddress}-${(i.data as CoordinatedTrade).triggeredAt}` === tradeKey
        );
        if (isDuplicate) {
          console.log("[LiveFeed] Duplicate coordinated trade ignored:", tradeKey);
          return prev;
        }
      }
      
      // Check for duplicate transfers based on signature
      if (item.type === "transfer" && item.data.signature) {
        const isDuplicate = prev.some(
          (i) => i.type === "transfer" && 
            (i.data as TransferEvent).signature === item.data.signature
        );
        if (isDuplicate) {
          return prev;
        }
      }

      const newItems = [item, ...prev];
      return newItems.slice(0, MAX_FEED_ITEMS);
    });

    // Play sound outside of setState (will play even for duplicates, but that's minor)
    if (soundEnabled) {
      playNotificationSound(item.type);
    }
  };

  const playNotificationSound = (type: "transfer" | "coordinated") => {
    // Simple beep using Web Audio API
    try {
      const audioContext = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = type === "coordinated" ? 880 : 440;
      oscillator.type = "sine";
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 0.1
      );

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch {
      // Audio not supported
    }
  };

  // Auto-scroll effect
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [feedItems, autoScroll]);

  // Fullscreen handling
  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch {
      toast.error("Fullscreen not supported");
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const clearFeed = () => {
    setFeedItems([]);
    toast.success("Feed cleared");
  };

  // Get connection status
  const getConnectionStatus = () => {
    if (streamType === "all") return allStream.status;
    if (streamType === "transfers") return transfersStream.status;
    return coordinatedStream.status;
  };

  // Filter items
  const filteredItems = feedItems.filter((item) => {
    if (filterSide === "ALL") return true;
    if (item.type === "transfer") {
      return item.data.side === filterSide;
    }
    return true; // Coordinated trades are always shown
  });

  const stats = {
    transfers: feedItems.filter((i) => i.type === "transfer").length,
    coordinated: feedItems.filter((i) => i.type === "coordinated").length,
    buys: feedItems.filter(
      (i) => i.type === "transfer" && i.data.side === "BUY"
    ).length,
    sells: feedItems.filter(
      (i) => i.type === "transfer" && i.data.side === "SELL"
    ).length,
  };

  return (
    <div
      ref={containerRef}
      className={cn("flex flex-col h-full", isFullscreen && "bg-background")}
    >
      <Header
        title="Live Feed"
        description="Real-time stream of all transfers and coordinated trades"
        actions={
          <div className="flex items-center gap-2">
            <ConnectionStatus status={getConnectionStatus()} />
          </div>
        }
      />

      <div className="flex-1 flex flex-col p-4 md:p-6 space-y-4 overflow-hidden">
        {/* Control Bar */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              {/* Stream Type */}
              <div className="flex items-center gap-2">
                <Label className="shrink-0">Stream:</Label>
                <Select
                  value={streamType}
                  onValueChange={(v) => setStreamType(v as StreamType)}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Events</SelectItem>
                    <SelectItem value="transfers">Transfers Only</SelectItem>
                    <SelectItem value="coordinated">Coordinated Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Filter */}
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select
                  value={filterSide}
                  onValueChange={(v) => setFilterSide(v as "ALL" | "BUY" | "SELL")}
                >
                  <SelectTrigger className="w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All</SelectItem>
                    <SelectItem value="BUY">Buys</SelectItem>
                    <SelectItem value="SELL">Sells</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator orientation="vertical" className="h-8" />

              {/* Play/Pause */}
              <Button
                variant={isPaused ? "default" : "outline"}
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

              {/* Clear */}
              <Button
                variant="outline"
                size="sm"
                onClick={clearFeed}
                disabled={feedItems.length === 0}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Clear
              </Button>

              <div className="flex-1" />

              {/* Auto-scroll */}
              <div className="flex items-center gap-2">
                <Switch
                  id="auto-scroll"
                  checked={autoScroll}
                  onCheckedChange={setAutoScroll}
                />
                <Label htmlFor="auto-scroll" className="text-sm cursor-pointer">
                  <ArrowDownCircle className="h-4 w-4 inline mr-1" />
                  Auto-scroll
                </Label>
              </div>

              {/* Sound */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSoundEnabled(!soundEnabled)}
              >
                {soundEnabled ? (
                  <Volume2 className="h-4 w-4" />
                ) : (
                  <VolumeX className="h-4 w-4" />
                )}
              </Button>

              {/* Fullscreen */}
              <Button variant="ghost" size="sm" onClick={toggleFullscreen}>
                {isFullscreen ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats Bar */}
        <div className="grid grid-cols-4 gap-4">
          <MiniStat
            label="Transfers"
            value={stats.transfers}
            icon={Activity}
            color="text-blue-500"
          />
          <MiniStat
            label="Coordinated"
            value={stats.coordinated}
            icon={Users}
            color="text-yellow-500"
          />
          <MiniStat label="Buys" value={stats.buys} color="text-green-500" />
          <MiniStat label="Sells" value={stats.sells} color="text-red-500" />
        </div>

        {/* Feed Container */}
        <Card className="flex-1 overflow-hidden">
          <ScrollArea ref={scrollRef} className="h-full max-h-[calc(100vh-380px)]">
            <div className="p-4 space-y-2">
              {filteredItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Activity className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-lg font-medium text-muted-foreground">
                    Waiting for events...
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {isPaused
                      ? "Stream is paused. Click Resume to continue."
                      : "Events will appear here in real-time."}
                  </p>
                </div>
              ) : (
                filteredItems.map((item, index) => (
                  <FeedItemRow 
                    key={`${item.type}-${index}`} 
                    item={item} 
                    onClick={() => setSelectedItem(item)}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </Card>
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedItem?.type === "transfer" && (
            <TransferDetailDialog data={selectedItem.data} />
          )}
          {selectedItem?.type === "coordinated" && (
            <CoordinatedDetailDialog data={selectedItem.data} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface MiniStatProps {
  label: string;
  value: number;
  icon?: React.ElementType;
  color?: string;
}

function MiniStat({ label, value, icon: Icon, color }: MiniStatProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
      {Icon && <Icon className={cn("h-4 w-4", color)} />}
      <div>
        <p className={cn("text-lg font-semibold", color)}>{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

interface FeedItemRowProps {
  item: FeedItem;
  onClick?: () => void;
}

function FeedItemRow({ item, onClick }: FeedItemRowProps) {
  if (item.type === "transfer") {
    return <TransferFeedItem data={item.data} onClick={onClick} />;
  }
  return <CoordinatedFeedItem data={item.data} onClick={onClick} />;
}

function TransferFeedItem({ data, onClick }: { data: TransferEvent; onClick?: () => void }) {
  const isBuy = data.side === "BUY";

  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center gap-4 rounded-lg border p-3 transition-all cursor-pointer",
        "hover:bg-muted/50",
        isBuy ? "border-l-green-500 border-l-4" : "border-l-red-500 border-l-4"
      )}
    >
      <div
        className={cn(
          "shrink-0 rounded-full px-2 py-1 text-xs font-semibold",
          isBuy
            ? "bg-green-500/10 text-green-500"
            : "bg-red-500/10 text-red-500"
        )}
      >
        {data.side}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Wallet:</span>
          <AddressDisplay address={data.walletAddress} truncate={false} showLink={false} />
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Token:</span>
          <AddressDisplay address={data.tokenAddress} type="token" truncate={false} showLink={false} />
        </div>
      </div>

      <div className="text-right shrink-0">
        <p className="font-medium">{data.amount}</p>
        <p className="text-xs text-muted-foreground">
          {formatTimeAgo(new Date(data.timestamp))}
        </p>
      </div>
    </div>
  );
}

function CoordinatedFeedItem({ data, onClick }: { data: CoordinatedTrade; onClick?: () => void }) {
  // Parse wallet addresses if needed
  const walletCount = data.uniqueWalletCount || 0;
  
  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center gap-4 rounded-lg border p-3 transition-all cursor-pointer",
        "hover:bg-muted/50",
        "border-l-yellow-500 border-l-4 bg-yellow-500/5"
      )}
    >
      <div className="shrink-0 rounded-full bg-yellow-500/10 px-2 py-1 text-xs font-semibold text-yellow-500">
        <Users className="inline h-3 w-3 mr-1" />
        COORDINATED
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Token:</span>
          <AddressDisplay address={data.tokenAddress} type="token" truncate={false} showLink={false} />
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-yellow-600 font-medium">
            {walletCount} wallets
          </span>
          <span className="text-muted-foreground">
            Window: {new Date(data.windowStart).toLocaleTimeString()} - {new Date(data.windowEnd).toLocaleTimeString()}
          </span>
        </div>
      </div>

      <div className="text-right shrink-0">
        <p className="text-xs text-muted-foreground">
          {formatTimeAgo(new Date(data.triggeredAt))}
        </p>
      </div>
    </div>
  );
}

// Detail Dialogs
function TransferDetailDialog({ data }: { data: TransferEvent }) {
  const isBuy = data.side === "BUY";

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Badge
            className={cn(
              isBuy
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            )}
          >
            {data.side}
          </Badge>
          Transfer Details
        </DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <div className="space-y-3">
          <div>
            <Label className="text-muted-foreground text-xs uppercase tracking-wider">Timestamp</Label>
            <p className="font-medium">{format(new Date(data.timestamp), "PPpp")}</p>
          </div>
          
          <Separator />
          
          <div>
            <Label className="text-muted-foreground text-xs uppercase tracking-wider">Wallet Address</Label>
            <div className="mt-1 p-3 bg-muted rounded-lg">
              <code className="text-sm break-all">{data.walletAddress}</code>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => window.open(getSolscanUrl(data.walletAddress, "account"), "_blank")}
            >
              <ExternalLink className="mr-2 h-3 w-3" />
              View on Solscan
            </Button>
          </div>
          
          <Separator />
          
          <div>
            <Label className="text-muted-foreground text-xs uppercase tracking-wider">Token Address</Label>
            <div className="mt-1 p-3 bg-muted rounded-lg">
              <code className="text-sm break-all">{data.tokenAddress}</code>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => window.open(getSolscanUrl(data.tokenAddress, "token"), "_blank")}
            >
              <ExternalLink className="mr-2 h-3 w-3" />
              View on Solscan
            </Button>
          </div>
          
          <Separator />
          
          <div>
            <Label className="text-muted-foreground text-xs uppercase tracking-wider">Amount</Label>
            <p className="text-lg font-semibold">{data.amount}</p>
          </div>
          
          {data.signature && (
            <>
              <Separator />
              <div>
                <Label className="text-muted-foreground text-xs uppercase tracking-wider">Transaction Signature</Label>
                <div className="mt-1 p-3 bg-muted rounded-lg">
                  <code className="text-sm break-all">{data.signature}</code>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => window.open(getSolscanUrl(data.signature, "tx"), "_blank")}
                >
                  <ExternalLink className="mr-2 h-3 w-3" />
                  View Transaction
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

function CoordinatedDetailDialog({ data }: { data: CoordinatedTrade }) {
  const wallets = parseWalletAddresses(data);

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Badge className="bg-yellow-100 text-yellow-700">
            <Users className="mr-1 h-3 w-3" />
            Coordinated
          </Badge>
          Trade Details
        </DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <div className="space-y-3">
          <div>
            <Label className="text-muted-foreground text-xs uppercase tracking-wider">Detected At</Label>
            <p className="font-medium">{format(new Date(data.triggeredAt), "PPpp")}</p>
          </div>
          
          <Separator />
          
          <div>
            <Label className="text-muted-foreground text-xs uppercase tracking-wider">Token Address</Label>
            <div className="mt-1 p-3 bg-muted rounded-lg">
              <code className="text-sm break-all">{data.tokenAddress}</code>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => window.open(getSolscanUrl(data.tokenAddress, "token"), "_blank")}
            >
              <ExternalLink className="mr-2 h-3 w-3" />
              View on Solscan
            </Button>
          </div>
          
          <Separator />
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground text-xs uppercase tracking-wider">Window Start</Label>
              <p className="font-medium">{format(new Date(data.windowStart), "PPpp")}</p>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs uppercase tracking-wider">Window End</Label>
              <p className="font-medium">{format(new Date(data.windowEnd), "PPpp")}</p>
            </div>
          </div>
          
          <Separator />
          
          <div>
            <Label className="text-muted-foreground text-xs uppercase tracking-wider">
              Participating Wallets ({data.uniqueWalletCount})
            </Label>
            <div className="mt-2 space-y-2 max-h-60 overflow-y-auto">
              {wallets.map((wallet, i) => (
                <div key={i} className="p-3 bg-muted rounded-lg flex items-center justify-between gap-2">
                  <code className="text-sm break-all flex-1">{wallet}</code>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="shrink-0"
                    onClick={() => window.open(getSolscanUrl(wallet, "account"), "_blank")}
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
