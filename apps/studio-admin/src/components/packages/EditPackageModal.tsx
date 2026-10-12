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
} from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import { Boxes, Save } from "lucide-react";
import { useSubscriptionPlans } from "@/hooks/useSubscriptionPlans";
import type {
  PlatformPackageItem,
  CreatePackagePayload,
  UpdatePackagePayload,
  PackageCategory,
  PackageBillingType,
} from "@/hooks/usePlatformPackages";

export interface EditPackageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  packageToEdit?: PlatformPackageItem | null;
  existingPackages: PlatformPackageItem[];
  onSave: (payload: CreatePackagePayload) => Promise<void>;
  onUpdate: (code: string, payload: UpdatePackagePayload) => Promise<void>;
}

const CATEGORIES: PackageCategory[] = [
  "TELEMETRY",
  "FIELD_OPS",
  "CAPACITY_BOOSTER",
  "SECURITY_GOV",
  "CIVIL_INFRA",
  "AI_COPILOT",
  "GIS_ANALYTICS",
  "DISASTER_RECOVERY",
  "BILLING_FINANCE",
  "INTEGRATION",
  "WORKFORCE_SAFETY",
  "COLLABORATION",
];

const BILLING_TYPES: PackageBillingType[] = [
  "MONTHLY_RECURRING",
  "ANNUAL_RECURRING",
  "ONE_TIME",
  "METERED_USAGE",
];

const DEFAULT_TIERS = ["FREE", "STARTER", "PRO", "ENTERPRISE"];

export function EditPackageModal({
  open,
  onOpenChange,
  packageToEdit,
  existingPackages,
  onSave,
  onUpdate,
}: EditPackageModalProps) {
  const { t } = useTranslation();
  const { data: dbPlans = [] } = useSubscriptionPlans();
  const isEditing = !!packageToEdit;

  // Deriving actual tier options directly from database subscription plans
  const availableTiers = React.useMemo(() => {
    if (dbPlans && dbPlans.length > 0) {
      return Array.from(new Set(dbPlans.map((p) => p.name.toUpperCase())));
    }
    return DEFAULT_TIERS;
  }, [dbPlans]);

  const [packageCode, setPackageCode] = React.useState("");
  const [packageName, setPackageName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [category, setCategory] = React.useState<PackageCategory>("TELEMETRY");
  const [billingType, setBillingType] = React.useState<PackageBillingType>("MONTHLY_RECURRING");
  const [priceIdr, setPriceIdr] = React.useState<number>(0);
  const [minimumTier, setMinimumTier] = React.useState<string>("FREE");
  const [quotaDeltaOlt, setQuotaDeltaOlt] = React.useState<number>(0);
  const [quotaDeltaOdp, setQuotaDeltaOdp] = React.useState<number>(0);
  const [published, setPublished] = React.useState<boolean>(false);
  const [prerequisiteCodes, setPrerequisiteCodes] = React.useState<string[]>([]);
  const [conflictCodes, setConflictCodes] = React.useState<string[]>([]);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (packageToEdit) {
      setPackageCode(packageToEdit.packageCode);
      setPackageName(packageToEdit.packageName);
      setDescription(packageToEdit.description || "");
      setCategory(packageToEdit.category);
      setBillingType(packageToEdit.billingType);
      setPriceIdr(packageToEdit.priceIdr);
      setMinimumTier(packageToEdit.minimumTier || "FREE");
      setQuotaDeltaOlt(packageToEdit.quotaDeltaOlt || 0);
      setQuotaDeltaOdp(packageToEdit.quotaDeltaOdp || 0);
      setPublished(packageToEdit.published);
      setPrerequisiteCodes(packageToEdit.prerequisiteCodes || []);
      setConflictCodes(packageToEdit.conflictCodes || []);
    } else {
      setPackageCode("");
      setPackageName("");
      setDescription("");
      setCategory("TELEMETRY");
      setBillingType("MONTHLY_RECURRING");
      setPriceIdr(499500);
      setMinimumTier("FREE");
      setQuotaDeltaOlt(0);
      setQuotaDeltaOdp(0);
      setPublished(false);
      setPrerequisiteCodes([]);
      setConflictCodes([]);
    }
  }, [packageToEdit, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!packageName.trim()) return;

    setSubmitting(true);
    try {
      if (isEditing) {
        await onUpdate(packageToEdit.packageCode, {
          packageName: packageName.trim(),
          description: description.trim() || undefined,
          category,
          billingType,
          priceIdr: Number(priceIdr) || 0,
          minimumTier: minimumTier || undefined,
          quotaDeltaOlt: Number(quotaDeltaOlt) || 0,
          quotaDeltaOdp: Number(quotaDeltaOdp) || 0,
          published,
          prerequisiteCodes,
          conflictCodes,
        });
      } else {
        await onSave({
          packageCode: packageCode.trim().toUpperCase(),
          packageName: packageName.trim(),
          description: description.trim() || undefined,
          category,
          billingType,
          priceIdr: Number(priceIdr) || 0,
          minimumTier: minimumTier || undefined,
          quotaDeltaOlt: Number(quotaDeltaOlt) || 0,
          quotaDeltaOdp: Number(quotaDeltaOdp) || 0,
          published,
          prerequisiteCodes,
          conflictCodes,
        });
      }
      onOpenChange(false);
    } catch (err) {
      console.error("Failed to save package", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-card border-border text-foreground">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Boxes className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                {isEditing
                  ? t("packages.edit_modal.edit_title")
                  : t("packages.edit_modal.create_title")}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {t("packages.edit_modal.subtitle")}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-2 text-xs">
          {/* Row 1: Code & Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-foreground">
                {t("packages.fields.package_code")}
              </label>
              <Input
                value={packageCode}
                onChange={(e) => setPackageCode(e.target.value.toUpperCase().replace(/\s+/g, "_"))}
                disabled={isEditing}
                placeholder="PKG_OLT_POLLER_10"
                required
                className="h-8 font-mono text-xs bg-muted/20 border-border"
              />
              <span className="text-[10px] text-muted-foreground mt-0.5 block">
                {t("packages.fields.package_code_help")}
              </span>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-foreground">
                {t("packages.fields.package_name")}
              </label>
              <Input
                value={packageName}
                onChange={(e) => setPackageName(e.target.value)}
                placeholder={t("packages.fields.name_placeholder")}
                required
                className="h-8 text-xs bg-muted/20 border-border"
              />
            </div>
          </div>

          {/* Row 2: Category & Billing Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-foreground">
                {t("packages.fields.category")}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as PackageCategory)}
                className="w-full h-8 rounded-md border border-border bg-card px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-medium"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {t(`packages.category.${cat}`)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-foreground">
                {t("packages.fields.billing_type")}
              </label>
              <select
                value={billingType}
                onChange={(e) => setBillingType(e.target.value as PackageBillingType)}
                className="w-full h-8 rounded-md border border-border bg-card px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-medium"
              >
                {BILLING_TYPES.map((bt) => (
                  <option key={bt} value={bt}>
                    {t(`packages.billing_type.${bt}`)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 3: Price IDR & Minimum Tier (Dynamic from Database) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-foreground">
                {t("packages.fields.price_idr")}
              </label>
              <Input
                type="number"
                min={0}
                value={priceIdr}
                onChange={(e) => setPriceIdr(Number(e.target.value))}
                required
                className="h-8 font-mono text-xs bg-muted/20 border-border"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-foreground">
                {t("packages.fields.minimum_tier")}
              </label>
              <select
                value={minimumTier}
                onChange={(e) => setMinimumTier(e.target.value)}
                className="w-full h-8 rounded-md border border-border bg-card px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-medium font-mono"
              >
                {availableTiers.map((tr) => (
                  <option key={tr} value={tr}>
                    {tr}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 4: Quota Boosters OLT & ODP */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-2.5 rounded-md bg-muted/20 border border-border/80">
            <div>
              <label className="block font-semibold mb-1 text-foreground">
                {t("packages.fields.quota_delta_olt")}
              </label>
              <Input
                type="number"
                min={0}
                value={quotaDeltaOlt}
                onChange={(e) => setQuotaDeltaOlt(Number(e.target.value))}
                placeholder="0"
                className="h-8 font-mono text-xs bg-card border-border"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-foreground">
                {t("packages.fields.quota_delta_odp")}
              </label>
              <Input
                type="number"
                min={0}
                value={quotaDeltaOdp}
                onChange={(e) => setQuotaDeltaOdp(Number(e.target.value))}
                placeholder="0"
                className="h-8 font-mono text-xs bg-card border-border"
              />
            </div>
          </div>

          {/* Row 5: Description */}
          <div>
            <label className="block font-semibold mb-1 text-foreground">
              {t("packages.fields.description")}
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("packages.fields.description_placeholder")}
              className="w-full rounded-md border border-border bg-muted/20 px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Row 6: Prerequisites & Conflicts */}
          {existingPackages.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-2.5 rounded-md bg-muted/20 border border-border/80">
              <div>
                <label className="block font-semibold mb-1 text-foreground">
                  {t("packages.fields.prerequisites")}
                </label>
                <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto custom-scrollbar p-1">
                  {existingPackages
                    .filter((p) => p.packageCode !== (packageToEdit?.packageCode || packageCode))
                    .map((pkg) => {
                      const isSelected = prerequisiteCodes.includes(pkg.packageCode);
                      return (
                        <button
                          key={pkg.packageCode}
                          type="button"
                          onClick={() => {
                            setPrerequisiteCodes((prev) =>
                              isSelected ? prev.filter((c) => c !== pkg.packageCode) : [...prev, pkg.packageCode]
                            );
                          }}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-mono border transition-colors ${
                            isSelected
                              ? "bg-sky-500/20 text-sky-500 border-sky-500/40 font-bold"
                              : "bg-muted/30 text-muted-foreground border-border hover:text-foreground"
                          }`}
                        >
                          {pkg.packageCode}
                        </button>
                      );
                    })}
                </div>
                <span className="text-[10px] text-muted-foreground mt-0.5 block">
                  {t("packages.fields.prerequisites_help")}
                </span>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-foreground">
                  {t("packages.fields.conflicts")}
                </label>
                <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto custom-scrollbar p-1">
                  {existingPackages
                    .filter((p) => p.packageCode !== (packageToEdit?.packageCode || packageCode))
                    .map((pkg) => {
                      const isSelected = conflictCodes.includes(pkg.packageCode);
                      return (
                        <button
                          key={pkg.packageCode}
                          type="button"
                          onClick={() => {
                            setConflictCodes((prev) =>
                              isSelected ? prev.filter((c) => c !== pkg.packageCode) : [...prev, pkg.packageCode]
                            );
                          }}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-mono border transition-colors ${
                            isSelected
                              ? "bg-rose-500/20 text-rose-500 border-rose-500/40 font-bold"
                              : "bg-muted/30 text-muted-foreground border-border hover:text-foreground"
                          }`}
                        >
                          {pkg.packageCode}
                        </button>
                      );
                    })}
                </div>
                <span className="text-[10px] text-muted-foreground mt-0.5 block">
                  {t("packages.fields.conflicts_help")}
                </span>
              </div>
            </div>
          )}

          {/* Row 7: Published Toggle */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="packagePublishedCheck"
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary accent-primary"
            />
            <label htmlFor="packagePublishedCheck" className="text-xs font-semibold text-foreground cursor-pointer">
              {t("packages.fields.is_published")}
            </label>
          </div>

          <DialogFooter className="pt-3 border-t border-border flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-7 px-3 text-xs"
            >
              {t("packages.edit_modal.cancel_btn")}
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={submitting}
              className="h-7 px-3 text-xs font-semibold gap-1.5"
            >
              <Save className="h-3.5 w-3.5" />
              {isEditing
                ? t("packages.edit_modal.update_btn")
                : t("packages.edit_modal.save_btn")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
