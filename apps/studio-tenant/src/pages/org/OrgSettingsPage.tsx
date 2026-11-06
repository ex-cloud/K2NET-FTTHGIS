import * as React from "react";
import { useRouterState, useNavigate } from "@tanstack/react-router";
import {
  Building,
  Save,
  Copy,
  Palette,
  Globe,
  Lock,
  Sparkles,
  ExternalLink,
  Play,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Trash2,
  KeyRound,
} from "lucide-react";
import {
  PageHero,
  PageLayout,
  Card,
  Button,
  Input,
  Label,
  Textarea,
  Switch,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@k2net/ui";
import { toast } from "sonner";
import { useAuth } from "@k2net/auth/client";
import { useTenantInfo } from "../../hooks/useTenantInfo";
import { useTenantBranding } from "../../hooks/useTenantBranding";
import { useTenantLicense } from "../../hooks/useTenantLicense";
import { parseDomain } from "../../lib/domain";
import { useTranslation } from "@k2net/i18n";
import { BrandingSettingsSection } from "../../components/settings/BrandingSettingsSection";

type SettingsSection = "general" | "branding" | "security" | "sso" | "oauth";

interface SectionMeta {
  title: string;
  subtitle: string;
  breadcrumb: string;
}

function GeneralSettingsSection({
  organizationName,
  slug,
  email,
  nameValue,
  setNameValue,
  addressValue,
  setAddressValue,
}: {
  organizationName: string;
  slug: string;
  email: string;
  nameValue: string;
  setNameValue: (val: string) => void;
  addressValue: string;
  setAddressValue: (val: string) => void;
}) {
  const { t } = useTranslation();
  const hostname = typeof window !== "undefined" ? window.location.hostname : "";
  const { baseDomain, isHyphen } = parseDomain(hostname);
  const suffix = isHyphen ? `-${baseDomain}` : `.${baseDomain || "gis.kdua.net"}`;

  return (
    <Card className="p-5 border-border/60 bg-card space-y-4 shadow-xs">
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold">{t("settings.org_official_name")}</Label>
        <Input
          value={nameValue}
          onChange={(e) => setNameValue(e.target.value)}
          placeholder={organizationName || "Organization Workspace"}
          className="h-8.5 text-xs"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">{t("settings.tenant_subdomain")}</Label>
          <div className="flex items-center">
            <Input
              defaultValue={slug || "workspace"}
              disabled
              className="h-8.5 text-xs font-mono bg-muted/40 rounded-r-none"
            />
            <span className="h-8.5 px-3 text-xs bg-muted border border-l-0 border-border rounded-r-md flex items-center font-mono text-muted-foreground select-all">
              {suffix}
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground">
            {t("settings.subdomain_permanent_hint", { defaultValue: "Canonical system subdomain. Permanently assigned to your workspace." })}
          </p>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">{t("settings.official_email")}</Label>
          <Input
            type="email"
            defaultValue={email || ""}
            disabled
            placeholder="admin@isp.net.id"
            className="h-8.5 text-xs bg-muted/40 font-mono"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-semibold">{t("settings.hq_noc_address")}</Label>
        <Textarea
          value={addressValue}
          onChange={(e) => setAddressValue(e.target.value)}
          placeholder={t("settings.hq_address_placeholder")}
          className="text-xs min-h-[60px] resize-none"
        />
      </div>
    </Card>
  );
}

function SecuritySettingsSection({ slug }: { slug?: string }) {
  const { t } = useTranslation();
  const [loading, setLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [mfaEnforced, setMfaEnforced] = React.useState(false);
  const [sessionTimeout, setSessionTimeout] = React.useState(30);
  const [isPlatformEnforced, setIsPlatformEnforced] = React.useState(false);
  const [ipAllowlistCidrs, setIpAllowlistCidrs] = React.useState<string>("");

  React.useEffect(() => {
    if (!slug) return;
    let isMounted = true;
    (async () => {
      try {
        setLoading(true);
        const { apiClient } = await import("../../lib/api-client");
        const res = await apiClient<{
          mfaEnforced: boolean;
          sessionIdleTimeoutMinutes: number;
          isMfaEnforcedByPlatform: boolean;
          ipAllowlistCidrs?: string;
        }>(`/api/v1/organizations/${encodeURIComponent(slug)}/security-policy`);
        if (res && isMounted) {
          setMfaEnforced(res.mfaEnforced);
          setSessionTimeout(res.sessionIdleTimeoutMinutes || 30);
          setIsPlatformEnforced(res.isMfaEnforcedByPlatform);
          setIpAllowlistCidrs(res.ipAllowlistCidrs || "");
        }
      } catch (e) {
        console.warn("Failed to load tenant security policy:", e);
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [slug]);

  const handleSaveSecurity = async () => {
    if (!slug) return;
    try {
      setIsSaving(true);
      const { apiClient } = await import("../../lib/api-client");
      await apiClient(`/api/v1/organizations/${encodeURIComponent(slug)}/security-policy`, {
        method: "PUT",
        body: JSON.stringify({
          mfaEnforced: isPlatformEnforced ? true : mfaEnforced,
          sessionIdleTimeoutMinutes: sessionTimeout,
          ipAllowlistCidrs: ipAllowlistCidrs.trim() || undefined,
        }),
      });
      toast.success(t("common.saved_successfully"));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t("settings.whitelabel.save_error"));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="p-5 border-border/60 bg-card space-y-4 shadow-xs">
      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/40">
        <div className="space-y-0.5 max-w-lg">
          <div className="flex items-center gap-2">
            <Label className="text-xs font-semibold">{t("settings.mfa_enforce_label")}</Label>
            {isPlatformEnforced && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400">
                {t("settings.account.mfa_locked_platform") || "Platform Enforced"}
              </span>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground">
            {t("settings.mfa_enforce_desc")}
          </p>
        </div>
        <Switch
          checked={isPlatformEnforced || mfaEnforced}
          disabled={loading || isPlatformEnforced || isSaving}
          onCheckedChange={setMfaEnforced}
        />
      </div>

      <div className="space-y-1.5 max-w-xs">
        <Label className="text-xs font-semibold">{t("settings.session_timeout_label")}</Label>
        <Input
          type="number"
          min={5}
          max={1440}
          value={sessionTimeout}
          onChange={(e) => setSessionTimeout(parseInt(e.target.value, 10) || 30)}
          disabled={loading || isSaving}
          className="h-8.5 text-xs font-mono"
        />
        <p className="text-[10px] text-muted-foreground">{t("settings.session_timeout_desc")}</p>
      </div>

      <div className="space-y-1.5 pt-2 border-t border-border/40">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold">{t("settings.ip_allowlist_label")}</Label>
          <span className="text-[10px] text-muted-foreground font-mono">IPv4 / IPv6 CIDR</span>
        </div>
        <textarea
          rows={3}
          value={ipAllowlistCidrs}
          onChange={(e) => setIpAllowlistCidrs(e.target.value)}
          disabled={loading || isSaving}
          placeholder={t("settings.ip_allowlist_placeholder")}
          className="w-full rounded-md border border-border/60 bg-background/50 px-3 py-2 text-xs font-mono placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
        />
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          {t("settings.ip_allowlist_desc")}
        </p>
      </div>

      <div className="flex justify-end pt-2 border-t border-border/40">
        <Button
          size="sm"
          disabled={loading || isSaving}
          onClick={handleSaveSecurity}
          className="h-7 px-3 text-xs font-medium gap-1.5"
        >
          <Save className="size-3.5" />
          {isSaving ? t("settings.whitelabel.saving") : t("common.save_changes")}
        </Button>
      </div>
    </Card>
  );
}

interface SsoConfigResponse {
  id?: string;
  providerType: string;
  displayName?: string;
  issuerUrl?: string;
  clientId: string;
  hasClientSecret?: boolean;
  metadataUrl?: string;
  entityId?: string;
  singleSignOnUrl?: string;
  signingCertificate?: string;
  enforceSso: boolean;
  allowBreakGlassBypass: boolean;
  domainMappings?: string[];
  status: string;
  lastTestStatus?: string;
  lastTestAt?: string;
  lastTestErrorMessage?: string;
  version?: number;
}

function SsoSettingsSection({ slug }: { slug?: string }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { license, isLoading: isLicenseLoading } = useTenantLicense();

  const isSsoAllowed = Boolean(license?.entitlements?.ssoEnabled);

  const [providerType, setProviderType] = React.useState<string>("GOOGLE");
  const [displayName, setDisplayName] = React.useState<string>("");
  const [clientId, setClientId] = React.useState<string>("");
  const [clientSecret, setClientSecret] = React.useState<string>("");
  const [hasExistingSecret, setHasExistingSecret] = React.useState<boolean>(false);
  const [issuerUrl, setIssuerUrl] = React.useState<string>("");
  const [metadataUrl, setMetadataUrl] = React.useState<string>("");
  const [singleSignOnUrl, setSingleSignOnUrl] = React.useState<string>("");
  const [entityId, setEntityId] = React.useState<string>("");
  const [signingCertificate, setSigningCertificate] = React.useState<string>("");
  const [enforceSso, setEnforceSso] = React.useState<boolean>(false);
  const [allowBreakGlassBypass, setAllowBreakGlassBypass] = React.useState<boolean>(true);
  const [domainMappings, setDomainMappings] = React.useState<string>("");
  const [lastTestStatus, setLastTestStatus] = React.useState<string | undefined>(undefined);
  const [lastTestAt, setLastTestAt] = React.useState<string | undefined>(undefined);
  const [version, setVersion] = React.useState<number | undefined>(undefined);

  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [isSaving, setIsSaving] = React.useState<boolean>(false);
  const [isTesting, setIsTesting] = React.useState<boolean>(false);
  const [isDeleting, setIsDeleting] = React.useState<boolean>(false);

  const loadSsoConfig = React.useCallback(async () => {
    if (!slug || !isSsoAllowed) return;
    setIsLoading(true);
    try {
      const { apiClient } = await import("../../lib/api-client");
      const res = await apiClient<SsoConfigResponse>(`/api/v1/organizations/${encodeURIComponent(slug)}/sso`);
      if (res && res.providerType) {
        setProviderType(res.providerType);
        setDisplayName(res.displayName || "");
        setClientId(res.clientId || "");
        setHasExistingSecret(Boolean(res.hasClientSecret));
        setIssuerUrl(res.issuerUrl || "");
        setMetadataUrl(res.metadataUrl || "");
        setSingleSignOnUrl(res.singleSignOnUrl || "");
        setEntityId(res.entityId || "");
        setSigningCertificate(res.signingCertificate || "");
        setEnforceSso(Boolean(res.enforceSso));
        setAllowBreakGlassBypass(res.allowBreakGlassBypass !== false);
        setDomainMappings(Array.isArray(res.domainMappings) ? res.domainMappings.join(", ") : "");
        setLastTestStatus(res.lastTestStatus);
        setLastTestAt(res.lastTestAt);
        setVersion(res.version);
      }
    } catch {
      // 204 No Content or not configured yet
    } finally {
      setIsLoading(false);
    }
  }, [slug, isSsoAllowed]);

  React.useEffect(() => {
    loadSsoConfig();
  }, [loadSsoConfig]);

  const handleTestProbe = async () => {
    if (!slug) return;
    setIsTesting(true);
    try {
      const { apiClient } = await import("../../lib/api-client");
      const res = await apiClient<{ success: boolean; message: string; latencyMs?: number }>(
        `/api/v1/organizations/${encodeURIComponent(slug)}/sso/test-probe`,
        {
          method: "POST",
          body: JSON.stringify({
            providerType,
            issuerUrl: issuerUrl || undefined,
            metadataUrl: metadataUrl || undefined,
            clientId,
            clientSecret: clientSecret || undefined,
          }),
        }
      );

      if (res.success) {
        setLastTestStatus("SUCCESS");
        setLastTestAt(new Date().toISOString());
        toast.success(t("settings.sso_test_probe_success", { ms: res.latencyMs || 45 }));
      } else {
        setLastTestStatus("FAILED");
        toast.error(t("settings.sso_test_probe_failed", { error: res.message }));
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setLastTestStatus("FAILED");
      toast.error(t("settings.sso_test_probe_failed", { error: message }));
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async () => {
    if (!slug) return;
    if (!clientId.trim()) {
      toast.error("Client ID wajib diisi.");
      return;
    }

    setIsSaving(true);
    try {
      const { apiClient } = await import("../../lib/api-client");
      const payload = {
        providerType,
        displayName: displayName || undefined,
        clientId: clientId.trim(),
        clientSecret: clientSecret.trim() || undefined,
        issuerUrl: issuerUrl.trim() || undefined,
        metadataUrl: metadataUrl.trim() || undefined,
        singleSignOnUrl: singleSignOnUrl.trim() || undefined,
        entityId: entityId.trim() || undefined,
        signingCertificate: signingCertificate.trim() || undefined,
        enforceSso,
        allowBreakGlassBypass,
        domainMappings: domainMappings
          .split(/[,\n]/)
          .map((d) => d.trim().toLowerCase())
          .filter((d) => d.length > 0),
        status: "ACTIVE",
        version,
      };

      const updated = await apiClient<SsoConfigResponse>(
        `/api/v1/organizations/${encodeURIComponent(slug)}/sso`,
        {
          method: "PUT",
          body: JSON.stringify(payload),
        }
      );

      setVersion(updated.version);
      if (updated.hasClientSecret) {
        setHasExistingSecret(true);
        setClientSecret("");
      }
      toast.success(t("settings.sso_saved_success"));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!slug) return;
    if (!window.confirm(t("settings.sso_delete_confirm"))) return;

    setIsDeleting(true);
    try {
      const { apiClient } = await import("../../lib/api-client");
      await apiClient(`/api/v1/organizations/${encodeURIComponent(slug)}/sso`, {
        method: "DELETE",
      });

      setClientId("");
      setClientSecret("");
      setHasExistingSecret(false);
      setIssuerUrl("");
      setMetadataUrl("");
      setSingleSignOnUrl("");
      setEntityId("");
      setSigningCertificate("");
      setEnforceSso(false);
      setLastTestStatus(undefined);
      setLastTestAt(undefined);
      setVersion(undefined);
      toast.success(t("settings.sso_deleted_success"));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  };

  const isSaml = providerType === "SAML_CUSTOM";

  return (
    <div className="space-y-4">
      {!isSsoAllowed && !isLicenseLoading && (
        <Card className="border-amber-500/40 bg-amber-500/5 p-4 sm:p-5 relative overflow-hidden shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20 shrink-0">
                <Lock className="size-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  {t("settings.sso_locked_title")}
                  <Badge variant="outline" className="border-amber-500/30 text-amber-600 dark:text-amber-400 text-[10px] px-1.5 py-0 font-mono">
                    {t("settings.sso_badge_locked")}
                  </Badge>
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">
                  {t("settings.sso_locked_desc")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2.5 text-xs font-medium gap-1.5 border-border/80"
                onClick={() => navigate({ to: "/billing/marketplace" as unknown as string })}
              >
                <ExternalLink className="size-3.5" />
                {t("settings.sso_marketplace_btn")}
              </Button>
              <Button
                variant="default"
                size="sm"
                className="h-7 px-2.5 text-xs font-medium gap-1.5 bg-amber-600 hover:bg-amber-700 text-white"
                onClick={() => navigate({ to: "/billing/license" as unknown as string })}
              >
                <Sparkles className="size-3.5" />
                {t("settings.sso_upgrade_btn")}
              </Button>
            </div>
          </div>
        </Card>
      )}

      <Card className="p-5 border-border/60 bg-card space-y-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-lg bg-muted/30 border border-border/40">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Label className="text-xs font-semibold">{t("settings.sso_integration_label")}</Label>
              <Badge
                variant="outline"
                className={
                  lastTestStatus === "SUCCESS"
                    ? "border-primary/40 text-primary bg-primary/10 text-[10px]"
                    : lastTestStatus === "FAILED"
                    ? "border-destructive/40 text-destructive bg-destructive/10 text-[10px]"
                    : "border-border text-muted-foreground text-[10px]"
                }
              >
                {lastTestStatus === "SUCCESS" ? (
                  <span className="flex items-center gap-1"><CheckCircle2 className="size-3" /> VERIFIED</span>
                ) : lastTestStatus === "FAILED" ? (
                  <span className="flex items-center gap-1"><AlertCircle className="size-3" /> FAILED</span>
                ) : (
                  "NOT TESTED"
                )}
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground">
              {t("settings.sso_integration_desc")}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!isSsoAllowed || isTesting || (!issuerUrl && !metadataUrl)}
              onClick={handleTestProbe}
              className="h-7 px-2.5 text-xs font-medium gap-1.5 border-border/80"
            >
              {isTesting ? <Loader2 className="size-3.5 animate-spin" /> : <Play className="size-3.5 text-primary" />}
              {isTesting ? t("settings.sso_test_probe_testing") : t("settings.sso_test_probe_btn")}
            </Button>
          </div>
        </div>

        {/* Configuration Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">{t("settings.sso_provider_type")}</Label>
            <Select
              disabled={!isSsoAllowed || isLoading}
              value={providerType}
              onValueChange={setProviderType}
            >
              <SelectTrigger className="h-8.5 text-xs bg-background border-border/80">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GOOGLE">{t("settings.sso_provider_google")}</SelectItem>
                <SelectItem value="MICROSOFT_ENTRA">{t("settings.sso_provider_microsoft")}</SelectItem>
                <SelectItem value="OKTA">{t("settings.sso_provider_okta")}</SelectItem>
                <SelectItem value="OIDC_CUSTOM">{t("settings.sso_provider_custom_oidc")}</SelectItem>
                <SelectItem value="SAML_CUSTOM">{t("settings.sso_provider_custom_saml")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">{t("settings.sso_display_name_label")}</Label>
            <Input
              disabled={!isSsoAllowed || isLoading}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Corporate SSO"
              className="h-8.5 text-xs bg-background border-border/80"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">{t("settings.sso_client_id_label")}</Label>
            <Input
              disabled={!isSsoAllowed || isLoading}
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              placeholder="e.g. k2net-enterprise-client"
              className="h-8.5 text-xs font-mono bg-background border-border/80"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold flex items-center justify-between">
              <span>{t("settings.sso_client_secret_label")}</span>
              {hasExistingSecret && (
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <KeyRound className="size-3 text-primary" />
                  Encrypted
                </span>
              )}
            </Label>
            <Input
              type="password"
              disabled={!isSsoAllowed || isLoading}
              value={clientSecret}
              onChange={(e) => setClientSecret(e.target.value)}
              placeholder={hasExistingSecret ? t("settings.sso_client_secret_placeholder") : "••••••••••••••••"}
              className="h-8.5 text-xs font-mono bg-background border-border/80"
            />
          </div>

          {!isSaml ? (
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs font-semibold">{t("settings.sso_discovery_url_label")}</Label>
              <Input
                disabled={!isSsoAllowed || isLoading}
                value={issuerUrl}
                onChange={(e) => setIssuerUrl(e.target.value)}
                placeholder="https://login.microsoftonline.com/{tenant-id}/v2.0"
                className="h-8.5 text-xs font-mono bg-background border-border/80"
              />
            </div>
          ) : (
            <>
              <div className="space-y-1.5 md:col-span-2">
                <Label className="text-xs font-semibold">{t("settings.sso_sso_url_label")}</Label>
                <Input
                  disabled={!isSsoAllowed || isLoading}
                  value={singleSignOnUrl}
                  onChange={(e) => setSingleSignOnUrl(e.target.value)}
                  placeholder="https://idp.example.com/saml2/idp/SSOService.php"
                  className="h-8.5 text-xs font-mono bg-background border-border/80"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">{t("settings.sso_entity_id_label")}</Label>
                <Input
                  disabled={!isSsoAllowed || isLoading}
                  value={entityId}
                  onChange={(e) => setEntityId(e.target.value)}
                  placeholder="https://idp.example.com/entity"
                  className="h-8.5 text-xs font-mono bg-background border-border/80"
                />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label className="text-xs font-semibold">{t("settings.sso_signing_cert_label")}</Label>
                <Textarea
                  disabled={!isSsoAllowed || isLoading}
                  value={signingCertificate}
                  onChange={(e) => setSigningCertificate(e.target.value)}
                  placeholder="-----BEGIN CERTIFICATE----- ... -----END CERTIFICATE-----"
                  className="min-h-24 text-xs font-mono bg-background border-border/80"
                />
              </div>
            </>
          )}

          <div className="space-y-1.5 md:col-span-2">
            <Label className="text-xs font-semibold">{t("settings.sso_domains_label")}</Label>
            <Input
              disabled={!isSsoAllowed || isLoading}
              value={domainMappings}
              onChange={(e) => setDomainMappings(e.target.value)}
              placeholder={t("settings.sso_domains_placeholder")}
              className="h-8.5 text-xs font-mono bg-background border-border/80"
            />
            <p className="text-[10px] text-muted-foreground">
              {t("settings.sso_domains_desc")}
            </p>
          </div>
        </div>

        {/* Security Enforcement Switches */}
        <div className="space-y-3 pt-3 border-t border-border/50">
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/30">
            <div className="space-y-0.5">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                {t("settings.sso_enforce_label")}
                {lastTestStatus !== "SUCCESS" && (
                  <Badge variant="outline" className="border-amber-500/40 text-amber-600 dark:text-amber-400 text-[10px]">
                    Probe Required
                  </Badge>
                )}
              </Label>
              <p className="text-[11px] text-muted-foreground">
                {lastTestStatus !== "SUCCESS"
                  ? t("settings.sso_probe_required_notice")
                  : t("settings.sso_enforce_desc")}
              </p>
            </div>
            <Switch
              disabled={!isSsoAllowed || isLoading || lastTestStatus !== "SUCCESS"}
              checked={enforceSso}
              onCheckedChange={setEnforceSso}
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/30">
            <div className="space-y-0.5">
              <Label className="text-xs font-semibold">{t("settings.sso_break_glass_label")}</Label>
              <p className="text-[11px] text-muted-foreground">{t("settings.sso_break_glass_desc")}</p>
            </div>
            <Switch
              disabled={!isSsoAllowed || isLoading}
              checked={allowBreakGlassBypass}
              onCheckedChange={setAllowBreakGlassBypass}
            />
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <div>
            {clientId && (
              <Button
                variant="outline"
                size="sm"
                disabled={!isSsoAllowed || isDeleting}
                onClick={handleDelete}
                className="h-7 px-2.5 text-xs font-medium gap-1.5 text-destructive hover:text-destructive border-destructive/30 hover:border-destructive/60 hover:bg-destructive/10"
              >
                <Trash2 className="size-3.5" />
                {t("settings.sso_delete_btn")}
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="default"
              size="sm"
              disabled={!isSsoAllowed || isSaving || !clientId.trim()}
              onClick={handleSave}
              className="h-7 px-2.5 text-xs font-medium gap-1.5"
            >
              {isSaving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
              {t("settings.sso_save_btn")}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

function OAuthSettingsSection({ slug }: { slug: string }) {
  const { t } = useTranslation();
  const [copied, setCopied] = React.useState(false);

  // Masked organization client ID placeholder derived from active slug
  const organizationClientId = React.useMemo(() => {
    return slug ? `k2net_client_${slug}` : "k2net_client_org";
  }, [slug]);

  const handleCopy = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(organizationClientId);
      setCopied(true);
      toast.success(t("settings.api_key_copied"));
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Card className="p-5 border-border/60 bg-card space-y-4 shadow-xs">
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold">{t("settings.api_secret_label")}</Label>
        <div className="flex items-center gap-2">
          <Input
            type="text"
            readOnly
            value={organizationClientId}
            className="h-8.5 text-xs font-mono bg-muted/40"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="h-8.5 px-2.5 text-xs gap-1.5"
          >
            <Copy className="h-3.5 w-3.5" />
            {copied ? t("common.copied") : t("common.copy")}
          </Button>
        </div>
      </div>
    </Card>
  );
}

export function OrgSettingsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { organizationName, slug, refetch: refetchTenantInfo } = useTenantInfo();
  const { branding } = useTenantBranding();
  const isWhitelabelAllowed = Boolean(branding?.isWhitelabelAllowed ?? branding?.whitelabelAllowed);

  const routerState = useRouterState();
  const pathname = routerState.location.pathname;

  const [generalTab, setGeneralTab] = React.useState<string>(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");
      if (tab === "branding" || tab === "domains") return tab;
    }
    return "info";
  });

  const [nameValue, setNameValue] = React.useState(organizationName || "");
  const [addressValue, setAddressValue] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    if (organizationName) {
      setNameValue(organizationName);
    }
  }, [organizationName]);

  const sectionConfig: Record<SettingsSection, SectionMeta> = {
    general: {
      title: t("nav.org_profile"),
      subtitle: t("settings.general_subtitle"),
      breadcrumb: t("nav.org_profile"),
    },
    branding: {
      title: t("settings.branding_title"),
      subtitle: t("settings.branding_subtitle"),
      breadcrumb: t("nav.org_branding"),
    },
    security: {
      title: t("security.title"),
      subtitle: t("security.subtitle"),
      breadcrumb: t("nav.org_security"),
    },
    sso: {
      title: t("nav.org_sso"),
      subtitle: t("security.mfa_desc"),
      breadcrumb: t("nav.org_sso"),
    },
    oauth: {
      title: t("nav.org_oauth"),
      subtitle: t("settings.general.platform_identity_desc"),
      breadcrumb: t("nav.org_oauth"),
    },
  };

  const currentSection: SettingsSection = React.useMemo(() => {
    if (pathname.includes("/settings/branding")) return "general";
    if (pathname.includes("/settings/security")) return "security";
    if (pathname.includes("/settings/sso")) return "sso";
    if (pathname.includes("/settings/oauth")) return "oauth";
    return "general";
  }, [pathname]);

  const handleSave = async () => {
    if (currentSection !== "general") {
      toast.success(t("common.saved_successfully"));
      return;
    }

    if (!slug) {
      toast.error(t("settings.slug_not_identified"));
      return;
    }

    setIsSaving(true);
    try {
      const { apiClient } = await import("../../lib/api-client");
      await apiClient(`/api/v1/organizations/${encodeURIComponent(slug)}`, {
        method: "PUT",
        body: JSON.stringify({
          name: nameValue.trim() || organizationName,
          address: addressValue.trim(),
        }),
      });

      // Hapus cache lokal agar header & sidebar langsung merefleksikan nama baru
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("k2net_resolved_tenant");
      }
      await refetchTenantInfo();

      toast.success(t("common.saved_successfully"));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("settings.whitelabel.save_error");
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const meta = sectionConfig[currentSection] || sectionConfig.general;

  return (
    <PageLayout variant="workspace" spaceY="space-y-6">
      <PageHero
        bordered={false}
        className="pb-0"
        eyebrow={t("nav.tenant_settings")}
        title={meta.title}
        icon={Building}
        subtitle={meta.subtitle}
        actions={
          (currentSection === "general" && generalTab !== "info") ? undefined : (
            <Button
              size="sm"
              disabled={isSaving}
              onClick={handleSave}
              className="h-7 px-2.5 text-xs font-medium gap-1.5 shadow-xs"
            >
              <Save className="size-3.5" />
              {isSaving ? t("settings.whitelabel.saving") : t("common.save_changes")}
            </Button>
          )
        }
      />

      <div className="w-full max-w-4xl space-y-4">
        {currentSection === "general" && (
          <Tabs value={generalTab} onValueChange={setGeneralTab} className="w-full space-y-4">
            <TabsList size="sm" className="border border-border/60 bg-muted/60 p-0.5">
              <TabsTrigger value="info" className="gap-1.5 text-xs font-medium cursor-pointer">
                <Building className="size-3.5" />
                {t("settings.tab_general_info")}
              </TabsTrigger>
              <TabsTrigger value="branding" className="gap-1.5 text-xs font-medium cursor-pointer">
                <Palette className="size-3.5" />
                {t("settings.tab_branding_whitelabel")}
                {!isWhitelabelAllowed && (
                  <Lock className="size-3 text-amber-500 ml-0.5" />
                )}
              </TabsTrigger>
              <TabsTrigger value="domains" className="gap-1.5 text-xs font-medium cursor-pointer">
                <Globe className="size-3.5" />
                {t("settings.tab_custom_domains")}
                {!isWhitelabelAllowed && (
                  <Lock className="size-3 text-amber-500 ml-0.5" />
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="space-y-4 mt-0">
              <GeneralSettingsSection
                organizationName={organizationName}
                slug={slug}
                email={user?.email || ""}
                nameValue={nameValue}
                setNameValue={setNameValue}
                addressValue={addressValue}
                setAddressValue={setAddressValue}
              />
              <div className="flex justify-end pt-2">
                <Button
                  size="sm"
                  disabled={isSaving}
                  onClick={handleSave}
                  className="h-7 px-3 text-xs font-medium gap-1.5"
                >
                  <Save className="size-3.5" />
                  {isSaving ? t("settings.whitelabel.saving") : t("common.save_changes")}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="branding" className="space-y-4 mt-0">
              <BrandingSettingsSection viewMode="branding" />
            </TabsContent>

            <TabsContent value="domains" className="space-y-4 mt-0">
              <BrandingSettingsSection viewMode="domains" />
            </TabsContent>
          </Tabs>
        )}
        {currentSection === "security" && <SecuritySettingsSection slug={slug} />}
        {currentSection === "sso" && <SsoSettingsSection slug={slug} />}
        {currentSection === "oauth" && <OAuthSettingsSection slug={slug} />}
      </div>
    </PageLayout>
  );
}
