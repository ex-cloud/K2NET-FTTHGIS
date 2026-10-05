import * as React from "react";
import { useRouterState } from "@tanstack/react-router";
import {
  Building,
  Save,
  Upload,
  Copy,
} from "lucide-react";
import {
  PageHeader,
  PageContentShell,
  Card,
  Button,
  Input,
  Label,
  Textarea,
  Switch,
} from "@k2net/ui";
import { toast } from "sonner";
import { useAuth } from "@k2net/auth/client";
import { useTenantInfo } from "../../hooks/useTenantInfo";
import { useTranslation } from "@k2net/i18n";

type SettingsSection = "general" | "branding" | "security" | "sso" | "oauth";

interface SectionMeta {
  title: string;
  breadcrumb: string;
}

function GeneralSettingsSection({
  organizationName,
  slug,
  email,
}: {
  organizationName: string;
  slug: string;
  email: string;
}) {
  const { t } = useTranslation();
  return (
    <Card className="p-5 border-border/60 bg-card space-y-4 shadow-xs">
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold">{t("settings.org_official_name")}</Label>
        <Input
          defaultValue={organizationName || "Organization Workspace"}
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
            <span className="h-8.5 px-3 text-xs bg-muted border border-l-0 border-border rounded-r-md flex items-center font-mono text-muted-foreground">
              .gis.kdua.net
            </span>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">{t("settings.official_email")}</Label>
          <Input
            type="email"
            defaultValue={email || ""}
            placeholder="admin@isp.net.id"
            className="h-8.5 text-xs"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-semibold">{t("settings.hq_noc_address")}</Label>
        <Textarea
          defaultValue=""
          placeholder={t("settings.hq_address_placeholder")}
          className="text-xs min-h-[60px] resize-none"
        />
      </div>
    </Card>
  );
}

function BrandingSettingsSection() {
  const { t } = useTranslation();
  return (
    <Card className="p-5 border-border/60 bg-card space-y-4 shadow-xs">
      <div className="space-y-2">
        <Label className="text-xs font-semibold">{t("settings.logo_label")}</Label>
        <div className="flex items-center gap-4 p-4 rounded-xl border border-dashed border-border bg-muted/20">
          <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
            <Building className="h-8 w-8" />
          </div>
          <div className="space-y-1.5">
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
              <Upload className="h-3.5 w-3.5" />
              {t("settings.logo_upload_btn")}
            </Button>
            <p className="text-[10px] text-muted-foreground">
              {t("settings.logo_size_hint")}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}

function SecuritySettingsSection() {
  const { t } = useTranslation();
  return (
    <Card className="p-5 border-border/60 bg-card space-y-4 shadow-xs">
      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/40">
        <div className="space-y-0.5">
          <Label className="text-xs font-semibold">{t("settings.mfa_enforce_label")}</Label>
          <p className="text-[11px] text-muted-foreground">
            {t("settings.mfa_enforce_desc")}
          </p>
        </div>
        <Switch defaultChecked />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-semibold">{t("settings.session_timeout_label")}</Label>
        <Input defaultValue="30 Menit" className="h-8.5 text-xs max-w-xs font-mono" />
      </div>
    </Card>
  );
}

function SsoSettingsSection({ slug }: { slug: string }) {
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
          defaultValue={`https://auth-gis.kdua.net/realms/${slug || "realm"}`}
          disabled
          className="h-8.5 text-xs font-mono bg-muted/40"
        />
      </div>
    </Card>
  );
}

function OAuthSettingsSection() {
  const { t } = useTranslation();
  return (
    <Card className="p-5 border-border/60 bg-card space-y-4 shadow-xs">
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold">{t("settings.api_secret_label")}</Label>
        <div className="flex items-center gap-2">
          <Input
            type="password"
            defaultValue="sk_live_k2net_98f4a187b2c019485"
            className="h-8.5 text-xs font-mono"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => toast.success(t("settings.api_key_copied"))}
            className="h-8.5 px-2.5 text-xs gap-1.5"
          >
            <Copy className="h-3.5 w-3.5" />
            {t("common.download")}
          </Button>
        </div>
      </div>
    </Card>
  );
}

export function OrgSettingsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { organizationName, slug } = useTenantInfo();
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;

  const sectionConfig: Record<SettingsSection, SectionMeta> = {
    general: { title: t("nav.organization_profile"), breadcrumb: t("nav.organization_profile") },
    branding: { title: t("settings.branding_title"), breadcrumb: t("nav.custom_branding") },
    security: { title: t("security.title"), breadcrumb: t("nav.security_access") },
    sso: { title: t("nav.sso_oauth_config"), breadcrumb: "SSO" },
    oauth: { title: t("nav.api_keys_tokens"), breadcrumb: "OAuth & API" },
  };

  const currentSection: SettingsSection = React.useMemo(() => {
    if (pathname.includes("/settings/branding")) return "branding";
    if (pathname.includes("/settings/security")) return "security";
    if (pathname.includes("/settings/sso")) return "sso";
    if (pathname.includes("/settings/oauth")) return "oauth";
    return "general";
  }, [pathname]);

  const handleSave = () => {
    toast.success(t("common.saved_successfully"));
  };

  const meta = sectionConfig[currentSection] || sectionConfig.general;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <PageHeader
        title={meta.title}
        breadcrumbs={[
          { label: t("nav.organizations"), href: "/projects" },
          { label: t("nav.settings"), href: "/settings/general" },
          { label: meta.breadcrumb },
        ]}
        actions={
          <Button
            size="sm"
            onClick={handleSave}
            className="h-8 px-3 text-xs font-semibold gap-1.5 shadow-xs"
          >
            <Save className="h-3.5 w-3.5" />
            {t("common.save_changes")}
          </Button>
        }
      />

      <PageContentShell className="space-y-4 custom-scrollbar max-w-4xl">
        {currentSection === "general" && (
          <GeneralSettingsSection
            organizationName={organizationName}
            slug={slug}
            email={user?.email || ""}
          />
        )}
        {currentSection === "branding" && <BrandingSettingsSection />}
        {currentSection === "security" && <SecuritySettingsSection />}
        {currentSection === "sso" && <SsoSettingsSection slug={slug} />}
        {currentSection === "oauth" && <OAuthSettingsSection />}
      </PageContentShell>
    </div>
  );
}
