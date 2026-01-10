"use client";

import { useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-muted/30">
      {/* Sidebar - hidden on mobile */}
      <div className="hidden lg:flex">
        <Sidebar
          collapsed={sidebarCollapsed}
          onCollapse={setSidebarCollapsed}
        />
      </div>

      {/* Main content area */}
      <main
        className={cn(
          "flex-1 overflow-auto transition-all duration-300",
          "scrollbar-thin"
        )}
      >
        {children}
      </main>
    </div>
  );
}
