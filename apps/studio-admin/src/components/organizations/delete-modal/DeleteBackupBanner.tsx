import * as React from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";

interface DeleteBackupBannerProps {
  onExportBackup: () => void;
  exportingBackup: boolean;
}

export function DeleteBackupBanner({ onExportBackup, exportingBackup }: DeleteBackupBannerProps) {
  const { t } = useTranslation();
  return (
    <div className="p-3 rounded-xl bg-card border border-border flex items-center justify-between gap-3">
      <div className="space-y-0.5">
        <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <Download className="w-3.5 h-3.5 text-primary" />
          {t("organizations.delete_export_banner_title")}
        </span>
        <p className="text-[11px] text-muted-foreground leading-tight">
          {t("organizations.delete_export_banner_desc")}
        </p>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onExportBackup}
        disabled={exportingBackup}
        className="h-8 text-xs font-medium shrink-0 border-border bg-background hover:bg-muted"
      >
        {exportingBackup ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
        ) : (
          <Download className="w-3.5 h-3.5 mr-1.5" />
        )}
        {t("organizations.delete_export_btn")}
      </Button>
    </div>
  );
}
