import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export interface PendingRestoreItem {
  id: string;
  provider: string;
  accountEmail: string | null;
  fileCount: number;
}

export function usePendingRestore(apiUrl: string) {
  const searchParams = useSearchParams();
  const [pending, setPending] = useState<PendingRestoreItem | null>(null);

  useEffect(() => {
    const id = searchParams.get("pendingRestoreId");
    const provider = searchParams.get("pendingProvider");
    const count = searchParams.get("pendingCount");
    const email = searchParams.get("pendingEmail");

    if (id && provider && count) {
      setPending({
        id,
        provider,
        accountEmail: email,
        fileCount: parseInt(count, 10) || 1,
      });
      return;
    }

    fetch(`${apiUrl}/providers/pending-restore`, { credentials: "include" })
      .then((res) => (res.ok ? res.json() : { pending: [] }))
      .then((data) => {
        if (data.pending?.[0]) {
          setPending(data.pending[0]);
        } else {
          setPending(null);
        }
      })
      .catch(() => {
        setPending(null);
      });
  }, [searchParams, apiUrl]);

  return { pending, setPending };
}
