"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { ShieldCheck, Moon, Building2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Input, Label } from "@/components/ui/Form";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { api, getErrorMessage } from "@/lib/api";

const schema = z
  .object({
    currentPassword: z.string().min(1, "Required"),
    newPassword: z.string().min(8, "At least 8 characters").regex(/[A-Z]/, "Needs an uppercase letter").regex(/[0-9]/, "Needs a number"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, { message: "Passwords don't match", path: ["confirmPassword"] });
type FormValues = z.infer<typeof schema>;

export default function VendorSettingsPage() {
  const { user } = useAuth();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const changePassword = useMutation({
    mutationFn: (values: FormValues) => api.post("/auth/change-password", values),
    onSuccess: () => {
      toast.success("Password changed successfully");
      reset();
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink dark:text-white">Settings</h1>
        <p className="mt-1 text-sm text-[rgb(var(--fg-muted))]">Manage your account and preferences.</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
        <CardContent className="flex items-center gap-4">
          <Avatar name={user?.name ?? "?"} size="lg" />
          <div>
            <p className="font-medium text-ink dark:text-white">{user?.name}</p>
            <p className="text-sm text-[rgb(var(--fg-muted))]">{user?.email}</p>
            {user?.vendor && (
              <p className="mt-1 flex items-center gap-1 text-xs text-[rgb(var(--fg-muted))]">
                <Building2 className="h-3 w-3" /> {user.vendor.companyName}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Change Password</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit((v) => changePassword.mutate(v))} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input id="currentPassword" type="password" {...register("currentPassword")} error={errors.currentPassword?.message} />
            </div>
            <div>
              <Label htmlFor="newPassword">New Password</Label>
              <Input id="newPassword" type="password" {...register("newPassword")} error={errors.newPassword?.message} />
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input id="confirmPassword" type="password" {...register("confirmPassword")} error={errors.confirmPassword?.message} />
            </div>
            <div className="sm:col-span-2 flex justify-end">
              <Button type="submit" isLoading={changePassword.isPending}>Update Password</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Moon className="h-4 w-4" /> Appearance</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-ink dark:text-white">Theme</p>
            <p className="text-sm text-[rgb(var(--fg-muted))]">Switch between light and dark mode.</p>
          </div>
          <ThemeToggle />
        </CardContent>
      </Card>
    </div>
  );
}
