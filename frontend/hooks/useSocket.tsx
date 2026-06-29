"use client";

import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { API_URL } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { Notification } from "@/types";

export function useSocket() {
  const { accessToken, user } = useAuthStore();
  const socketRef = useRef<Socket | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!accessToken || !user) return;

    const socket = io(API_URL, {
      auth: { token: accessToken },
      withCredentials: true,
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;

    socket.on("notification:new", (notification: Notification) => {
      toast.message(notification.title, { description: notification.message });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [accessToken, user, queryClient]);

  return socketRef.current;
}
