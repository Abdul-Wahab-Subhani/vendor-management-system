"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, getErrorMessage } from "@/lib/api";
import { Input, Label } from "@/components/ui/Form";
import { Button } from "@/components/ui/Button";

const schema = z.object({ email: z.string().email("Enter a valid email address") });
type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const mutation = useMutation({
    mutationFn: (values: FormValues) => api.post("/auth/forgot-password", values),
    onSuccess: () => setSent(true),
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  if (sent) {
    return (
      <div className="animate-slide-up text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-success" />
        <h2 className="mt-4 font-display text-xl font-semibold text-ink dark:text-white">Check your inbox</h2>
        <p className="mt-2 text-sm text-[rgb(var(--fg-muted))]">
          If an account exists for that email, we&apos;ve sent a link to reset your password.
        </p>
        <Link href="/login" className="mt-6 inline-block text-sm font-medium text-navy-700 dark:text-gold-400">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-slide-up">
      <h2 className="font-display text-2xl font-semibold text-ink dark:text-white">Forgot password</h2>
      <p className="mt-1 text-sm text-[rgb(var(--fg-muted))]">Enter your email and we&apos;ll send you a reset link.</p>

      <form className="mt-7 space-y-4" onSubmit={handleSubmit((v) => mutation.mutate(v))}>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="you@company.com" {...register("email")} error={errors.email?.message} />
        </div>
        <Button type="submit" className="w-full" size="lg" isLoading={mutation.isPending}>
          Send Reset Link
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-[rgb(var(--fg-muted))]">
        <Link href="/login" className="font-medium text-navy-700 hover:text-gold-500 dark:text-gold-400">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
