"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-paper px-6 text-center dark:bg-navy-950">
      <div className="mb-6 rounded-2xl bg-danger-light p-5 dark:bg-danger/10">
        <AlertTriangle className="h-10 w-10 text-danger" />
      </div>
      <h1 className="font-display text-2xl font-bold text-ink dark:text-white">Something went wrong</h1>
      <p className="mt-2 max-w-sm text-sm text-[rgb(var(--fg-muted))]">
        We hit an unexpected error. Try again, and if the problem persists, contact support.
      </p>
      <Button className="mt-6" onClick={() => reset()}>
        Try Again
      </Button>
    </div>
  );
}
