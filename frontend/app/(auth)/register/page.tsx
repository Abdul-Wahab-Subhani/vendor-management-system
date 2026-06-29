"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { Input, Label } from "@/components/ui/Form";
import { Button } from "@/components/ui/Button";

const schema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Enter a valid email address"),
    password: z
      .string()
      .min(8, "At least 8 characters")
      .regex(/[A-Z]/, "Must contain an uppercase letter")
      .regex(/[0-9]/, "Must contain a number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
  const { register: registerUser, isRegistering } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  return (
    <div className="animate-slide-up">
      <h2 className="font-display text-2xl font-semibold text-ink dark:text-white">Create a vendor account</h2>
      <p className="mt-1 text-sm text-[rgb(var(--fg-muted))]">
        Self-registration creates a vendor-role account. Admin accounts are created by a Super Admin.
      </p>

      <form
        className="mt-7 space-y-4"
        onSubmit={handleSubmit((v) => registerUser({ name: v.name, email: v.email, password: v.password }))}
      >
        <div>
          <Label htmlFor="name">Full name</Label>
          <Input id="name" placeholder="Jane Doe" {...register("name")} error={errors.name?.message} />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="you@company.com" {...register("email")} error={errors.email?.message} />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" placeholder="••••••••" {...register("password")} error={errors.password?.message} />
        </div>
        <div>
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <Input id="confirmPassword" type="password" placeholder="••••••••" {...register("confirmPassword")} error={errors.confirmPassword?.message} />
        </div>

        <Button type="submit" className="w-full" size="lg" isLoading={isRegistering}>
          Create Account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-[rgb(var(--fg-muted))]">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-navy-700 hover:text-gold-500 dark:text-gold-400">
          Sign in
        </Link>
      </p>
    </div>
  );
}
