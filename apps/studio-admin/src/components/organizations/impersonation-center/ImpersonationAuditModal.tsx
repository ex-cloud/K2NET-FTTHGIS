import { ShieldAlert, ShieldCheck } from "lucide-react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@k2net/ui";
import type { ImpersonationSessionItem } from "@/hooks/useImpersonationCenter";
import { formatDuration, formatTimestamp } from "./types";
import { getStatusBadge } from "./ImpersonationHistoryTable";
import { useTranslation } from "@k2net/i18n";

interface ImpersonationAuditModalProps {
  selectedSession: ImpersonationSessionItem | null;
  onClose: () => void;
}

export function ImpersonationAuditModal({
  selectedSession,
  onClose,
}: ImpersonationAuditModalProps) {
  const { t } = useTranslation();
  if (!selectedSession) return null;

  return (
    <Dialog open={Boolean(selectedSession)} onOpenChange={onClose}>
      <DialogContent className="max-w-lg border-border bg-card text-foreground">
        <DialogHeader>
          <div className="flex items-center gap-2 text-amber-500 mb-1">
            <ShieldAlert className="h-5 w-5" />
            <span className="text-xs font-mono font-bold tracking-wider uppercase">
              {t("organizations.impersonation_audit_badge")}
            </span>
          </div>
          <DialogTitle className="text-lg font-bold">
            {t("organizations.impersonation_audit_title")}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {t("organizations.impersonation_audit_desc")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          <div className="grid grid-cols-2 gap-3 p-3 rounded-lg border border-border/80 bg-muted/30">
            <div>
              <span className="text-muted-foreground">{t("organizations.impersonation_session_status")}:</span>
              <div className="mt-1">{getStatusBadge(selectedSession.status)}</div>
            </div>
            <div>
              <span className="text-muted-foreground">{t("organizations.impersonation_total_duration")}:</span>
              <div className="mt-1 font-mono font-bold text-foreground">
                {formatDuration(selectedSession.durationSeconds)}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between border-b border-border/50 pb-1.5">
              <span className="text-muted-foreground">{t("organizations.col_actor")}:</span>
              <span className="font-semibold text-foreground">{selectedSession.actorEmail}</span>
            </div>
            <div className="flex justify-between border-b border-border/50 pb-1.5">
              <span className="text-muted-foreground">{t("organizations.col_target_org")}:</span>
              <span className="font-semibold text-foreground">
                {selectedSession.targetOrgName} ({selectedSession.targetOrgSlug})
              </span>
            </div>
            <div className="flex justify-between border-b border-border/50 pb-1.5">
              <span className="text-muted-foreground">{t("organizations.impersonation_ticket_no")}:</span>
              <span className="font-mono text-primary">{selectedSession.ticketReference || "—"}</span>
            </div>
            <div className="flex justify-between border-b border-border/50 pb-1.5">
              <span className="text-muted-foreground">{t("organizations.impersonation_step_up_verified")}:</span>
              <span className="font-mono text-foreground flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                <span>{formatTimestamp(selectedSession.stepUpVerifiedAt)}</span>
              </span>
            </div>
            <div className="flex justify-between border-b border-border/50 pb-1.5">
              <span className="text-muted-foreground">{t("organizations.col_started_at")}:</span>
              <span className="font-mono text-foreground">{formatTimestamp(selectedSession.startedAt)}</span>
            </div>
            <div className="flex justify-between border-b border-border/50 pb-1.5">
              <span className="text-muted-foreground">{t("organizations.impersonation_expires_revoked_at")}:</span>
              <span className="font-mono text-foreground">
                {formatTimestamp(selectedSession.revokedAt || selectedSession.expiresAt)}
              </span>
            </div>
          </div>

          <div className="space-y-1.5 pt-1">
            <span className="font-semibold text-foreground">{t("organizations.impersonation_investigation_reason")}:</span>
            <div className="p-3 rounded-md bg-muted/40 border border-border text-foreground leading-relaxed">
              {selectedSession.reason}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button size="sm" variant="outline" onClick={onClose} className="text-xs cursor-pointer">
            {t("common.close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
