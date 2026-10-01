import {
  MessageSquare,
  Download,
  FileJson,
  X,
  PlayCircle,
  PauseCircle,
} from "lucide-react";
import { Button, ActionTooltip } from "@k2net/ui";
import { usePermissions } from "@/hooks/use-permissions";
import { useTranslation } from "@k2net/i18n";

interface OrganizationBulkActionBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBulkSuspend: () => void;
  onBulkResume: () => void;
  onBulkBroadcast: () => void;
  onBulkExport: () => void;
  onBulkBackupJson?: () => void;
}

export function OrganizationBulkActionBar({
  selectedCount,
  onClearSelection,
  onBulkSuspend,
  onBulkResume,
  onBulkBroadcast,
  onBulkExport,
  onBulkBackupJson,
}: OrganizationBulkActionBarProps) {
  const { t } = useTranslation();
  const { canAccess } = usePermissions();
  const canUpdateOrg = canAccess(["system.organizations.update", "system.organizations.manage"]);
  const canBroadcast = canAccess(["system.organizations.manage", "system.organizations.update"]);
  const canExport = canAccess(["system.organizations.view", "orgs.view"]);
  const canBackup = canAccess(["system.organizations.manage", "system.backup.manage"]);

  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-16 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-[95vw] overflow-x-auto animate-in fade-in slide-in-from-bottom-4 duration-200">
      <div className="flex items-center gap-3 px-3.5 py-1.5 rounded-md border border-border/80 bg-popover/90 backdrop-blur-xl shadow-lg text-xs whitespace-nowrap">
        {/* Selected Count Badge */}
        <div className="flex items-center gap-2 pr-3 border-r border-border/60">
          <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-mono text-[10px] font-bold">
            {selectedCount}
          </div>
          <span className="font-medium text-foreground">
            {selectedCount > 1
              ? t("organizations.bulk_selected_count_plural", { count: selectedCount })
              : t("organizations.bulk_selected_count", { count: selectedCount })}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5">
          <ActionTooltip
            label={
              canUpdateOrg
                ? t("organizations.bulk_resume_tooltip")
                : t("organizations.readonly_no_update_perm")
            }
          >
            <Button
              variant="outline"
              size="sm"
              onClick={onBulkResume}
              disabled={!canUpdateOrg}
              className="h-7 text-xs border-border bg-card/80 hover:bg-primary/10 hover:text-primary hover:border-primary/30 gap-1.5 disabled:opacity-50"
            >
              <PlayCircle className="h-3 w-3" />
              <span>{t("common.resume")}</span>
            </Button>
          </ActionTooltip>

          <ActionTooltip
            label={
              canUpdateOrg
                ? t("organizations.bulk_suspend_tooltip")
                : t("organizations.readonly_no_update_perm")
            }
          >
            <Button
              variant="outline"
              size="sm"
              onClick={onBulkSuspend}
              disabled={!canUpdateOrg}
              className="h-7 text-xs border-border bg-card/80 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 gap-1.5 disabled:opacity-50"
            >
              <PauseCircle className="h-3 w-3" />
              <span>{t("common.suspend")}</span>
            </Button>
          </ActionTooltip>

          <ActionTooltip
            label={
              canBroadcast
                ? t("organizations.bulk_broadcast_tooltip")
                : t("organizations.readonly_no_manage_perm")
            }
          >
            <Button
              variant="outline"
              size="sm"
              onClick={onBulkBroadcast}
              disabled={!canBroadcast}
              className="h-7 text-xs border-border bg-card/80 hover:bg-primary/10 hover:text-primary hover:border-primary/30 gap-1.5 disabled:opacity-50"
            >
              <MessageSquare className="h-3 w-3" />
              <span>{t("common.broadcast")}</span>
            </Button>
          </ActionTooltip>

          <ActionTooltip
            label={
              canExport
                ? t("organizations.bulk_export_tooltip")
                : t("organizations.readonly_no_view_perm")
            }
          >
            <Button
              variant="outline"
              size="sm"
              onClick={onBulkExport}
              disabled={!canExport}
              className="h-7 text-xs border-border bg-card/80 hover:bg-accent text-foreground gap-1.5 disabled:opacity-50"
            >
              <Download className="h-3 w-3" />
              <span>Export CSV</span>
            </Button>
          </ActionTooltip>

          {onBulkBackupJson && (
            <ActionTooltip
              label={
                canBackup
                  ? t("organizations.bulk_backup_json_tooltip")
                  : t("organizations.readonly_no_backup_perm")
              }
            >
              <Button
                variant="outline"
                size="sm"
                onClick={onBulkBackupJson}
                disabled={!canBackup}
                className="h-7 text-xs border-border bg-card/80 hover:bg-primary/10 hover:text-primary hover:border-primary/30 text-foreground gap-1.5 disabled:opacity-50"
              >
                <FileJson className="h-3 w-3 text-primary" />
                <span>Backup JSON</span>
              </Button>
            </ActionTooltip>
          )}
        </div>

        {/* Clear Selection Button */}
        <div className="pl-2 border-l border-border/60">
          <ActionTooltip label={t("common.clear_selection")} shortcut="Esc">
            <button
              onClick={onClearSelection}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </ActionTooltip>
        </div>
      </div>
    </div>
  );
}
