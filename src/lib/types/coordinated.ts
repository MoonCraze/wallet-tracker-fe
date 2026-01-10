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
