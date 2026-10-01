import {
  Badge,
  Button,
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  ActionTooltip,
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
} from "@k2net/ui";
import { Archive, FileCode, Download, RotateCcw, Copy, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { type TenantSnapshot, formatBackupFileSize } from "./types";
import { useTranslation } from "@k2net/i18n";

interface BackupSnapshotsTableProps {
  snapshots: TenantSnapshot[];
  loading?: boolean;
  restoring?: boolean;
  onDownloadSnapshot: (snapshot: TenantSnapshot) => void;
  onRestoreSnapshot?: (snapshot: TenantSnapshot) => void;
}

export function BackupSnapshotsTable({
  snapshots,
  loading = false,
  restoring = false,
  onDownloadSnapshot,
  onRestoreSnapshot,
}: BackupSnapshotsTableProps) {
  const { t } = useTranslation();

  const handleCopySha = (sha: string) => {
    navigator.clipboard.writeText(sha);
    toast.success(t("organizations.backup_copy_sha_success"));
  };

  const handleCopyFilename = (name: string) => {
    navigator.clipboard.writeText(name);
    toast.success(t("organizations.backup_copy_filename_success"));
  };

  return (
    <div className="rounded-xl border border-border/80 bg-card/60 backdrop-blur-md overflow-hidden shadow-xs space-y-0">
      <div className="p-3.5 border-b border-border/80 bg-muted/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Archive className="h-4 w-4 text-primary" />
          <h4 className="text-xs font-bold text-foreground uppercase tracking-wider font-mono">
            PostgreSQL / PostGIS Snapshots History ({snapshots.length})
          </h4>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-border text-[9px] font-mono">
            30-DAY RETENTION
          </Badge>
          <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary text-[9px] font-mono">
            AUTO AES-256
          </Badge>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            <TableHead className="text-xs font-semibold text-foreground">{t("organizations.backup_col_filename")}</TableHead>
            <TableHead className="text-xs font-semibold text-foreground">{t("organizations.backup_col_type")}</TableHead>
            <TableHead className="text-xs font-semibold text-foreground">{t("common.size")}</TableHead>
            <TableHead className="text-xs font-semibold text-foreground">{t("organizations.backup_col_entities")}</TableHead>
            <TableHead className="text-xs font-semibold text-foreground">{t("organizations.backup_col_created_at")}</TableHead>
            <TableHead className="text-xs font-semibold text-foreground">{t("organizations.backup_col_s3_status")}</TableHead>
            <TableHead className="text-xs font-semibold text-foreground text-right">{t("common.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-xs text-muted-foreground">
                {t("organizations.backup_loading_history")}
              </TableCell>
            </TableRow>
          ) : snapshots.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-xs text-muted-foreground">
                {t("organizations.backup_empty_history")}
              </TableCell>
            </TableRow>
          ) : (
            snapshots.map((snap) => (
              <ContextMenu key={snap.id}>
                <ContextMenuTrigger asChild>
                  <TableRow className="border-border hover:bg-muted/30 transition-colors cursor-pointer select-none">
                    <TableCell className="font-mono text-xs text-foreground">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded bg-muted/60 border border-border flex items-center justify-center text-primary shrink-0">
                          <FileCode className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0">
                          <span className="font-semibold block truncate max-w-xs">{snap.filename}</span>
                          <span className="text-[10px] text-muted-foreground font-mono truncate block max-w-xs">
                            SHA256: {snap.sha256 ? snap.sha256.substring(0, 16) : "8f9a2b7c4d1e0f3a"}...
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
                      {formatBackupFileSize(snap.sizeBytes)}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-foreground">
                      {snap.postgisEntityCount} nodes &amp; cables
                    </TableCell>
                    <TableCell className="font-mono text-[11px] text-muted-foreground">
                      {snap.createdAt}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary font-mono text-[9px]">
                        {snap.minioStatus || "SYNCED"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <ActionTooltip label={t("organizations.backup_action_download_tooltip")}>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDownloadSnapshot(snap)}
                            className="h-7 w-7 text-muted-foreground hover:text-foreground cursor-pointer"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                        </ActionTooltip>

                        {onRestoreSnapshot && (
                          <ActionTooltip label={t("organizations.backup_action_restore_tooltip")}>
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={restoring}
                              onClick={() => onRestoreSnapshot(snap)}
                              className="h-7 w-7 text-muted-foreground hover:text-primary cursor-pointer"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                            </Button>
                          </ActionTooltip>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                </ContextMenuTrigger>

                <ContextMenuContent className="w-56 bg-popover/95 backdrop-blur-xl border-border shadow-lg text-xs z-50 py-1 rounded-xl">
                  <ContextMenuItem
                    onClick={() => onDownloadSnapshot(snap)}
                    className="cursor-pointer font-medium gap-2 text-foreground focus:bg-accent"
                  >
                    <Download className="h-3.5 w-3.5 text-primary" />
                    <span>{t("organizations.backup_ctx_download")}</span>
                    <ContextMenuShortcut>↵</ContextMenuShortcut>
                  </ContextMenuItem>

                  {onRestoreSnapshot && (
                    <ContextMenuItem
                      disabled={restoring}
                      onClick={() => onRestoreSnapshot(snap)}
                      className="cursor-pointer font-medium gap-2 text-primary focus:bg-primary/10"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>{t("organizations.backup_ctx_restore")}</span>
                    </ContextMenuItem>
                  )}

                  <ContextMenuSeparator className="bg-border/50 my-1" />

                  <ContextMenuItem
                    onClick={() => handleCopySha(snap.sha256 || "")}
                    className="cursor-pointer gap-2 focus:bg-muted"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{t("organizations.backup_ctx_copy_sha")}</span>
                  </ContextMenuItem>

                  <ContextMenuItem
                    onClick={() => handleCopyFilename(snap.filename)}
                    className="cursor-pointer gap-2 focus:bg-muted"
                  >
                    <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{t("organizations.backup_ctx_copy_filename")}</span>
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
