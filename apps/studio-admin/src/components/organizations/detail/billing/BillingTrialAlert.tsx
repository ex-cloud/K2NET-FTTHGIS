import * as React from "react";
import { Button, ActionTooltip } from "@k2net/ui";
import { Calendar, Clock, ShieldAlert } from "lucide-react";
import { usePermissions } from "@/hooks/use-permissions";
import type { TenantSubscriptionSummary } from "@/hooks/useTenantSubscription";
import { BillingExtendTrialModal } from "./BillingExtendTrialModal";

interface BillingTrialAlertProps {
  orgName?: string;
  status: string;
  summary: TenantSubscriptionSummary | null;
  onExtendTrial: (days: number, reason?: string) => Promise<void> | void;
}

export function BillingTrialAlert({
  orgName = "Organisasi",
  status,
  summary,
  onExtendTrial,
}: BillingTrialAlertProps) {
  const { canAccess } = usePermissions();
  const canManageOrg = canAccess(["system.organizations.manage", "system.organizations.update"]);
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const isExpired = status === "TRIAL_EXPIRED" || Boolean(summary?.isTrialExpired);
  const isTrial = status === "TRIAL" || Boolean(summary?.trialExpiresAt);

  const cutOffFormatted = React.useMemo(() => {
    if (!summary?.gracePeriodUntil) return null;
    try {
      const date = new Date(summary.gracePeriodUntil);
      return new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(date);
    } catch {
      return null;
    }
  }, [summary?.gracePeriodUntil]);

  const graceDaysRemaining = React.useMemo(() => {
    if (!summary?.gracePeriodUntil) return 0;
    try {
      const diffMs = new Date(summary.gracePeriodUntil).getTime() - Date.now();
      return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    } catch {
      return 0;
    }
  }, [summary?.gracePeriodUntil]);

  if (!isTrial && !isExpired) {
    return null;
  }

  return (
    <>
      <div
        className={`p-3.5 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs ${
          isExpired
            ? "border-amber-500/40 bg-amber-500/10 text-foreground"
            : "border-blue-500/30 bg-blue-500/10 text-foreground"
        }`}
      >
        <div className="flex items-start sm:items-center gap-2.5 min-w-0">
          {isExpired ? (
            <ShieldAlert className="h-4 w-4 text-amber-500 shrink-0 mt-0.5 sm:mt-0" />
          ) : (
            <Clock className="h-4 w-4 text-blue-500 shrink-0 mt-0.5 sm:mt-0" />
          )}
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-foreground">
                {isExpired ? "Status Evaluasi: Trial Kedaluwarsa (Proyek Di-Pause)" : "Status Evaluasi: Starter Free Trial (14 Hari)"}
              </span>
              {isExpired && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-500 border border-amber-500/30 font-mono">
                  Cut-off: {graceDaysRemaining > 0 ? `${graceDaysRemaining} hari lagi` : "Hari ini"} ({cutOffFormatted || "30 Hari Inactivity"})
                </span>
              )}
            </div>
            <p className="text-muted-foreground text-[11px] leading-relaxed">
              {isExpired
                ? `Masa trial 14 hari telah habis. Proyek berada dalam mode Read-Only. Organisasi akan dihapus otomatis (Nuclear Purge) pada tanggal cut-off jika tidak di-upgrade atau diperpanjang.`
                : `Sisa ${summary?.trialDaysRemaining ?? 14} hari masa evaluasi aktif.`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
          <ActionTooltip
            label={
              canManageOrg
                ? "Buka formulir perpanjangan masa trial"
                : "Akses Read-Only: Memerlukan izin system.organizations.manage"
            }
          >
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsModalOpen(true)}
              disabled={!canManageOrg}
              className="h-7 text-xs border-amber-500/40 bg-card hover:bg-amber-500/20 text-foreground font-medium cursor-pointer disabled:opacity-50 gap-1.5"
            >
              <Calendar className="h-3.5 w-3.5 text-amber-500" />
              <span>Perpanjang Masa Trial</span>
            </Button>
          </ActionTooltip>
        </div>
      </div>

      {/* Confirmation & Duration Selection Modal */}
      <BillingExtendTrialModal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        orgName={orgName}
        summary={summary}
        onConfirmExtend={async (days, reason) => {
          await onExtendTrial(days, reason);
        }}
      />
    </>
  );
}
