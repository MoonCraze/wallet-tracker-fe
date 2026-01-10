"use client";

import { cn } from "@/lib/utils";
import type { SSEStatus } from "@/lib/hooks/useSSE";

interface ConnectionStatusProps {
  /** Boolean connected state (simple) */
  connected?: boolean;
  /** SSEStatus state (from useSSE hook) */
  status?: SSEStatus;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function ConnectionStatus({
  connected,
  status,
  showLabel = true,
  size = "md",
  className,
}: ConnectionStatusProps) {
  // Determine if connected based on either prop
  const isConnected = status ? status === "connected" : connected;
  const isConnecting = status === "connecting";
  const hasError = status === "error";

  const sizeClasses = {
    sm: "h-1.5 w-1.5",
    md: "h-2 w-2",
    lg: "h-3 w-3",
  };

  const textSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  const getStatusColor = () => {
    if (isConnected) return "bg-green-500";
    if (isConnecting) return "bg-yellow-500";
    if (hasError) return "bg-red-500";
    return "bg-gray-500";
  };

  const getStatusText = () => {
    if (isConnected) return "Live";
    if (isConnecting) return "Connecting...";
    if (hasError) return "Error";
    return "Disconnected";
  };

  const getTextColor = () => {
    if (isConnected) return "text-green-600";
    if (isConnecting) return "text-yellow-600";
    if (hasError) return "text-red-600";
    return "text-gray-500";
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="relative">
        <div
          className={cn(
            "rounded-full",
            sizeClasses[size],
            getStatusColor()
          )}
        />
        {(isConnected || isConnecting) && (
          <div
            className={cn(
              "absolute inset-0 animate-ping rounded-full opacity-75",
              sizeClasses[size],
              isConnected ? "bg-green-500" : "bg-yellow-500"
            )}
          />
        )}
      </div>
      {showLabel && (
        <span
          className={cn(
            "text-muted-foreground",
            textSizes[size],
            getTextColor()
          )}
        >
          {getStatusText()}
        </span>
      )}
    </div>
  );
}
