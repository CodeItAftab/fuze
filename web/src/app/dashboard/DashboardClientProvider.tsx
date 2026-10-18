"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth.store";
import { socketClient } from "@/lib/socket";

export function DashboardClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { checkSession, user } = useAuthStore();

  useEffect(() => {
    // 1. Initial session verification
    void checkSession();
  }, [checkSession]);

  useEffect(() => {
    // 2. Establish real-time socket connection only when authenticated
    if (user) {
      socketClient.connect();
    }
    return () => {
      socketClient.disconnect();
    };
  }, [user]);

  return <>{children}</>;
}
