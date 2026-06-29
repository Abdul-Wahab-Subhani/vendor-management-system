"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, Lock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Input, Label } from "@/components/ui/Form";
import { Button } from "@/components/ui/Button";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});
type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const { login, isLoggingIn } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  return (
    <div className="animate-slide-up">
      <h2 className="font-display text-2xl font-semibold text-ink dark:text-white">Welcome back</h2>
      <p className="mt-1 text-sm text-[rgb(var(--fg-muted))]">Sign in to your account to continue.</p>

      <form className="mt-7 space-y-4" onSubmit={handleSubmit((v) => login(v))}>
        <div>
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[rgb(var(--fg-muted))]" />
            <Input id="email" type="email" placeholder="you@company.com" className="pl-9" {...register("email")} error={errors.email?.message} />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link href="/forgot-password" className="text-xs font-medium text-navy-700 hover:text-gold-500 dark:text-gold-400">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[rgb(var(--fg-muted))]" />
            <Input id="password" type="password" placeholder="••••••••" className="pl-9" {...register("password")} error={errors.password?.message} />
          </div>
        </div>

        <Button type="submit" className="w-full" size="lg" isLoading={isLoggingIn}>
          Sign In
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-[rgb(var(--fg-muted))]">
        Vendor without an account?{" "}
        <Link href="/register" className="font-medium text-navy-700 hover:text-gold-500 dark:text-gold-400">
          Register here
        </Link>
      </p>
    </div>
  );
}
