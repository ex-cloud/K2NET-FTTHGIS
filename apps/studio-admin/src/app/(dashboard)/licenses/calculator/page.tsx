import * as React from "react";
import { PageHero, Card, Button, Badge, toast } from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import {
  Calculator,
  Building2,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Calendar,
  Clock,
  Layers,
  FileText,
  DollarSign,
} from "lucide-react";
import {
  useAllLicenses,
  useAdminProrateEstimate,
  type LicenseItem,
  type ProrateEstimateResponse,
} from "@/hooks/useOrganizationLicenses";

function formatIdr(val?: number): string {
  if (typeof val !== "number" || isNaN(val) || val <= 0) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(val);
}

const AVAILABLE_PLANS = ["STARTER", "PRO", "ENTERPRISE"] as const;

interface CalculatorInputsProps {
  licenses: LicenseItem[];
  selectedOrgId: string;
  setSelectedOrgId: (id: string) => void;
  targetPlan: string;
  setTargetPlan: (plan: string) => void;
  selectedLicense?: LicenseItem;
  estimate?: ProrateEstimateResponse;
}

function CalculatorInputsSection({
  licenses,
  selectedOrgId,
  setSelectedOrgId,
  targetPlan,
  setTargetPlan,
  selectedLicense,
  estimate,
}: CalculatorInputsProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = React.useState<boolean>(false);

  // Group unique organizations from licenses
  const orgOptions = React.useMemo(() => {
    const map = new Map<string, { id: string; name: string; slug: string; currentPlan: string }>();
    for (const lic of licenses) {
      if (!map.has(lic.organizationId)) {
        map.set(lic.organizationId, {
          id: lic.organizationId,
          name: lic.organizationName || lic.organizationSlug,
          slug: lic.organizationSlug,
          currentPlan: lic.planName,
        });
      }
    }
    return Array.from(map.values());
  }, [licenses]);

  const handleCopyEstimate = () => {
    if (!estimate || !selectedLicense) return;
    const summary = [
      `=== K2NET UPGRADE PRORATION ESTIMATE ===`,
      `Tenant: ${selectedLicense.organizationName} (${selectedLicense.organizationSlug})`,
      `Transition: ${estimate.currentPlan} -> ${estimate.targetPlan}`,
      `Days Remaining: ${estimate.daysRemaining} / ${estimate.totalCycleDays} days`,
      `Current Plan Daily Rate: ${formatIdr(estimate.dailyRateOld)}`,
      `Unused Prorated Credit: -${formatIdr(estimate.proratedCredit)}`,
      `Target Plan Price: ${formatIdr(estimate.targetPlanPrice)}`,
      `Net Payable Amount: ${formatIdr(estimate.netDueAmount)} IDR`,
      `Calculation: ${estimate.calculationSummary}`,
    ].join("\n");

    navigator.clipboard.writeText(summary).then(() => {
      setCopied(true);
      toast.success(t("license.prorate.copy_estimate_success"));
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <Card glowingEffect className="p-5 flex flex-col justify-between gap-5 bg-card border-border">
      <div className="space-y-4">
        {/* Organization Dropdown */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Building2 className="size-3.5 text-muted-foreground" />
            <span>{t("license.prorate.select_org")}</span>
          </label>
          <select
            value={selectedOrgId}
            onChange={(e) => setSelectedOrgId(e.target.value)}
            className="w-full h-8 px-2.5 rounded-md border border-border bg-background text-foreground text-xs focus:outline-hidden focus:ring-1 focus:ring-border"
          >
            <option value="" disabled>
              -- {t("license.prorate.select_org_placeholder")} --
            </option>
            {orgOptions.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name} ({org.slug}) — {org.currentPlan}
              </option>
            ))}
          </select>
        </div>

        {/* Current Tenant Active Contract Overview */}
        {selectedLicense && (
          <div className="p-3 rounded-md border border-border/70 bg-muted/20 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-semibold">
                {t("license.prorate.tenant_info")}
              </span>
              <Badge variant="outline" className="text-[10px] font-mono">
                {selectedLicense.planName}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-border/40">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Calendar className="size-3 shrink-0" />
                <span>
                  {selectedLicense.validUntil ? selectedLicense.validUntil.substring(0, 10) : "—"}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="size-3 shrink-0" />
                <span className="font-mono text-foreground font-medium">
                  {selectedLicense.daysRemaining ?? 0} {t("common.days")}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Target Plan Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Layers className="size-3.5 text-muted-foreground" />
            <span>{t("license.prorate.target_tier_selection")}</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {AVAILABLE_PLANS.map((plan) => {
              const isSelected = targetPlan === plan;
              const isCurrent = selectedLicense?.planName?.toUpperCase() === plan;

              return (
                <button
                  key={plan}
                  type="button"
                  onClick={() => setTargetPlan(plan)}
                  className={`h-11 px-2.5 rounded-md border text-xs font-medium transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                    isSelected
                      ? "bg-foreground text-background border-foreground shadow-xs font-semibold"
                      : "bg-muted/15 border-border text-foreground hover:bg-muted/30"
                  }`}
                >
                  <span className="font-mono text-xs">{plan}</span>
                  {isCurrent && (
                    <span className="text-[9px] opacity-75 font-mono">
                      ({t("license.prorate.current_plan")})
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Copy Summary Action */}
      <div className="pt-3 border-t border-border/60">
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopyEstimate}
          disabled={!estimate}
          className="w-full gap-1.5 text-xs font-medium"
        >
          {copied ? <Check className="size-3.5 text-primary" /> : <Copy className="size-3.5" />}
          <span>{t("license.prorate.copy_estimate")}</span>
        </Button>
      </div>
    </Card>
  );
}

interface CalculatorBreakdownProps {
  estimate?: ProrateEstimateResponse;
  isLoading: boolean;
  error?: unknown;
}

function CalculatorBreakdownSection({ estimate, isLoading, error }: CalculatorBreakdownProps) {
  const { t } = useTranslation();

  return (
    <Card glowingEffect className="p-5 flex flex-col justify-between gap-5 bg-card border-border">
      <div className="space-y-4">
        {/* Header Transition */}
        <div className="flex items-center justify-between pb-3 border-b border-border/60">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-foreground">
              {t("license.prorate.breakdown_title")}
            </span>
          </div>
          {estimate && (
            <Badge
              variant="outline"
              className={`text-[10px] font-mono gap-1 ${
                estimate.isUpgradeEligible
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border bg-muted/30 text-muted-foreground"
              }`}
            >
              {estimate.isUpgradeEligible ? (
                <CheckCircle2 className="size-3" />
              ) : (
                <AlertCircle className="size-3" />
              )}
              {estimate.isUpgradeEligible
                ? t("license.prorate.eligible_badge")
                : t("license.prorate.not_eligible_badge")}
            </Badge>
          )}
        </div>

        {/* Dynamic State */}
        {isLoading ? (
          <div className="space-y-3 py-6 animate-pulse">
            <div className="h-6 bg-muted/40 rounded w-1/3" />
            <div className="h-14 bg-muted/20 rounded" />
            <div className="h-4 bg-muted/40 rounded w-1/2" />
          </div>
        ) : error ? (
          <div className="flex items-start gap-2.5 text-muted-foreground text-xs p-4 rounded-md border border-border/70 bg-muted/10">
            <AlertCircle className="size-4 shrink-0 text-amber-500 mt-0.5" />
            <p>{t("license.prorate.no_active_license_warning")}</p>
          </div>
        ) : estimate ? (
          <div className="space-y-4">
            {/* Visual Transition */}
            <div className="flex items-center justify-between p-3 rounded-md border border-border/70 bg-muted/20 text-xs">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-mono text-muted-foreground">
                  {t("license.prorate.current_plan")}
                </span>
                <p className="font-mono font-bold text-foreground text-sm">
                  {estimate.currentPlan}
                </p>
                <p className="text-[11px] font-mono text-muted-foreground">
                  {formatIdr(estimate.currentPlanPrice)}
                </p>
              </div>

              <div className="flex items-center justify-center size-7 rounded-full bg-muted/40 text-muted-foreground">
                <ArrowRight className="size-3.5" />
              </div>

              <div className="space-y-0.5 text-right">
                <span className="text-[10px] uppercase font-mono text-muted-foreground">
                  {t("license.prorate.target_plan_label")}
                </span>
                <p className="font-mono font-bold text-foreground text-sm">
                  {estimate.targetPlan}
                </p>
                <p className="text-[11px] font-mono text-muted-foreground">
                  {formatIdr(estimate.targetPlanPrice)}
                </p>
              </div>
            </div>

            {/* Financial Accounting Grid */}
            <div className="space-y-2 text-xs border border-border/60 rounded-md p-3.5 bg-muted/10">
              <div className="flex justify-between text-muted-foreground">
                <span>{t("license.prorate.days_remaining")}</span>
                <span className="font-mono font-medium text-foreground">
                  {t("license.prorate.days_of_cycle", {
                    days: estimate.daysRemaining,
                    total: estimate.totalCycleDays,
                  })}
                </span>
              </div>

              <div className="flex justify-between text-muted-foreground">
                <span>{t("license.prorate.daily_rate_old")}</span>
                <span className="font-mono font-medium text-foreground">
                  {formatIdr(estimate.dailyRateOld)} / {t("common.day")}
                </span>
              </div>

              <div className="flex justify-between text-muted-foreground">
                <span>{t("license.prorate.prorated_credit")}</span>
                <span className="font-mono font-semibold text-primary">
                  - {formatIdr(estimate.proratedCredit)}
                </span>
              </div>

              <div className="flex justify-between text-muted-foreground">
                <span>{t("license.prorate.target_plan_label")}</span>
                <span className="font-mono font-medium text-foreground">
                  {formatIdr(estimate.targetPlanPrice)}
                </span>
              </div>

              {/* Net Highlight */}
              <div className="pt-2.5 mt-2 border-t border-border flex items-baseline justify-between">
                <div>
                  <span className="text-xs font-bold text-foreground block">
                    {t("license.prorate.net_amount_due")}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    Tax exclusive · Pro-rata applied
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold font-mono tracking-tight text-foreground">
                    {formatIdr(estimate.netDueAmount)}
                  </span>
                  <span className="text-[10px] text-muted-foreground ml-1">IDR</span>
                </div>
              </div>
            </div>

            {/* Formula Description */}
            {estimate.calculationSummary && (
              <div className="flex items-start gap-2 p-2.5 rounded-md border border-border/40 bg-muted/15 text-[11px] text-muted-foreground">
                <FileText className="size-3.5 shrink-0 mt-0.5 text-muted-foreground" />
                <p className="italic leading-relaxed">{estimate.calculationSummary}</p>
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* Accounting Footnote */}
      <div className="pt-2 border-t border-border/60 text-[10px] text-muted-foreground">
        {t("license.prorate.accounting_footnote")}
      </div>
    </Card>
  );
}

export default function LicenseCalculatorPage() {
  const { t } = useTranslation();
  const { data: licenses = [] } = useAllLicenses();

  const [selectedOrgId, setSelectedOrgId] = React.useState<string>("");
  const [targetPlan, setTargetPlan] = React.useState<string>("ENTERPRISE");

  // Preselect first organization with active license
  React.useEffect(() => {
    if (licenses.length > 0 && !selectedOrgId) {
      setSelectedOrgId(licenses[0].organizationId);
    }
  }, [licenses, selectedOrgId]);

  const selectedLicense = React.useMemo(() => {
    return licenses.find((l) => l.organizationId === selectedOrgId);
  }, [licenses, selectedOrgId]);

  // Hook estimate
  const {
    data: estimate,
    isLoading: isEstimating,
    error,
  } = useAdminProrateEstimate(
    selectedOrgId || undefined,
    targetPlan || undefined
  );

  return (
    <div className="relative flex flex-col w-full h-full bg-background pt-6 pb-0 gap-5 overflow-hidden">
      {/* Page Hero Header */}
      <div className="px-4 md:px-6 shrink-0">
        <PageHero
          bordered={false}
          className="pb-0"
          eyebrow={t("license.hero_eyebrow")}
          title={t("nav.prorated_upgrade_calculator")}
          icon={Calculator}
          subtitle={t("license.prorate.upgrade_instruction")}
          meta={
            <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm text-muted-foreground/90 font-medium">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-foreground font-mono">{licenses.length}</span>
                <span>Active Contracts</span>
              </div>
              <span className="text-muted-foreground/30 px-1">/</span>
              <div className="flex items-center gap-1.5">
                <DollarSign className="size-3.5 text-muted-foreground" />
                <span>Proration Engine</span>
              </div>
            </div>
          }
        />
      </div>

      {/* 2-Column Responsive Simulator Grid */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 max-w-6xl">
          <CalculatorInputsSection
            licenses={licenses}
            selectedOrgId={selectedOrgId}
            setSelectedOrgId={setSelectedOrgId}
            targetPlan={targetPlan}
            setTargetPlan={setTargetPlan}
            selectedLicense={selectedLicense}
            estimate={estimate}
          />
          <CalculatorBreakdownSection
            estimate={estimate}
            isLoading={isEstimating}
            error={error}
          />
        </div>
      </div>
    </div>
  );
}
