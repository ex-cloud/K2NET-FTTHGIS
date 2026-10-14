import * as React from "react";
import { Send } from "lucide-react";
import {
  Button,
  Badge,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Skeleton,
} from "@k2net/ui";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "@k2net/i18n";
import { apiClient } from "../../lib/api-client";
import { getCurrentOrgSlug } from "../../lib/domain";

export interface WebhookDeliveryItem {
  id: string;
  webhookId: string;
  eventType: string;
  payload: string;
  responseStatusCode?: number | null;
  responseBody?: string | null;
  executionDurationMs?: number | null;
  status: string;
  errorMessage?: string | null;
  attemptNumber: number;
  deliveredAt: string;
}

interface WebhookDeliveriesModalProps {
  webhook: {
    id: string;
    name: string;
    url: string;
  } | null;
  onClose: () => void;
}

export function WebhookDeliveriesModal({
  webhook,
  onClose,
}: WebhookDeliveriesModalProps) {
  const { t } = useTranslation();
  const orgSlug = getCurrentOrgSlug() || "system";
  const webhookId = webhook?.id;

  const { data: deliveries = [], isLoading } = useQuery<WebhookDeliveryItem[]>({
    queryKey: ["tenant-developer-webhook-deliveries", orgSlug, webhookId],
    queryFn: async () => {
      if (!webhookId) return [];
      const res = await apiClient<WebhookDeliveryItem[]>(
        `/api/v1/organizations/${orgSlug}/developer/webhooks/${webhookId}/deliveries`
      );
      return Array.isArray(res) ? res : [];
    },
    enabled: Boolean(webhookId),
  });

  return (
    <Dialog open={Boolean(webhook)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="size-5" />
            <span>{t("settings.developer.delivery_logs_btn")}</span>
          </DialogTitle>
          <DialogDescription>
            {webhook?.name} ({webhook?.url})
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[350px] overflow-y-auto space-y-2 py-2">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : deliveries.length === 0 ? (
            <div className="text-center p-8 text-xs text-muted-foreground">
              No outbound webhook dispatches recorded yet.
            </div>
          ) : (
            deliveries.map((del) => (
              <div
                key={del.id}
                className="p-3 border border-border rounded-md bg-muted/20 flex items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-medium text-foreground">
                      {del.eventType}
                    </span>
                    {del.status === "SUCCESS" ? (
                      <Badge
                        variant="outline"
                        className="text-[10px] text-primary border-primary/30 bg-primary/10"
                      >
                        {del.responseStatusCode || 200} OK
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-[10px] text-destructive border-destructive/30 bg-destructive/10"
                      >
                        {del.responseStatusCode || "ERR"} {del.status}
                      </Badge>
                    )}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {new Date(del.deliveredAt).toLocaleString()} •{" "}
                    {del.executionDurationMs ?? 0}
                    {t("settings.developer.duration_ms")}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[11px] font-mono text-muted-foreground">
                    Attempt #{del.attemptNumber}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        <DialogFooter>
          <Button size="sm" onClick={onClose}>
            {t("common.done")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
