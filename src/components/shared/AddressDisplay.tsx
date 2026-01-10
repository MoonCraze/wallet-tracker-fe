"use client";

import { ExternalLink, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { truncateAddress, copyToClipboard, getSolscanUrl } from "@/lib/utils";
import { useState } from "react";

interface AddressDisplayProps {
  address: string;
  type?: "tx" | "token" | "account";
  truncate?: boolean;
  showCopy?: boolean;
  showLink?: boolean;
  className?: string;
}

export function AddressDisplay({
  address,
  type = "account",
  truncate = true,
  showCopy = true,
  showLink = true,
  className,
}: AddressDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const success = await copyToClipboard(address);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const displayAddress = truncate ? truncateAddress(address) : address;

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={handleCopy}
            className="font-mono text-sm cursor-pointer hover:text-primary transition-colors flex items-center gap-1"
          >
            {displayAddress}
            {copied ? (
              <Check className="h-3 w-3 text-green-500" />
            ) : (
              <Copy className="h-3 w-3 opacity-50" />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-md">
          <p className="font-mono text-xs break-all">{address}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {copied ? "Copied!" : "Click to copy"}
          </p>
        </TooltipContent>
      </Tooltip>

      {showLink && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={(e) => {
                e.stopPropagation();
                window.open(getSolscanUrl(address, type), "_blank");
              }}
            >
              <ExternalLink className="h-3 w-3" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>View on Solscan</p>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
