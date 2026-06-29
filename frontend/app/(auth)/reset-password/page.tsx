"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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

const schema = z
  .object({
    password: z
      .string()
      .min(8, "At least 8 characters")
      .regex(/[A-Z]/, "Must contain an uppercase letter")
      .regex(/[0-9]/, "Must contain a number"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, { message: "Passwords do not match", path: ["confirmPassword"] });
type FormValues = z.infer<typeof schema>;

function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [done, setDone] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const mutation = useMutation({
    mutationFn: (values: FormValues) => api.post("/auth/reset-password", { token, password: values.password }),
    onSuccess: () => setDone(true),
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  if (done) {
    return (
      <div className="animate-slide-up text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-success" />
        <h2 className="mt-4 font-display text-xl font-semibold text-ink dark:text-white">Password updated</h2>
        <p className="mt-2 text-sm text-[rgb(var(--fg-muted))]">You can now sign in with your new password.</p>
        <Button className="mt-6" onClick={() => router.push("/login")}>
          Go to Sign In
        </Button>
      </div>
    );
  }

  return (
    <div className="animate-slide-up">
      <h2 className="font-display text-2xl font-semibold text-ink dark:text-white">Set a new password</h2>
      <p className="mt-1 text-sm text-[rgb(var(--fg-muted))]">Choose a strong password for your account.</p>

      <form className="mt-7 space-y-4" onSubmit={handleSubmit((v) => mutation.mutate(v))}>
        <div>
          <Label htmlFor="password">New password</Label>
          <Input id="password" type="password" {...register("password")} error={errors.password?.message} />
        </div>
        <div>
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <Input id="confirmPassword" type="password" {...register("confirmPassword")} error={errors.confirmPassword?.message} />
        </div>
        <Button type="submit" className="w-full" size="lg" isLoading={mutation.isPending} disabled={!token}>
          Reset Password
        </Button>
        {!token && <p className="text-center text-xs text-danger">No reset token found in the link.</p>}
      </form>

      <p className="mt-6 text-center text-sm text-[rgb(var(--fg-muted))]">
        <Link href="/login" className="font-medium text-navy-700 hover:text-gold-500 dark:text-gold-400">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
