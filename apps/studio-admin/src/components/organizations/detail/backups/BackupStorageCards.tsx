import { Badge, Button, Card } from "@k2net/ui";
import { HardDrive, Cloud, MapPin, Download } from "lucide-react";

interface BackupStorageCardsProps {
  slug: string;
  onSpatialExport: (format: "Shapefile" | "GeoJSON" | "KMZ") => void;
}

export function BackupStorageCards({
  slug,
  onSpatialExport,
}: BackupStorageCardsProps) {
  return (
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
          Prefix: <code className="text-primary font-mono text-xs">db-backups/{slug}/</code>. Enkripsi AES-256 aktif.
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
            onClick={() => onSpatialExport("Shapefile")}
            className="h-6 text-[10px] px-2 border-border flex-1 gap-1 cursor-pointer"
          >
            <Download className="h-2.5 w-2.5" />
            <span>Shapefile</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSpatialExport("KMZ")}
            className="h-6 text-[10px] px-2 border-border flex-1 gap-1 cursor-pointer"
          >
            <Download className="h-2.5 w-2.5" />
            <span>KMZ</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSpatialExport("GeoJSON")}
            className="h-6 text-[10px] px-2 border-border flex-1 gap-1 cursor-pointer"
          >
            <Download className="h-2.5 w-2.5" />
            <span>GeoJSON</span>
          </Button>
        </div>
      </Card>
    </div>
  );
}
