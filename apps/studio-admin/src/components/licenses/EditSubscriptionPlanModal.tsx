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
  Checkbox,
  toast,
} from "@k2net/ui";
import {
  Sliders,
  Shield,
  Terminal,
  Layers,
  Server,
  Split,
  Box,
  Users,
  Archive,
  HardDrive,
  Activity,
  Info,
} from "lucide-react";
import { useTranslation } from "@k2net/i18n";
import {
  useUpdateSubscriptionPlan,
  type SubscriptionPlanMaster,
  type UpdateSubscriptionPlanPayload,
} from "@/hooks/useSubscriptionPlans";

interface EditSubscriptionPlanModalProps {
  plan: SubscriptionPlanMaster | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface PlanQuotasFormProps {
  maxProjects: string;
  setMaxProjects: (val: string) => void;
  maxArchivedProjects: string;
  setMaxArchivedProjects: (val: string) => void;
  maxOdps: string;
  setMaxOdps: (val: string) => void;
  maxOdcs: string;
  setMaxOdcs: (val: string) => void;
  maxCustomers: string;
  setMaxCustomers: (val: string) => void;
  maxOlts: string;
  setMaxOlts: (val: string) => void;
  maxStorageGb: string;
  setMaxStorageGb: (val: string) => void;
  apiRateLimitRpm: string;
  setApiRateLimitRpm: (val: string) => void;
}

function PlanQuotasFields({
  maxProjects,
  setMaxProjects,
  maxArchivedProjects,
  setMaxArchivedProjects,
  maxOdps,
  setMaxOdps,
  maxOdcs,
  setMaxOdcs,
  maxCustomers,
  setMaxCustomers,
  maxOlts,
  setMaxOlts,
  maxStorageGb,
  setMaxStorageGb,
  apiRateLimitRpm,
  setApiRateLimitRpm,
}: PlanQuotasFormProps) {
  const { t } = useTranslation();
  return (
    <div className="space-y-3">
      {/* Section A: Workspace & Projects */}
      <div className="border border-border/70 rounded-md p-3 bg-muted/10 space-y-2.5">
        <div className="flex items-center gap-1.5 border-b border-border/50 pb-1.5">
          <Layers className="size-3.5 text-primary" />
          <span className="font-semibold text-foreground text-xs">
            {t("license.modal.sec_workspace")}
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Layers className="size-3" />
              <span>{t("license.modal.max_projects")}</span>
            </Label>
            <Input
              type="number"
              min={1}
              value={maxProjects}
              onChange={(e) => setMaxProjects(e.target.value)}
              className="h-7 text-xs bg-background"
              required
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Archive className="size-3" />
              <span>{t("license.modal.archived_projects")}</span>
            </Label>
            <Input
              type="number"
              min={0}
              value={maxArchivedProjects}
              onChange={(e) => setMaxArchivedProjects(e.target.value)}
              className="h-7 text-xs bg-background"
              required
            />
          </div>
        </div>
      </div>

      {/* Section B: FTTH Network Infrastructure */}
      <div className="border border-border/70 rounded-md p-3 bg-muted/10 space-y-2.5">
        <div className="flex items-center gap-1.5 border-b border-border/50 pb-1.5">
          <Server className="size-3.5 text-primary" />
          <span className="font-semibold text-foreground text-xs">
            {t("license.modal.sec_infrastructure")}
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Server className="size-3" />
              <span>{t("license.modal.max_olts_capacity")}</span>
            </Label>
            <Input
              type="number"
              min={1}
              value={maxOlts}
              onChange={(e) => setMaxOlts(e.target.value)}
              className="h-7 text-xs bg-background"
              required
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Split className="size-3" />
              <span>{t("license.modal.max_odps")}</span>
            </Label>
            <Input
              type="number"
              min={0}
              value={maxOdps}
              onChange={(e) => setMaxOdps(e.target.value)}
              className="h-7 text-xs bg-background"
              required
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Box className="size-3" />
              <span>{t("license.modal.max_odcs")}</span>
            </Label>
            <Input
              type="number"
              min={0}
              value={maxOdcs}
              onChange={(e) => setMaxOdcs(e.target.value)}
              className="h-7 text-xs bg-background"
              required
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Users className="size-3" />
              <span>{t("license.modal.max_customers")}</span>
            </Label>
            <Input
              type="number"
              min={0}
              value={maxCustomers}
              onChange={(e) => setMaxCustomers(e.target.value)}
              className="h-7 text-xs bg-background"
              required
            />
          </div>
        </div>
      </div>

      {/* Section C: Cloud & API Capacity */}
      <div className="border border-border/70 rounded-md p-3 bg-muted/10 space-y-2.5">
        <div className="flex items-center gap-1.5 border-b border-border/50 pb-1.5">
          <HardDrive className="size-3.5 text-primary" />
          <span className="font-semibold text-foreground text-xs">
            {t("license.modal.sec_cloud_api")}
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground flex items-center gap-1">
              <HardDrive className="size-3" />
              <span>{t("license.modal.max_storage_gb")}</span>
            </Label>
            <Input
              type="number"
              min={1}
              value={maxStorageGb}
              onChange={(e) => setMaxStorageGb(e.target.value)}
              className="h-7 text-xs bg-background"
              required
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Activity className="size-3" />
              <span>{t("license.modal.api_rate_limit_rpm")}</span>
            </Label>
            <Input
              type="number"
              min={100}
              value={apiRateLimitRpm}
              onChange={(e) => setApiRateLimitRpm(e.target.value)}
              className="h-7 text-xs bg-background"
              required
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export function EditSubscriptionPlanModal({
  plan,
  open,
  onOpenChange,
}: EditSubscriptionPlanModalProps) {
  const { t } = useTranslation();
  const updateMutation = useUpdateSubscriptionPlan();

  const [price, setPrice] = React.useState<string>("");
  const [description, setDescription] = React.useState<string>("");
  const [maxProjects, setMaxProjects] = React.useState<string>("");
  const [maxArchivedProjects, setMaxArchivedProjects] = React.useState<string>("");
  const [maxOdps, setMaxOdps] = React.useState<string>("");
  const [maxOdcs, setMaxOdcs] = React.useState<string>("");
  const [maxCustomers, setMaxCustomers] = React.useState<string>("");
  const [maxOlts, setMaxOlts] = React.useState<string>("");
  const [maxStorageGb, setMaxStorageGb] = React.useState<string>("");
  const [apiRateLimitRpm, setApiRateLimitRpm] = React.useState<string>("");
  const [hasSso, setHasSso] = React.useState<boolean>(false);
  const [hasApiAccess, setHasApiAccess] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (!plan) return;
    setPrice(String(plan.price ?? 0));
    setDescription(plan.description || "");
    setMaxProjects(String(plan.maxProjects ?? 1));
    setMaxArchivedProjects(String(plan.maxArchivedProjects ?? 1));
    setMaxOdps(String(plan.maxOdps ?? 0));
    setMaxOdcs(String(plan.maxOdcs ?? 0));
    setMaxCustomers(String(plan.maxCustomers ?? 0));
    setMaxOlts(String(plan.maxOlts ?? plan.maxProjects ?? 1));
    setMaxStorageGb(String(plan.maxStorageGb ?? 2));
    setApiRateLimitRpm(String(plan.apiRateLimitRpm ?? 500));
    setHasSso(Boolean(plan.hasSso));
    setHasApiAccess(Boolean(plan.hasApiAccess));
  }, [plan]);

  if (!plan) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      toast.error(t("license.feedback.error_generic"));
      return;
    }

    const payload: UpdateSubscriptionPlanPayload = {
      id: plan.id,
      price: parsedPrice,
      description: description.trim() || undefined,
      maxProjects: parseInt(maxProjects, 10) || 1,
      maxArchivedProjects: parseInt(maxArchivedProjects, 10) || 0,
      maxOdps: parseInt(maxOdps, 10) || 0,
      maxOdcs: parseInt(maxOdcs, 10) || 0,
      maxCustomers: parseInt(maxCustomers, 10) || 0,
      maxOlts: parseInt(maxOlts, 10) || 1,
      maxStorageGb: parseInt(maxStorageGb, 10) || 2,
      apiRateLimitRpm: parseInt(apiRateLimitRpm, 10) || 500,
      hasSso,
      hasApiAccess,
    };

    try {
      await updateMutation.mutateAsync(payload);
      toast.success(t("license.plans.update_success"));
      onOpenChange(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("license.feedback.error_generic");
      toast.error(msg);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-md bg-muted text-foreground">
              <Sliders className="size-3.5" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold text-foreground">
                {t("license.plans.edit_plan_title")} — {plan.name}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {t("license.plans.edit_plan_desc")}
              </DialogDescription>
            </div>
          </div>
          {(plan.activeTenants ?? 0) > 0 && (
            <div className="flex items-center gap-2 p-2.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs mt-2">
              <Info className="size-4 shrink-0" />
              <span>{t("license.modal.edit_plan_tenants_impact", { count: plan.activeTenants ?? 0 })}</span>
            </div>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2 text-xs">
          {/* Price & Description */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">
                {t("license.plans.price_label")}
              </Label>
              <Input
                type="number"
                min={0}
                step={10000}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="h-8 font-mono text-xs bg-background"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">
                {t("license.plans.description_label")}
              </Label>
              <Input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enterprise SLA & High-Availability"
                className="h-8 text-xs bg-background"
              />
            </div>
          </div>

          {/* Quotas */}
          <PlanQuotasFields
            maxProjects={maxProjects}
            setMaxProjects={setMaxProjects}
            maxArchivedProjects={maxArchivedProjects}
            setMaxArchivedProjects={setMaxArchivedProjects}
            maxOdps={maxOdps}
            setMaxOdps={setMaxOdps}
            maxOdcs={maxOdcs}
            setMaxOdcs={setMaxOdcs}
            maxCustomers={maxCustomers}
            setMaxCustomers={setMaxCustomers}
            maxOlts={maxOlts}
            setMaxOlts={setMaxOlts}
            maxStorageGb={maxStorageGb}
            setMaxStorageGb={setMaxStorageGb}
            apiRateLimitRpm={apiRateLimitRpm}
            setApiRateLimitRpm={setApiRateLimitRpm}
          />

          {/* Features */}
          <div className="border border-border/70 rounded-md p-3 bg-muted/10 space-y-2">
            <span className="font-semibold text-foreground text-xs block">
              {t("license.plans.features_heading")}
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-foreground">
                <Checkbox
                  checked={hasSso}
                  onCheckedChange={(c) => setHasSso(Boolean(c))}
                />
                <div className="flex items-center gap-1.5">
                  <Shield className="size-3 text-muted-foreground" />
                  <span>{t("license.plans.sso_label")}</span>
                </div>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs text-foreground">
                <Checkbox
                  checked={hasApiAccess}
                  onCheckedChange={(c) => setHasApiAccess(Boolean(c))}
                />
                <div className="flex items-center gap-1.5">
                  <Terminal className="size-3 text-muted-foreground" />
                  <span>{t("license.plans.api_label")}</span>
                </div>
              </label>
            </div>
          </div>

          <DialogFooter className="pt-2 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              {t("license.actions.cancel")}
            </Button>
            <Button
              type="submit"
              variant="default"
              size="sm"
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending
                ? t("common.loading")
                : t("license.actions.confirm")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
