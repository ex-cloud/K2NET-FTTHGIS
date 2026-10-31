import * as React from "react";
import { useRouterState } from "@tanstack/react-router";
import {
  Building,
  Save,
  Copy,
  Palette,
  Globe,
  Lock,
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
} from "@k2net/ui";
import { toast } from "sonner";
import { useAuth } from "@k2net/auth/client";
import { useTenantInfo } from "../../hooks/useTenantInfo";
import { useTenantBranding } from "../../hooks/useTenantBranding";
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
        }>(`/api/v1/organizations/${encodeURIComponent(slug)}/security-policy`);
        if (res && isMounted) {
          setMfaEnforced(res.mfaEnforced);
          setSessionTimeout(res.sessionIdleTimeoutMinutes || 30);
          setIsPlatformEnforced(res.isMfaEnforcedByPlatform);
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
        <p className="text-[10px] text-muted-foreground">Inactivity duration in minutes before session auto-lock.</p>
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

function SsoSettingsSection({ slug: _slug }: { slug?: string }) {
  const { t } = useTranslation();
  return (
    <Card className="p-5 border-border/60 bg-card space-y-4 shadow-xs">
      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/40">
        <div className="space-y-0.5">
          <Label className="text-xs font-semibold">{t("settings.sso_integration_label")}</Label>
          <p className="text-[11px] text-muted-foreground">
            {t("settings.sso_integration_desc")}
          </p>
        </div>
        <Switch defaultChecked />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-semibold">{t("settings.issuer_url_label")}</Label>
        <Input
          defaultValue="https://auth-gis.kdua.net/realms/k2net-tenants"
          disabled
          className="h-8.5 text-xs font-mono bg-muted/40"
        />
      </div>
    </Card>
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
