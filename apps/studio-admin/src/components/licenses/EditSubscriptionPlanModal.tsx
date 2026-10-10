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
import { Sliders, Shield, Terminal } from "lucide-react";
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
}: PlanQuotasFormProps) {
  const { t } = useTranslation();
  return (
    <div className="border border-border/70 rounded-md p-3 bg-muted/10 space-y-2.5">
      <div>
        <span className="font-semibold text-foreground text-xs block">
          {t("license.plans.base_quotas_heading")}
        </span>
        <span className="text-[10px] text-muted-foreground">
          {t("license.plans.base_quotas_desc")}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        <div className="space-y-1">
          <Label className="text-[11px] text-muted-foreground">
            {t("license.modal.max_projects_olts")}
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
          <Label className="text-[11px] text-muted-foreground">
            {t("organizations.quotas.archived_projects")}
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
        <div className="space-y-1">
          <Label className="text-[11px] text-muted-foreground">
            {t("license.modal.max_odps")}
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
          <Label className="text-[11px] text-muted-foreground">
            {t("license.modal.max_odcs")}
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
          <Label className="text-[11px] text-muted-foreground">
            {t("license.modal.max_customers")}
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
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto bg-card border-border">
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
