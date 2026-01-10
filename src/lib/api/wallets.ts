import apiClient from "./client";

/**
 * Response from wallet management endpoints
 */
export interface WalletListResponse {
  success: boolean;
  count: number;
  wallets: string[];
  message?: string;
  warning?: string;
  totalProvided?: number;
  excluded?: number;
}

export interface WalletActionResponse {
  success: boolean;
  message: string;
  added?: number;
  removed?: number;
  totalCount: number;
  warning?: string;
  excluded?: number;
}

/**
 * Get list of tracked wallet addresses
 * Requires authentication
 */
export async function getWallets(): Promise<WalletListResponse> {
  const { data } = await apiClient.get("/api/wallets");
  return data;
}

/**
 * Replace entire wallet list (max 100 wallets)
 * Requires authentication
 */
export async function updateWallets(
  wallets: string[]
): Promise<WalletListResponse> {
  const { data } = await apiClient.put("/api/wallets", { wallets });
  return data;
}

/**
 * Add wallets to existing list
 * Requires authentication
 */
export async function addWallets(
  wallets: string[]
): Promise<WalletActionResponse> {
  const { data } = await apiClient.post("/api/wallets/add", { wallets });
  return data;
}

/**
 * Remove wallets from list
 * Requires authentication
 */
export async function removeWallets(
  wallets: string[]
): Promise<WalletActionResponse> {
  const { data } = await apiClient.post("/api/wallets/remove", { wallets });
  return data;
}

/**
 * Validate Solana wallet address format
 */
export function isValidWalletAddress(address: string): boolean {
  // Solana addresses are base58 encoded, typically 32-44 characters
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
  return typeof address === "string" && base58Regex.test(address.trim());
}

/**
 * Validate multiple wallet addresses
 */
export function validateWallets(wallets: string[]): {
  valid: string[];
  invalid: string[];
} {
  const valid: string[] = [];
  const invalid: string[] = [];

  wallets.forEach((wallet) => {
    const trimmed = wallet.trim();
    if (trimmed && isValidWalletAddress(trimmed)) {
      valid.push(trimmed);
    } else if (trimmed) {
      invalid.push(trimmed);
    }
  });

  return { valid, invalid };
}

/**
 * Parse wallet addresses from text (comma or newline separated)
 */
export function parseWalletAddresses(text: string): string[] {
  return text
    .split(/[\n,]/)
    .map((addr) => addr.trim())
    .filter((addr) => addr.length > 0);
}
