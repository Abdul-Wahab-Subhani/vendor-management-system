"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { api, getErrorMessage } from "@/lib/api";

function VerifyEmailContent() {
  const params = useSearchParams();
  const token = params.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMsg("No verification token found in the link.");
      return;
    }
    api
      .post("/auth/verify-email", { token })
      .then(() => setStatus("success"))
      .catch((err) => {
        setStatus("error");
        setErrorMsg(getErrorMessage(err));
      });
  }, [token]);

  return (
    <div className="animate-slide-up text-center">
      {status === "loading" && <Loader2 className="mx-auto h-12 w-12 animate-spin text-navy-700" />}
      {status === "success" && (
        <>
          <CheckCircle2 className="mx-auto h-12 w-12 text-success" />
          <h2 className="mt-4 font-display text-xl font-semibold text-ink dark:text-white">Email verified</h2>
          <p className="mt-2 text-sm text-[rgb(var(--fg-muted))]">Your email address has been confirmed.</p>
        </>
      )}
      {status === "error" && (
        <>
          <XCircle className="mx-auto h-12 w-12 text-danger" />
          <h2 className="mt-4 font-display text-xl font-semibold text-ink dark:text-white">Verification failed</h2>
          <p className="mt-2 text-sm text-[rgb(var(--fg-muted))]">{errorMsg}</p>
        </>
      )}
      <Link href="/login" className="mt-6 inline-block text-sm font-medium text-navy-700 dark:text-gold-400">
        Back to sign in
      </Link>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailContent />
    </Suspense>
  );
}
