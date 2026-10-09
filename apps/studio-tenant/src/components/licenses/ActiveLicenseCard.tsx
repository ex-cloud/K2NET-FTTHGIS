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
  Zap,
  Globe,
  Lock,
  Cpu,
} from "lucide-react";
import { Card, Button, Badge } from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import type { TenantLicenseDetails } from "../../hooks/useTenantLicense";
import { toast } from "sonner";

interface ActiveLicenseCardProps {
  license: TenantLicenseDetails | null | undefined;
  isLoading: boolean;
  onOpenActivateModal: () => void;
}

function LicenseCardHeader({
  license,
  onOpenActivateModal,
}: {
  license: TenantLicenseDetails | null | undefined;
  onOpenActivateModal: () => void;
}) {
  const { t } = useTranslation();
  const statusKey = license ? license.status.toLowerCase() : "active";

  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-border/60">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border/80 bg-muted/40 text-foreground">
          <KeyRound className="h-5 w-5" />
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base font-semibold text-foreground tracking-tight">
              {license?.planName || t("license.tenant.no_active_license")}
            </h2>
            {license && (
              <Badge
                variant="outline"
                className="text-[11px] font-mono px-2 py-0.5 border-border/80 bg-muted/30 text-foreground"
              >
                {t(`license.status.${statusKey}`)}
              </Badge>
            )}
            {license?.activationType && (
              <Badge
                variant="outline"
                className="text-[10px] font-mono px-1.5 py-0 border-border/60 text-muted-foreground"
              >
                {license.activationType}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {license
              ? t("license.tenant.tenant_license_active_desc")
              : t("license.tenant.tenant_license_none_desc")}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Button
          size="sm"
          variant="default"
          onClick={onOpenActivateModal}
          className="h-7 px-2.5 text-xs font-medium gap-1.5 rounded-md shadow-xs bg-foreground text-background hover:bg-foreground/90 cursor-pointer"
        >
          <Zap className="h-3.5 w-3.5" />
          <span>{t("license.tenant.activate_license_btn")}</span>
        </Button>
      </div>
    </div>
  );
}

function LicenseKeySection({
  license,
}: {
  license: TenantLicenseDetails;
}) {
  const { t, formatDate } = useTranslation();
  const [copied, setCopied] = React.useState(false);
  const [showFullKey, setShowFullKey] = React.useState(false);

  const handleCopyKey = () => {
    if (!license.licenseKey) return;
    navigator.clipboard.writeText(license.licenseKey);
    setCopied(true);
    toast.success(t("license.tenant.key_copied_to_clipboard"));
    setTimeout(() => setCopied(false), 2000);
  };

  const displayKey = showFullKey ? license.licenseKey : license.maskedLicenseKey;

  return (
    <div className="md:col-span-2 space-y-2">
      <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
        {t("license.tenant.cryptographic_license_token")}
      </label>
      <div className="flex items-center gap-2 p-2 rounded-md bg-muted/30 border border-border/80 font-mono text-xs">
        <span className="flex-1 select-all font-semibold tracking-wide text-foreground truncate">
          {displayKey || "—"}
        </span>
        <Button
          size="xs"
          variant="ghost"
          onClick={() => setShowFullKey(!showFullKey)}
          title={showFullKey ? t("common.hide") : t("common.show")}
          className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
        >
          {showFullKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
        </Button>
        <Button
          size="xs"
          variant="ghost"
          onClick={handleCopyKey}
          title={t("common.copy")}
          className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-foreground" /> : <Copy className="h-3.5 w-3.5" />}
        </Button>
      </div>
      <div className="flex items-center gap-3 text-[11px] text-muted-foreground pt-1">
        <span className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {t("license.tenant.valid_from")}: {formatDate(license.validFrom)}
        </span>
        <span>•</span>
        <span className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {t("license.tenant.valid_until")}: {formatDate(license.validUntil)}
        </span>
      </div>
    </div>
  );
}

function LicenseValidityBox({
  license,
}: {
  license: TenantLicenseDetails;
}) {
  const { t } = useTranslation();
  const isExpired = license.status === "EXPIRED" || license.daysRemaining <= 0;
  const isGrace = license.status === "GRACE_PERIOD";

  return (
    <div className="rounded-md border border-border/80 bg-muted/20 p-3 flex flex-col justify-between">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{t("license.tenant.validity_period")}</span>
        <ShieldCheck className="h-3.5 w-3.5 text-foreground/70" />
      </div>
      <div className="py-1">
        <div className="text-2xl font-bold font-mono tracking-tight text-foreground">
          {license.daysRemaining > 0 ? license.daysRemaining : 0}{" "}
          <span className="text-xs font-normal text-muted-foreground">{t("license.tenant.days_left")}</span>
        </div>
        {isGrace && (
          <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
            {t("license.tenant.grace_days_remaining", { count: license.graceDaysRemaining })}
          </p>
        )}
        {isExpired && !isGrace && (
          <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
            {t("license.tenant.license_expired_notice")}
          </p>
        )}
      </div>
      <div className="text-[11px] text-muted-foreground/75 truncate">
        {t("license.tenant.issued_by")}: {license.issuedBy || "System Core"}
      </div>
    </div>
  );
}

function LicenseEntitlementsBar({
  entitlements,
}: {
  entitlements: TenantLicenseDetails["entitlements"];
}) {
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

export function ActiveLicenseCard({
  license,
  isLoading,
  onOpenActivateModal,
}: ActiveLicenseCardProps) {
  const { t } = useTranslation();

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
    <Card className="p-5 border-border/80 bg-card shadow-2xs relative overflow-hidden">
      <LicenseCardHeader
        license={license}
        onOpenActivateModal={onOpenActivateModal}
      />

      {license ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
          <LicenseKeySection license={license} />
          <LicenseValidityBox license={license} />
        </div>
      ) : (
        <div className="py-6 text-center text-xs text-muted-foreground">
          {t("license.tenant.no_license_prompt")}
        </div>
      )}

      {license?.entitlements && (
        <LicenseEntitlementsBar entitlements={license.entitlements} />
      )}
    </Card>
  );
}
