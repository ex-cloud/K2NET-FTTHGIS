import * as React from "react";
import { Label, Input, Badge, Button } from "@k2net/ui";
import { ArrowRightLeft, AlertTriangle, FileText, Lock, Clock } from "lucide-react";
import type { EnrichedOrganization } from "../types";

interface ImpersonateFormBodyProps {
  organization: EnrichedOrganization;
  hasDifferentActiveSession: boolean;
  activeTargetOrgName?: string;
  conflictError: string | null;
  reason: string;
  setReason: (reason: string) => void;
  ticketReference: string;
  setTicketReference: (ref: string) => void;
  submitting: boolean;
  isReasonValid: boolean;
  onRetryWithAutoSwitch: () => void;
}

export function ImpersonateFormBody({
  organization,
  hasDifferentActiveSession,
  activeTargetOrgName,
  conflictError,
  reason,
  setReason,
  ticketReference,
  setTicketReference,
  submitting,
  isReasonValid,
  onRetryWithAutoSwitch,
}: ImpersonateFormBodyProps) {
  return (
    <div className="space-y-4 py-3 text-sm">
      {/* Tenant Target Info */}
      <div className="flex items-center justify-between rounded-lg border border-border/80 bg-muted/40 p-3">
        <div>
          <div className="font-semibold text-foreground">{organization.name}</div>
          <div className="text-xs text-muted-foreground font-mono">slug: {organization.slug}</div>
        </div>
        <Badge variant="outline" className="font-mono text-[10px] uppercase">
          {organization.planTier || "PRO"}
        </Badge>
      </div>

      {/* Seamless Auto-Switch Notification Box */}
      {hasDifferentActiveSession && (
        <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-foreground space-y-2">
          <div className="flex items-start gap-2.5">
            <ArrowRightLeft className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-foreground flex items-center gap-1.5">
                <span>Sesi Aktif di Tenant Lain:</span>
                <span className="font-mono text-primary underline">{activeTargetOrgName}</span>
              </p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Sistem akan secara otomatis mengakhiri sesi aktif di{" "}
                <strong className="text-foreground">{activeTargetOrgName}</strong> dan langsung beralih ke
                portal <strong className="text-foreground">{organization.name}</strong> secara mulus.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Conflict Error Fallback Box */}
      {conflictError && !hasDifferentActiveSession && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive space-y-2">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold">Sesi Impersonasi Lain Masih Terdeteksi</p>
              <p className="text-[11px] leading-relaxed opacity-90">{conflictError}</p>
            </div>
          </div>
          <div className="pt-1 flex justify-end">
            <Button
              size="sm"
              variant="destructive"
              onClick={onRetryWithAutoSwitch}
              disabled={submitting}
              className="h-7 text-xs font-semibold gap-1.5"
            >
              <ArrowRightLeft className="h-3.5 w-3.5" />
              <span>Akhiri Sesi Lama & Beralih Sekarang</span>
            </Button>
          </div>
        </div>
      )}

      {/* Form Reason */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="impersonate-reason" className="text-xs font-semibold">
            Alasan Investigasi / Bantuan <span className="text-destructive">*</span>
          </Label>
          <span
            className={`text-[10px] font-mono ${
              isReasonValid ? "text-muted-foreground" : "text-destructive font-semibold"
            }`}
          >
            {reason.trim().length}/10 karakter min
          </span>
        </div>
        <textarea
          id="impersonate-reason"
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          disabled={submitting}
          placeholder="Jelaskan kebutuhan akses dukungan (cth: Investigasi kendala ODP wilayah timur tiket #4928)..."
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        />
        {!isReasonValid && reason.length > 0 && (
          <p className="text-[10px] text-destructive flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" /> Minimal 10 karakter diperlukan untuk audit kepatuhan.
          </p>
        )}
      </div>

      {/* Form Ticket Reference */}
      <div className="space-y-1.5">
        <Label htmlFor="ticket-ref" className="text-xs font-semibold flex items-center gap-1.5">
          <FileText className="h-3.5 w-3.5 text-muted-foreground" />
          Nomor Tiket Dukungan (Opsional)
        </Label>
        <Input
          id="ticket-ref"
          value={ticketReference}
          onChange={(e) => setTicketReference(e.target.value)}
          disabled={submitting}
          placeholder="Contoh: TKT-2026-9021 atau INC-0042"
          className="text-xs"
        />
      </div>

      {/* Security Alert Box */}
      <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2.5">
        <Lock className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
        <div className="space-y-1 leading-relaxed">
          <p className="font-semibold text-amber-900 dark:text-amber-100 flex items-center gap-1">
            <Clock className="h-3 w-3" /> Time-Box 30 Menit & Step-Up Re-Auth
          </p>
          <p className="text-[11px] opacity-90">
            Sistem akan memvalidasi kesegaran otentikasi akun Anda (≤ 120 detik). Jika telah kedaluwarsa, Anda akan
            diminta memasukkan kredensial ulang sebelum sesi dibuka.
          </p>
        </div>
      </div>
    </div>
  );
}
