"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Input,
  Label,
  Badge,
} from "@k2net/ui";
import {
  ShieldAlert,
  Lock,
  ExternalLink,
  Loader2,
  AlertTriangle,
  FileText,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/lib/auth-compat";
import { getTenantUrl } from "@/lib/domain";
import type { EnrichedOrganization } from "./types";

interface ImpersonateTenantModalProps {
  organization: EnrichedOrganization | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ImpersonateTenantModal({
  organization,
  isOpen,
  onClose,
}: ImpersonateTenantModalProps) {
  const { data: session, signIn } = useSession();
  const [reason, setReason] = useState("");
  const [ticketReference, setTicketReference] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [conflictError, setConflictError] = useState<string | null>(null);
  const [revokingActive, setRevokingActive] = useState(false);

  // Check for pending impersonation after Keycloak step-up redirect
  useEffect(() => {
    if (!isOpen || !organization) return;
    setConflictError(null);

    const pending = sessionStorage.getItem("pending_impersonate");
    if (pending) {
      try {
        const parsed = JSON.parse(pending);
        if (parsed.orgId === organization.id) {
          sessionStorage.removeItem("pending_impersonate");
          setReason(parsed.reason || "");
          setTicketReference(parsed.ticketReference || "");
          // Auto-trigger with fresh token
          triggerStart(parsed.reason, parsed.ticketReference);
        }
      } catch (e) {
        console.error("Failed to parse pending impersonate", e);
      }
    }
  }, [isOpen, organization]);

  const isReasonValid = reason.trim().length >= 10;

  const handleRevokeActiveSession = async () => {
    setRevokingActive(true);
    try {
      const res = await fetch("/api/v1/system/impersonate/exit-active", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
        },
      });

      if (res.ok) {
        setConflictError(null);
        toast.success("Sesi Sebelumnya Berhasil Diakhiri", {
          description: "Sesi aktif telah ditutup. Silakan lanjutkan.",
        });
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error("Gagal Mengakhiri Sesi", {
          description: data.message || "Terjadi kesalahan saat menutup sesi.",
        });
      }
    } catch (e: any) {
      toast.error("Kesalahan Jaringan", { description: e.message });
    } finally {
      setRevokingActive(false);
    }
  };

  const triggerStart = async (overrideReason?: string, overrideTicket?: string) => {
    if (!organization) return;
    setSubmitting(true);
    setConflictError(null);

    const finalReason = (overrideReason ?? reason).trim();
    const finalTicket = (overrideTicket ?? ticketReference).trim();

    try {
      const res = await fetch(`/api/v1/system/tenants/${organization.slug}/impersonate/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify({
          reason: finalReason,
          ticketReference: finalTicket || undefined,
        }),
      });

      const data = await res.json().catch(() => ({}));

      // Step-Up Authentication Required (403)
      if (res.status === 403 && data.error === "STEP_UP_AUTH_REQUIRED") {
        toast.info("Verifikasi Kredensial Diperlukan", {
          description: "Mengalihkan ke Keycloak untuk verifikasi kata sandi ulang...",
        });

        sessionStorage.setItem(
          "pending_impersonate",
          JSON.stringify({
            orgId: organization.id,
            reason: finalReason,
            ticketReference: finalTicket,
          })
        );

        await signIn(undefined, { prompt: "login", maxAge: 0 });
        return;
      }

      if (res.status === 409) {
        setConflictError(data.details || data.message || "Anda masih memiliki sesi impersonasi aktif untuk tenant lain.");
        toast.error("Gagal Memulai Sesi Impersonasi", {
          description: data.details || "Anda masih memiliki sesi impersonasi aktif. Keluar terlebih dahulu.",
        });
        setSubmitting(false);
        return;
      }

      if (!res.ok) {
        toast.error("Gagal Memulai Impersonasi", {
          description: data.details || data.message || "Terjadi kesalahan pada sistem.",
        });
        setSubmitting(false);
        return;
      }

      // Success (200 OK)
      const { exchangeCode, targetTenantSlug } = data;
      const tenantBaseUrl = getTenantUrl(targetTenantSlug || organization.slug);
      const targetUrl = `${tenantBaseUrl}/?impersonate_code=${exchangeCode}`;

      toast.success(`Sesi Impersonasi Aktif: ${organization.name}`, {
        description: "Membuka portal tenant di tab baru...",
      });

      window.open(targetUrl, "_blank");
      onClose();
      setReason("");
      setTicketReference("");
    } catch (err: any) {
      toast.error("Terjadi Kesalahan Jaringan", {
        description: err.message || "Pastikan koneksi internet stabil.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!organization) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !submitting && onClose()}>
      <DialogContent className="max-w-lg border-border bg-card text-foreground">
        <DialogHeader>
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-500 mb-1">
            <ShieldAlert className="h-5 w-5" />
            <span className="text-xs font-mono font-bold tracking-wider uppercase">
              Support Mode — God Mode Impersonation
            </span>
          </div>
          <DialogTitle className="text-lg font-bold">
            Mulai Sesi Impersonasi Tenant
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-xs">
            Akses portal tenant atas nama dukungan operasional dengan pengawasan ketat dual-identity audit.
          </DialogDescription>
        </DialogHeader>

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

          {/* Active Session Conflict Box */}
          {conflictError && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive space-y-2">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold">Sesi Impersonasi Masih Aktif</p>
                  <p className="text-[11px] leading-relaxed opacity-90">{conflictError}</p>
                </div>
              </div>
              <div className="pt-1 flex justify-end">
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleRevokeActiveSession}
                  disabled={revokingActive}
                  className="h-7 text-xs font-semibold"
                >
                  {revokingActive ? "Mengakhiri Sesi..." : "Akhiri Sesi Aktif Sebelumnya"}
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
                Sistem akan memvalidasi kesegaran otentikasi akun Anda (≤ 120 detik). Jika telah kedaluwarsa, Anda akan diminta memasukkan kredensial ulang sebelum sesi dibuka.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={submitting}
            className="text-xs"
          >
            Batal
          </Button>
          <Button
            onClick={() => triggerStart()}
            disabled={!isReasonValid || submitting}
            className="text-xs gap-1.5 bg-amber-600 hover:bg-amber-700 text-primary-foreground font-semibold"
          >
            {submitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Memproses Sesi...</span>
              </>
            ) : (
              <>
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Mulai Impersonasi</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
