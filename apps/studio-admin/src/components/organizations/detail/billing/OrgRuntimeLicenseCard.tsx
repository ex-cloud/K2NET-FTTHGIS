import * as React from "react";
import {
  KeyRound,
  Copy,
  Check,
  Eye,
  EyeOff,
  ShieldCheck,
  Calendar,
  Sparkles,
  Globe,
  Lock,
  Cpu,
  Download,
  Clock,
  Plus,
} from "lucide-react";
import { Card, Button, Badge, ActionTooltip } from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import { toast } from "sonner";
import type { EnrichedOrganization } from "../../types";
import {
  useOrganizationLicenses,
  type LicenseItem,
} from "@/hooks/useOrganizationLicenses";
import { LicenseExtendModal } from "@/components/licenses/LicenseExtendModal";
import { OfflineCertExportModal } from "@/components/licenses/OfflineCertExportModal";
import { ManualIssueLicenseModal } from "@/components/licenses/ManualIssueLicenseModal";

interface OrgRuntimeLicenseCardProps {
  organization: EnrichedOrganization;
}

interface CardHeaderProps {
  activeLicense?: LicenseItem;
  onExport: () => void;
  onExtend: () => void;
  onIssue: () => void;
}

function LicenseCardTopBar({ activeLicense, onExport, onExtend, onIssue }: CardHeaderProps) {
  const { t } = useTranslation();
  const statusKey = activeLicense ? activeLicense.status.toLowerCase() : "active";

  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-border/60">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border/80 bg-muted/40 text-foreground">
          <KeyRound className="h-5 w-5" />
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-semibold text-foreground tracking-tight">
              {t("license.tenant.cryptographic_license_token")}
            </h3>
            {activeLicense ? (
              <>
                <Badge
                  variant="outline"
                  className="text-[11px] font-mono px-2 py-0.5 border-border/80 bg-muted/30 text-foreground"
                >
                  {t(`license.status.${statusKey}`)}
                </Badge>
                <Badge
                  variant="outline"
                  className="text-[11px] font-mono px-2 py-0.5 border-border/80 bg-muted/20 text-muted-foreground"
                >
                  {activeLicense.planName}
                </Badge>
                {activeLicense.activationType && (
                  <Badge
                    variant="outline"
                    className="text-[10px] font-mono px-1.5 py-0 border-border/60 text-muted-foreground"
                  >
                    {activeLicense.activationType}
                  </Badge>
                )}
              </>
            ) : (
              <Badge
                variant="outline"
                className="text-[11px] font-mono px-2 py-0.5 border-border/80 text-muted-foreground"
              >
                {t("license.tenant.no_active_license")}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {activeLicense
              ? t("license.tenant.tenant_license_active_desc")
              : t("license.tenant.tenant_license_none_desc")}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {activeLicense ? (
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={onExport}
              className="h-7 px-2.5 text-xs font-medium gap-1.5 rounded-md border-border/80 text-foreground hover:bg-muted/40 cursor-pointer shadow-2xs"
            >
              <Download className="h-3.5 w-3.5" />
              <span>{t("license.actions.export_cert")}</span>
            </Button>
            <Button
              size="sm"
              variant="default"
              onClick={onExtend}
              className="h-7 px-2.5 text-xs font-medium gap-1.5 rounded-md shadow-xs bg-foreground text-background hover:bg-foreground/90 cursor-pointer"
            >
              <Clock className="h-3.5 w-3.5" />
              <span>{t("license.actions.extend_license")}</span>
            </Button>
          </>
        ) : (
          <Button
            size="sm"
            variant="default"
            onClick={onIssue}
            className="h-7 px-2.5 text-xs font-medium gap-1.5 rounded-md shadow-xs bg-foreground text-background hover:bg-foreground/90 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>{t("license.actions.issue_manual")}</span>
          </Button>
        )}
      </div>
    </div>
  );
}

interface LicenseTokenSectionProps {
  activeLicense: LicenseItem;
}

function LicenseTokenSection({ activeLicense }: LicenseTokenSectionProps) {
  const { t, formatDate } = useTranslation();
  const [copied, setCopied] = React.useState(false);
  const [showFullKey, setShowFullKey] = React.useState(false);

  const handleCopyKey = () => {
    if (!activeLicense.licenseKey) return;
    navigator.clipboard.writeText(activeLicense.licenseKey);
    setCopied(true);
    toast.success(t("license.tenant.key_copied_to_clipboard"));
    setTimeout(() => setCopied(false), 2000);
  };

  const displayKey = showFullKey
    ? activeLicense.licenseKey
    : activeLicense.maskedLicenseKey;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
      {/* License Token & Dates */}
      <div className="md:col-span-2 space-y-2">
        <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
          {t("license.table.license_key")}
        </label>
        <div className="flex items-center gap-2 p-2 rounded-md bg-muted/30 border border-border/80 font-mono text-xs">
          <span className="flex-1 select-all font-semibold tracking-wide text-foreground truncate">
            {displayKey || "—"}
          </span>
          <ActionTooltip label={showFullKey ? t("common.hide") : t("common.show")}>
            <Button
              size="xs"
              variant="ghost"
              onClick={() => setShowFullKey(!showFullKey)}
              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              {showFullKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </Button>
          </ActionTooltip>
          <ActionTooltip label={t("license.actions.copy_key")}>
            <Button
              size="xs"
              variant="ghost"
              onClick={handleCopyKey}
              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-foreground" /> : <Copy className="h-3.5 w-3.5" />}
            </Button>
          </ActionTooltip>
        </div>

        <div className="flex items-center gap-3 text-[11px] text-muted-foreground pt-1 flex-wrap">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {t("license.tenant.valid_from")}: {formatDate(activeLicense.validFrom)}
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {t("license.tenant.valid_until")}: {formatDate(activeLicense.validUntil)}
          </span>
          {activeLicense.machineFingerprint && (
            <>
              <span>•</span>
              <span className="flex items-center gap-1 text-primary font-mono text-[10px]">
                <Cpu className="h-3 w-3" />
                {t("license.modal.airgap_lock_badge")}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Validity Box */}
      <div className="rounded-md border border-border/80 bg-muted/20 p-3 flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{t("license.table.days_remaining")}</span>
          <ShieldCheck className="h-3.5 w-3.5 text-foreground/70" />
        </div>
        <div className="py-1">
          <div className="text-2xl font-bold font-mono tracking-tight text-foreground">
            {activeLicense.daysRemaining > 0 ? activeLicense.daysRemaining : 0}{" "}
            <span className="text-xs font-normal text-muted-foreground">{t("license.tenant.days_left")}</span>
          </div>
          {activeLicense.status === "GRACE_PERIOD" && (
            <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
              {t("license.tenant.grace_days_remaining", { count: activeLicense.graceDaysRemaining })}
            </p>
          )}
        </div>
        <div className="text-[11px] text-muted-foreground/75 truncate">
          {t("license.tenant.issued_by")}: {activeLicense.issuedBy || "System Core"}
        </div>
      </div>
    </div>
  );
}

function LicenseEntitlementsList({ entitlements }: { entitlements: LicenseItem["entitlements"] }) {
  const { t } = useTranslation();

  return (
    <div className="mt-4 pt-3 border-t border-border/50 flex items-center gap-2 flex-wrap">
      <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mr-1">
        {t("license.tenant.entitlements")}:
      </span>
      {entitlements.ssoEnabled && (
        <Badge variant="outline" className="text-[10px] gap-1 border-border/70 text-foreground bg-muted/20">
          <Lock className="h-3 w-3" /> Keycloak SSO
        </Badge>
      )}
      {entitlements.apiEnabled && (
        <Badge variant="outline" className="text-[10px] gap-1 border-border/70 text-foreground bg-muted/20">
          <Cpu className="h-3 w-3" /> REST API Gateway
        </Badge>
      )}
      {entitlements.aiCopilotEnabled && (
        <Badge variant="outline" className="text-[10px] gap-1 border-border/70 text-foreground bg-muted/20">
          <Sparkles className="h-3 w-3" /> AI Fiber Copilot
        </Badge>
      )}
      {entitlements.customDomainEnabled && (
        <Badge variant="outline" className="text-[10px] gap-1 border-border/70 text-foreground bg-muted/20">
          <Globe className="h-3 w-3" /> Custom Domain
        </Badge>
      )}
    </div>
  );
}

export function OrgRuntimeLicenseCard({ organization }: OrgRuntimeLicenseCardProps) {
  const { t } = useTranslation();
  const { data: licenses = [], isLoading } = useOrganizationLicenses(organization.id);

  const [extendModalOpen, setExtendModalOpen] = React.useState(false);
  const [exportModalOpen, setExportModalOpen] = React.useState(false);
  const [issueModalOpen, setIssueModalOpen] = React.useState(false);

  // Active or most recent license
  const activeLicense: LicenseItem | undefined = React.useMemo(() => {
    if (!licenses || licenses.length === 0) return undefined;
    return (
      licenses.find((l) => l.status === "ACTIVE") ||
      licenses.find((l) => l.status === "GRACE_PERIOD") ||
      licenses[0]
    );
  }, [licenses]);

  if (isLoading) {
    return (
      <Card className="p-5 border-border/80 bg-card/60 shadow-2xs animate-pulse">
        <div className="h-6 w-1/3 bg-muted rounded mb-4" />
        <div className="h-4 w-2/3 bg-muted rounded mb-2" />
        <div className="h-10 w-full bg-muted rounded" />
      </Card>
    );
  }

  return (
    <>
      <Card className="p-5 border-border/80 bg-card shadow-2xs relative overflow-hidden">
        <LicenseCardTopBar
          activeLicense={activeLicense}
          onExport={() => setExportModalOpen(true)}
          onExtend={() => setExtendModalOpen(true)}
          onIssue={() => setIssueModalOpen(true)}
        />

        {activeLicense ? (
          <LicenseTokenSection activeLicense={activeLicense} />
        ) : (
          <div className="py-6 text-center text-xs text-muted-foreground">
            {t("license.tenant.no_license_prompt")}
          </div>
        )}

        {activeLicense?.entitlements && (
          <LicenseEntitlementsList entitlements={activeLicense.entitlements} />
        )}
      </Card>

      {/* Modals */}
      {activeLicense && (
        <>
          <LicenseExtendModal
            license={activeLicense}
            open={extendModalOpen}
            onOpenChange={setExtendModalOpen}
          />
          <OfflineCertExportModal
            license={activeLicense}
            open={exportModalOpen}
            onOpenChange={setExportModalOpen}
          />
        </>
      )}

      <ManualIssueLicenseModal
        open={issueModalOpen}
        onOpenChange={setIssueModalOpen}
        preselectedOrgId={organization.id}
      />
    </>
  );
}
