import axios, { AxiosError } from "axios";
import { useAuthStore } from "./store";

export const API_URL = process.env.NEXT_PUBLIC_API_URL;

function normalizeApiBaseUrl(url?: string): string {
  const trimmed = (url ?? "").trim().replace(/\/+$/, "");
  if (!trimmed) return "/api/v1";
  return trimmed.endsWith("/api/v1") ? trimmed : `${trimmed}/api/v1`;
}

export const api = axios.create({
  baseURL: normalizeApiBaseUrl(API_URL),
  withCredentials: true, // sends/receives httpOnly accessToken / refreshToken cookies
});

let isRefreshing = false;
let pendingQueue: Array<() => void> = [];

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    const isAuthRoute = originalRequest?.url?.includes("/auth/login") || originalRequest?.url?.includes("/auth/refresh");

    if (status === 401 && originalRequest && !isAuthRoute && !(originalRequest as { _retry?: boolean })._retry) {
      (originalRequest as { _retry?: boolean })._retry = true;

      if (isRefreshing) {
        await new Promise<void>((resolve) => pendingQueue.push(resolve));
        return api(originalRequest);
      }

      isRefreshing = true;
      try {
        const { data } = await api.post("/auth/refresh");
        useAuthStore.getState().setAccessToken(data.data.accessToken);
        pendingQueue.forEach((resolve) => resolve());
        pendingQueue = [];
        return api(originalRequest);
      } catch (refreshError) {
        useAuthStore.getState().clearAuth();
        if (typeof window !== "undefined") window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

/** Extracts a friendly error message from an Axios/API error. */
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string; errors?: { message: string }[] } | undefined;
    if (data?.errors?.length) return data.errors.map((e) => e.message).join(", ");
    return data?.message ?? error.message ?? "Something went wrong";
  }
  return "Something went wrong";
}
