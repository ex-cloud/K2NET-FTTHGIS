import * as React from "react";
import { Label, Input, Badge, Button } from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
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
  const { t } = useTranslation();

  return (
    <div className="space-y-4 py-3 text-sm">
      {/* Tenant Target Info */}
      <div className="flex items-center justify-between rounded-lg border border-border/80 bg-muted/40 p-3">
        <div>
          <div className="font-semibold text-foreground">{organization.name}</div>
          <div className="text-xs text-muted-foreground font-mono">
            {t("organizations.impersonation_form_slug_prefix", { slug: organization.slug })}
          </div>
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
                <span>{t("organizations.impersonation_form_active_other_title")}</span>
                <span className="font-mono text-primary underline">{activeTargetOrgName}</span>
              </p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {t("organizations.impersonation_form_auto_switch_desc", {
                  fromOrg: activeTargetOrgName || "",
                  toOrg: organization.name,
                })}
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
              <p className="font-semibold">{t("organizations.impersonation_form_conflict_title")}</p>
              <p className="text-[11px] leading-relaxed opacity-90">{conflictError}</p>
            </div>
          </div>
          <div className="pt-1 flex justify-end">
            <Button
              size="sm"
              variant="destructive"
              onClick={onRetryWithAutoSwitch}
              disabled={submitting}
              className="h-7 text-xs font-medium gap-1.5"
            >
              <ArrowRightLeft className="h-3.5 w-3.5" />
              <span>{t("organizations.impersonation_form_switch_now_btn")}</span>
            </Button>
          </div>
        </div>
      )}

      {/* Form Reason */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="impersonate-reason" className="text-xs font-semibold">
            {t("organizations.impersonation_form_reason_label")} <span className="text-destructive">*</span>
          </Label>
          <span
            className={`text-[10px] font-mono ${
              isReasonValid ? "text-muted-foreground" : "text-destructive font-semibold"
            }`}
          >
            {t("organizations.impersonation_form_reason_counter", { count: reason.trim().length })}
          </span>
        </div>
        <textarea
          id="impersonate-reason"
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          disabled={submitting}
          placeholder={t("organizations.impersonation_form_reason_placeholder")}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        />
        {!isReasonValid && reason.length > 0 && (
          <p className="text-[10px] text-destructive flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" /> {t("organizations.impersonation_form_reason_min_error")}
          </p>
        )}
      </div>

      {/* Form Ticket Reference */}
      <div className="space-y-1.5">
        <Label htmlFor="ticket-ref" className="text-xs font-semibold flex items-center gap-1.5">
          <FileText className="h-3.5 w-3.5 text-muted-foreground" />
          {t("organizations.impersonation_form_ticket_label")}
        </Label>
        <Input
          id="ticket-ref"
          value={ticketReference}
          onChange={(e) => setTicketReference(e.target.value)}
          disabled={submitting}
          placeholder={t("organizations.impersonation_form_ticket_placeholder")}
          className="text-xs"
        />
      </div>

      {/* Security Alert Box */}
      <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2.5">
        <Lock className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
        <div className="space-y-1 leading-relaxed">
          <p className="font-semibold text-amber-900 dark:text-amber-100 flex items-center gap-1">
            <Clock className="h-3 w-3" /> {t("organizations.impersonation_form_security_title")}
          </p>
          <p className="text-[11px] opacity-90">
            {t("organizations.impersonation_form_security_desc")}
          </p>
        </div>
      </div>
    </div>
  );
}
