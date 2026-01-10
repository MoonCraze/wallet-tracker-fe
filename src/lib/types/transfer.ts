/**
 * Transfer event from the backend SSE stream or database
 */
export interface TransferEvent {
  id?: string;
  walletAddress: string;
  tokenAddress: string;
  amount: string;
  signature: string;
  timestamp: string;
  side: "BUY" | "SELL";
}

/**
 * Transfer event with additional metadata for display
 */
export interface TransferEventWithMeta extends TransferEvent {
  isNew?: boolean;
  processedAt?: Date;
}

/**
 * Transfer query parameters for fetching from database
 */
export interface TransferQueryParams {
  limit?: number;
  offset?: number;
  walletAddress?: string;
  tokenAddress?: string;
  side?: "BUY" | "SELL";
  startDate?: string;
  endDate?: string;
}
