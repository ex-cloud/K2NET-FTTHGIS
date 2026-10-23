import * as React from "react";
import { PageHero, Card, Button, Badge, PageLayout } from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import {
  ScrollText,
  Clock,
  ShieldAlert,
  BellRing,
  Percent,
  FileSpreadsheet,
  RefreshCcw,
  CheckCircle2,
} from "lucide-react";
import { useBillingPolicies } from "@/hooks/useBillingSubscriptions";

export default function BillingPoliciesPage() {
  const { t } = useTranslation();
  const { data: policies = [], isLoading, refetch, isFetching } = useBillingPolicies();

  // Helper dictionary lookup
  const policyMap = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const p of policies) {
      map.set(p.policyKey, p.policyValue);
    }
    return map;
  }, [policies]);

  const graceDays = policyMap.get("billing.grace_days") ?? policyMap.get("grace_period_days") ?? "14";
  const readOnlyDays = policyMap.get("billing.readonly_days") ?? policyMap.get("readonly_lockout_days") ?? "14";
  const dunningCadence = policyMap.get("billing.reminder_schedule_days") ?? policyMap.get("dunning_schedule_days") ?? "30,14,7,1";
  const taxRate = policyMap.get("billing.tax_rate_percentage") ?? policyMap.get("tax_rate_percent") ?? "11.0";
  const timezone = policyMap.get("billing.timezone") ?? "Asia/Jakarta (WIB)";
  const invoiceFormat = policyMap.get("billing.invoice_number_format") ?? policyMap.get("invoice_number_format") ?? "INV/{YYYY}/{MM}/{SEQ:5}";

  return (
    <PageLayout variant="workspace" spaceY="space-y-6">
      {/* Domain Eyebrow Hero Header */}
      <PageHero
        bordered={false}
        className="pb-0"
        eyebrow="CATALOG"
        title={t("billing.policies_title")}
        icon={ScrollText}
        subtitle={t("billing.policies_desc")}
        meta={
          <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm text-muted-foreground/90 font-medium">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-foreground font-mono">{graceDays}</span>
              <span>{t("billing.policy_grace_days_meta")}</span>
            </div>
            <span className="text-muted-foreground/30 px-1">/</span>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-foreground font-mono">{readOnlyDays}</span>
              <span>{t("billing.policy_lockout_days_meta")}</span>
            </div>
            <span className="text-muted-foreground/30 px-1">/</span>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-foreground font-mono">{taxRate}%</span>
              <span>{t("billing.policy_ppn_meta")}</span>
            </div>
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="gap-1.5 h-7 px-2.5 text-xs font-medium border-border/80 bg-background/80 hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
              title={t("common.refresh")}
            >
              <RefreshCcw className={`size-3.5 ${isFetching ? "animate-spin text-primary" : ""}`} />
              <span>{t("common.refresh")}</span>
            </Button>
          </div>
        }
      />

      {/* 5-Pillar Policy Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Pillar 1: Grace Period */}
        <Card glowingEffect className="p-4 flex flex-col justify-between gap-3 bg-card border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs text-foreground/75 dark:text-muted-foreground font-bold tracking-wider uppercase font-mono">
              {t("billing.policy_grace_period_title")}
            </span>
            <div className="size-6 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
              <Clock className="size-3.5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold tracking-tight text-foreground font-mono">
                {isLoading ? "—" : graceDays}
              </span>
              <span className="text-xs text-muted-foreground font-medium">
                {t("common.days")}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t("billing.policy_grace_period_desc")}
            </p>
          </div>
          <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>{t("billing.policy_status")}</span>
            <Badge variant="outline" className="text-[10px] border-primary/30 text-primary bg-primary/10 font-mono">
              ACTIVE ENFORCED
            </Badge>
          </div>
        </Card>

        {/* Pillar 2: Read-Only Lockout */}
        <Card glowingEffect className="p-4 flex flex-col justify-between gap-3 bg-card border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs text-foreground/75 dark:text-muted-foreground font-bold tracking-wider uppercase font-mono">
              {t("billing.policy_lockout_title")}
            </span>
            <div className="size-6 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive">
              <ShieldAlert className="size-3.5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold tracking-tight text-foreground font-mono">
                {isLoading ? "—" : readOnlyDays}
              </span>
              <span className="text-xs text-muted-foreground font-medium">
                {t("common.days")}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t("billing.policy_lockout_desc")}
            </p>
          </div>
          <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>{t("billing.policy_action")}</span>
            <span className="font-mono text-destructive font-medium text-[11px]">
              RESTRICTED_READ_ONLY
            </span>
          </div>
        </Card>

        {/* Pillar 3: Dunning Notification Cadence */}
        <Card glowingEffect className="p-4 flex flex-col justify-between gap-3 bg-card border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs text-foreground/75 dark:text-muted-foreground font-bold tracking-wider uppercase font-mono">
              {t("billing.policy_dunning_title")}
            </span>
            <div className="size-6 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <BellRing className="size-3.5" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1 font-mono font-bold text-foreground text-sm">
              {isLoading
                ? "—"
                : dunningCadence.split(",").map((day, idx) => (
                    <span
                      key={idx}
                      className="px-1.5 py-0.5 rounded-sm bg-muted/40 border border-border/70 text-xs"
                    >
                      H-{day.trim()}
                    </span>
                  ))}
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">
              {t("billing.policy_dunning_desc")}
            </p>
          </div>
          <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>{t("billing.policy_channels")}</span>
            <span className="font-mono text-foreground font-medium text-[11px]">
              WA Cloud + SMTP
            </span>
          </div>
        </Card>

        {/* Pillar 4: Tax & Localization */}
        <Card glowingEffect className="p-4 flex flex-col justify-between gap-3 bg-card border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs text-foreground/75 dark:text-muted-foreground font-bold tracking-wider uppercase font-mono">
              {t("billing.policy_tax_title")}
            </span>
            <div className="size-6 rounded-lg bg-foreground/5 border border-border flex items-center justify-center text-foreground">
              <Percent className="size-3.5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold tracking-tight text-foreground font-mono">
                {isLoading ? "—" : `${taxRate}%`}
              </span>
              <span className="text-xs text-muted-foreground font-medium">PPN Indonesia</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t("billing.policy_tax_desc")}
            </p>
          </div>
          <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>{t("billing.policy_timezone")}</span>
            <span className="font-mono text-foreground font-medium text-[11px]">
              {timezone}
            </span>
          </div>
        </Card>

        {/* Pillar 5: Invoice Numbering Format */}
        <Card glowingEffect className="p-4 flex flex-col justify-between gap-3 bg-card border-border md:col-span-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-foreground/75 dark:text-muted-foreground font-bold tracking-wider uppercase font-mono">
              {t("billing.policy_invoice_format_title")}
            </span>
            <div className="size-6 rounded-lg bg-foreground/5 border border-border flex items-center justify-center text-foreground">
              <FileSpreadsheet className="size-3.5" />
            </div>
          </div>
          <div>
            <div className="font-mono font-bold text-foreground text-sm bg-muted/30 px-3 py-1.5 rounded-md border border-border/70 inline-block">
              {isLoading ? "—" : invoiceFormat}
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">
              {t("billing.policy_invoice_format_desc")}
            </p>
          </div>
          <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>{t("billing.policy_sample_number")}</span>
            <span className="font-mono text-primary font-medium text-[11px]">
              INV/2026/10/00042
            </span>
          </div>
        </Card>
      </div>

      {/* Live System Configuration Table */}
      <div className="border border-border/80 rounded-lg overflow-hidden bg-card shadow-xs">
        <div className="px-4 py-3 border-b border-border/80 bg-muted/20 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground font-mono">
              {t("billing.policies_table_title")}
            </h3>
            <p className="text-[11px] text-muted-foreground">
              {t("billing.policies_table_desc")}
            </p>
          </div>
          <Badge variant="outline" className="text-[10px] font-mono border-border">
            {policies.length} {t("billing.policies_count")}
          </Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border/80 bg-muted/30 text-muted-foreground text-[11px] font-semibold">
                <th className="py-2.5 px-3">{t("billing.policy_th_key")}</th>
                <th className="py-2.5 px-3">{t("billing.policy_th_value")}</th>
                <th className="py-2.5 px-3">{t("billing.policy_th_description")}</th>
                <th className="py-2.5 px-3 text-right">{t("billing.policy_th_status")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 font-mono">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-muted-foreground">
                    <RefreshCcw className="size-4 animate-spin text-primary mx-auto mb-1" />
                    <span className="text-xs">{t("common.loading")}</span>
                  </td>
                </tr>
              ) : policies.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-muted-foreground font-sans">
                    {t("billing.no_policies_found")}
                  </td>
                </tr>
              ) : (
                policies.map((policy) => (
                  <tr key={policy.id || policy.policyKey} className="hover:bg-muted/15 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-foreground">
                      {policy.policyKey}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded-sm bg-muted/40 border border-border/60 text-foreground font-bold">
                        {policy.policyValue}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-sans text-muted-foreground text-[11px]">
                      {policy.description || "—"}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <span className="inline-flex items-center gap-1 text-[10px] text-primary font-sans font-medium">
                        <CheckCircle2 className="size-3" />
                        <span>Enforced</span>
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </PageLayout>
  );
}
