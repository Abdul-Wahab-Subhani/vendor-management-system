"use client";

import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-paper px-6 text-center dark:bg-navy-950">
      <div className="mb-6 rounded-2xl bg-navy-800/5 p-5 dark:bg-gold-400/10">
        <FileQuestion className="h-10 w-10 text-navy-800 dark:text-gold-400" />
      </div>
      <h1 className="font-display text-3xl font-bold text-ink dark:text-white">404</h1>
      <p className="mt-2 max-w-sm text-sm text-[rgb(var(--fg-muted))]">
        The page you&apos;re looking for doesn&apos;t exist or may have been moved.
      </p>
      <Link href="/dashboard" className="mt-6">
        <Button>Back to Dashboard</Button>
      </Link>
    </div>
  );
}
