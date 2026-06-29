"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, roleHome } from "@/hooks/useAuth";

export default function RootPage() {
  const router = useRouter();
  const { user, isInitializing } = useAuth();

  useEffect(() => {
    if (isInitializing) return;
    router.replace(user ? roleHome(user.role) : "/login");
  }, [user, isInitializing, router]);

  return (
    <div className="flex h-screen items-center justify-center bg-paper dark:bg-navy-950">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-navy-800 border-t-transparent dark:border-gold-400 dark:border-t-transparent" />
    </div>
  );
}
