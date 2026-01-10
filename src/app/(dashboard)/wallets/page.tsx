"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import {
  Wallet2,
  Plus,
  Trash2,
  Save,
  RefreshCw,
  Upload,
  Download,
  Copy,
  Check,
  AlertTriangle,
  Info,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Header } from "@/components/dashboard/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import { useWallets } from "@/lib/hooks/useWallets";
import {
  isValidWalletAddress,
  validateWallets,
  parseWalletAddresses,
} from "@/lib/api/wallets";

const MAX_WALLETS = 100;

export default function WalletsPage() {
  const { data: session } = useSession();
  const {
    wallets,
    count,
    loading,
    saving,
    error,
    fetchWallets,
    saveWallets,
    addWallets: addWalletsToList,
    removeWallets: removeWalletsFromList,
  } = useWallets();

  const [localWallets, setLocalWallets] = useState<string[]>([]);
  const [newWallet, setNewWallet] = useState("");
  const [hasChanges, setHasChanges] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [bulkAddText, setBulkAddText] = useState("");
  const [selectedWallets, setSelectedWallets] = useState<Set<string>>(
    new Set()
  );
  const [copiedWallet, setCopiedWallet] = useState<string | null>(null);

  // Memoize computed values
  const isWalletLimitReached = useMemo(
    () => localWallets.length >= MAX_WALLETS,
    [localWallets.length]
  );

  const canAddMoreWallets = useMemo(
    () => localWallets.length < MAX_WALLETS,
    [localWallets.length]
  );

  // Load wallets on mount
  useEffect(() => {
    if (session?.accessToken) {
      fetchWallets().catch(console.error);
    }
  }, [session, fetchWallets]);

  // Sync local state with fetched wallets
  useEffect(() => {
    setLocalWallets([...wallets]);
    setHasChanges(false);
  }, [wallets]);

  // Check for changes
  useEffect(() => {
    const changed =
      JSON.stringify([...localWallets].sort()) !==
      JSON.stringify([...wallets].sort());
    setHasChanges(changed);
  }, [localWallets, wallets]);

  // Add single wallet
  const handleAddWallet = () => {
    const trimmed = newWallet.trim();
    if (!trimmed) {
      toast.error("Please enter a wallet address");
      return;
    }

    if (!isValidWalletAddress(trimmed)) {
      toast.error("Invalid wallet address", {
        description:
          "Wallet address must be a valid Solana address (32-44 characters)",
      });
      return;
    }

    if (localWallets.includes(trimmed)) {
      toast.error("Wallet already in list");
      return;
    }

    if (localWallets.length >= MAX_WALLETS) {
      toast.error(`Maximum ${MAX_WALLETS} wallets allowed`);
      return;
    }

    setLocalWallets([...localWallets, trimmed]);
    setNewWallet("");
    toast.success("Wallet added to list (not saved yet)");
  };

  // Remove wallet
  const handleRemoveWallet = (wallet: string) => {
    setLocalWallets(localWallets.filter((w) => w !== wallet));
    setSelectedWallets((prev) => {
      const next = new Set(prev);
      next.delete(wallet);
      return next;
    });
  };

  // Bulk add wallets
  const handleBulkAdd = useCallback(() => {
    const parsed = parseWalletAddresses(bulkAddText);
    if (parsed.length === 0) {
      toast.error("No valid wallet addresses found");
      return;
    }

    const { valid, invalid } = validateWallets(parsed);

    if (invalid.length > 0) {
      toast.error(`${invalid.length} invalid addresses found`, {
        description: invalid.slice(0, 3).join(", "),
      });
    }

    if (valid.length === 0) {
      return;
    }

    // Remove duplicates
    const newWallets = valid.filter((w) => !localWallets.includes(w));
    const duplicates = valid.length - newWallets.length;

    if (newWallets.length === 0) {
      toast.error("All wallets are already in the list");
      return;
    }

    const totalAfterAdd = localWallets.length + newWallets.length;
    if (totalAfterAdd > MAX_WALLETS) {
      const canAdd = MAX_WALLETS - localWallets.length;
      toast.warning(`Can only add ${canAdd} more wallets (limit: ${MAX_WALLETS})`);
      setLocalWallets([...localWallets, ...newWallets.slice(0, canAdd)]);
    } else {
      setLocalWallets([...localWallets, ...newWallets]);
    }

    setBulkAddText("");
    setShowAddDialog(false);

    toast.success(`Added ${Math.min(newWallets.length, MAX_WALLETS - localWallets.length)} wallets`, {
      description:
        duplicates > 0 ? `${duplicates} duplicates skipped` : undefined,
    });
  }, [bulkAddText, localWallets]);

  // Remove selected wallets
  const handleRemoveSelected = () => {
    if (selectedWallets.size === 0) {
      toast.error("No wallets selected");
      return;
    }

    setLocalWallets(localWallets.filter((w) => !selectedWallets.has(w)));
    setSelectedWallets(new Set());
    toast.success(`Removed ${selectedWallets.size} wallets`);
  };

  // Save changes
  const handleSave = async () => {
    if (localWallets.length === 0) {
      toast.error("Cannot save empty wallet list");
      return;
    }

    try {
      const result = await saveWallets(localWallets);
      
      if (result.warning) {
        toast.warning("Saved with warnings", {
          description: result.warning,
        });
      } else {
        toast.success("Wallet list saved successfully", {
          description: `${result.count} wallets are now being tracked`,
        });
      }
      
      setHasChanges(false);
    } catch (err) {
      toast.error("Failed to save wallets", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    }
  };

  // Reset changes
  const handleReset = () => {
    setLocalWallets([...wallets]);
    setSelectedWallets(new Set());
    setHasChanges(false);
    toast.info("Changes reverted");
  };

  // Copy wallet address
  const handleCopyWallet = async (wallet: string) => {
    await navigator.clipboard.writeText(wallet);
    setCopiedWallet(wallet);
    setTimeout(() => setCopiedWallet(null), 2000);
    toast.success("Address copied");
  };

  // Export wallets
  const handleExport = () => {
    const content = localWallets.join("\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `wallets-${new Date().toISOString().split("T")[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Wallets exported");
  };

  // Import wallets
  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".txt,.csv";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const parsed = parseWalletAddresses(text);
        const { valid, invalid } = validateWallets(parsed);

        if (invalid.length > 0) {
          toast.warning(`${invalid.length} invalid addresses skipped`);
        }

        if (valid.length === 0) {
          toast.error("No valid addresses found in file");
          return;
        }

        // Remove duplicates with existing wallets
        const newWallets = valid.filter((w) => !localWallets.includes(w));

        if (newWallets.length === 0) {
          toast.error("All wallets from file are already in the list");
          return;
        }

        const totalAfterImport = localWallets.length + newWallets.length;
        if (totalAfterImport > MAX_WALLETS) {
          const canAdd = MAX_WALLETS - localWallets.length;
          setLocalWallets([...localWallets, ...newWallets.slice(0, canAdd)]);
          toast.warning(`Imported ${canAdd} wallets (limit reached)`);
        } else {
          setLocalWallets([...localWallets, ...newWallets]);
          toast.success(`Imported ${newWallets.length} wallets`);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  // Toggle wallet selection
  const toggleWalletSelection = (wallet: string) => {
    setSelectedWallets((prev) => {
      const next = new Set(prev);
      if (next.has(wallet)) {
        next.delete(wallet);
      } else {
        next.add(wallet);
      }
      return next;
    });
  };

  // Select all wallets
  const handleSelectAll = () => {
    if (selectedWallets.size === localWallets.length) {
      setSelectedWallets(new Set());
    } else {
      setSelectedWallets(new Set(localWallets));
    }
  };

  // Not authenticated
  if (!session) {
    return (
      <div className="flex flex-col">
        <Header title="Wallet Management" description="Manage tracked wallets" />
        <div className="p-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Authentication Required</AlertTitle>
            <AlertDescription>
              Please sign in to manage tracked wallet addresses.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <Header
        title="Wallet Management"
        description="Manage tracked Solana wallet addresses"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchWallets}
              disabled={loading}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            {hasChanges && (
              <>
                <Button variant="ghost" size="sm" onClick={handleReset}>
                  Reset
                </Button>
                <Button size="sm" onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Changes
                </Button>
              </>
            )}
          </div>
        }
      />

      <div className="flex-1 p-4 md:p-6 space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {hasChanges && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Unsaved Changes</AlertTitle>
            <AlertDescription>
              You have {localWallets.length - wallets.length > 0 ? "added" : "removed"}{" "}
              wallets. Click &quot;Save Changes&quot; to apply them.
            </AlertDescription>
          </Alert>
        )}

        {isWalletLimitReached && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Wallet Limit Reached</AlertTitle>
            <AlertDescription>
              Maximum of {MAX_WALLETS} wallets allowed. Remove some wallets to
              add new ones.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {/* Stats Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet2 className="h-5 w-5" />
                Wallet Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Currently Tracked
                </span>
                <Badge variant="outline" className="text-base">
                  {count}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Local Changes
                </span>
                <Badge variant={hasChanges ? "default" : "outline"}>
                  {localWallets.length}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Maximum Allowed
                </span>
                <Badge variant="outline">{MAX_WALLETS}</Badge>
              </div>
              {selectedWallets.size > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Selected</span>
                  <Badge variant="secondary">{selectedWallets.size}</Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions Card */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Import, export, and manage wallets</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => setShowAddDialog(true)}
                disabled={isWalletLimitReached}
              >
                <Plus className="h-4 w-4 mr-2" />
                Bulk Add Wallets
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleImport}
                disabled={isWalletLimitReached}
              >
                <Upload className="h-4 w-4 mr-2" />
                Import from File
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleExport}
                disabled={localWallets.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Export to File
              </Button>
              {selectedWallets.size > 0 && (
                <Button
                  variant="destructive"
                  className="w-full justify-start"
                  onClick={handleRemoveSelected}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove Selected ({selectedWallets.size})
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Wallet List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Tracked Wallets</CardTitle>
                <CardDescription>
                  {localWallets.length} wallet{localWallets.length !== 1 ? "s" : ""} in list
                </CardDescription>
              </div>
              {localWallets.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                >
                  {selectedWallets.size === localWallets.length
                    ? "Deselect All"
                    : "Select All"}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add new wallet */}
            <div className="flex gap-2">
              <Input
                placeholder="Enter Solana wallet address..."
                value={newWallet}
                onChange={(e) => setNewWallet(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddWallet();
                  }
                }}
                disabled={isWalletLimitReached}
              />
              <Button
                onClick={handleAddWallet}
                disabled={isWalletLimitReached}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <Separator />

            {/* Wallet list */}
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                <RefreshCw className="h-8 w-8 mx-auto mb-2 animate-spin" />
                <p>Loading wallets...</p>
              </div>
            ) : localWallets.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Wallet2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No wallets added yet</p>
                <p className="text-sm">Add wallets using the input above</p>
              </div>
            ) : (
              <ScrollArea className="h-[400px] w-full rounded-md border p-4">
                <div className="space-y-2">
                  {localWallets.map((wallet, idx) => (
                    <div
                      key={wallet}
                      className="flex items-center gap-2 p-3 rounded-md border bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedWallets.has(wallet)}
                        onChange={() => toggleWalletSelection(wallet)}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <code className="text-xs flex-1 font-mono break-all">
                        {wallet}
                      </code>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleCopyWallet(wallet)}
                        >
                          {copiedWallet === wallet ? (
                            <Check className="h-3 w-3 text-green-500" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => handleRemoveWallet(wallet)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bulk Add Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Bulk Add Wallets</DialogTitle>
            <DialogDescription>
              Enter wallet addresses separated by commas or new lines
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="bulk-add">Wallet Addresses</Label>
              <textarea
                id="bulk-add"
                className="w-full h-64 p-3 mt-2 text-sm font-mono border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU&#10;9vMJfxuKxXBoEa7rM12mYLMwTacLMLDJqHozw96WQL8i&#10;2h4Uj5k9KVKM7YGfjdMFwFBSvdRVj7HJgPKH8xYXN2JA"
                value={bulkAddText}
                onChange={(e) => setBulkAddText(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {parseWalletAddresses(bulkAddText).length} addresses found
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleBulkAdd}
              disabled={bulkAddText.trim().length === 0}
            >
              Add Wallets
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
