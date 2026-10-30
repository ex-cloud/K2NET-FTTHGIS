import { ExternalLink, XCircle, Clock } from "lucide-react";
import {
  Button,
  Badge,
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import type { ImpersonationSessionItem } from "@/hooks/useImpersonationCenter";
import { formatRemaining, formatTimestamp } from "./types";

interface ImpersonationActiveTableProps {
  activeSessions: ImpersonationSessionItem[];
  canForceRevoke: boolean;
  actionLoadingId: string | null;
  onReopenPortal: (slug: string) => void;
  onRevokeClick: (session: ImpersonationSessionItem) => void;
  onRevokeAllClick?: () => void;
}

export function ImpersonationActiveTable({
  activeSessions,
  canForceRevoke,
  actionLoadingId,
  onReopenPortal,
  onRevokeClick,
  onRevokeAllClick,
}: ImpersonationActiveTableProps) {
  const { t } = useTranslation();

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden shadow-2xs">
      <div className="px-5 py-3.5 border-b border-border/80 bg-muted/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse" />
          <h2 className="text-sm font-bold text-foreground">
            {t("organizations.impersonation_live_monitor_title", {
              count: activeSessions.length,
              defaultValue: `Live Active Sessions Monitor (${activeSessions.length})`,
            })}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {activeSessions.length > 1 && canForceRevoke && onRevokeAllClick && (
            <Button
              size="sm"
              variant="destructive"
              onClick={onRevokeAllClick}
              className="h-7 text-xs font-semibold gap-1.5 cursor-pointer"
            >
              <XCircle className="size-3.5" />
              <span>
                {t("organizations.impersonation_btn_revoke_all", {
                  count: activeSessions.length,
                  defaultValue: `Revoke All (${activeSessions.length})`,
                })}
              </span>
            </Button>
          )}
          <Badge variant="outline" className="text-[10px] font-mono">
            {t("organizations.impersonation_auto_poll_badge", { defaultValue: "Auto-poll 15s" })}
          </Badge>
        </div>
      </div>

      {activeSessions.length === 0 ? (
        <div className="py-10 text-center text-xs text-muted-foreground space-y-1">
          <p className="font-medium text-foreground">
            {t("organizations.impersonation_empty_title", { defaultValue: "No active impersonation sessions." })}
          </p>
          <p className="text-[11px]">
            {t("organizations.impersonation_empty_desc", {
              defaultValue: "All tenant operational access is locked and operating under normal boundaries.",
            })}
          </p>
        </div>
      ) : (
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow className="border-b border-border text-xs">
              <TableHead className="font-semibold text-muted-foreground">
                {t("organizations.impersonation_col_admin", { defaultValue: "Admin Actor" })}
              </TableHead>
              <TableHead className="font-semibold text-muted-foreground">
                {t("organizations.impersonation_col_target", { defaultValue: "Target Tenant" })}
              </TableHead>
              <TableHead className="font-semibold text-muted-foreground">
                {t("organizations.impersonation_col_reason", { defaultValue: "Reason & Ticket" })}
              </TableHead>
              <TableHead className="font-semibold text-muted-foreground">
                {t("organizations.impersonation_col_started", { defaultValue: "Start Time" })}
              </TableHead>
              <TableHead className="font-semibold text-muted-foreground">
                {t("organizations.impersonation_col_remaining", { defaultValue: "Time Remaining" })}
              </TableHead>
              <TableHead className="font-semibold text-muted-foreground text-right pr-5">
                {t("organizations.impersonation_col_actions", { defaultValue: "Actions" })}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {activeSessions.map((s) => (
              <TableRow key={s.id} className="border-b border-border/50 hover:bg-muted/30 text-xs">
                <TableCell className="py-3">
                  <div className="space-y-0.5">
                    <div className="font-semibold text-foreground">{s.actorName || s.actorEmail}</div>
                    <div className="text-[11px] font-mono text-muted-foreground">{s.actorEmail}</div>
                  </div>
                </TableCell>

                <TableCell className="py-3">
                  <div className="space-y-0.5">
                    <div className="font-semibold text-foreground">{s.targetOrgName}</div>
                    <div className="text-[11px] font-mono text-muted-foreground">slug: {s.targetOrgSlug}</div>
                  </div>
                </TableCell>

                <TableCell className="py-3 max-w-xs">
                  <div className="space-y-0.5">
                    <p className="line-clamp-1 text-foreground" title={s.reason}>{s.reason}</p>
                    {s.ticketReference && (
                      <Badge variant="outline" className="text-[10px] font-mono">
                        {s.ticketReference}
                      </Badge>
                    )}
                  </div>
                </TableCell>

                <TableCell className="py-3 font-mono text-[11px] text-muted-foreground">
                  {formatTimestamp(s.startedAt)}
                </TableCell>

                <TableCell className="py-3">
                  <Badge variant="outline" className="border-amber-500/40 bg-amber-500/15 text-amber-500 font-mono text-[10px] gap-1 px-2 py-0.5 font-medium">
                    <Clock className="h-3 w-3 animate-spin" />
                    <span>{formatRemaining(s.remainingSeconds)}</span>
                  </Badge>
                </TableCell>

                <TableCell className="py-3 text-right pr-5">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onReopenPortal(s.targetOrgSlug)}
                      className="h-7 text-xs font-semibold gap-1 border-primary/40 text-primary hover:bg-primary/10 cursor-pointer"
                    >
                      <span>{t("organizations.impersonation_btn_open_portal", { defaultValue: "Open Portal" })}</span>
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                    {canForceRevoke ? (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => onRevokeClick(s)}
                        disabled={actionLoadingId === s.id}
                        className="h-7 text-xs font-semibold gap-1 cursor-pointer"
                      >
                        <XCircle className="h-3 w-3" />
                        <span>{t("organizations.impersonation_btn_revoke", { defaultValue: "Revoke Access" })}</span>
                      </Button>
                    ) : (
                      <span className="text-[10px] font-mono text-muted-foreground/60 px-2 py-1 bg-muted/40 rounded border border-border/50">
                        {t("organizations.impersonation_audit_only", { defaultValue: "Audit Only" })}
                      </span>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
