"use client";

import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "./AuthProvider";
import { ErrorBoundary } from "./ErrorBoundary";
import { QueryProvider } from "./QueryProvider";
import { ThemeProvider } from "./ThemeProvider";

interface ProvidersProps {
  children: React.ReactNode;
}

/**
 * Combined providers wrapper
 * Wraps the application with all necessary context providers
 */
export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <AuthProvider>
        <QueryProvider>
          <ErrorBoundary>
            <TooltipProvider>
              {children}
              <Toaster
                position="top-right"
                richColors
                closeButton
                duration={4000}
                toastOptions={{
                  classNames: {
                    toast: "font-sans",
                    title: "font-medium",
                    description: "text-sm",
                  },
                }}
              />
            </TooltipProvider>
          </ErrorBoundary>
        </QueryProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
