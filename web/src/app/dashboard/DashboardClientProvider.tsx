"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth.store";
import { useDriveStore } from "@/stores/drive.store";
import { socketClient } from "@/lib/socket";
import { ToastContainer } from "@/components/ui/ToastContainer";
import { FloatingTransferHub } from "@/components/transfers/FloatingTransferHub";

export function DashboardClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { checkSession, user } = useAuthStore();

  useEffect(() => {
    void checkSession();
  }, [checkSession]);

  useEffect(() => {
    if (user) {
      socketClient.connect();
      void useDriveStore.getState().syncActiveMigration();
    }
    return () => {
      socketClient.disconnect();
    };
  }, [user]);

  return (
    <>
      {children}
      <FloatingTransferHub />
      <ToastContainer />
    </>
  );
}
