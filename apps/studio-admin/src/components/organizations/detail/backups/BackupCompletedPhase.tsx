import { Button } from "@k2net/ui";
import { CheckCircle2, ShieldCheck, Download, ArrowRight } from "lucide-react";
import { useTranslation } from "@k2net/i18n";

interface BackupCompletedPhaseProps {
  downloadFileName?: string;
  fileSizeBytes?: number;
  sha256Fingerprint?: string;
  onDownloadFile?: () => void;
  onClose: () => void;
}

export function BackupCompletedPhase({
  downloadFileName,
  fileSizeBytes = 0,
  sha256Fingerprint = "",
  onDownloadFile,
  onClose,
}: BackupCompletedPhaseProps) {
  const { t } = useTranslation();
  return (
    <div className="space-y-4 pt-2">
      <div className="rounded-xl border border-primary/40 bg-primary/5 p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0">
            <CheckCircle2 className="size-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-foreground">
              {t("organizations.backup_success_title")}
            </h4>
            <p className="text-[11px] text-muted-foreground">
              {t("organizations.backup_success_desc")}
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-3 font-mono text-xs space-y-1.5">
          <div className="flex items-center justify-between text-muted-foreground">
            <span>{t("organizations.backup_file_name")}</span>
            <span className="font-bold text-foreground truncate max-w-xs">{downloadFileName}</span>
          </div>
          {fileSizeBytes > 0 && (
            <div className="flex items-center justify-between text-muted-foreground">
              <span>{t("organizations.backup_file_size")}</span>
              <span className="text-foreground font-semibold">{(fileSizeBytes / 1024).toFixed(1)} KB</span>
            </div>
          )}
          {sha256Fingerprint && (
            <div className="flex items-center justify-between text-muted-foreground">
              <span>SHA-256:</span>
              <span className="text-primary truncate max-w-xs">{sha256Fingerprint.substring(0, 24)}...</span>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-border/60">
        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
          <ShieldCheck className="size-3.5 text-primary" />
          {t("organizations.backup_available_in_table")}
        </span>
        <div className="flex items-center gap-2">
          {onDownloadFile && (
            <Button
              variant="outline"
              size="sm"
              onClick={onDownloadFile}
              className="cursor-pointer gap-1.5"
            >
              <Download className="size-3.5 text-primary" />
              <span>{t("organizations.backup_download_file_btn")}</span>
            </Button>
          )}
          <Button
            size="sm"
            onClick={onClose}
            className="bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer gap-1"
          >
            <span>{t("organizations.backup_done_view_history")}</span>
            <ArrowRight className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
