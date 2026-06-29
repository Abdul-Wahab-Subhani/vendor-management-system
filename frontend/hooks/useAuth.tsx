"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, getErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { User } from "@/types";

interface LoginInput {
  email: string;
  password: string;
}

export function useBootstrapAuth() {
  const { setUser, setAccessToken, setRefreshToken, setInitializing, refreshToken, user } = useAuthStore();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // If no session exists, we're done initializing
        if (!refreshToken && !user) {
          if (mounted) setInitializing(false);
          return;
        }

        const { data } = await api.post("/auth/refresh", refreshToken ? { refreshToken } : undefined);
        if (!mounted) return;
        setAccessToken(data.data.accessToken);
        setRefreshToken(data.data.refreshToken);
        const me = await api.get("/auth/me");
        if (!mounted) return;
        setUser(me.data.data as User);
      } catch {
        if (mounted) setUser(null);
      } finally {
        if (mounted) setInitializing(false);
      }
    })();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

export function useAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, setUser, accessToken, setAccessToken, setRefreshToken, clearAuth, isInitializing } = useAuthStore();

  const loginMutation = useMutation({
    mutationFn: async (input: LoginInput) => {
      const { data } = await api.post("/auth/login", input);
      return data.data;
    },
    onSuccess: (data) => {
      setUser(data.user as User);
      setAccessToken(data.accessToken);
      setRefreshToken(data.refreshToken);
      toast.success("Welcome back!");
      router.push(roleHome(data.user.role));
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const registerMutation = useMutation({
    mutationFn: async (input: { name: string; email: string; password: string }) => {
      const { data } = await api.post("/auth/register", input);
      return data;
    },
    onSuccess: () => {
      toast.success("Account created! Check your email to verify your address.");
      router.push("/login");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      clearAuth();
      queryClient.clear();
      router.push("/login");
    }
  };

  return {
    user,
    accessToken,
    isAuthenticated: Boolean(user),
    isInitializing,
    login: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    register: registerMutation.mutateAsync,
    isRegistering: registerMutation.isPending,
    logout,
  };
}

export function roleHome(role: string): string {
  if (role === "VENDOR") return "/vendor-portal";
  return "/dashboard";
}
