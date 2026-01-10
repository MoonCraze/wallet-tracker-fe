import apiClient from "./client";
import type { TransferEvent, DatabaseStats } from "../types";
import type { CoordinatedTrade } from "../types/coordinated";

/**
 * Fetch transfers from the database
 * Requires authentication
 * 
 * @param options - Query options
 * @param options.limit - Maximum number of transfers (ignored when using time filters)
 * @param options.startTime - Filter transfers after this time (ISO 8601)
 * @param options.endTime - Filter transfers before this time (ISO 8601)
 * 
 * Note: Backend ignores limit parameter when startTime or endTime is provided
 */
export async function getTransfers(options: {
  limit?: number;
  startTime?: string;
  endTime?: string;
} = {}): Promise<TransferEvent[]> {
  const { limit = 50, startTime, endTime } = options;
  const params: Record<string, any> = {};
  
  // Only add limit if no time filters are provided (backend ignores it otherwise)
  if (!startTime && !endTime) {
    params.limit = limit;
  }
  
  if (startTime) params.startTime = startTime;
  if (endTime) params.endTime = endTime;
  
  const { data } = await apiClient.get("/dev/db/transfers", { params });
  return Array.isArray(data) ? data : data.data || [];
}

/**
 * Fetch coordinated trades from the database
 * Requires authentication
 */
export async function getCoordinatedTrades(
  limit: number = 50
): Promise<CoordinatedTrade[]> {
  const { data } = await apiClient.get("/dev/db/coordinated", {
    params: { limit },
  });
  return Array.isArray(data) ? data : data.data || [];
}

/**
 * Get database statistics
 * Requires authentication
 */
export async function getStats(): Promise<DatabaseStats> {
  const { data } = await apiClient.get("/dev/db/stats");
  return data;
}

/**
 * Check backend health (public endpoint)
 */
export async function checkHealth(): Promise<{
  status: "ok" | "error";
  timestamp?: string;
}> {
  try {
    const { data } = await apiClient.get("/health");
    return data;
  } catch (error) {
    return { status: "error" };
  }
}

/**
 * Export transfers to JSON format
 */
export function exportToJson(
  data: TransferEvent[] | CoordinatedTrade[],
  filename: string
): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export transfers to CSV format
 */
export function exportToCsv(
  data: TransferEvent[],
  filename: string = "transfers"
): void {
  const headers = [
    "Timestamp",
    "Wallet Address",
    "Token Address",
    "Amount",
    "Side",
    "Signature",
  ];
  
  const rows = data.map((t) => [
    t.timestamp,
    t.walletAddress,
    t.tokenAddress,
    t.amount,
    t.side,
    t.signature,
  ]);
  
  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
