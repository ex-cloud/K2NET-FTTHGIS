import * as React from "react";
import {
  Webhook,
  MessageSquare,
  Mail,
  HardDrive,
  MapPin,
  Key,
  CreditCard,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Plug,
  Lock,
} from "lucide-react";
import {
  PageLayout,
  PageHero,
  Card,
  Button,
  Badge,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@k2net/ui";
import { Link, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "@k2net/i18n";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../lib/api-client";
import { getCurrentOrgSlug } from "../../lib/domain";
import { useTenantLicense } from "../../hooks/useTenantLicense";
import { useTenantSubscription } from "../../hooks/useTenantSubscription";

interface IntegrationItem {
  id: string;
  title: string;
  category: string;
  description: string;
  status: "ACTIVE" | "CONNECTED" | "READY" | "CONFIGURED" | "NOT_CONFIGURED" | "REQUIRES_UPGRADE" | "REQUIRES_ENTERPRISE";
  statusLabel: string;
  port: string;
  protocol: string;
  icon: React.ElementType;
  route?: string;
  internalService?: string;
}

function getDeveloperIntegrations(
  t: (k: string) => string,
  isApiAllowed: boolean,
  apiKeysCount: number,
  webhooksCount: number
): IntegrationItem[] {
  return [
    {
      id: "api-keys",
      title: t("nav.developer_api_keys"),
      category: "Developer",
      description: "Programmatic REST API keys with granular scope permissions and SHA-256 token hashing.",
      status: !isApiAllowed ? "REQUIRES_UPGRADE" : apiKeysCount > 0 ? "ACTIVE" : "READY",
      statusLabel: !isApiAllowed
        ? "Requires Pro / Enterprise"
        : apiKeysCount > 0
          ? `${apiKeysCount} Keys Active`
          : "0 Keys Created",
      port: "8000 / 9090",
      protocol: "REST / Bearer",
      icon: Key,
      route: "/developer/api-keys",
      internalService: "Kong API Gateway & ftth-backend",
    },
    {
      id: "webhooks",
      title: t("nav.developer_webhooks"),
      category: "Developer",
      description: "Event-driven real-time HTTP callbacks with HMAC-SHA256 signature verification and auto-retries.",
      status: webhooksCount > 0 ? "ACTIVE" : "READY",
      statusLabel: webhooksCount > 0 ? `${webhooksCount} Endpoints Active` : "0 Endpoints Registered",
      port: "9090",
      protocol: "HTTP/2 Webhook Push",
      icon: Webhook,
      route: "/developer/webhooks",
      internalService: "Spring Boot Webhook Dispatcher",
    },
  ];
}

function getMessagingAndBillingIntegrations(
  t: (k: string) => string,
  whatsappActive: boolean,
  invoicesCount: number
): IntegrationItem[] {
  return [
    {
      id: "whatsapp",
      title: t("gateways.gateway_notification_title"),
      category: "Messaging",
      description: t("gateways.gateway_notification_subtitle"),
      status: whatsappActive ? "ACTIVE" : "NOT_CONFIGURED",
      statusLabel: whatsappActive ? "WABA Alerts Enabled" : "Disabled in Preferences",
      port: "5001",
      protocol: "REST (Go Gateway)",
      icon: MessageSquare,
      route: "/billing/license",
      internalService: "notification-gateway (WhatsApp WABA)",
    },
    {
      id: "payment",
      title: "Xendit Payment Gateway",
      category: "Billing",
      description: "Automated B2B invoices, Virtual Account generation, and instant payment webhook callback settlement.",
      status: invoicesCount > 0 ? "ACTIVE" : "CONNECTED",
      statusLabel: `${invoicesCount} Invoices Tracked`,
      port: "5002",
      protocol: "REST / Webhook",
      icon: CreditCard,
      route: "/billing/invoices",
      internalService: "payment-gateway & Xendit Engine",
    },
  ];
}

function getInfrastructureIntegrations(
  t: (k: string) => string,
  storageUsed: number,
  storageMax: number,
  isSsoAllowed: boolean,
  emailActive: boolean
): IntegrationItem[] {
  return [
    {
      id: "minio-s3",
      title: t("gateways.gateway_storage_title"),
      category: "Storage",
      description: t("gateways.gateway_storage_subtitle"),
      status: "ACTIVE",
      statusLabel: `${storageUsed.toFixed(1)} / ${storageMax} GB (${Math.round((storageUsed / Math.max(1, storageMax)) * 100)}%)`,
      port: "5004 / 9005",
      protocol: "AWS S3 Signature v4",
      icon: HardDrive,
      route: "/billing/quotas",
      internalService: "storage-gateway & MinIO Object Storage",
    },
    {
      id: "keycloak-sso",
      title: "Keycloak Identity SSO",
      category: "Security",
      description: "Enterprise SAML 2.0 & OpenID Connect Single Sign-On federation with RBAC authorization.",
      status: isSsoAllowed ? "ACTIVE" : "REQUIRES_ENTERPRISE",
      statusLabel: isSsoAllowed ? "OIDC & SAML Fed Active" : "Requires Enterprise Plan",
      port: "8081 / 80",
      protocol: "OIDC / SAML 2.0",
      icon: Lock,
      route: "/settings/security",
      internalService: "Keycloak 26 Self-Hosted",
    },
    {
      id: "maps-api",
      title: t("gateways.gateway_map_title"),
      category: "GIS & Maps",
      description: t("gateways.gateway_map_subtitle"),
      status: "CONNECTED",
      statusLabel: "Reverse Geocoding Active",
      port: "5003",
      protocol: "REST (Go Gateway)",
      icon: MapPin,
      internalService: "map-gateway (Google / HERE Maps)",
    },
    {
      id: "smtp",
      title: t("settings.smtp_title"),
      category: "Email",
      description: t("settings.smtp_subtitle"),
      status: emailActive ? "ACTIVE" : "CONFIGURED",
      statusLabel: emailActive ? "Email Delivery Active" : "Disabled in Preferences",
      port: "587 / TLS",
      protocol: "SMTP TLS",
      icon: Mail,
      route: "/billing/license",
      internalService: "notification-gateway (SMTP Dispatcher)",
    },
  ];
}

export function IntegrationsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const orgSlug = getCurrentOrgSlug() || "system";

  const { license, contacts, invoices } = useTenantLicense();
  const { summary } = useTenantSubscription();

  const [selectedIntegration, setSelectedIntegration] = React.useState<IntegrationItem | null>(null);
  const [inspectOpen, setInspectOpen] = React.useState(false);

  // Live query API keys count
  const { data: apiKeys = [] } = useQuery<{ id: string }[]>({
    queryKey: ["tenant-developer-api-keys", orgSlug],
    queryFn: async () => {
      try {
        const res = await apiClient<{ id: string }[]>(
          `/api/v1/organizations/${orgSlug}/developer/api-keys`
        );
        return Array.isArray(res) ? res : [];
      } catch {
        return [];
      }
    },
    staleTime: 30 * 1000,
  });

  // Live query webhooks count
  const { data: webhooks = [] } = useQuery<{ id: string }[]>({
    queryKey: ["tenant-developer-webhooks", orgSlug],
    queryFn: async () => {
      try {
        const res = await apiClient<{ id: string }[]>(
          `/api/v1/organizations/${orgSlug}/developer/webhooks`
        );
        return Array.isArray(res) ? res : [];
      } catch {
        return [];
      }
    },
    staleTime: 30 * 1000,
  });

  // Dynamic real-time integration state computation from live DB & configuration
  const integrations = React.useMemo<IntegrationItem[]>(() => {
    const isApiAllowed = Boolean(license?.entitlements?.apiEnabled ?? summary?.hasApiAccess);
    const isSsoAllowed = Boolean(license?.entitlements?.ssoEnabled ?? summary?.hasSso);
    const whatsappActive = Boolean(contacts?.notifyWhatsappEnabled);
    const emailActive = Boolean(contacts?.notifyEmailEnabled);

    const storageUsed = summary?.usedStorageGb ?? 0;
    const storageMax = license?.entitlements?.maxStorageGb ?? summary?.maxStorageGb ?? 2;
    const translate = t as (k: string) => string;

    return [
      ...getDeveloperIntegrations(translate, isApiAllowed, apiKeys.length, webhooks.length),
      ...getMessagingAndBillingIntegrations(translate, whatsappActive, invoices.length),
      ...getInfrastructureIntegrations(translate, storageUsed, storageMax, isSsoAllowed, emailActive),
    ];
  }, [license, summary, contacts, invoices, apiKeys, webhooks, t]);

  const handleAction = (item: IntegrationItem) => {
    if (item.route) {
      navigate({ to: item.route });
    } else {
      setSelectedIntegration(item);
      setInspectOpen(true);
    }
  };

  return (
    <PageLayout variant="workspace" spaceY="space-y-6">
      {/* 1. Page Hero */}
      <PageHero
        bordered={false}
        className="pb-0"
        eyebrow={t("nav.tenant_integrations").toUpperCase()}
        title={t("nav.integrations")}
        icon={Plug}
        subtitle={t("gateways.overview_subtitle")}
      />

      {/* 2. Top Segmented Navigation Tabs */}
      <div className="flex items-center gap-1 border-b border-border/60 pb-2">
        <Link
          to="/developer/api-keys"
          className="px-3 py-1.5 text-xs font-medium rounded-md transition-colors text-muted-foreground hover:text-foreground hover:bg-muted/50"
        >
          {t("nav.developer_api_keys")}
        </Link>
        <Link
          to="/developer/webhooks"
          className="px-3 py-1.5 text-xs font-medium rounded-md transition-colors text-muted-foreground hover:text-foreground hover:bg-muted/50"
        >
          {t("nav.developer_webhooks")}
        </Link>
        <Link
          to="/integrations"
          className="px-3 py-1.5 text-xs font-semibold rounded-md transition-colors bg-muted text-foreground"
        >
          {t("nav.developer_gateways")}
        </Link>
      </div>

      {/* 3. Integration Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {integrations.map((item) => {
          const Icon = item.icon;

          return (
            <Card
              key={item.id}
              className="flex flex-col justify-between p-5 border-border/80 bg-card hover:border-border transition-all shadow-2xs space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted/40 text-foreground border border-border/80">
                    <Icon className="h-5 w-5" />
                  </div>
                  <Badge
                    variant="outline"
                    className="text-[10px] font-mono px-2 py-0.5 border-border/80 bg-muted/30 text-foreground"
                  >
                    {item.statusLabel}
                  </Badge>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-foreground">{item.title}</h3>
                  <span className="text-[10px] font-mono text-muted-foreground block mt-0.5">
                    {item.category} • Port {item.port}
                  </span>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed min-h-[36px]">
                  {item.description}
                </p>
              </div>

              <div className="pt-3 border-t border-border/60 flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground font-mono truncate max-w-[140px]">
                  {item.protocol}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAction(item)}
                  className="h-7 px-2.5 text-xs font-medium gap-1.5 border-border/80 text-foreground hover:bg-muted"
                >
                  {item.route ? (
                    <>
                      <span>{t("common.open")}</span>
                      <ExternalLink className="size-3" />
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="size-3.5" />
                      <span>{t("common.details")}</span>
                    </>
                  )}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Gateway Inspect Dialog */}
      <Dialog open={inspectOpen} onOpenChange={setInspectOpen}>
        <DialogContent className="sm:max-w-md border-border bg-card">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <CheckCircle2 className="size-4 text-foreground" />
              {selectedIntegration?.title}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {selectedIntegration?.description}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="p-3 rounded-lg bg-muted/30 border border-border/70 space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground font-medium">Internal Service:</span>
                <span className="font-mono font-semibold text-foreground">{selectedIntegration?.internalService}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground font-medium">Internal Port:</span>
                <span className="font-mono text-foreground">{selectedIntegration?.port}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground font-medium">Protocol / Transport:</span>
                <span className="font-mono text-foreground">{selectedIntegration?.protocol}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground font-medium">Multi-Tenant Scoping:</span>
                <span className="font-mono text-foreground">Header X-Tenant-ID & Token</span>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setInspectOpen(false)}
              className="h-7 px-2.5 text-xs font-medium border-border/80"
            >
              {t("common.close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
