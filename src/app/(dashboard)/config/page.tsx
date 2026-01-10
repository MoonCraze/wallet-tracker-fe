"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Save,
  RefreshCw,
  Settings2,
  Clock,
  Users,
  DollarSign,
  Bug,
  Shield,
  Plus,
  Trash2,
  Copy,
  Check,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

import { Header } from "@/components/dashboard/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

import { useConfig, useExcludeTokens } from "@/lib/hooks/useConfig";
import type { SystemConfig } from "@/lib/types/config";
import { isValidTokenAddress } from "@/lib/api/config";

export default function ConfigPage() {
  const { data: session } = useSession();
  const {
    config,
    loading: configLoading,
    saving,
    error: configError,
    fetchConfig,
    saveConfig,
  } = useConfig();

  const {
    tokens: excludeTokens,
    loading: tokensLoading,
    fetchTokens,
    addToken,
    removeToken,
  } = useExcludeTokens();

  // Local form state
  const [formState, setFormState] = useState<Partial<SystemConfig>>({});
  const [newToken, setNewToken] = useState("");
  const [hasChanges, setHasChanges] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Load config and tokens on mount
  useEffect(() => {
    if (session?.accessToken) {
      fetchConfig().catch(console.error);
      fetchTokens().catch(console.error);
    }
  }, [session, fetchConfig, fetchTokens]);

  // Sync form state with config
  useEffect(() => {
    if (config) {
      setFormState({
        minAmount: config.minAmount,
        coordinatedWindowMinutes: config.coordinatedWindowMinutes,
        coordinatedMinWallets: config.coordinatedMinWallets,
        dedupBySignatureOnly: config.dedupBySignatureOnly,
        debugEvents: config.debugEvents,
        debugEventsVerbose: config.debugEventsVerbose,
      });
      setHasChanges(false);
    }
  }, [config]);

  // Handle form field changes
  const handleChange = <K extends keyof SystemConfig>(
    key: K,
    value: SystemConfig[K]
  ) => {
    setFormState((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  // Save configuration
  const handleSave = async () => {
    try {
      await saveConfig(formState);
      toast.success("Configuration saved", {
        description: "Your changes have been applied successfully.",
      });
      setHasChanges(false);
    } catch (err) {
      toast.error("Failed to save configuration", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    }
  };

  // Reset to original values
  const handleReset = () => {
    if (config) {
      setFormState({
        minAmount: config.minAmount,
        coordinatedWindowMinutes: config.coordinatedWindowMinutes,
        coordinatedMinWallets: config.coordinatedMinWallets,
        dedupBySignatureOnly: config.dedupBySignatureOnly,
        debugEvents: config.debugEvents,
        debugEventsVerbose: config.debugEventsVerbose,
      });
      setHasChanges(false);
      toast.info("Changes reverted");
    }
  };

  // Add exclude token
  const handleAddToken = async () => {
    if (!newToken.trim()) {
      toast.error("Please enter a token address");
      return;
    }

    if (!isValidTokenAddress(newToken.trim())) {
      toast.error("Invalid token address", {
        description: "Token address must be a valid Solana address (32-44 characters)",
      });
      return;
    }

    try {
      await addToken(newToken.trim());
      setNewToken("");
      toast.success("Token added to exclude list");
    } catch (err) {
      toast.error("Failed to add token", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    }
  };

  // Remove exclude token
  const handleRemoveToken = async (token: string) => {
    try {
      await removeToken(token);
      toast.success("Token removed from exclude list");
    } catch (err) {
      toast.error("Failed to remove token", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    }
  };

  // Copy token to clipboard
  const handleCopyToken = async (token: string) => {
    await navigator.clipboard.writeText(token);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
    toast.success("Token address copied");
  };

  // Not authenticated
  if (!session) {
    return (
      <div className="flex flex-col">
        <Header title="Configuration" description="System settings" />
        <div className="p-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Authentication Required</AlertTitle>
            <AlertDescription>
              Please sign in to access configuration settings.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <Header
        title="Configuration"
        description="Manage system settings and detection parameters"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                fetchConfig();
                fetchTokens();
              }}
              disabled={configLoading || tokensLoading}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${
                  configLoading || tokensLoading ? "animate-spin" : ""
                }`}
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
        {configError && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{configError}</AlertDescription>
          </Alert>
        )}

        {hasChanges && (
          <Alert>
            <Settings2 className="h-4 w-4" />
            <AlertTitle>Unsaved Changes</AlertTitle>
            <AlertDescription>
              You have unsaved changes. Click &quot;Save Changes&quot; to apply
              them.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {/* Coordinated Trade Detection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Coordinated Trade Detection
              </CardTitle>
              <CardDescription>
                Configure parameters for detecting coordinated trading patterns
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {configLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label
                      htmlFor="coordinatedWindowMinutes"
                      className="flex items-center gap-2"
                    >
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      Time Window (Minutes)
                    </Label>
                    <Input
                      id="coordinatedWindowMinutes"
                      type="number"
                      min={1}
                      max={60}
                      value={formState.coordinatedWindowMinutes ?? ""}
                      onChange={(e) =>
                        handleChange(
                          "coordinatedWindowMinutes",
                          parseInt(e.target.value) || 1
                        )
                      }
                      placeholder="5"
                    />
                    <p className="text-xs text-muted-foreground">
                      Time window in minutes for detecting coordinated trades
                      (1-60)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="coordinatedMinWallets"
                      className="flex items-center gap-2"
                    >
                      <Users className="h-4 w-4 text-muted-foreground" />
                      Minimum Wallets
                    </Label>
                    <Input
                      id="coordinatedMinWallets"
                      type="number"
                      min={2}
                      max={50}
                      value={formState.coordinatedMinWallets ?? ""}
                      onChange={(e) =>
                        handleChange(
                          "coordinatedMinWallets",
                          parseInt(e.target.value) || 2
                        )
                      }
                      placeholder="5"
                    />
                    <p className="text-xs text-muted-foreground">
                      Minimum unique wallets required to trigger alert (2-50)
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Transfer Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Transfer Settings
              </CardTitle>
              <CardDescription>
                Configure transfer filtering and deduplication
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {configLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label
                      htmlFor="minAmount"
                      className="flex items-center gap-2"
                    >
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      Minimum Amount
                    </Label>
                    <Input
                      id="minAmount"
                      type="number"
                      min={0}
                      step="0.01"
                      value={formState.minAmount ?? ""}
                      onChange={(e) =>
                        handleChange(
                          "minAmount",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      placeholder="1"
                    />
                    <p className="text-xs text-muted-foreground">
                      Minimum transfer amount threshold to process events
                    </p>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label
                        htmlFor="dedupBySignatureOnly"
                        className="flex items-center gap-2"
                      >
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        Dedup by Signature Only
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        If enabled, deduplicates by signature only instead of
                        wallet+token+signature
                      </p>
                    </div>
                    <Switch
                      id="dedupBySignatureOnly"
                      checked={formState.dedupBySignatureOnly ?? false}
                      onCheckedChange={(checked) =>
                        handleChange("dedupBySignatureOnly", checked)
                      }
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Debug Settings */}
          {/* <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bug className="h-5 w-5" />
                Debug Settings
              </CardTitle>
              <CardDescription>
                Enable debug logging for troubleshooting
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {configLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="debugEvents">Debug Events</Label>
                      <p className="text-xs text-muted-foreground">
                        Enable debug logging for all processed events
                      </p>
                    </div>
                    <Switch
                      id="debugEvents"
                      checked={formState.debugEvents ?? false}
                      onCheckedChange={(checked) =>
                        handleChange("debugEvents", checked)
                      }
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="debugEventsVerbose">Verbose Debug</Label>
                      <p className="text-xs text-muted-foreground">
                        Enable verbose debug logging with full event details
                      </p>
                    </div>
                    <Switch
                      id="debugEventsVerbose"
                      checked={formState.debugEventsVerbose ?? false}
                      onCheckedChange={(checked) =>
                        handleChange("debugEventsVerbose", checked)
                      }
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card> */}

          {/* Exclude Tokens */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Excluded Tokens
              </CardTitle>
              <CardDescription>
                Tokens excluded from tracking (e.g., WSOL, USDC)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add new token */}
              <div className="flex gap-2">
                <Input
                  placeholder="Token address..."
                  value={newToken}
                  onChange={(e) => setNewToken(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddToken();
                    }
                  }}
                />
                <Button onClick={handleAddToken} size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Token list */}
              {tokensLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : excludeTokens.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No tokens excluded
                </p>
              ) : (
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {excludeTokens.map((token) => (
                    <div
                      key={token}
                      className="flex items-center justify-between gap-2 p-2 rounded-md border bg-muted/30"
                    >
                      <code className="text-xs truncate flex-1 font-mono">
                        {token}
                      </code>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleCopyToken(token)}
                        >
                          {copiedToken === token ? (
                            <Check className="h-3 w-3 text-green-500" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-destructive hover:text-destructive"
                          onClick={() => handleRemoveToken(token)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {excludeTokens.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {excludeTokens.length} token(s) excluded
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Current Config Summary */}
        {config && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Current Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">
                  Window: {config.coordinatedWindowMinutes} min
                </Badge>
                <Badge variant="outline">
                  Min Wallets: {config.coordinatedMinWallets}
                </Badge>
                <Badge variant="outline">Min Amount: {config.minAmount}</Badge>
                <Badge
                  variant={config.dedupBySignatureOnly ? "default" : "outline"}
                >
                  Dedup: {config.dedupBySignatureOnly ? "Signature" : "Full"}
                </Badge>
                {/* <Badge variant={config.debugEvents ? "destructive" : "outline"}>
                  Debug: {config.debugEvents ? "ON" : "OFF"}
                </Badge>
                <Badge
                  variant={config.debugEventsVerbose ? "destructive" : "outline"}
                >
                  Verbose: {config.debugEventsVerbose ? "ON" : "OFF"}
                </Badge> */}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
