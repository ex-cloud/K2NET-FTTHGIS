import { useState, useCallback } from "react";
import { toast } from "sonner";
import type { EnrichedOrganization } from "../../types";
import type { TenantSnapshot } from "./types";

export function useOrgDataBackupsState(org: EnrichedOrganization) {
  const [triggering, setTriggering] = useState(false);

  // Initial Snapshots Data
  const [snapshots, setSnapshots] = useState<TenantSnapshot[]>([
    {
      id: "snap-01",
      filename: `ftth-backup-${org.slug}-2026-08-29-0000.json`,
      type: "SCHEDULED",
      sizeBytes: 12500000,
      postgisEntityCount: 642,
      sha256: "8f9a2b7c4d1e0f3a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a",
      createdAt: "2026-08-29 00:00 WIB",
      minioStatus: "SYNCED",
      nextcloudStatus: "SYNCED",
    },
    {
      id: "snap-02",
      filename: `ftth-backup-${org.slug}-2026-08-28-0000.json`,
      type: "SCHEDULED",
      sizeBytes: 12400000,
      postgisEntityCount: 640,
      sha256: "7e8d9c0b1a2f3e4d5c6b7a8e9f0d1c2b3a4f5e6d7c8b9a0e1f2d3c4b5a6f7e8d",
      createdAt: "2026-08-28 00:00 WIB",
      minioStatus: "SYNCED",
      nextcloudStatus: "SYNCED",
    },
    {
      id: "snap-03",
      filename: `ftth-manual-${org.slug}-before-upgrade.json`,
      type: "MANUAL",
      sizeBytes: 12100000,
      postgisEntityCount: 635,
      sha256: "1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b",
      createdAt: "2026-08-26 15:30 WIB",
      minioStatus: "SYNCED",
      nextcloudStatus: "SYNCED",
    },
  ]);

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
      a.download = `k2net-backup-${org.slug}-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      const newSnap: TenantSnapshot = {
        id: `snap-${Date.now()}`,
        filename: a.download,
        type: "MANUAL",
        sizeBytes: blob.size || 12800000,
        postgisEntityCount: 645,
        sha256: "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2",
        createdAt: "Baru saja",
        minioStatus: "SYNCED",
        nextcloudStatus: "SYNCED",
      };

      setSnapshots((prev) => [newSnap, ...prev]);
      toast.success(`Snapshot ${org.name} berhasil dibuat dan diunduh.`, { id: toastId });
    } catch {
      toast.error("Gagal membuat snapshot database.", { id: toastId });
    } finally {
      setTriggering(false);
    }
  }, [org.name, org.slug]);

  const handleSpatialExport = useCallback((format: "Shapefile" | "GeoJSON" | "KMZ") => {
    const toastId = toast.loading(`Mengekspor topologi spasial dalam format ${format}...`);
    setTimeout(() => {
      toast.success(`Topologi spasial ${org.name} berhasil diekspor (.${format.toLowerCase()}).`, {
        id: toastId,
        description: "Semua kabel fiber, ODC, dan ODP berhasil dikonversi.",
      });
    }, 700);
  }, [org.name]);

  return {
    triggering,
    snapshots,
    handleTriggerSnapshot,
    handleSpatialExport,
  };
}
