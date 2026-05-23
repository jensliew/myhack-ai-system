"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center text-center px-4">
      <div className="space-y-6 max-w-md">
        <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
          <AlertTriangle className="h-8 w-8 text-destructive" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">Something went wrong</h2>
          <p className="text-muted-foreground">
            An unexpected error occurred. Please try again or return to the home page.
          </p>
          {error.digest && (
            <p className="text-xs text-muted-foreground font-mono bg-muted px-2 py-1 rounded">
              Error ID: {error.digest}
            </p>
          )}
        </div>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={reset} className="gap-2">
            <RefreshCw className="h-4 w-4" /> Try Again
          </Button>
          <Link href="/">
            <Button className="gap-2">
              <Home className="h-4 w-4" /> Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
