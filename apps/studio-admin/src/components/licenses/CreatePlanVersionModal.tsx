import * as React from "react";
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
  Switch,
} from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import { PlusCircle, Loader2, GitCommit, Sliders, Shield } from "lucide-react";
import type { SubscriptionPlanMaster } from "@/hooks/useSubscriptionPlans";
import { useCreatePlanVersion, type CreatePlanVersionInput } from "@/hooks/usePlanVersions";

interface CreatePlanVersionModalProps {
  plan: SubscriptionPlanMaster | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreatePlanVersionModal({
  plan,
  open,
  onOpenChange,
  onSuccess,
}: CreatePlanVersionModalProps) {
  const { t } = useTranslation();
  const createMutation = useCreatePlanVersion(plan?.id);

  const [version, setVersion] = React.useState<string>("");
  const [status, setStatus] = React.useState<"DRAFT" | "ACTIVE">("DRAFT");
  const [priceMonthly, setPriceMonthly] = React.useState<number>(0);
  const [priceYearly, setPriceYearly] = React.useState<number>(0);
  const [maxProjects, setMaxProjects] = React.useState<number>(1);
  const [maxArchivedProjects, setMaxArchivedProjects] = React.useState<number>(1);
  const [maxOlts, setMaxOlts] = React.useState<number>(1);
  const [maxOdcs, setMaxOdcs] = React.useState<number>(10);
  const [maxOdps, setMaxOdps] = React.useState<number>(50);
  const [maxCustomers, setMaxCustomers] = React.useState<number>(500);
  const [maxStorageGb, setMaxStorageGb] = React.useState<number>(5);
  const [apiRateLimitRpm, setApiRateLimitRpm] = React.useState<number>(500);
  const [hasSso, setHasSso] = React.useState<boolean>(false);
  const [hasApiAccess, setHasApiAccess] = React.useState<boolean>(false);
  const [hasAiCopilot, setHasAiCopilot] = React.useState<boolean>(false);
  const [hasCustomDomain, setHasCustomDomain] = React.useState<boolean>(false);
  const [graceDays, setGraceDays] = React.useState<number>(14);
  const [readonlyDays, setReadonlyDays] = React.useState<number>(14);
  const [changelog, setChangelog] = React.useState<string>("");
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  // Sync initial state when modal opens or plan changes
  React.useEffect(() => {
    if (plan && open) {
      setVersion("");
      setStatus("DRAFT");
      setPriceMonthly(plan.price);
      setPriceYearly(plan.price * 10);
      setMaxProjects(plan.maxProjects ?? 1);
      setMaxArchivedProjects(plan.maxArchivedProjects ?? 1);
      setMaxOlts(plan.maxOlts ?? 1);
      setMaxOdcs(plan.maxOdcs ?? 10);
      setMaxOdps(plan.maxOdps ?? 50);
      setMaxCustomers(plan.maxCustomers ?? 500);
      setMaxStorageGb(plan.maxStorageGb ?? 5);
      setApiRateLimitRpm(plan.apiRateLimitRpm ?? 500);
      setHasSso(plan.hasSso ?? false);
      setHasApiAccess(plan.hasApiAccess ?? false);
      setHasAiCopilot(false);
      setHasCustomDomain(false);
      setGraceDays(14);
      setReadonlyDays(14);
      setChangelog("");
      setErrorMsg(null);
    }
  }, [plan, open]);

  if (!plan) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedVersion = version.trim();
    if (!trimmedVersion) {
      setErrorMsg("Version tag is required (e.g. v1.1.0)");
      return;
    }

    const payload: CreatePlanVersionInput = {
      version: trimmedVersion,
      status,
      priceMonthly: Number(priceMonthly),
      priceYearly: Number(priceYearly),
      currency: "IDR",
      maxProjects: Number(maxProjects),
      maxArchivedProjects: Number(maxArchivedProjects),
      maxOlts: Number(maxOlts),
      maxOdcs: Number(maxOdcs),
      maxOdps: Number(maxOdps),
      maxCustomers: Number(maxCustomers),
      maxStorageGb: Number(maxStorageGb),
      apiRateLimitRpm: Number(apiRateLimitRpm),
      hasSso,
      hasApiAccess,
      hasAiCopilot,
      hasCustomDomain,
      graceDays: Number(graceDays),
      readonlyDays: Number(readonlyDays),
      changelog: changelog.trim() || undefined,
    };

    try {
      await createMutation.mutateAsync(payload);
      onOpenChange(false);
      onSuccess?.();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create plan version";
      setErrorMsg(message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-card border-border max-h-[90vh] overflow-y-auto p-6 text-foreground">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <PlusCircle className="size-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold text-foreground">
                {t("license.plans.create_modal_title")} — {plan.name}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                {t("license.plans.create_modal_desc", { planName: plan.name })}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {errorMsg && (
            <div className="p-2.5 rounded-md bg-destructive/10 border border-destructive/30 text-xs text-destructive">
              {errorMsg}
            </div>
          )}

          {/* Section 1: Versioning & Pricing */}
          <div className="p-3.5 rounded-lg border border-border/80 bg-background/50 space-y-3">
            <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <GitCommit className="size-3.5 text-primary" />
              <span>Version & Commercial Baseline</span>
            </span>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-[11px] font-medium text-foreground">
                  {t("license.plans.version_label")}
                </Label>
                <Input
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  placeholder={t("license.plans.version_placeholder")}
                  className="h-8 text-xs font-mono"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-medium text-foreground">
                  {t("license.plans.monthly_price_label")}
                </Label>
                <Input
                  type="number"
                  min={0}
                  value={priceMonthly}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setPriceMonthly(val);
                    setPriceYearly(val * 10);
                  }}
                  className="h-8 text-xs font-mono"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-medium text-foreground">
                  {t("license.plans.yearly_price_label")}
                </Label>
                <Input
                  type="number"
                  min={0}
                  value={priceYearly}
                  onChange={(e) => setPriceYearly(Number(e.target.value))}
                  className="h-8 text-xs font-mono"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 text-xs">
              <span className="text-muted-foreground">{t("license.plans.status_label")}</span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant={status === "DRAFT" ? "default" : "outline"}
                  size="xs"
                  onClick={() => setStatus("DRAFT")}
                >
                  {t("license.plans.status_draft")}
                </Button>
                <Button
                  type="button"
                  variant={status === "ACTIVE" ? "default" : "outline"}
                  size="xs"
                  onClick={() => setStatus("ACTIVE")}
                >
                  {t("license.plans.status_active")}
                </Button>
              </div>
            </div>
          </div>

          {/* Section 2: Quota Limits */}
          <div className="p-3.5 rounded-lg border border-border/80 bg-background/50 space-y-3">
            <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Sliders className="size-3.5 text-primary" />
              <span>{t("license.plans.base_quotas_heading")}</span>
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">Max Projects</Label>
                <Input
                  type="number"
                  min={1}
                  value={maxProjects}
                  onChange={(e) => setMaxProjects(Number(e.target.value))}
                  className="h-8 text-xs font-mono"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">Max OLTs</Label>
                <Input
                  type="number"
                  min={1}
                  value={maxOlts}
                  onChange={(e) => setMaxOlts(Number(e.target.value))}
                  className="h-8 text-xs font-mono"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">Max ODPs</Label>
                <Input
                  type="number"
                  min={1}
                  value={maxOdps}
                  onChange={(e) => setMaxOdps(Number(e.target.value))}
                  className="h-8 text-xs font-mono"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">Max Storage (GB)</Label>
                <Input
                  type="number"
                  min={1}
                  value={maxStorageGb}
                  onChange={(e) => setMaxStorageGb(Number(e.target.value))}
                  className="h-8 text-xs font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Feature Entitlements & Policies */}
          <div className="p-3.5 rounded-lg border border-border/80 bg-background/50 space-y-3">
            <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Shield className="size-3.5 text-primary" />
              <span>{t("license.plans.features_heading")}</span>
            </span>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="flex items-center justify-between p-2 rounded border border-border/60">
                <span className="text-muted-foreground">{t("license.plans.sso_label")}</span>
                <Switch checked={hasSso} onCheckedChange={setHasSso} />
              </div>
              <div className="flex items-center justify-between p-2 rounded border border-border/60">
                <span className="text-muted-foreground">{t("license.plans.api_label")}</span>
                <Switch checked={hasApiAccess} onCheckedChange={setHasApiAccess} />
              </div>
              <div className="flex items-center justify-between p-2 rounded border border-border/60">
                <span className="text-muted-foreground">AI Copilot</span>
                <Switch checked={hasAiCopilot} onCheckedChange={setHasAiCopilot} />
              </div>
              <div className="flex items-center justify-between p-2 rounded border border-border/60">
                <span className="text-muted-foreground">Custom Domain</span>
                <Switch checked={hasCustomDomain} onCheckedChange={setHasCustomDomain} />
              </div>
            </div>
          </div>

          {/* Section 4: Changelog */}
          <div className="space-y-1">
            <Label className="text-[11px] font-medium text-foreground">
              {t("license.plans.changelog_label")}
            </Label>
            <textarea
              value={changelog}
              onChange={(e) => setChangelog(e.target.value)}
              placeholder={t("license.plans.changelog_placeholder")}
              rows={2}
              className="w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-xs text-foreground shadow-sm placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          <DialogFooter className="pt-2 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={createMutation.isPending}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              variant="default"
              size="sm"
              disabled={createMutation.isPending}
              className="gap-1.5"
            >
              {createMutation.isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <PlusCircle className="size-3.5" />
              )}
              <span>{t("license.plans.create_version_btn")}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
