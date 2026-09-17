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
  const { canAccess } = usePermissions();
  const canUpdateOrg = canAccess(["system.organizations.update", "system.organizations.manage"]);
  const canBroadcast = canAccess(["system.organizations.manage", "system.organizations.update"]);
  const canExport = canAccess(["system.organizations.view", "orgs.view"]);
  const canBackup = canAccess(["system.organizations.manage", "system.backup.manage"]);

  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-200">
      <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl border border-border/80 bg-popover/90 backdrop-blur-xl shadow-lg text-xs">
        {/* Selected Count Badge */}
        <div className="flex items-center gap-2 pr-3 border-r border-border/60">
          <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-mono text-[10px] font-bold">
            {selectedCount}
          </div>
          <span className="font-medium text-foreground">
            {selectedCount} organization{selectedCount > 1 ? "s" : ""} selected
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5">
          <ActionTooltip
            label={
              canUpdateOrg
                ? "Resume all selected organizations"
                : "Akses Read-Only: Memerlukan izin system.organizations.update"
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
              <span>Resume</span>
            </Button>
          </ActionTooltip>

          <ActionTooltip
            label={
              canUpdateOrg
                ? "Suspend all selected organizations"
                : "Akses Read-Only: Memerlukan izin system.organizations.update"
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
              <span>Suspend</span>
            </Button>
          </ActionTooltip>

          <ActionTooltip
            label={
              canBroadcast
                ? "Send announcement notification to selected tenants"
                : "Akses Read-Only: Memerlukan izin system.organizations.manage"
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
              <span>Broadcast</span>
            </Button>
          </ActionTooltip>

          <ActionTooltip
            label={
              canExport
                ? "Export selected organizations to CSV"
                : "Akses Read-Only: Memerlukan izin system.organizations.view"
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
                  ? "Unduh paket arsip cadangan (.JSON) organisasi terpilih"
                  : "Akses Read-Only: Memerlukan izin system.backup.manage"
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
          <ActionTooltip label="Clear Selection" shortcut="Esc">
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
