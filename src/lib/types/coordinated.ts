/**
 * Coordinated trade event from the backend SSE stream or database
 */
export interface CoordinatedTrade {
  id?: string;
  tokenAddress: string;
  timestamp: string;
  walletCount: number;
  wallets: string[];
  timeWindowSeconds: number;
  pattern: string;
  windowStart?: string;
  windowEnd?: string;
  triggeredAt?: string;
  uniqueWalletCount?: number;
  walletAddresses?: string | string[];
}

/**
 * Coordinated trade with additional metadata for display
 */
export interface CoordinatedTradeWithMeta extends CoordinatedTrade {
  isNew?: boolean;
  processedAt?: Date;
}

/**
 * Helper to parse wallet addresses from coordinated trade
 * The backend may return wallets as array or walletAddresses as JSON string (old SSE)
 */
export function parseWalletAddresses(trade: CoordinatedTrade): string[] {
  // New API format
  if (Array.isArray(trade.wallets)) {
    return trade.wallets;
  }
  // Old SSE format
  if (Array.isArray(trade.walletAddresses)) {
    return trade.walletAddresses;
  }
  if (typeof trade.walletAddresses === 'string') {
    try {
      const parsed = JSON.parse(trade.walletAddresses);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

/**
 * Get timestamp from coordinated trade
 */
export function getTradeTimestamp(trade: CoordinatedTrade): string {
  return trade.timestamp || trade.triggeredAt || new Date().toISOString();
}

/**
 * Get wallet count from coordinated trade
 */
export function getWalletCount(trade: CoordinatedTrade): number {
  return trade.walletCount ?? trade.uniqueWalletCount ?? 0;
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
