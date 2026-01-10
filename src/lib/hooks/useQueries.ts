"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { getTransfers, getCoordinatedTrades, getStats } from "../api/transfers";
import {
  getConfig,
  updateConfig,
  getExcludeTokens,
  addExcludeToken,
  removeExcludeToken,
} from "../api/config";
import type { TransferEvent, DatabaseStats, ConfigUpdate, SystemConfig } from "../types";
import type { CoordinatedTrade } from "../types/coordinated";

// Query keys for cache management
export const queryKeys = {
  transfers: (limit?: number) => ["transfers", limit] as const,
  coordinatedTrades: (limit?: number) => ["coordinated-trades", limit] as const,
  stats: ["stats"] as const,
  config: ["config"] as const,
  excludeTokens: ["exclude-tokens"] as const,
};

/**
 * Hook for fetching transfers with React Query
 * Provides caching, deduplication, and background refetching
 */
export function useTransfersQuery(limit: number = 50) {
  const { data: session } = useSession();

  return useQuery({
    queryKey: queryKeys.transfers(limit),
    queryFn: () => getTransfers(limit),
    enabled: !!session?.accessToken,
    staleTime: 30 * 1000, // Consider data fresh for 30 seconds
  });
}

/**
 * Hook for fetching coordinated trades with React Query
 */
export function useCoordinatedTradesQuery(limit: number = 50) {
  const { data: session } = useSession();

  return useQuery({
    queryKey: queryKeys.coordinatedTrades(limit),
    queryFn: () => getCoordinatedTrades(limit),
    enabled: !!session?.accessToken,
    staleTime: 30 * 1000,
  });
}

/**
 * Hook for fetching database statistics with React Query
 */
export function useStatsQuery() {
  const { data: session } = useSession();

  return useQuery({
    queryKey: queryKeys.stats,
    queryFn: getStats,
    enabled: !!session?.accessToken,
    staleTime: 60 * 1000, // Stats can be cached longer
    refetchInterval: 60 * 1000, // Refetch every minute
  });
}

/**
 * Hook for fetching system configuration with React Query
 */
export function useConfigQuery() {
  const { data: session } = useSession();

  return useQuery({
    queryKey: queryKeys.config,
    queryFn: getConfig,
    enabled: !!session?.accessToken,
    staleTime: 5 * 60 * 1000, // Config rarely changes
  });
}

/**
 * Hook for updating system configuration
 */
export function useUpdateConfigMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updates: ConfigUpdate) => updateConfig(updates),
    onSuccess: (data) => {
      // Update the cache with the new config
      queryClient.setQueryData(queryKeys.config, data);
    },
  });
}

/**
 * Hook for fetching excluded tokens with React Query
 */
export function useExcludeTokensQuery() {
  const { data: session } = useSession();

  return useQuery({
    queryKey: queryKeys.excludeTokens,
    queryFn: getExcludeTokens,
    enabled: !!session?.accessToken,
    select: (data) => data.excludeTokens || [],
  });
}

/**
 * Hook for adding a token to the exclude list
 */
export function useAddExcludeTokenMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tokenAddress: string) => addExcludeToken(tokenAddress),
    onSuccess: (data) => {
      // Update the cache with the new tokens list
      queryClient.setQueryData(queryKeys.excludeTokens, data);
    },
  });
}

/**
 * Hook for removing a token from the exclude list
 */
export function useRemoveExcludeTokenMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tokenAddress: string) => removeExcludeToken(tokenAddress),
    onSuccess: (data) => {
      // Update the cache with the new tokens list
      queryClient.setQueryData(queryKeys.excludeTokens, data);
    },
  });
}

/**
 * Hook for invalidating all queries (e.g., after reconnection)
 */
export function useInvalidateQueries() {
  const queryClient = useQueryClient();

  return {
    invalidateAll: () => queryClient.invalidateQueries(),
    invalidateTransfers: () => queryClient.invalidateQueries({ queryKey: ["transfers"] }),
    invalidateStats: () => queryClient.invalidateQueries({ queryKey: queryKeys.stats }),
    invalidateConfig: () => queryClient.invalidateQueries({ queryKey: queryKeys.config }),
  };
}
