import { useState, useEffect } from "react";
import { Button, Badge, Input } from "@k2net/ui";
import {
  Layers,
  MapPin,
  Lock,
  FileText,
  CreditCard,
  HardDrive,
  Cloud,
  Play,
} from "lucide-react";
import { useTranslation } from "@k2net/i18n";

interface BackupConfigPhaseProps {
  onClose: () => void;
  onStartExecution: (note?: string) => void;
  isOpen: boolean;
}

export function BackupConfigPhase({
  onClose,
  onStartExecution,
  isOpen,
}: BackupConfigPhaseProps) {
  const { t } = useTranslation();
  const [backupNote, setBackupNote] = useState("");

  useEffect(() => {
    if (isOpen) {
      setBackupNote("");
    }
  }, [isOpen]);

  return (
    <div className="space-y-4 pt-2">
      {/* Scope Breakdown */}
      <div className="rounded-xl border border-border bg-muted/20 p-3.5 space-y-3">
        <div className="flex items-center justify-between border-b border-border/60 pb-2">
          <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Layers className="size-3.5 text-primary" />
            Components Included in Backup:
          </span>
          <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary text-[9px] font-mono">
            AES-256 ENCRYPTED
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-start gap-2 p-2 rounded-lg bg-card border border-border/60">
            <MapPin className="size-3.5 text-purple-500 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-foreground">PostGIS Topology</p>
              <p className="text-[10px] text-muted-foreground">Fiber cables, ODC, ODP, &amp; boundaries</p>
            </div>
          </div>

          <div className="flex items-start gap-2 p-2 rounded-lg bg-card border border-border/60">
            <Lock className="size-3.5 text-blue-500 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-foreground">Keycloak 26 IAM</p>
              <p className="text-[10px] text-muted-foreground">Realm, users, roles, &amp; permissions</p>
            </div>
          </div>

          <div className="flex items-start gap-2 p-2 rounded-lg bg-card border border-border/60">
            <FileText className="size-3.5 text-amber-500 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-foreground">Document Vault</p>
              <p className="text-[10px] text-muted-foreground">Tenant PDF/KMZ archive metadata</p>
            </div>
          </div>

          <div className="flex items-start gap-2 p-2 rounded-lg bg-card border border-border/60">
            <CreditCard className="size-3.5 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-foreground">Billing &amp; Quota</p>
              <p className="text-[10px] text-muted-foreground">Plan tiers &amp; entity configurations</p>
            </div>
          </div>
        </div>
      </div>

      {/* Storage Redundancy Note */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center gap-2 p-2.5 rounded-lg border border-border bg-card">
          <HardDrive className="size-4 text-primary shrink-0" />
          <div className="min-w-0">
            <p className="text-[10px] text-muted-foreground">{t("organizations.backup_primary_storage")}</p>
            <p className="font-mono text-xs font-semibold text-foreground truncate">MinIO S3 Bucket</p>
          </div>
        </div>
        <div className="flex items-center gap-2 p-2.5 rounded-lg border border-border bg-card">
          <Cloud className="size-4 text-blue-500 shrink-0" />
          <div className="min-w-0">
            <p className="text-[10px] text-muted-foreground">{t("organizations.backup_cloud_redundancy")}</p>
            <p className="font-mono text-xs font-semibold text-foreground truncate">Nextcloud WebDAV</p>
          </div>
        </div>
      </div>

      {/* Optional Snapshot Label */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-foreground flex items-center justify-between">
          <span>{t("organizations.backup_note_label")}</span>
          <span className="text-[10px] font-normal text-muted-foreground">{t("organizations.backup_note_sublabel")}</span>
        </label>
        <Input
          value={backupNote}
          onChange={(e) => setBackupNote(e.target.value)}
          placeholder={t("organizations.backup_note_placeholder")}
          className="h-9 text-xs"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
        <Button variant="outline" size="sm" onClick={onClose} className="cursor-pointer">
          {t("common.cancel")}
        </Button>
        <Button
          size="sm"
          onClick={() => onStartExecution(backupNote)}
          className="bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer gap-1.5"
        >
          <Play className="size-3.5 fill-current" />
          <span>{t("organizations.backup_start_process_btn")}</span>
        </Button>
      </div>
    </div>
  );
}
