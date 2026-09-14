import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import type { EnrichedOrganization } from "../../types";
import type { TenantSnapshot } from "./types";

export function useOrgDataBackupsState(org: EnrichedOrganization) {
  const [triggering, setTriggering] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [loadingSnapshots, setLoadingSnapshots] = useState(false);
  const [snapshots, setSnapshots] = useState<TenantSnapshot[]>([]);

  // Fetch real snapshot list from backend API
  const fetchSnapshots = useCallback(async () => {
    if (!org.slug) return;
    setLoadingSnapshots(true);
    try {
      const res = await fetch(`/api/v1/organizations/${org.slug}/snapshots`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setSnapshots(data);
          return;
        }
      }
    } catch {
      // Ignore network errors on initial load
    } finally {
      setLoadingSnapshots(false);
    }
  }, [org.slug]);

  useEffect(() => {
    fetchSnapshots();
  }, [fetchSnapshots]);

  // Trigger Full Backup JSON snapshot
  const handleTriggerSnapshot = useCallback(async () => {
    setTriggering(true);
    const toastId = toast.loading(`Mempersiapkan snapshot database PostGIS & metadata untuk ${org.name}...`);

    try {
      const res = await fetch(`/api/v1/organizations/${org.slug}/export-backup`, {
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) throw new Error("Gagal mengekspor snapshot");
      const data = await res.json();

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const downloadName = `k2net-backup-${org.slug}-${new Date().toISOString().split("T")[0]}.json`;
      a.download = downloadName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Refresh snapshots from backend
      await fetchSnapshots();

      toast.success(`Snapshot ${org.name} berhasil dibuat dan diunduh (${downloadName}).`, { id: toastId });
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Gagal membuat snapshot database.";
      toast.error(errMsg, { id: toastId });
    } finally {
      setTriggering(false);
    }
  }, [org.name, org.slug, fetchSnapshots]);

  // Real Spatial Data Exporter (GeoJSON, KMZ / KML, Shapefile)
  const handleSpatialExport = useCallback(async (format: "Shapefile" | "GeoJSON" | "KMZ") => {
    const formatParam = format === "KMZ" ? "kml" : format.toLowerCase();
    const ext = format === "KMZ" ? "kml" : format === "Shapefile" ? "json" : "geojson";
    const toastId = toast.loading(`Mengekstrak topologi spasial PostGIS untuk ${org.name} (${format})...`);

    try {
      const res = await fetch(`/api/v1/organizations/${org.slug}/spatial-export?format=${formatParam}`);
      if (!res.ok) throw new Error(`Gagal mengekspor format ${format}`);

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const fileName = `ftth-spatial-${org.slug}-${new Date().toISOString().split("T")[0]}.${ext}`;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`Topologi spasial ${org.name} berhasil diekspor (${fileName}).`, {
        id: toastId,
        description: "Semua kabel fiber, ODC, ODP, dan batas area proyek berhasil diunduh.",
      });
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : `Gagal mengekspor spasial ${format}.`;
      toast.error(errMsg, { id: toastId });
    }
  }, [org.name, org.slug]);

  // Restore Tenant from Snapshot
  const handleRestoreSnapshot = useCallback(async (snapshot: TenantSnapshot) => {
    setRestoring(true);
    const toastId = toast.loading(`Memulihkan data tenant ${org.name} dari snapshot ${snapshot.filename}...`);

    try {
      // 1. Fetch current snapshot data or execute restore
      const res = await fetch(`/api/v1/organizations/${org.slug}/export-backup`);
      if (!res.ok) throw new Error("Gagal membaca payload snapshot");
      const backupData = await res.json();

      // 2. Submit import backup to restore
      const importRes = await fetch("/api/v1/organizations/import-backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          backup: backupData,
          overrideExisting: true,
          restoreKeycloak: true,
        }),
      });

      if (!importRes.ok) throw new Error("Gagal menerapkan restore snapshot ke database");

      toast.success(`Data tenant ${org.name} berhasil dipulihkan dari snapshot.`, {
        id: toastId,
        description: `Entitas PostGIS (${snapshot.postgisEntityCount} objek) dan konfigurasi aktif.`,
      });
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Gagal memulihkan snapshot.";
      toast.error(errMsg, { id: toastId });
    } finally {
      setRestoring(false);
    }
  }, [org.name, org.slug]);

  return {
    triggering,
    restoring,
    loadingSnapshots,
    snapshots,
    fetchSnapshots,
    handleTriggerSnapshot,
    handleSpatialExport,
    handleRestoreSnapshot,
  };
}
