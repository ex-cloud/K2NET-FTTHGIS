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

interface ImpersonationAuditModalProps {
  selectedSession: ImpersonationSessionItem | null;
  onClose: () => void;
}

export function ImpersonationAuditModal({
  selectedSession,
  onClose,
}: ImpersonationAuditModalProps) {
  if (!selectedSession) return null;

  return (
    <Dialog open={Boolean(selectedSession)} onOpenChange={onClose}>
      <DialogContent className="max-w-lg border-border bg-card text-foreground">
        <DialogHeader>
          <div className="flex items-center gap-2 text-amber-500 mb-1">
            <ShieldAlert className="h-5 w-5" />
            <span className="text-xs font-mono font-bold tracking-wider uppercase">
              Audit Record Impersonasi
            </span>
          </div>
          <DialogTitle className="text-lg font-bold">
            Detail Forensik Akses Tenant
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Rekaman audit lengkap identitas ganda (*dual-identity audit*) untuk kepatuhan hukum dan regulasi.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          <div className="grid grid-cols-2 gap-3 p-3 rounded-lg border border-border/80 bg-muted/30">
            <div>
              <span className="text-muted-foreground">Status Sesi:</span>
              <div className="mt-1">{getStatusBadge(selectedSession.status)}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Total Durasi:</span>
              <div className="mt-1 font-mono font-bold text-foreground">
                {formatDuration(selectedSession.durationSeconds)}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between border-b border-border/50 pb-1.5">
              <span className="text-muted-foreground">Admin Pelaksana:</span>
              <span className="font-semibold text-foreground">{selectedSession.actorEmail}</span>
            </div>
            <div className="flex justify-between border-b border-border/50 pb-1.5">
              <span className="text-muted-foreground">Tenant Target:</span>
              <span className="font-semibold text-foreground">
                {selectedSession.targetOrgName} ({selectedSession.targetOrgSlug})
              </span>
            </div>
            <div className="flex justify-between border-b border-border/50 pb-1.5">
              <span className="text-muted-foreground">Nomor Tiket:</span>
              <span className="font-mono text-primary">{selectedSession.ticketReference || "—"}</span>
            </div>
            <div className="flex justify-between border-b border-border/50 pb-1.5">
              <span className="text-muted-foreground">Step-Up MFA Verified:</span>
              <span className="font-mono text-foreground flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                <span>{formatTimestamp(selectedSession.stepUpVerifiedAt)}</span>
              </span>
            </div>
            <div className="flex justify-between border-b border-border/50 pb-1.5">
              <span className="text-muted-foreground">Waktu Mulai:</span>
              <span className="font-mono text-foreground">{formatTimestamp(selectedSession.startedAt)}</span>
            </div>
            <div className="flex justify-between border-b border-border/50 pb-1.5">
              <span className="text-muted-foreground">Waktu Kedaluwarsa/Berakhir:</span>
              <span className="font-mono text-foreground">
                {formatTimestamp(selectedSession.revokedAt || selectedSession.expiresAt)}
              </span>
            </div>
          </div>

          <div className="space-y-1.5 pt-1">
            <span className="font-semibold text-foreground">Alasan &amp; Dokumen Investigasi:</span>
            <div className="p-3 rounded-md bg-muted/40 border border-border text-foreground leading-relaxed">
              {selectedSession.reason}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button size="sm" variant="outline" onClick={onClose} className="text-xs cursor-pointer">
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
