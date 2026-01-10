"use client";

import { useSession } from "next-auth/react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MobileSidebar } from "./Sidebar";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { cn } from "@/lib/utils";

interface HeaderProps {
  title?: string;
  description?: string;
  showSearch?: boolean;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  actions?: React.ReactNode;
  connected?: boolean;
}

export function Header({
  title,
  description,
  showSearch = false,
  searchPlaceholder = "Search...",
  onSearch,
  actions,
  connected,
}: HeaderProps) {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:px-6">
      <div className="flex items-center gap-4">
        <MobileSidebar />
        
        {title && (
          <div className="hidden sm:block">
            <h1 className="text-lg font-semibold">{title}</h1>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Connection status */}
        {typeof connected === "boolean" && (
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "h-2 w-2 rounded-full",
                connected ? "bg-green-500" : "bg-red-500",
                connected && "live-indicator"
              )}
            />
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {connected ? "Connected" : "Disconnected"}
            </span>
          </div>
        )}

        {/* Search */}
        {showSearch && (
          <div className="relative hidden md:block">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={searchPlaceholder}
              className="w-64 pl-8"
              onChange={(e) => onSearch?.(e.target.value)}
            />
          </div>
        )}

        {/* Custom actions */}
        {actions}

        {/* Theme toggle */}
        <ThemeToggle />

        {/* User info (desktop) */}
        {session && (
          <div className="hidden items-center gap-2 md:flex">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              <span className="text-sm font-semibold text-primary">
                {session.user?.name?.charAt(0).toUpperCase() || "U"}
              </span>
            </div>
            <Badge variant="outline" className="hidden lg:inline-flex">
              {session.user?.role || "User"}
            </Badge>
          </div>
        )}
      </div>
    </header>
  );
}
