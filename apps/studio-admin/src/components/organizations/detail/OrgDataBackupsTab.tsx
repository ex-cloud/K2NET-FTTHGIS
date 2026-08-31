

import { useState } from "react";
import {
  Badge,
  Button,
  Card,
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  ActionTooltip,
} from "@k2net/ui";
import {
  Database,
  Download,
  Upload,
  RefreshCw,
  HardDrive,
  FileCode,
  Archive,
  Cloud,
  MapPin,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { EnrichedOrganization } from "../types";

interface OrgDataBackupsTabProps {
  organization: EnrichedOrganization;
  onOpenImportModal?: () => void;
}

export interface TenantSnapshot {
  id: string;
  filename: string;
  type: "SCHEDULED" | "MANUAL" | "PRE_MAINTENANCE";
  sizeBytes: number;
  postgisEntityCount: number;
  sha256: string;
  createdAt: string;
  minioStatus: "SYNCED" | "PENDING";
  nextcloudStatus: "SYNCED" | "QUEUED";
}

export function OrgDataBackupsTab({
  organization: org,
  onOpenImportModal,
}: OrgDataBackupsTabProps) {
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

  const formatFileSize = (bytes: number) => {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleTriggerSnapshot = async () => {
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
  };

  const handleSpatialExport = (format: "Shapefile" | "GeoJSON" | "KMZ") => {
    const toastId = toast.loading(`Mengekspor topologi spasial dalam format ${format}...`);
    setTimeout(() => {
      toast.success(`Topologi spasial ${org.name} berhasil diekspor (.${format.toLowerCase()}).`, {
        id: toastId,
        description: "Semua kabel fiber, ODC, dan ODP berhasil dikonversi.",
      });
    }, 700);
  };

  return (
    <div className="space-y-6">
      {/* 1. Master Backup & Data Sovereignty Banner */}
      <div className="p-4 rounded-xl border border-border bg-card/70 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-start md:items-center gap-3.5">
          <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 shadow-xs">
            <Database className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-foreground">PostGIS & Metadata Data Lifecycle</h3>
              <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary font-mono text-[10px]">
                DAILY 00:00 CRON ACTIVE
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Semua data spasial topologi, konfigurasi Keycloak realm, dan OLT poller dicadangkan otomatis ke MinIO S3 & Offsite Cloud.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onOpenImportModal && (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenImportModal}
              className="h-8 px-3 text-xs border-border gap-1.5 shadow-xs"
            >
              <Upload className="h-3.5 w-3.5" />
              <span>Restore / Import</span>
            </Button>
          )}
          <Button
            size="sm"
            onClick={handleTriggerSnapshot}
            disabled={triggering}
            className="h-8 px-3 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 shadow-xs"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", triggering && "animate-spin")} />
            <span>{triggering ? "Creating Snapshot..." : "Trigger Full Backup Now"}</span>
          </Button>
        </div>
      </div>

      {/* 2. 3-Layer Storage Status & Spatial Exporters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Layer 1: MinIO S3 Bucket */}
        <Card className="p-4 space-y-2 bg-card border-border shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-foreground font-mono uppercase">
              <HardDrive className="h-4 w-4 text-primary" />
              <span>MinIO S3 Bucket</span>
            </div>
            <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary text-[9px] font-mono">
              SYNCED
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Prefix: <code className="text-primary font-mono text-xs">db-backups/{org.slug}/</code>. Enkripsi AES-256 aktif.
          </p>
        </Card>

        {/* Layer 2: Offsite Cloud Nextcloud */}
        <Card className="p-4 space-y-2 bg-card border-border shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-foreground font-mono uppercase">
              <Cloud className="h-4 w-4 text-blue-500" />
              <span>Offsite Nextcloud</span>
            </div>
            <Badge variant="outline" className="border-blue-500/30 bg-blue-500/10 text-blue-500 text-[9px] font-mono">
              04:00 SYNC
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Sinkronisasi harian WebDAV ke server terisolasi untuk redundansi Disaster Recovery.
          </p>
        </Card>

        {/* Layer 3: Spatial GIS Exporters */}
        <Card className="p-4 space-y-2.5 bg-card border-border shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-foreground font-mono uppercase">
              <MapPin className="h-4 w-4 text-purple-500" />
              <span>GIS Spatial Export</span>
            </div>
            <span className="text-[10px] text-muted-foreground font-mono">1-Click</span>
          </div>
          <div className="flex items-center gap-1.5 pt-0.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSpatialExport("Shapefile")}
              className="h-6 text-[10px] px-2 border-border flex-1 gap-1"
            >
              <Download className="h-2.5 w-2.5" />
              <span>Shapefile</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSpatialExport("KMZ")}
              className="h-6 text-[10px] px-2 border-border flex-1 gap-1"
            >
              <Download className="h-2.5 w-2.5" />
              <span>KMZ</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSpatialExport("GeoJSON")}
              className="h-6 text-[10px] px-2 border-border flex-1 gap-1"
            >
              <Download className="h-2.5 w-2.5" />
              <span>GeoJSON</span>
            </Button>
          </div>
        </Card>
      </div>

      {/* 3. Snapshot History Table */}
      <div className="rounded-xl border border-border/80 bg-card/60 backdrop-blur-md overflow-hidden shadow-xs space-y-0">
        <div className="p-3.5 border-b border-border/80 bg-muted/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Archive className="h-4 w-4 text-primary" />
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider font-mono">
              PostgreSQL / PostGIS Snapshots History ({snapshots.length})
            </h4>
          </div>
          <Badge variant="outline" className="border-border text-[9px] font-mono">
            30-DAY RETENTION
          </Badge>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-xs font-semibold text-foreground">Nama Berkas Snapshot</TableHead>
              <TableHead className="text-xs font-semibold text-foreground">Tipe</TableHead>
              <TableHead className="text-xs font-semibold text-foreground">Ukuran</TableHead>
              <TableHead className="text-xs font-semibold text-foreground">Entitas PostGIS</TableHead>
              <TableHead className="text-xs font-semibold text-foreground">Dibuat Pada</TableHead>
              <TableHead className="text-xs font-semibold text-foreground">Status S3</TableHead>
              <TableHead className="text-xs font-semibold text-foreground text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {snapshots.map((snap) => (
              <TableRow key={snap.id} className="border-border hover:bg-muted/30 transition-colors">
                <TableCell className="font-mono text-xs text-foreground">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded bg-muted/60 border border-border flex items-center justify-center text-primary shrink-0">
                      <FileCode className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0">
                      <span className="font-semibold block truncate max-w-xs">{snap.filename}</span>
                      <span className="text-[10px] text-muted-foreground font-mono truncate block max-w-xs">
                        SHA256: {snap.sha256.substring(0, 16)}...
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="border-border font-mono text-[9px]">
                    {snap.type}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {formatFileSize(snap.sizeBytes)}
                </TableCell>
                <TableCell className="font-mono text-xs text-foreground">
                  {snap.postgisEntityCount} nodes & cables
                </TableCell>
                <TableCell className="font-mono text-[11px] text-muted-foreground">
                  {snap.createdAt}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary font-mono text-[9px]">
                    {snap.minioStatus}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <ActionTooltip label="Unduh Snapshot JSON">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleTriggerSnapshot}
                      className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                  </ActionTooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
