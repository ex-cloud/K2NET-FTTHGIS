import { useState, useCallback, useEffect } from "react";
import type { TenantSnapshot } from "./types";

export function useSnapshotList(
  orgIdentifier: string,
  authHeaders: (extra?: Record<string, string>) => Record<string, string>
) {
  const [loadingSnapshots, setLoadingSnapshots] = useState(false);
  const [snapshots, setSnapshots] = useState<TenantSnapshot[]>([]);

  const fetchSnapshots = useCallback(async () => {
    if (!orgIdentifier) return;
    setLoadingSnapshots(true);
    try {
      const res = await fetch(`/api/v1/organizations/${orgIdentifier}/snapshots`, {
        headers: authHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setSnapshots(data);
          return;
        }
      }
    } catch {
      // Ignore network errors on initial load
    } finally {
      setLoadingSnapshots(false);
    }
  }, [orgIdentifier, authHeaders]);

  useEffect(() => {
    fetchSnapshots();
  }, [fetchSnapshots]);

  return {
    snapshots,
    loadingSnapshots,
    fetchSnapshots,
  };
}
