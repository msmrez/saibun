"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Saibun] App error:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-card border border-border rounded-xl p-6 space-y-3">
        <h2 className="text-base font-medium text-foreground">Something went wrong</h2>
        <p className="text-sm text-muted-foreground">
          The app hit an unexpected error. Your keys never leave your device.
          You can retry safely.
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
  );
}

