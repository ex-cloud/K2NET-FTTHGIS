import * as React from "react";
import {
  Webhook,
  MessageSquare,
  Mail,
  HardDrive,
  MapPin,
  Key,
} from "lucide-react";
import {
  PageHeader,
  PageContentShell,
  Card,
  Button,
  Switch,
  Input,
  Label,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@k2net/ui";
import { toast } from "sonner";
import { useTranslation } from "@k2net/i18n";

interface IntegrationItem {
  id: string;
  title: string;
  category: string;
  description: string;
  status: "CONNECTED" | "NOT_CONFIGURED";
  icon: React.ElementType;
}

export function IntegrationsPage() {
  const { t } = useTranslation();
  const [selectedIntegration, setSelectedIntegration] = React.useState<IntegrationItem | null>(null);
  const [configOpen, setConfigOpen] = React.useState(false);

  const integrations: IntegrationItem[] = [
    {
      id: "whatsapp",
      title: t("gateways.gateway_notification_title"),
      category: "Messaging",
      description: t("gateways.gateway_notification_subtitle"),
      status: "CONNECTED",
      icon: MessageSquare,
    },
    {
      id: "sms",
      title: "SMS Gateway (Twilio / SMSC)",
      category: "Messaging",
      description: t("gateways.gateway_notification_subtitle"),
      status: "CONNECTED",
      icon: MessageSquare,
    },
    {
      id: "smtp",
      title: t("settings.smtp_title"),
      category: "Email",
      description: t("settings.smtp_subtitle"),
      status: "NOT_CONFIGURED",
      icon: Mail,
    },
    {
      id: "webhooks",
      title: "Event-Driven Webhooks",
      category: "Developer",
      description: t("gateways.gateway_audit_subtitle"),
      status: "CONNECTED",
      icon: Webhook,
    },
    {
      id: "minio-s3",
      title: t("gateways.gateway_storage_title"),
      category: "Storage",
      description: t("gateways.gateway_storage_subtitle"),
      status: "CONNECTED",
      icon: HardDrive,
    },
    {
      id: "maps-api",
      title: t("gateways.gateway_map_title"),
      category: "GIS & Maps",
      description: t("gateways.gateway_map_subtitle"),
      status: "CONNECTED",
      icon: MapPin,
    },
  ];

  const handleConfigure = (item: IntegrationItem) => {
    setSelectedIntegration(item);
    setConfigOpen(true);
  };

  const handleSaveConfig = () => {
    toast.success(t("common.saved_successfully"));
    setConfigOpen(false);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <PageHeader
        title={t("nav.integrations")}
        breadcrumbs={[
          { label: t("nav.organizations"), href: "/projects" },
          { label: t("nav.integrations") },
        ]}
      />


      <PageContentShell className="space-y-4 custom-scrollbar">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {integrations.map((item) => {
            const Icon = item.icon;
            const isConnected = item.status === "CONNECTED";

            return (
              <Card
                key={item.id}
                className="flex flex-col justify-between p-5 border-border/60 bg-card hover:border-primary/40 transition-all shadow-xs space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                        isConnected
                          ? "bg-primary/10 text-primary border-primary/20"
                          : "bg-muted text-muted-foreground border-border"
                      }`}
                    >
                      {isConnected ? "TERHUBUNG" : "BELUM AKTIF"}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-foreground">{item.title}</h3>
                    <span className="text-[10px] font-mono text-primary block mt-0.5">
                      {item.category}
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed min-h-[36px]">
                    {item.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-border/40 flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">API Gateway</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleConfigure(item)}
                    className="h-7.5 px-2.5 text-xs gap-1.5"
                  >
                    <Key className="h-3 w-3" />
                    {t("common.edit")}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </PageContentShell>

      {/* Integration Config Modal */}
      <Dialog open={configOpen} onOpenChange={setConfigOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              {selectedIntegration?.title}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {t("settings.general_subtitle")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">{t("nav.api_keys_tokens")}</Label>
              <Input
                type="password"
                placeholder="sk_live_k2net_..."
                defaultValue="••••••••••••••••••••••••"
                className="h-8.5 text-xs font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Webhook Callback URL</Label>
              <Input
                placeholder="https://api.domain.com/v1/callback"
                defaultValue="https://gis.kdua.net/api/v1/webhooks/incoming"
                className="h-8.5 text-xs font-mono"
              />
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 border border-border/60">
              <div className="space-y-0.5">
                <Label className="text-xs font-semibold">{t("common.active")}</Label>
                <p className="text-[10px] text-muted-foreground">
                  {t("common.status")}
                </p>
              </div>
              <Switch defaultChecked />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button variant="ghost" size="sm" onClick={() => setConfigOpen(false)} className="text-xs">
              {t("common.cancel")}
            </Button>
            <Button size="sm" onClick={handleSaveConfig} className="text-xs font-medium">
              {t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

