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
  Badge,
} from "@k2net/ui";
import { toast } from "sonner";
import { useAuth } from "@k2net/auth/client";
import { useTenantInfo } from "../../hooks/useTenantInfo";

type SettingsSection = "general" | "branding" | "security" | "sso" | "oauth" | "audit-logs";

interface SectionMeta {
  title: string;
  breadcrumb: string;
}

const SECTION_CONFIG: Record<SettingsSection, SectionMeta> = {
  general: { title: "Profil Organisasi", breadcrumb: "Profil" },
  branding: { title: "Kustomisasi & Logo Tenant", breadcrumb: "Branding" },
  security: { title: "Kebijakan Keamanan & MFA", breadcrumb: "Keamanan" },
  sso: { title: "Single Sign-On (SSO)", breadcrumb: "SSO" },
  oauth: { title: "API Keys & Integrasi OAuth", breadcrumb: "OAuth & API" },
  "audit-logs": { title: "Audit Trail Organisasi", breadcrumb: "Audit Trail" },
};

function GeneralSettingsSection({
  organizationName,
  slug,
  email,
}: {
  organizationName: string;
  slug: string;
  email: string;
}) {
  return (
    <Card className="p-5 border-border/60 bg-card space-y-4 shadow-xs">
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold">Nama Resmi Organisasi / ISP</Label>
        <Input
          defaultValue={organizationName || "Organization Workspace"}
          className="h-8.5 text-xs"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Subdomain Tenant</Label>
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
          <Label className="text-xs font-semibold">Email Kontak Resmi</Label>
          <Input
            type="email"
            defaultValue={email || ""}
            placeholder="admin@isp.net.id"
            className="h-8.5 text-xs"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-semibold">Alamat Kantor Pusat / NOC</Label>
        <Textarea
          defaultValue=""
          placeholder="Masukkan alamat kantor pusat operasional atau NOC..."
          className="text-xs min-h-[60px] resize-none"
        />
      </div>
    </Card>
  );
}

function BrandingSettingsSection() {
  return (
    <Card className="p-5 border-border/60 bg-card space-y-4 shadow-xs">
      <div className="space-y-2">
        <Label className="text-xs font-semibold">Logo Organisasi (Format PNG / SVG transparan)</Label>
        <div className="flex items-center gap-4 p-4 rounded-xl border border-dashed border-border bg-muted/20">
          <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
            <Building className="h-8 w-8" />
          </div>
          <div className="space-y-1.5">
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
              <Upload className="h-3.5 w-3.5" />
              Pilih File Logo Baru
            </Button>
            <p className="text-[10px] text-muted-foreground">
              Rekomendasi ukuran: 512x512 px, maksimal 2 MB.
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}

function SecuritySettingsSection() {
  return (
    <Card className="p-5 border-border/60 bg-card space-y-4 shadow-xs">
      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/40">
        <div className="space-y-0.5">
          <Label className="text-xs font-semibold">Wajibkan MFA / 2FA untuk Seluruh Staf</Label>
          <p className="text-[11px] text-muted-foreground">
            Seluruh operator, surveyor, dan teknisi wajib menggunakan authenticator app (TOTP) saat login.
          </p>
        </div>
        <Switch defaultChecked />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-semibold">Batas Waktu Sesi Tidak Aktif (Inactivity Timeout)</Label>
        <Input defaultValue="30 Menit" className="h-8.5 text-xs max-w-xs font-mono" />
      </div>
    </Card>
  );
}

function SsoSettingsSection({ slug }: { slug: string }) {
  return (
    <Card className="p-5 border-border/60 bg-card space-y-4 shadow-xs">
      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/40">
        <div className="space-y-0.5">
          <Label className="text-xs font-semibold">Keycloak SAML / OIDC Integration</Label>
          <p className="text-[11px] text-muted-foreground">
            Login terintegrasi dengan active directory / Keycloak realm tenant Anda.
          </p>
        </div>
        <Switch defaultChecked />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-semibold">Issuer URL</Label>
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
  return (
    <Card className="p-5 border-border/60 bg-card space-y-4 shadow-xs">
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold">Tenant API Secret Key</Label>
        <div className="flex items-center gap-2">
          <Input
            type="password"
            defaultValue="sk_live_k2net_98f4a187b2c019485"
            className="h-8.5 text-xs font-mono"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => toast.success("API Key disalin ke clipboard")}
            className="h-8.5 px-2.5 text-xs gap-1.5"
          >
            <Copy className="h-3.5 w-3.5" />
            Salin
          </Button>
        </div>
      </div>
    </Card>
  );
}

function AuditLogsSettingsSection() {
  return (
    <Card className="p-5 border-border/60 bg-card space-y-3 shadow-xs">
      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
        Rekam Jejak Kepatuhan Organisasi
      </h3>
      <div className="space-y-2">
        <div className="p-3 rounded-lg bg-muted/30 border border-border/40 text-xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="font-semibold text-foreground">
              Perubahan konfigurasi MFA oleh Administrator
            </span>
            <span className="text-[10px] font-mono text-muted-foreground block">
              IP: 103.144.20.10 • Waktu: Sesi Aktif
            </span>
          </div>
          <Badge variant="outline" className="font-mono text-[9px]">
            SECURITY
          </Badge>
        </div>
      </div>
    </Card>
  );
}

export function OrgSettingsPage() {
  const { user } = useAuth();
  const { organizationName, slug } = useTenantInfo();
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;

  const currentSection: SettingsSection = React.useMemo(() => {
    if (pathname.includes("/settings/branding")) return "branding";
    if (pathname.includes("/settings/security")) return "security";
    if (pathname.includes("/settings/sso")) return "sso";
    if (pathname.includes("/settings/oauth")) return "oauth";
    if (pathname.includes("/settings/audit-logs")) return "audit-logs";
    return "general";
  }, [pathname]);

  const handleSave = () => {
    toast.success("Pengaturan organisasi berhasil diperbarui");
  };

  const meta = SECTION_CONFIG[currentSection] || SECTION_CONFIG.general;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <PageHeader
        title={meta.title}
        breadcrumbs={[
          { label: "Organisasi", href: "/projects" },
          { label: "Pengaturan", href: "/settings/general" },
          { label: meta.breadcrumb },
        ]}
        actions={
          currentSection !== "audit-logs" && (
            <Button
              size="sm"
              onClick={handleSave}
              className="h-8 px-3 text-xs font-semibold gap-1.5 shadow-xs"
            >
              <Save className="h-3.5 w-3.5" />
              Simpan Perubahan
            </Button>
          )
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
        {currentSection === "audit-logs" && <AuditLogsSettingsSection />}
      </PageContentShell>
    </div>
  );
}
