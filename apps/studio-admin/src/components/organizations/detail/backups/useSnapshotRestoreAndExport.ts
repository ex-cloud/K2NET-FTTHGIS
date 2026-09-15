import { useState, useCallback } from "react";
import { toast } from "sonner";
import type { EnrichedOrganization } from "../../types";
import type { TenantSnapshot } from "./types";
import { triggerDownloadFile } from "./useBackupPipeline";

export function useSnapshotRestoreAndExport(
  org: EnrichedOrganization,
  orgIdentifier: string,
  authHeaders: (extra?: Record<string, string>) => Record<string, string>
) {
  const [restoring, setRestoring] = useState(false);

  // Download specific snapshot from history table
  const handleDownloadSnapshot = useCallback(async (snapshot: TenantSnapshot) => {
    const toastId = toast.loading(`Menyiapkan unduhan berkas snapshot ${snapshot.filename}...`);
    try {
      const res = await fetch(`/api/v1/organizations/${orgIdentifier}/export-backup`, {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error("Gagal mengambil data snapshot dari server");
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      triggerDownloadFile(blob, snapshot.filename);
      toast.success(`Snapshot ${snapshot.filename} berhasil diunduh.`, { id: toastId });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal mengunduh berkas snapshot";
      toast.error(msg, { id: toastId });
    }
  }, [orgIdentifier, authHeaders]);

  // Real Spatial Data Exporter (GeoJSON, KMZ / KML, Shapefile)
  const handleSpatialExport = useCallback(async (format: "Shapefile" | "GeoJSON" | "KMZ") => {
    const formatParam = format === "KMZ" ? "kml" : format.toLowerCase();
    const ext = format === "KMZ" ? "kml" : format === "Shapefile" ? "json" : "geojson";
    const toastId = toast.loading(`Mengekstrak topologi spasial PostGIS untuk ${org.name} (${format})...`);

    try {
      const res = await fetch(`/api/v1/organizations/${orgIdentifier}/spatial-export?format=${formatParam}`, {
        headers: authHeaders(),
      });
      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        throw new Error(errText || `Gagal mengekspor format ${format}`);
      }

      const blob = await res.blob();
      const fileName = `ftth-spatial-${org.slug || orgIdentifier}-${new Date().toISOString().split("T")[0]}.${ext}`;
      triggerDownloadFile(blob, fileName);

      toast.success(`Topologi spasial ${org.name} berhasil diekspor (${fileName}).`, {
        id: toastId,
        description: "Semua kabel fiber, ODC, ODP, dan batas area proyek berhasil diunduh.",
      });
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : `Gagal mengekspor spasial ${format}.`;
      toast.error(errMsg, { id: toastId });
    }
  }, [org.name, org.slug, orgIdentifier, authHeaders]);

  // Restore Tenant from Snapshot
  const handleRestoreSnapshot = useCallback(async (snapshot: TenantSnapshot) => {
    setRestoring(true);
    const toastId = toast.loading(`Memulihkan data tenant ${org.name} dari snapshot ${snapshot.filename}...`);

    try {
      const res = await fetch(`/api/v1/organizations/${orgIdentifier}/export-backup`, {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error("Gagal membaca payload snapshot");
      const backupData = await res.json();

      const importRes = await fetch("/api/v1/organizations/import-backup", {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          organization: backupData.organization,
          projects: backupData.projects || [],
          mode: "update_existing",
        }),
      });

      if (!importRes.ok) {
        const errText = await importRes.text().catch(() => "");
        throw new Error(errText || "Gagal menerapkan restore snapshot ke database");
      }

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
  }, [org.name, orgIdentifier, authHeaders]);

  return {
    restoring,
    handleDownloadSnapshot,
    handleSpatialExport,
    handleRestoreSnapshot,
  };
}
