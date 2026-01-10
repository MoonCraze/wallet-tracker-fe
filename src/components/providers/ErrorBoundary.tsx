"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary component for catching JavaScript errors in the component tree
 * This prevents the entire app from crashing and provides a graceful fallback UI
 */
export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to an error reporting service
    console.error("[ErrorBoundary] Uncaught error:", error, errorInfo);
    
    // You can also send to an error tracking service here
    // e.g., Sentry.captureException(error, { extra: errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-[400px] items-center justify-center p-4">
          <div className="text-center max-w-md">
            <div className="mb-6 flex justify-center">
              <div className="rounded-full bg-red-100 p-4 dark:bg-red-900/20">
                <AlertTriangle className="h-12 w-12 text-red-600 dark:text-red-400" />
              </div>
            </div>

            <h2 className="mb-2 text-xl font-bold">Something went wrong</h2>
            <p className="mb-4 text-muted-foreground text-sm">
              An unexpected error occurred. You can try refreshing or go back to the dashboard.
            </p>
            
            {process.env.NODE_ENV === "development" && this.state.error && (
              <pre className="mb-4 p-3 bg-muted rounded text-xs text-left overflow-auto max-h-32">
                {this.state.error.message}
              </pre>
            )}

            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button onClick={this.handleReset} variant="default">
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
              <Button asChild variant="outline">
                <Link href="/">
                  <Home className="mr-2 h-4 w-4" />
                  Go Home
                </Link>
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
