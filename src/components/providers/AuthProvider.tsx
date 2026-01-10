"use client";

import { SessionProvider } from "next-auth/react";

interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * Auth provider wrapper for the application
 * Provides NextAuth session context to all child components
 * 
 * Configuration:
 * - refetchInterval: 0 disables automatic session polling to prevent infinite loops
 * - refetchOnWindowFocus: false prevents refetch when window regains focus
 * - Session will still be checked on navigation and API calls
 */
export function AuthProvider({ children }: AuthProviderProps) {
  return (
    <SessionProvider 
      refetchInterval={0}
      refetchOnWindowFocus={false}
    >
      {children}
    </SessionProvider>
  );
}
