"use client";

import { useState, useCallback } from "react";
import {
  getWallets,
  updateWallets,
  addWallets,
  removeWallets,
  type WalletListResponse,
  type WalletActionResponse,
} from "../api/wallets";

/**
 * Hook for managing tracked wallet addresses
 * Requires authentication
 */
export function useWallets() {
  const [wallets, setWallets] = useState<string[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch wallet list
  const fetchWallets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getWallets();
      setWallets(data.wallets || []);
      setCount(data.count || 0);
      return data;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch wallets";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update entire wallet list
  const saveWallets = useCallback(
    async (newWallets: string[]): Promise<WalletListResponse> => {
      setSaving(true);
      setError(null);
      try {
        const data = await updateWallets(newWallets);
        setWallets(data.wallets || []);
        setCount(data.count || 0);
        return data;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to update wallets";
        setError(message);
        throw err;
      } finally {
        setSaving(false);
      }
    },
    []
  );

  // Add wallets to existing list
  const addWalletsToList = useCallback(
    async (walletsToAdd: string[]): Promise<WalletActionResponse> => {
      setSaving(true);
      setError(null);
      try {
        const data = await addWallets(walletsToAdd);
        // Refetch to get updated list
        await fetchWallets();
        return data;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to add wallets";
        setError(message);
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [fetchWallets]
  );

  // Remove wallets from list
  const removeWalletsFromList = useCallback(
    async (walletsToRemove: string[]): Promise<WalletActionResponse> => {
      setSaving(true);
      setError(null);
      try {
        const data = await removeWallets(walletsToRemove);
        // Refetch to get updated list
        await fetchWallets();
        return data;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to remove wallets";
        setError(message);
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [fetchWallets]
  );

  return {
    wallets,
    count,
    loading,
    saving,
    error,
    fetchWallets,
    saveWallets,
    addWallets: addWalletsToList,
    removeWallets: removeWalletsFromList,
    setWallets,
    setError,
  };
}
