"use client";

import { useState, useCallback, useRef } from "react";
import { getTransfers, getCoordinatedTrades, getStats } from "../api/transfers";
import type { TransferEvent, DatabaseStats } from "../types";
import type { CoordinatedTrade } from "../types/coordinated";

/**
 * Hook for fetching transfers from the database
 * Requires authentication
 */
export function useTransfers() {
  const [transfers, setTransfers] = useState<TransferEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  const fetchTransfers = useCallback(async (options: {
    limit?: number;
    startTime?: string;
    endTime?: string;
  } = {}) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTransfers(options);
      // Only update state if component is still mounted
      if (isMountedRef.current) {
        setTransfers(data);
      }
      return data;
    } catch (err) {
      if (isMountedRef.current) {
        const message =
          err instanceof Error ? err.message : "Failed to fetch transfers";
        setError(message);
      }
      throw err;
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  const clearTransfers = useCallback(() => {
    setTransfers([]);
    setError(null);
  }, []);

  return {
    transfers,
    loading,
    error,
    fetchTransfers,
    clearTransfers,
    setTransfers,
  };
}

/**
 * Hook for fetching coordinated trades from the database
 * Requires authentication
 */
export function useCoordinatedTrades() {
  const [trades, setTrades] = useState<CoordinatedTrade[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTrades = useCallback(async (limit: number = 50) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCoordinatedTrades(limit);
      setTrades(data);
      return data;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch coordinated trades";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearTrades = useCallback(() => {
    setTrades([]);
    setError(null);
  }, []);

  return {
    trades,
    loading,
    error,
    fetchTrades,
    clearTrades,
    setTrades,
  };
}

/**
 * Hook for fetching database statistics
 * Requires authentication
 */
export function useStats() {
  const [stats, setStats] = useState<DatabaseStats>({
    transferCount: 0,
    coordinatedCount: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getStats();
      setStats(data);
      return data;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch statistics";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    stats,
    loading,
    error,
    fetchStats,
    setStats,
  };
}
