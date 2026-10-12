"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth.store";
import { socketClient } from "@/lib/socket";

export default function DashboardLayout({
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

    // 3. Fallback active session heartbeat every 15 seconds
    const interval = setInterval(() => {
      void checkSession();
    }, 15000);

    return () => clearInterval(interval);
  }, [checkSession]);

  return <>{children}</>;
}
