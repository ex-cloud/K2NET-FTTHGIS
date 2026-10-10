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
import { Sliders, Building2, Key, Cpu, ShieldCheck } from "lucide-react";
import { useTranslation } from "@k2net/i18n";
import {
  useUpdateLicense,
  type LicenseItem,
  type LicenseStatus,
  type UpdateLicensePayload,
} from "@/hooks/useOrganizationLicenses";

interface EditLicenseModalProps {
  license: LicenseItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface QuotaOverridesProps {
  overrideMaxProjects: string;
  setOverrideMaxProjects: (val: string) => void;
  overrideMaxOdps: string;
  setOverrideMaxOdps: (val: string) => void;
  overrideMaxOdcs: string;
  setOverrideMaxOdcs: (val: string) => void;
  overrideMaxCustomers: string;
  setOverrideMaxCustomers: (val: string) => void;
  overrideMaxStorageGb: string;
  setOverrideMaxStorageGb: (val: string) => void;
}

function QuotaOverridesFields({
  overrideMaxProjects,
  setOverrideMaxProjects,
  overrideMaxOdps,
  setOverrideMaxOdps,
  overrideMaxOdcs,
  setOverrideMaxOdcs,
  overrideMaxCustomers,
  setOverrideMaxCustomers,
  overrideMaxStorageGb,
  setOverrideMaxStorageGb,
}: QuotaOverridesProps) {
  const { t } = useTranslation();
  return (
    <div className="border border-border/70 rounded-md p-3 bg-muted/10 space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-foreground text-xs">
          {t("license.modal.quota_overrides")}
        </span>
        <span className="text-[10px] text-muted-foreground">
          {t("license.modal.quota_overrides_hint")}
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
            placeholder={t("license.modal.default_quota_placeholder")}
            value={overrideMaxProjects}
            onChange={(e) => setOverrideMaxProjects(e.target.value)}
            className="h-7 text-xs bg-background"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[11px] text-muted-foreground">
            {t("license.modal.max_odps")}
          </Label>
          <Input
            type="number"
            min={1}
            placeholder={t("license.modal.default_quota_placeholder")}
            value={overrideMaxOdps}
            onChange={(e) => setOverrideMaxOdps(e.target.value)}
            className="h-7 text-xs bg-background"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[11px] text-muted-foreground">
            {t("license.modal.max_odcs")}
          </Label>
          <Input
            type="number"
            min={1}
            placeholder={t("license.modal.default_quota_placeholder")}
            value={overrideMaxOdcs}
            onChange={(e) => setOverrideMaxOdcs(e.target.value)}
            className="h-7 text-xs bg-background"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[11px] text-muted-foreground">
            {t("license.modal.max_customers")}
          </Label>
          <Input
            type="number"
            min={1}
            placeholder={t("license.modal.default_quota_placeholder")}
            value={overrideMaxCustomers}
            onChange={(e) => setOverrideMaxCustomers(e.target.value)}
            className="h-7 text-xs bg-background"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[11px] text-muted-foreground">
            {t("license.modal.max_storage_gb")}
          </Label>
          <Input
            type="number"
            min={1}
            placeholder={t("license.modal.default_quota_placeholder")}
            value={overrideMaxStorageGb}
            onChange={(e) => setOverrideMaxStorageGb(e.target.value)}
            className="h-7 text-xs bg-background"
          />
        </div>
      </div>
    </div>
  );
}

interface FeatureEntitlementsProps {
  featureSso: boolean;
  setFeatureSso: (val: boolean) => void;
  featureApi: boolean;
  setFeatureApi: (val: boolean) => void;
  featureAi: boolean;
  setFeatureAi: (val: boolean) => void;
  featureDomain: boolean;
  setFeatureDomain: (val: boolean) => void;
}

function FeatureEntitlementsFields({
  featureSso,
  setFeatureSso,
  featureApi,
  setFeatureApi,
  featureAi,
  setFeatureAi,
  featureDomain,
  setFeatureDomain,
}: FeatureEntitlementsProps) {
  const { t } = useTranslation();
  return (
    <div className="border border-border/70 rounded-md p-3 bg-muted/10 space-y-2">
      <span className="font-semibold text-foreground text-xs block">
        {t("license.modal.feature_flags")}
      </span>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
        <label className="flex items-center gap-2 cursor-pointer text-xs text-foreground">
          <Checkbox
            checked={featureSso}
            onCheckedChange={(c) => setFeatureSso(Boolean(c))}
          />
          <span>{t("license.modal.feature_sso")}</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer text-xs text-foreground">
          <Checkbox
            checked={featureApi}
            onCheckedChange={(c) => setFeatureApi(Boolean(c))}
          />
          <span>{t("license.modal.feature_api")}</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer text-xs text-foreground">
          <Checkbox
            checked={featureAi}
            onCheckedChange={(c) => setFeatureAi(Boolean(c))}
          />
          <span>{t("license.modal.feature_ai")}</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer text-xs text-foreground">
          <Checkbox
            checked={featureDomain}
            onCheckedChange={(c) => setFeatureDomain(Boolean(c))}
          />
          <span>{t("license.modal.feature_domain")}</span>
        </label>
      </div>
    </div>
  );
}

interface BillingContactsProps {
  billingContactName: string;
  setBillingContactName: (val: string) => void;
  billingContactEmail: string;
  setBillingContactEmail: (val: string) => void;
  billingContactPhone: string;
  setBillingContactPhone: (val: string) => void;
  notifyEmail: boolean;
  setNotifyEmail: (val: boolean) => void;
  notifyWhatsapp: boolean;
  setNotifyWhatsapp: (val: boolean) => void;
}

function BillingContactsFields({
  billingContactName,
  setBillingContactName,
  billingContactEmail,
  setBillingContactEmail,
  billingContactPhone,
  setBillingContactPhone,
  notifyEmail,
  setNotifyEmail,
  notifyWhatsapp,
  setNotifyWhatsapp,
}: BillingContactsProps) {
  const { t } = useTranslation();
  return (
    <div className="border border-border/70 rounded-md p-3 bg-muted/10 space-y-2.5">
      <div className="flex items-center gap-1.5">
        <ShieldCheck className="size-3.5 text-muted-foreground" />
        <span className="font-semibold text-foreground text-xs">
          {t("license.modal.contacts_heading")}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <div className="space-y-1">
          <Label className="text-[11px] text-muted-foreground">
            {t("license.tenant.contact_name_label")}
          </Label>
          <Input
            type="text"
            placeholder={t("license.tenant.contact_name_placeholder")}
            value={billingContactName}
            onChange={(e) => setBillingContactName(e.target.value)}
            className="h-7 text-xs bg-background"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[11px] text-muted-foreground">
            {t("license.tenant.contact_email_label")}
          </Label>
          <Input
            type="email"
            placeholder="billing@tenant.isp"
            value={billingContactEmail}
            onChange={(e) => setBillingContactEmail(e.target.value)}
            className="h-7 text-xs bg-background"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[11px] text-muted-foreground">
            {t("license.tenant.contact_phone_label")}
          </Label>
          <Input
            type="tel"
            placeholder="+628123456789"
            value={billingContactPhone}
            onChange={(e) => setBillingContactPhone(e.target.value)}
            className="h-7 text-xs bg-background"
          />
        </div>
      </div>

      <div className="flex items-center gap-4 pt-1">
        <label className="flex items-center gap-1.5 cursor-pointer text-xs text-foreground">
          <Checkbox
            checked={notifyEmail}
            onCheckedChange={(c) => setNotifyEmail(Boolean(c))}
          />
          <span>{t("license.tenant.channel_email")}</span>
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer text-xs text-foreground">
          <Checkbox
            checked={notifyWhatsapp}
            onCheckedChange={(c) => setNotifyWhatsapp(Boolean(c))}
          />
          <span>{t("license.tenant.channel_whatsapp")}</span>
        </label>
      </div>
    </div>
  );
}

export function EditLicenseModal({
  license,
  open,
  onOpenChange,
}: EditLicenseModalProps) {
  const { t } = useTranslation();
  const updateMutation = useUpdateLicense();

  // Status & Dates
  const [status, setStatus] = React.useState<LicenseStatus>("ACTIVE");
  const [validUntil, setValidUntil] = React.useState<string>("");
  const [gracePeriodUntil, setGracePeriodUntil] = React.useState<string>("");

  // Custom Quota Overrides
  const [overrideMaxProjects, setOverrideMaxProjects] = React.useState<string>("");
  const [overrideMaxOdps, setOverrideMaxOdps] = React.useState<string>("");
  const [overrideMaxOdcs, setOverrideMaxOdcs] = React.useState<string>("");
  const [overrideMaxCustomers, setOverrideMaxCustomers] = React.useState<string>("");
  const [overrideMaxStorageGb, setOverrideMaxStorageGb] = React.useState<string>("");

  // Feature Entitlements
  const [featureSso, setFeatureSso] = React.useState<boolean>(false);
  const [featureApi, setFeatureApi] = React.useState<boolean>(false);
  const [featureAi, setFeatureAi] = React.useState<boolean>(false);
  const [featureDomain, setFeatureDomain] = React.useState<boolean>(false);

  // Machine Fingerprint
  const [machineFingerprint, setMachineFingerprint] = React.useState<string>("");

  // Billing Contacts
  const [billingContactName, setBillingContactName] = React.useState<string>("");
  const [billingContactEmail, setBillingContactEmail] = React.useState<string>("");
  const [billingContactPhone, setBillingContactPhone] = React.useState<string>("");
  const [notifyEmail, setNotifyEmail] = React.useState<boolean>(true);
  const [notifyWhatsapp, setNotifyWhatsapp] = React.useState<boolean>(false);

  // Notes
  const [notes, setNotes] = React.useState<string>("");

  React.useEffect(() => {
    if (!license) return;

    setStatus(license.status);
    setValidUntil(license.validUntil ? license.validUntil.substring(0, 10) : "");
    setGracePeriodUntil(
      license.gracePeriodUntil ? license.gracePeriodUntil.substring(0, 10) : ""
    );

    setOverrideMaxProjects(
      license.overrideMaxProjects != null ? String(license.overrideMaxProjects) : ""
    );
    setOverrideMaxOdps(
      license.overrideMaxOdps != null ? String(license.overrideMaxOdps) : ""
    );
    setOverrideMaxOdcs(
      license.overrideMaxOdcs != null ? String(license.overrideMaxOdcs) : ""
    );
    setOverrideMaxCustomers(
      license.overrideMaxCustomers != null ? String(license.overrideMaxCustomers) : ""
    );
    setOverrideMaxStorageGb(
      license.overrideMaxStorageGb != null ? String(license.overrideMaxStorageGb) : ""
    );

    setFeatureSso(Boolean(license.featureSsoEnabled ?? license.entitlements?.ssoEnabled));
    setFeatureApi(Boolean(license.featureApiEnabled ?? license.entitlements?.apiEnabled));
    setFeatureAi(
      Boolean(license.featureAiCopilotEnabled ?? license.entitlements?.aiCopilotEnabled)
    );
    setFeatureDomain(
      Boolean(
        license.featureCustomDomainEnabled ?? license.entitlements?.customDomainEnabled
      )
    );

    setMachineFingerprint(license.machineFingerprint || "");
    setBillingContactName(license.billingContactName || "");
    setBillingContactEmail(license.billingContactEmail || "");
    setBillingContactPhone(license.billingContactPhone || "");
    setNotifyEmail(license.notifyEmailEnabled ?? true);
    setNotifyWhatsapp(license.notifyWhatsappEnabled ?? false);
    setNotes(license.notes || "");
  }, [license]);

  if (!license) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload: UpdateLicensePayload = {
      organizationId: license.organizationId,
      licenseId: license.id,
      status,
      validUntil: validUntil ? `${validUntil}T23:59:59` : undefined,
      gracePeriodUntil: gracePeriodUntil ? `${gracePeriodUntil}T23:59:59` : undefined,
      overrideMaxProjects: overrideMaxProjects.trim()
        ? parseInt(overrideMaxProjects, 10)
        : undefined,
      overrideMaxOdps: overrideMaxOdps.trim() ? parseInt(overrideMaxOdps, 10) : undefined,
      overrideMaxOdcs: overrideMaxOdcs.trim() ? parseInt(overrideMaxOdcs, 10) : undefined,
      overrideMaxCustomers: overrideMaxCustomers.trim()
        ? parseInt(overrideMaxCustomers, 10)
        : undefined,
      overrideMaxStorageGb: overrideMaxStorageGb.trim()
        ? parseInt(overrideMaxStorageGb, 10)
        : undefined,
      featureSsoEnabled: featureSso,
      featureApiEnabled: featureApi,
      featureAiCopilotEnabled: featureAi,
      featureCustomDomainEnabled: featureDomain,
      machineFingerprint: machineFingerprint.trim() || undefined,
      billingContactName: billingContactName.trim() || undefined,
      billingContactEmail: billingContactEmail.trim() || undefined,
      billingContactPhone: billingContactPhone.trim() || undefined,
      notifyEmailEnabled: notifyEmail,
      notifyWhatsappEnabled: notifyWhatsapp,
      notes: notes.trim() || undefined,
    };

    try {
      await updateMutation.mutateAsync(payload);
      toast.success(t("license.feedback.update_success"));
      onOpenChange(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("license.feedback.error_generic");
      toast.error(msg);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-md bg-muted text-foreground">
              <Sliders className="size-3.5" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold text-foreground">
                {t("license.modal.edit_title")}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {t("license.modal.edit_desc")}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Target License Overview Pill */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-md border border-border/70 bg-muted/20 text-xs">
          <div className="flex items-center gap-2">
            <Building2 className="size-3.5 text-muted-foreground" />
            <span className="font-semibold text-foreground">
              {license.organizationName}
            </span>
            <span className="text-[11px] font-mono text-muted-foreground">
              ({license.organizationSlug})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 rounded-xs border border-border bg-card text-[10px] font-semibold text-foreground">
              {license.planName}
            </span>
            <span className="inline-flex items-center gap-1 font-mono text-[11px] text-muted-foreground">
              <Key className="size-3" />
              {license.maskedLicenseKey}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 py-2 text-xs">
          {/* Status & Validity Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">
                {t("license.modal.edit_status")}
              </Label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as LicenseStatus)}
                className="w-full h-8 px-2.5 rounded-md border border-border bg-background text-foreground text-xs focus:outline-hidden focus:ring-1 focus:ring-border"
              >
                <option value="ACTIVE">{t("license.status.active")}</option>
                <option value="GRACE_PERIOD">{t("license.status.grace_period")}</option>
                <option value="RESTRICTED_READ_ONLY">
                  {t("license.status.restricted_read_only")}
                </option>
                <option value="SUSPENDED">{t("license.status.suspended")}</option>
                <option value="REVOKED">{t("license.status.revoked")}</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">
                {t("license.modal.edit_valid_until")}
              </Label>
              <Input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className="h-8 text-xs bg-background"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">
                {t("license.modal.edit_grace_until")}
              </Label>
              <Input
                type="date"
                value={gracePeriodUntil}
                onChange={(e) => setGracePeriodUntil(e.target.value)}
                className="h-8 text-xs bg-background"
              />
            </div>
          </div>

          <QuotaOverridesFields
            overrideMaxProjects={overrideMaxProjects}
            setOverrideMaxProjects={setOverrideMaxProjects}
            overrideMaxOdps={overrideMaxOdps}
            setOverrideMaxOdps={setOverrideMaxOdps}
            overrideMaxOdcs={overrideMaxOdcs}
            setOverrideMaxOdcs={setOverrideMaxOdcs}
            overrideMaxCustomers={overrideMaxCustomers}
            setOverrideMaxCustomers={setOverrideMaxCustomers}
            overrideMaxStorageGb={overrideMaxStorageGb}
            setOverrideMaxStorageGb={setOverrideMaxStorageGb}
          />

          <FeatureEntitlementsFields
            featureSso={featureSso}
            setFeatureSso={setFeatureSso}
            featureApi={featureApi}
            setFeatureApi={setFeatureApi}
            featureAi={featureAi}
            setFeatureAi={setFeatureAi}
            featureDomain={featureDomain}
            setFeatureDomain={setFeatureDomain}
          />

          {/* Air-Gapped Machine Fingerprint */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <Cpu className="size-3 text-muted-foreground" />
              <Label className="text-xs font-medium text-foreground">
                {t("license.modal.machine_fingerprint")}
              </Label>
            </div>
            <Input
              type="text"
              placeholder={t("license.modal.machine_fingerprint_placeholder")}
              value={machineFingerprint}
              onChange={(e) => setMachineFingerprint(e.target.value)}
              className="h-8 font-mono text-[11px] bg-background"
            />
          </div>

          <BillingContactsFields
            billingContactName={billingContactName}
            setBillingContactName={setBillingContactName}
            billingContactEmail={billingContactEmail}
            setBillingContactEmail={setBillingContactEmail}
            billingContactPhone={billingContactPhone}
            setBillingContactPhone={setBillingContactPhone}
            notifyEmail={notifyEmail}
            setNotifyEmail={setNotifyEmail}
            notifyWhatsapp={notifyWhatsapp}
            setNotifyWhatsapp={setNotifyWhatsapp}
          />

          {/* Internal Notes / PO Reference */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-foreground">
              {t("license.modal.notes")}
            </Label>
            <Input
              type="text"
              placeholder={t("license.modal.notes_placeholder")}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="h-8 text-xs bg-background"
            />
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
