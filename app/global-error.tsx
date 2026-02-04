"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Saibun] Global error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="font-sans antialiased bg-background text-foreground">
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-card border border-border rounded-xl p-6 space-y-3">
            <h2 className="text-base font-medium text-foreground">App crashed</h2>
            <p className="text-sm text-muted-foreground">
              Refresh the page or retry. If the issue persists, please contact support.
            </p>
            <div className="flex gap-2 pt-2">
              <Button onClick={reset} className="flex-1">
                Retry
              </Button>
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
                className="flex-1 bg-transparent"
              >
                Reload
              </Button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}

