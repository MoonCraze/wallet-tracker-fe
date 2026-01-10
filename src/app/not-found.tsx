"use client";

import Link from "next/link";
import { Home, ArrowLeft, Search } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="text-center">
        {/* 404 Graphic */}
        <div className="relative mb-8">
          <span className="text-[150px] font-bold leading-none text-muted-foreground/20 md:text-[200px]">
            404
          </span>
          <div className="absolute inset-0 flex items-center justify-center">
            <Search className="h-16 w-16 text-muted-foreground/50 md:h-24 md:w-24" />
          </div>
        </div>

        {/* Message */}
        <h1 className="mb-2 text-2xl font-bold md:text-3xl">Page Not Found</h1>
        <p className="mb-8 text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        {/* Actions */}
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button asChild variant="outline">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Link>
          </Button>
          <Button onClick={() => window.history.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
}
