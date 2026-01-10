"use client";

import { useState, useCallback } from "react";
import {
  getConfig,
  updateConfig,
  getExcludeTokens,
  addExcludeToken,
  removeExcludeToken,
} from "../api/config";
import type { SystemConfig, ConfigUpdate } from "../types/config";

/**
 * Hook for managing system configuration
 * Requires authentication
 */
export function useConfig() {
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch current configuration
  const fetchConfig = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getConfig();
      setConfig(data);
      return data;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch configuration";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update configuration
  const saveConfig = useCallback(async (updates: ConfigUpdate) => {
    setSaving(true);
    setError(null);
    try {
      const data = await updateConfig(updates);
      setConfig(data);
      return data;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update configuration";
      setError(message);
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  return {
    config,
    loading,
    saving,
    error,
    fetchConfig,
    saveConfig,
    setConfig,
  };
}

/**
 * Hook for managing excluded tokens list
 * Requires authentication
 */
export function useExcludeTokens() {
  const [tokens, setTokens] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch excluded tokens
  const fetchTokens = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getExcludeTokens();
      setTokens(data.excludeTokens || []);
      return data.excludeTokens;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch excluded tokens";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Add a token to the exclude list
  const addToken = useCallback(async (tokenAddress: string) => {
    setError(null);
    try {
      const data = await addExcludeToken(tokenAddress);
      setTokens(data.excludeTokens || []);
      return data;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to add excluded token";
      setError(message);
      throw err;
    }
  }, []);

  // Remove a token from the exclude list
  const removeToken = useCallback(async (tokenAddress: string) => {
    setError(null);
    try {
      const data = await removeExcludeToken(tokenAddress);
      setTokens(data.excludeTokens || []);
      return data;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to remove excluded token";
      setError(message);
      throw err;
    }
  }, []);

  return {
    tokens,
    loading,
    error,
    fetchTokens,
    addToken,
    removeToken,
    setTokens,
  };
}
