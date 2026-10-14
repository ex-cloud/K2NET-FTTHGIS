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
} from "lucide-react";
import {
  PageLayout,
  PageHero,
  Card,
  CardContent,
  Button,
  Badge,
  Skeleton,
} from "@k2net/ui";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslation } from "@k2net/i18n";
import { apiClient } from "../../lib/api-client";
import { getCurrentOrgSlug } from "../../lib/domain";
import { CreateWebhookModal } from "./components/CreateWebhookModal";
import { WebhookDeliveriesModal } from "./components/WebhookDeliveriesModal";

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
  timestamp: string;
}

export function WebhooksPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const orgSlug = getCurrentOrgSlug() || "system";

  const [createModalOpen, setCreateModalOpen] = React.useState(false);
  const [selectedWebhookForDeliveries, setSelectedWebhookForDeliveries] =
    React.useState<WebhookItem | null>(null);
  const [pingingWebhookId, setPingingWebhookId] = React.useState<string | null>(null);

  const { data: webhooks = [], isLoading } = useQuery<WebhookItem[]>({
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
        toast.success(
          `Ping HTTP ${data.status} (${data.latencyMs}ms) — Delivered successfully!`
        );
      } else {
        toast.error(
          `Ping failed (${data.status}): ${data.errorMessage || "Unknown error"}`
        );
      }
    },
    onError: (err: unknown) => {
      setPingingWebhookId(null);
      const msg = (err as Error)?.message || "Ping error";
      toast.error(msg);
    },
  });

  const rollSecretMutation = useMutation({
    mutationFn: async (webhookId: string) => {
      return await apiClient(
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

  return (
    <PageLayout variant="workspace" spaceY="space-y-6">
      <PageHero
        bordered={false}
        className="pb-0"
        eyebrow={t("settings.developer.title")}
        title={t("settings.developer.webhooks_title")}
        icon={Webhook}
        subtitle={t("settings.developer.webhooks_subtitle")}
        actions={
          <Button
            size="sm"
            onClick={() => setCreateModalOpen(true)}
            className="gap-1.5 shadow-sm"
          >
            <Plus className="size-3.5" />
            <span>{t("settings.developer.create_webhook_btn")}</span>
          </Button>
        }
      />

      {isLoading ? (
        <Card className="border border-border bg-card">
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      ) : webhooks.length === 0 ? (
        <Card className="border border-dashed border-border bg-card/50">
          <CardContent className="p-12 text-center flex flex-col items-center justify-center space-y-4">
            <div className="size-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
              <Webhook className="size-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-foreground">
                {t("settings.developer.empty_webhooks")}
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm">
                {t("settings.developer.webhooks_subtitle")}
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => setCreateModalOpen(true)}
              className="gap-1.5"
            >
              <Plus className="size-3.5" />
              <span>{t("settings.developer.create_webhook_btn")}</span>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {webhooks.map((wh) => (
            <Card
              key={wh.id}
              className="border border-border bg-card hover:border-foreground/20 transition-colors shadow-xs"
            >
              <div className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-foreground">
                      {wh.name}
                    </span>
                    {wh.isActive ? (
                      <Badge
                        variant="outline"
                        className="text-[11px] font-mono text-primary border-primary/30 bg-primary/10"
                      >
                        {t("settings.developer.status_active")}
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-[11px] font-mono text-muted-foreground border-border bg-muted/30"
                      >
                        {t("settings.developer.status_revoked")}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-2 font-mono text-xs text-foreground font-medium">
                    <span className="bg-muted px-2 py-0.5 rounded border border-border">
                      {wh.url}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
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

                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="text-xs text-muted-foreground space-y-0.5 sm:text-right">
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
                        <span className="font-mono text-[11px]">
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
                      className="gap-1 border-border"
                    >
                      <Play className="size-3" />
                      <span>{t("settings.developer.test_ping_btn")}</span>
                    </Button>

                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => setSelectedWebhookForDeliveries(wh)}
                      className="gap-1 border-border"
                    >
                      <Eye className="size-3" />
                      <span>{t("settings.developer.delivery_logs_btn")}</span>
                    </Button>

                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => rollSecretMutation.mutate(wh.id)}
                      className="gap-1 border-border"
                    >
                      <RotateCw className="size-3" />
                      <span>{t("settings.developer.roll_secret_btn")}</span>
                    </Button>

                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => deleteMutation.mutate(wh.id)}
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive border-border"
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
