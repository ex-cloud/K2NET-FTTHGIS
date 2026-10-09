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
  Badge,
  toast,
} from "@k2net/ui";
import { Cpu, Copy, Check } from "lucide-react";
import { useTranslation } from "@k2net/i18n";
import { useOrganizations } from "@/hooks/useOrganizations";
import {
  useIssueManualLicense,
  type IssueLicensePayload,
} from "@/hooks/useOrganizationLicenses";

interface ManualIssueLicenseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedOrgId?: string;
}

export function ManualIssueLicenseModal({
  open,
  onOpenChange,
  preselectedOrgId,
}: ManualIssueLicenseModalProps) {
  const { t } = useTranslation();
  const { organizations = [] } = useOrganizations();
  const issueMutation = useIssueManualLicense();

  const [orgId, setOrgId] = React.useState<string>(preselectedOrgId || "");
  const [planName, setPlanName] = React.useState<string>("PRO");
  const [durationMonths, setDurationMonths] = React.useState<number>(12);
  const [activationType, setActivationType] = React.useState<string>("ENTERPRISE_PO");

  // Custom Quota Overrides
  const [showOverrides, setShowOverrides] = React.useState<boolean>(false);
  const [maxProjects, setMaxProjects] = React.useState<string>("");
  const [maxOdps, setMaxOdps] = React.useState<string>("");
  const [maxOdcs, setMaxOdcs] = React.useState<string>("");
  const [maxCustomers, setMaxCustomers] = React.useState<string>("");
  const [maxStorageGb, setMaxStorageGb] = React.useState<string>("");

  // Feature Flags
  const [featureSso, setFeatureSso] = React.useState<boolean>(false);
  const [featureApi, setFeatureApi] = React.useState<boolean>(false);
  const [featureAi, setFeatureAi] = React.useState<boolean>(false);
  const [featureDomain, setFeatureDomain] = React.useState<boolean>(false);

  // Machine Fingerprint & Notes
  const [machineFingerprint, setMachineFingerprint] = React.useState<string>("");
  const [copiedCli, setCopiedCli] = React.useState<boolean>(false);
  const [notes, setNotes] = React.useState<string>("");

  React.useEffect(() => {
    if (preselectedOrgId) {
      setOrgId(preselectedOrgId);
    } else if (organizations.length > 0 && !orgId) {
      setOrgId(organizations[0].id || "");
    }
  }, [preselectedOrgId, organizations, orgId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId) {
      toast.error(t("license.modal.select_org"));
      return;
    }

    const payload: IssueLicensePayload = {
      organizationId: orgId,
      planName,
      durationMonths: Math.max(1, durationMonths),
      activationType,
      overrideMaxProjects: maxProjects ? parseInt(maxProjects, 10) : undefined,
      overrideMaxOdps: maxOdps ? parseInt(maxOdps, 10) : undefined,
      overrideMaxOdcs: maxOdcs ? parseInt(maxOdcs, 10) : undefined,
      overrideMaxCustomers: maxCustomers ? parseInt(maxCustomers, 10) : undefined,
      overrideMaxStorageGb: maxStorageGb ? parseInt(maxStorageGb, 10) : undefined,
      featureSsoEnabled: featureSso,
      featureApiEnabled: featureApi,
      featureAiCopilotEnabled: featureAi,
      featureCustomDomainEnabled: featureDomain,
      machineFingerprint: machineFingerprint.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    try {
      await issueMutation.mutateAsync(payload);
      toast.success(t("license.feedback.issue_success"));
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
          <DialogTitle className="text-base font-semibold text-foreground">
            {t("license.modal.issue_title")}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {t("license.modal.issue_desc")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2 text-xs">
          {/* Organization Select */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-foreground">
              {t("license.modal.select_org")}
            </Label>
            <select
              value={orgId}
              onChange={(e) => setOrgId(e.target.value)}
              className="w-full h-8 px-2.5 rounded-md border border-border bg-background text-foreground text-xs focus:outline-hidden focus:ring-1 focus:ring-border"
              required
            >
              <option value="" disabled>
                -- {t("license.modal.select_org")} --
              </option>
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name} ({org.slug})
                </option>
              ))}
            </select>
          </div>

          {/* Tier & Duration Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">
                {t("license.modal.select_plan")}
              </Label>
              <select
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
                className="w-full h-8 px-2.5 rounded-md border border-border bg-background text-foreground text-xs focus:outline-hidden focus:ring-1 focus:ring-border"
              >
                <option value="STARTER">STARTER</option>
                <option value="PRO">PRO</option>
                <option value="ENTERPRISE">ENTERPRISE</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">
                {t("license.modal.duration_months")}
              </Label>
              <Input
                type="number"
                min={1}
                max={60}
                value={durationMonths}
                onChange={(e) => setDurationMonths(parseInt(e.target.value, 10) || 1)}
                className="h-8 text-xs bg-background"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">
                {t("license.modal.activation_mode")}
              </Label>
              <select
                value={activationType}
                onChange={(e) => setActivationType(e.target.value)}
                className="w-full h-8 px-2.5 rounded-md border border-border bg-background text-foreground text-xs focus:outline-hidden focus:ring-1 focus:ring-border"
              >
                <option value="ENTERPRISE_PO">ENTERPRISE_PO</option>
                <option value="OFFLINE_KEY">OFFLINE_KEY</option>
                <option value="ONLINE">ONLINE</option>
              </select>
            </div>
          </div>

          {/* Toggle Quota Overrides */}
          <div className="border border-border/70 rounded-md p-3 bg-muted/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground">
                {t("license.modal.quota_overrides")}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={() => setShowOverrides(!showOverrides)}
                className="h-6 text-[11px]"
              >
                {showOverrides ? t("common.hide") : t("common.edit")}
              </Button>
            </div>

            {showOverrides && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
                <div>
                  <Label className="text-[11px] text-muted-foreground">
                    {t("license.modal.max_projects_olts")}
                  </Label>
                  <Input
                    type="number"
                    placeholder="e.g. 10"
                    value={maxProjects}
                    onChange={(e) => setMaxProjects(e.target.value)}
                    className="h-7 text-xs bg-background mt-1"
                  />
                </div>
                <div>
                  <Label className="text-[11px] text-muted-foreground">
                    {t("license.modal.max_odps")}
                  </Label>
                  <Input
                    type="number"
                    placeholder="e.g. 2500"
                    value={maxOdps}
                    onChange={(e) => setMaxOdps(e.target.value)}
                    className="h-7 text-xs bg-background mt-1"
                  />
                </div>
                <div>
                  <Label className="text-[11px] text-muted-foreground">
                    {t("license.modal.max_odcs")}
                  </Label>
                  <Input
                    type="number"
                    placeholder="e.g. 500"
                    value={maxOdcs}
                    onChange={(e) => setMaxOdcs(e.target.value)}
                    className="h-7 text-xs bg-background mt-1"
                  />
                </div>
                <div>
                  <Label className="text-[11px] text-muted-foreground">
                    {t("license.modal.max_customers")}
                  </Label>
                  <Input
                    type="number"
                    placeholder="e.g. 5000"
                    value={maxCustomers}
                    onChange={(e) => setMaxCustomers(e.target.value)}
                    className="h-7 text-xs bg-background mt-1"
                  />
                </div>
                <div>
                  <Label className="text-[11px] text-muted-foreground">
                    {t("license.modal.max_storage_gb")}
                  </Label>
                  <Input
                    type="number"
                    placeholder="e.g. 250"
                    value={maxStorageGb}
                    onChange={(e) => setMaxStorageGb(e.target.value)}
                    className="h-7 text-xs bg-background mt-1"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Feature Flags Grid */}
          <div className="border border-border/70 rounded-md p-3 bg-muted/10 space-y-2">
            <span className="text-xs font-semibold text-foreground block">
              {t("license.modal.feature_flags")}
            </span>
            <div className="grid grid-cols-2 gap-2 pt-1">
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

          {/* Machine Fingerprint & Notes */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                <Cpu className="h-3.5 w-3.5 text-primary" />
                <span>{t("license.modal.machine_fingerprint")}</span>
                <Badge className="border-border bg-muted/30 text-[9px] text-muted-foreground font-mono">
                  {t("license.modal.airgap_lock_badge")}
                </Badge>
              </Label>
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={() => {
                  const cmd = 'printf "%s:%s" "$(cat /etc/machine-id 2>/dev/null || cat /var/lib/dbus/machine-id)" "$(cat /sys/class/net/$(ip route show default 2>/dev/null | awk \'{print $5}\')/address 2>/dev/null)" | sha256sum | awk \'{print $1}\'';
                  navigator.clipboard.writeText(cmd);
                  setCopiedCli(true);
                  toast.success(t("license.modal.cli_copied_toast"));
                  setTimeout(() => setCopiedCli(false), 2000);
                }}
                className="h-5 px-1.5 text-[10px] gap-1 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                {copiedCli ? (
                  <>
                    <Check className="h-2.5 w-2.5 text-primary" />
                    <span>{t("license.modal.copied")}</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-2.5 w-2.5" />
                    <span>{t("license.modal.copy_cli_btn")}</span>
                  </>
                )}
              </Button>
            </div>
            <Input
              type="text"
              placeholder={t("license.modal.machine_fingerprint_placeholder")}
              value={machineFingerprint}
              onChange={(e) => setMachineFingerprint(e.target.value)}
              className="h-8 text-xs font-mono bg-background"
            />
          </div>

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
              disabled={issueMutation.isPending}
            >
              {issueMutation.isPending ? t("common.processing") : t("license.actions.issue_manual")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
