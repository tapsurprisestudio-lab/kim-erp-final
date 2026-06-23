"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app:error-boundary]", error);
  }, [error]);

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 p-6">
      <Card className="w-full max-w-lg">
        <CardContent className="space-y-4 p-6 text-center">
          <div className="mx-auto grid size-12 place-items-center rounded-xl bg-amber-50 text-amber-700">
            <AlertTriangle className="size-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-950">Something went wrong</h1>
            <p className="mt-2 text-sm text-slate-600">
              The page could not complete that request. The error has been logged on the server.
            </p>
            {error.digest && <p className="mt-2 text-xs text-slate-400">Reference: {error.digest}</p>}
          </div>
          <Button onClick={reset}>Try again</Button>
        </CardContent>
      </Card>
    </main>
  );
}
