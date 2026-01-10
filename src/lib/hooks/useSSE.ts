"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import type { TransferEvent } from "../types/transfer";
import type { CoordinatedTrade } from "../types/coordinated";

/**
 * SSE event types
 */
export type SSEEventType = "transfer" | "coordinated" | "heartbeat";

/**
 * SSE connection status
 */
export type SSEStatus = "connecting" | "connected" | "disconnected" | "error";

/**
 * Callbacks for SSE events
 */
interface SSECallbacks {
  onTransfer?: (data: TransferEvent) => void;
  onCoordinated?: (data: CoordinatedTrade) => void;
  onError?: (error: Event) => void;
  onStatusChange?: (status: SSEStatus) => void;
}

/**
 * SSE hook options
 */
interface SSEOptions {
  /** Whether the SSE connection is enabled (default: true) */
  enabled?: boolean;
  /** Auto-reconnect on disconnect */
  autoReconnect?: boolean;
  /** Reconnect delay in milliseconds */
  reconnectDelay?: number;
  /** Maximum reconnect attempts */
  maxReconnectAttempts?: number;
  /** SSE URL (defaults to NEXT_PUBLIC_SSE_URL) */
  url?: string;
}

const DEFAULT_OPTIONS: SSEOptions = {
  enabled: true,
  autoReconnect: true,
  reconnectDelay: 5000,
  maxReconnectAttempts: 10,
};

/**
 * Hook for connecting to the SSE stream
 * SSE streams are PUBLIC - no authentication required
 */
export function useSSE(callbacks: SSECallbacks, options: SSEOptions = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Store callbacks in refs to prevent stale closures and avoid re-renders
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;
  
  // Store options in ref for stable reference
  const optsRef = useRef(opts);
  optsRef.current = opts;
  
  const [status, setStatus] = useState<SSEStatus>("disconnected");
  const [lastEvent, setLastEvent] = useState<Date | null>(null);

  // Update status and notify callback
  const updateStatus = useCallback((newStatus: SSEStatus) => {
    setStatus(newStatus);
    callbacksRef.current.onStatusChange?.(newStatus);
  }, []);

  // Connect to SSE stream
  const connect = useCallback(() => {
    const currentOpts = optsRef.current;
    
    // Clear any existing reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const url =
      currentOpts.url ||
      process.env.NEXT_PUBLIC_SSE_URL ||
      "https://helius.sarislabs.com/stream/all";

    updateStatus("connecting");
    
    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    // Connection opened
    eventSource.onopen = () => {
      console.log("[SSE] Connected to stream");
      reconnectAttempts.current = 0;
      updateStatus("connected");
    };

    // Handle transfer events (plural - backend sends array)
    eventSource.addEventListener("transfers", (e) => {
      try {
        const arr = JSON.parse(e.data) as TransferEvent[];
        setLastEvent(new Date());
        // Process each transfer in the array
        for (const data of arr) {
          callbacksRef.current.onTransfer?.(data);
        }
      } catch (err) {
        console.error("[SSE] Failed to parse transfers event:", err);
      }
    });

    // Handle coordinated trade events
    eventSource.addEventListener("coordinated", (e) => {
      try {
        const data = JSON.parse(e.data) as CoordinatedTrade;
        setLastEvent(new Date());
        callbacksRef.current.onCoordinated?.(data);
      } catch (err) {
        console.error("[SSE] Failed to parse coordinated event:", err);
      }
    });

    // Handle heartbeat events (keep-alive)
    eventSource.addEventListener("heartbeat", () => {
      setLastEvent(new Date());
    });

    // Handle errors
    eventSource.onerror = (error) => {
      console.error("[SSE] Connection error");
      updateStatus("error");
      callbacksRef.current.onError?.(error);
      eventSource.close();

      const maxAttempts = optsRef.current.maxReconnectAttempts || 10;
      const reconnectDelay = optsRef.current.reconnectDelay || 5000;

      // Auto-reconnect logic
      if (optsRef.current.autoReconnect && reconnectAttempts.current < maxAttempts) {
        reconnectAttempts.current++;
        console.log(
          `[SSE] Reconnecting in ${reconnectDelay}ms (attempt ${reconnectAttempts.current})`
        );
        reconnectTimeoutRef.current = setTimeout(connect, reconnectDelay);
      } else if (reconnectAttempts.current >= maxAttempts) {
        console.error("[SSE] Max reconnect attempts reached");
        updateStatus("disconnected");
      }
    };
  }, [updateStatus]);

  // Disconnect from SSE stream
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    reconnectAttempts.current = 0;
    updateStatus("disconnected");
    console.log("[SSE] Disconnected from stream");
  }, [updateStatus]);

  // Connect on mount if enabled, disconnect on unmount or when disabled
  useEffect(() => {
    if (opts.enabled) {
      connect();
    } else {
      disconnect();
    }
    return () => disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opts.enabled]);

  return {
    status,
    connected: status === "connected",
    lastEvent,
    connect,
    disconnect,
    reconnect: connect,
  };
}

/**
 * Hook for transfer-only stream
 * Note: /stream/transfers uses onmessage (not named events)
 */
export function useTransferStream(
  onTransfer: (data: TransferEvent) => void,
  options?: SSEOptions
) {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Store callback in ref to prevent stale closures
  const onTransferRef = useRef(onTransfer);
  onTransferRef.current = onTransfer;
  
  // Store options in ref
  const optsRef = useRef(opts);
  optsRef.current = opts;
  
  const [status, setStatus] = useState<SSEStatus>("disconnected");

  const connect = useCallback(() => {
    const currentOpts = optsRef.current;
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const url =
      currentOpts.url ||
      process.env.NEXT_PUBLIC_SSE_TRANSFERS_URL ||
      "https://helius.sarislabs.com/stream/transfers";

    setStatus("connecting");
    
    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      console.log("[SSE] Connected to transfers stream");
      reconnectAttempts.current = 0;
      setStatus("connected");
    };

    // /stream/transfers uses onmessage (generic), not named events
    eventSource.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        // Could be array or single object
        if (Array.isArray(data)) {
          for (const transfer of data) {
            onTransferRef.current(transfer as TransferEvent);
          }
        } else {
          onTransferRef.current(data as TransferEvent);
        }
      } catch (err) {
        console.error("[SSE] Failed to parse transfers:", err);
      }
    };

    eventSource.onerror = () => {
      console.error("[SSE] Transfers stream error");
      setStatus("error");
      eventSource.close();

      const maxAttempts = optsRef.current.maxReconnectAttempts || 10;
      const reconnectDelay = optsRef.current.reconnectDelay || 5000;

      if (optsRef.current.autoReconnect && reconnectAttempts.current < maxAttempts) {
        reconnectAttempts.current++;
        reconnectTimeoutRef.current = setTimeout(connect, reconnectDelay);
      } else {
        setStatus("disconnected");
      }
    };
  }, []);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setStatus("disconnected");
  }, []);

  useEffect(() => {
    if (opts.enabled) {
      connect();
    } else {
      disconnect();
    }
    return () => disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opts.enabled]);

  return { status, connected: status === "connected", connect, disconnect };
}

/**
 * Hook for coordinated trades-only stream
 * Note: /stream/coordinated uses onmessage (not named events)
 */
export function useCoordinatedStream(
  onCoordinated: (data: CoordinatedTrade) => void,
  options?: SSEOptions
) {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Store callback in ref to prevent stale closures
  const onCoordinatedRef = useRef(onCoordinated);
  onCoordinatedRef.current = onCoordinated;
  
  // Store options in ref
  const optsRef = useRef(opts);
  optsRef.current = opts;
  
  const [status, setStatus] = useState<SSEStatus>("disconnected");

  const connect = useCallback(() => {
    const currentOpts = optsRef.current;
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const url =
      currentOpts.url ||
      process.env.NEXT_PUBLIC_SSE_COORDINATED_URL ||
      "https://helius.sarislabs.com/stream/coordinated";

    setStatus("connecting");
    
    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      console.log("[SSE] Connected to coordinated stream");
      reconnectAttempts.current = 0;
      setStatus("connected");
    };

    // /stream/coordinated uses onmessage (generic), not named events
    eventSource.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data) as CoordinatedTrade;
        onCoordinatedRef.current(data);
      } catch (err) {
        console.error("[SSE] Failed to parse coordinated:", err);
      }
    };

    eventSource.onerror = () => {
      console.error("[SSE] Coordinated stream error");
      setStatus("error");
      eventSource.close();

      const maxAttempts = optsRef.current.maxReconnectAttempts || 10;
      const reconnectDelay = optsRef.current.reconnectDelay || 5000;

      if (optsRef.current.autoReconnect && reconnectAttempts.current < maxAttempts) {
        reconnectAttempts.current++;
        reconnectTimeoutRef.current = setTimeout(connect, reconnectDelay);
      } else {
        setStatus("disconnected");
      }
    };
  }, []);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setStatus("disconnected");
  }, []);

  useEffect(() => {
    if (opts.enabled) {
      connect();
    } else {
      disconnect();
    }
    return () => disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opts.enabled]);

  return { status, connected: status === "connected", connect, disconnect };
}
