"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth.store";
import { socketClient } from "@/lib/socket";

export function DashboardClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { checkSession } = useAuthStore();

  useEffect(() => {
    // 1. Initial session verification
    void checkSession();

    // 2. Establish real-time socket connection for live updates and instant session revocation signals
    socketClient.connect();
  }, [checkSession]);

  return <>{children}</>;
}
