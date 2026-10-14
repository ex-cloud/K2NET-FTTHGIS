import * as React from "react";
import {
  Webhook,
  Plus,
  Play,
  RotateCw,
  Trash2,
  CheckCircle2,
  XCircle,
  Eye,
  Key,
  Plug,
  RefreshCw,
  ShieldCheck,
  Search,
} from "lucide-react";
import {
  PageLayout,
  PageHero,
  Card,
  CardContent,
  Button,
  Badge,
  Skeleton,
  Input,
} from "@k2net/ui";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { useTranslation } from "@k2net/i18n";
import { apiClient } from "../../lib/api-client";
import { getCurrentOrgSlug } from "../../lib/domain";
import {
  CreateWebhookModal,
  WebhookDeliveriesModal,
} from "../../components/developer";

export interface WebhookItem {
  id: string;
  name: string;
  url: string;
  signingSecret: string;
  events: string[];
  isActive: boolean;
  headers?: string | null;
  failureCount: number;
  lastDeliveryAt?: string | null;
  lastDeliveryStatus?: string | null;
  createdAt: string;
}

interface TestPingResult {
  success: boolean;
  status: number;
  latencyMs: number;
  eventName: string;
  targetUrl: string;
  responseBody?: string | null;
  errorMessage?: string | null;
}

export function WebhooksPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const orgSlug = getCurrentOrgSlug() || "system";

  const [createModalOpen, setCreateModalOpen] = React.useState(false);
  const [selectedWebhookForDeliveries, setSelectedWebhookForDeliveries] =
    React.useState<WebhookItem | null>(null);
  const [pingingWebhookId, setPingingWebhookId] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");

  const { data: webhooks = [], isLoading, refetch, isFetching } = useQuery<WebhookItem[]>({
    queryKey: ["tenant-developer-webhooks", orgSlug],
    queryFn: async () => {
      const res = await apiClient<WebhookItem[]>(
        `/api/v1/organizations/${orgSlug}/developer/webhooks`
      );
      return Array.isArray(res) ? res : [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: {
      name: string;
      url: string;
      events: string[];
    }) => {
      return await apiClient<WebhookItem>(
        `/api/v1/organizations/${orgSlug}/developer/webhooks`,
        {
          method: "POST",
          body: JSON.stringify(payload),
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-developer-webhooks", orgSlug] });
      setCreateModalOpen(false);
      toast.success(t("common.saved_successfully"));
    },
    onError: (err: unknown) => {
      const msg = (err as Error)?.message || "Failed to create webhook";
      toast.error(msg);
    },
  });

  const testPingMutation = useMutation({
    mutationFn: async (webhookId: string) => {
      setPingingWebhookId(webhookId);
      return await apiClient<TestPingResult>(
        `/api/v1/organizations/${orgSlug}/developer/webhooks/${webhookId}/test-ping`,
        {
          method: "POST",
        }
      );
    },
    onSuccess: (data) => {
      setPingingWebhookId(null);
      queryClient.invalidateQueries({ queryKey: ["tenant-developer-webhooks", orgSlug] });
      if (data.success) {
        toast.success(`Ping succeeded! HTTP ${data.status} in ${data.latencyMs}ms`);
      } else {
        toast.error(`Ping failed (HTTP ${data.status}): ${data.errorMessage || "Network error"}`);
      }
    },
    onError: (err: unknown) => {
      setPingingWebhookId(null);
      const msg = (err as Error)?.message || "Failed to test webhook";
      toast.error(msg);
    },
  });

  const rollSecretMutation = useMutation({
    mutationFn: async (webhookId: string) => {
      return await apiClient<WebhookItem>(
        `/api/v1/organizations/${orgSlug}/developer/webhooks/${webhookId}/roll-secret`,
        {
          method: "POST",
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-developer-webhooks", orgSlug] });
      toast.success(t("common.saved_successfully"));
    },
    onError: (err: unknown) => {
      const msg = (err as Error)?.message || "Failed to roll secret";
      toast.error(msg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (webhookId: string) => {
      return await apiClient(
        `/api/v1/organizations/${orgSlug}/developer/webhooks/${webhookId}`,
        {
          method: "DELETE",
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-developer-webhooks", orgSlug] });
      toast.success(t("common.deleted_successfully"));
    },
    onError: (err: unknown) => {
      const msg = (err as Error)?.message || "Failed to delete webhook";
      toast.error(msg);
    },
  });

  const activeWebhooksCount = webhooks.filter((w) => w.isActive).length;
  const filteredWebhooks = webhooks.filter(
    (w) =>
      w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.events.some((ev) => ev.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <PageLayout variant="workspace" spaceY="space-y-6">
      <PageHero
        bordered={true}
        eyebrow={t("settings.developer.title")}
        title={t("settings.developer.webhooks_title")}
        icon={Webhook}
        subtitle={t("settings.developer.webhooks_subtitle")}
        meta={
          <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm text-muted-foreground font-medium">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-foreground font-mono">{activeWebhooksCount}</span>
              <span>{t("settings.developer.status_active")}</span>
            </div>
            <span className="text-muted-foreground/30 px-1">/</span>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-foreground font-mono">{webhooks.length}</span>
              <span>Total Endpoints</span>
            </div>
            <span className="text-muted-foreground/30 px-1">/</span>
            <div className="flex items-center gap-1 text-primary font-mono text-xs">
              <ShieldCheck className="size-3" />
              <span>HMAC-SHA256 Signed</span>
            </div>
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="gap-1.5 h-7 px-2.5 text-xs font-medium"
            >
              <RefreshCw className={`size-3.5 ${isFetching ? "animate-spin" : ""}`} />
              <span>{t("license.refresh_btn")}</span>
            </Button>
            <Button
              size="sm"
              variant="default"
              onClick={() => setCreateModalOpen(true)}
              className="gap-1.5 h-7 px-2.5 text-xs font-medium shadow-xs"
            >
              <Plus className="size-3.5" />
              <span>{t("settings.developer.create_webhook_btn")}</span>
            </Button>
          </div>
        }
      />

      {/* Module Navigation Tabs */}
      <div className="flex items-center gap-1.5 border-b border-border/60 pb-3">
        <Link
          to="/developer/api-keys"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
        >
          <Key className="size-3.5" />
          <span>{t("settings.developer.api_keys_title")}</span>
        </Link>
        <Link
          to="/developer/webhooks"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-secondary text-secondary-foreground shadow-2xs transition-colors"
        >
          <Webhook className="size-3.5 text-primary" />
          <span>{t("settings.developer.webhooks_title")}</span>
          <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0 border-border bg-muted/40">
            {webhooks.length}
          </Badge>
        </Link>
        <Link
          to="/integrations"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
        >
          <Plug className="size-3.5" />
          <span>{t("nav.developer_gateways")}</span>
        </Link>
      </div>

      {/* Search and Count Bar */}
      {webhooks.length > 0 && (
        <div className="flex items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search webhooks by name, URL, or events..."
              className="h-7 text-xs pl-8 pr-3"
            />
          </div>
          <span className="text-[11px] font-mono text-muted-foreground">
            Showing {filteredWebhooks.length} of {webhooks.length} endpoints
          </span>
        </div>
      )}

      {isLoading ? (
        <Card className="border border-border bg-card">
          <CardContent className="p-6 space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </CardContent>
        </Card>
      ) : webhooks.length === 0 ? (
        <Card className="border border-dashed border-border/80 bg-card/40">
          <CardContent className="p-12 text-center flex flex-col items-center justify-center space-y-4 max-w-md mx-auto">
            <div className="size-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
              <Webhook className="size-5" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-sm font-semibold text-foreground">
                {t("settings.developer.empty_webhooks")}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t("settings.developer.webhooks_subtitle")}
              </p>
            </div>
            <Button
              size="sm"
              variant="default"
              onClick={() => setCreateModalOpen(true)}
              className="gap-1.5 h-7 px-2.5 text-xs font-medium"
            >
              <Plus className="size-3.5" />
              <span>{t("settings.developer.create_webhook_btn")}</span>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2.5">
          {filteredWebhooks.map((wh) => (
            <Card
              key={wh.id}
              className="border border-border/80 bg-card hover:border-foreground/20 transition-colors shadow-2xs"
            >
              <div className="p-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-foreground">
                      {wh.name}
                    </span>
                    {wh.isActive ? (
                      <Badge
                        variant="outline"
                        className="text-[10px] font-mono text-primary border-primary/30 bg-primary/10 py-0 px-1.5"
                      >
                        {t("settings.developer.status_active")}
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-[10px] font-mono text-muted-foreground border-border bg-muted/30 py-0 px-1.5"
                      >
                        {t("settings.developer.status_revoked")}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-2 font-mono text-xs text-foreground font-medium">
                    <span className="bg-muted/60 px-2 py-0.5 rounded border border-border/60 text-[11px]">
                      {wh.url}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1 pt-0.5">
                    {wh.events.map((ev) => (
                      <span
                        key={ev}
                        className="text-[10px] bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded font-mono"
                      >
                        {ev}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-3 shrink-0">
                  <div className="text-[11px] text-muted-foreground space-y-0.5 sm:text-right font-mono">
                    <div>
                      {t("settings.developer.last_used")}:{" "}
                      <span className="font-medium text-foreground">
                        {wh.lastDeliveryAt
                          ? new Date(wh.lastDeliveryAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "—"}
                      </span>
                    </div>
                    {wh.lastDeliveryStatus && (
                      <div className="flex items-center sm:justify-end gap-1">
                        {wh.lastDeliveryStatus === "SUCCESS" ? (
                          <CheckCircle2 className="size-3 text-primary" />
                        ) : (
                          <XCircle className="size-3 text-destructive" />
                        )}
                        <span className="font-mono text-[10px]">
                          {wh.lastDeliveryStatus}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      size="xs"
                      variant="outline"
                      disabled={pingingWebhookId === wh.id}
                      onClick={() => testPingMutation.mutate(wh.id)}
                      className="gap-1 border-border h-6 px-2 text-[11px]"
                    >
                      <Play className="size-3" />
                      <span>{t("settings.developer.test_ping_btn")}</span>
                    </Button>

                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => setSelectedWebhookForDeliveries(wh)}
                      className="gap-1 border-border h-6 px-2 text-[11px]"
                    >
                      <Eye className="size-3" />
                      <span>{t("settings.developer.delivery_logs_btn")}</span>
                    </Button>

                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => rollSecretMutation.mutate(wh.id)}
                      className="gap-1 border-border h-6 px-2 text-[11px]"
                    >
                      <RotateCw className="size-3" />
                      <span>{t("settings.developer.roll_secret_btn")}</span>
                    </Button>

                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => deleteMutation.mutate(wh.id)}
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive border-border h-6 px-2"
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <CreateWebhookModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSubmit={(payload) => createMutation.mutate(payload)}
        isPending={createMutation.isPending}
      />

      <WebhookDeliveriesModal
        webhook={selectedWebhookForDeliveries}
        onClose={() => setSelectedWebhookForDeliveries(null)}
      />
    </PageLayout>
  );
}
