import { Badge, Button } from "@k2net/ui";
import { Database, Upload, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface BackupsHeaderBarProps {
  onOpenImportModal?: () => void;
  onTriggerSnapshot: () => void;
  triggering: boolean;
}

export function BackupsHeaderBar({
  onOpenImportModal,
  onTriggerSnapshot,
  triggering,
}: BackupsHeaderBarProps) {
  return (
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
            className="h-8 px-3 text-xs border-border gap-1.5 shadow-xs cursor-pointer"
          >
            <Upload className="h-3.5 w-3.5" />
            <span>Restore / Import</span>
          </Button>
        )}
        <Button
          size="sm"
          onClick={onTriggerSnapshot}
          disabled={triggering}
          className="h-8 px-3 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 shadow-xs cursor-pointer"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", triggering && "animate-spin")} />
          <span>{triggering ? "Creating Snapshot..." : "Trigger Full Backup Now"}</span>
        </Button>
      </div>
    </div>
  );
}
