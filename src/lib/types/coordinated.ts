/**
 * Coordinated trade event from the backend SSE stream or database
 */
export interface CoordinatedTrade {
  id?: string;
  tokenAddress: string;
  windowStart: string;
  windowEnd: string;
  triggeredAt: string;
  uniqueWalletCount: number;
  walletAddresses: string | string[]; // JSON string from DB, or parsed array from SSE
}

/**
 * Coordinated trade with additional metadata for display
 */
export interface CoordinatedTradeWithMeta extends CoordinatedTrade {
  isNew?: boolean;
  processedAt?: Date;
  severity?: "low" | "medium" | "high" | "critical";
}

/**
 * Helper to parse wallet addresses from coordinated trade
 * The backend may return walletAddresses as a JSON string (from DB) or as an array (from SSE)
 */
export function parseWalletAddresses(trade: CoordinatedTrade): string[] {
  if (Array.isArray(trade.walletAddresses)) {
    return trade.walletAddresses;
  }
  try {
    const parsed = JSON.parse(trade.walletAddresses);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Get severity level based on wallet count
 */
export function getSeverityLevel(walletCount: number): "low" | "medium" | "high" | "critical" {
  if (walletCount >= 10) return "critical";
  if (walletCount >= 7) return "high";
  if (walletCount >= 5) return "medium";
  return "low";
}

/**
 * Get severity color based on level
 */
export function getSeverityColor(severity: string): string {
  switch (severity) {
    case "critical":
      return "bg-red-500";
    case "high":
      return "bg-orange-500";
    case "medium":
      return "bg-yellow-500";
    default:
      return "bg-blue-500";
  }
}

/**
 * Coordinated trade query parameters
 */
export interface CoordinatedQueryParams {
  limit?: number;
  offset?: number;
  tokenAddress?: string;
  minWallets?: number;
  startDate?: string;
  endDate?: string;
}
