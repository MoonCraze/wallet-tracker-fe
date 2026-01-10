import apiClient from "./client";
import type { SystemConfig, ConfigUpdate } from "../types/config";

/**
 * Get current system configuration
 * Requires authentication
 */
export async function getConfig(): Promise<SystemConfig> {
  const { data } = await apiClient.get("/config");
  return data;
}

/**
 * Update system configuration
 * Requires authentication
 */
export async function updateConfig(
  config: ConfigUpdate
): Promise<SystemConfig> {
  const { data } = await apiClient.patch("/config", config);
  return data;
}

/**
 * Get list of excluded tokens
 * Requires authentication
 */
export async function getExcludeTokens(): Promise<{ excludeTokens: string[] }> {
  const { data } = await apiClient.get("/config/exclude-tokens");
  return data;
}

/**
 * Add a token to the exclude list
 * Requires authentication
 */
export async function addExcludeToken(
  tokenAddress: string
): Promise<{ ok: boolean; excludeTokens: string[] }> {
  const { data } = await apiClient.post("/config/exclude-tokens", {
    tokenAddress,
  });
  return data;
}

/**
 * Remove a token from the exclude list
 * Requires authentication
 */
export async function removeExcludeToken(
  tokenAddress: string
): Promise<{ ok: boolean; excludeTokens: string[] }> {
  const { data } = await apiClient.delete(
    `/config/exclude-tokens/${tokenAddress}`
  );
  return data;
}

/**
 * Validate token address format
 */
export function isValidTokenAddress(address: string): boolean {
  // Solana addresses are base58 encoded, typically 32-44 characters
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
  return base58Regex.test(address);
}
