import * as React from "react";
import {
  AlertTriangle,
  Lock,
  Plus,
  RefreshCw,
  ShieldCheck,
  Webhook,
} from "lucide-react";
import { Badge, Button, Card, DataTable } from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import { toast } from "sonner";
import { useTenantLicense } from "../../hooks/useTenantLicense";
import { useTenantSubscription } from "../../hooks/useTenantSubscription";
import { usePermissions } from "../../hooks/use-permissions";
import {
  SiemConfirmDialog,
  SiemDeliveriesModal,
  SiemEndpointFormModal,
  SiemSecretRevealModal,
  type SiemDeliveryItem,
  type SiemEndpointItem,
  type UpsertSiemEndpointInput,
} from "./SecuritySiemModals";
import { buildSiemColumns, SiemStatsRow } from "./SecuritySiemTableColumns";

export function SecuritySiemStreamingCard({ slug }: { slug?: string }) {
  const { t } = useTranslation();
  const { license } = useTenantLicense();
  const { tier, canAccessSso } = useTenantSubscription();
  const { canAccess } = usePermissions();

  const canManage = canAccess(["security.policy.manage", "organizations.update"]);
  const isEnterpriseAllowed = Boolean(
    license?.entitlements?.ssoEnabled || tier === "enterprise" || canAccessSso
  );

  const [endpoints, setEndpoints] = React.useState<SiemEndpointItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [formOpen, setFormOpen] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<SiemEndpointItem | null>(null);
  const [revealedSecret, setRevealedSecret] = React.useState<string | null>(null);

  const [testingId, setTestingId] = React.useState<string | null>(null);
  const [reEnablingId, setReEnablingId] = React.useState<string | null>(null);
  const [deliveriesTarget, setDeliveriesTarget] = React.useState<SiemEndpointItem | null>(null);
  const [deliveries, setDeliveries] = React.useState<SiemDeliveryItem[]>([]);
  const [loadingDeliveries, setLoadingDeliveries] = React.useState(false);
  const [replayingId, setReplayingId] = React.useState<string | null>(null);

  const [confirmTarget, setConfirmTarget] = React.useState<SiemEndpointItem | null>(null);
  const [confirmKind, setConfirmKind] = React.useState<"delete" | "roll" | null>(null);
  const [confirmBusy, setConfirmBusy] = React.useState(false);

  const loadEndpoints = React.useCallback(async () => {
    if (!slug || !isEnterpriseAllowed) return;
    setIsLoading(true);
    try {
      const { apiClient } = await import("../../lib/api-client");
      const data = await apiClient<SiemEndpointItem[]>(
        `/api/v1/organizations/${encodeURIComponent(slug)}/security/siem/endpoints`
      );
      setEndpoints(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  }, [isEnterpriseAllowed, slug]);

  React.useEffect(() => {
    loadEndpoints();
  }, [loadEndpoints]);

  const handleSaveEndpoint = async (payload: UpsertSiemEndpointInput) => {
    if (!slug) return;
    setIsSaving(true);
    try {
      const { apiClient } = await import("../../lib/api-client");
      if (editingItem) {
        await apiClient<SiemEndpointItem>(
          `/api/v1/organizations/${encodeURIComponent(slug)}/security/siem/endpoints/${encodeURIComponent(editingItem.id)}`,
          { method: "PUT", body: JSON.stringify(payload) }
        );
        toast.success(t("settings.siem.updated_success"));
      } else {
        const created = await apiClient<SiemEndpointItem>(
          `/api/v1/organizations/${encodeURIComponent(slug)}/security/siem/endpoints`,
          { method: "POST", body: JSON.stringify(payload) }
        );
        toast.success(t("settings.siem.created_success"));
        if (created?.plainTextSecret) setRevealedSecret(created.plainTextSecret);
      }
      setFormOpen(false);
      setEditingItem(null);
      await loadEndpoints();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestEndpoint = React.useCallback(
    async (item: SiemEndpointItem) => {
      if (!slug || testingId) return;
      setTestingId(item.id);
      try {
        const { apiClient } = await import("../../lib/api-client");
        const res = await apiClient<{ success: boolean; httpStatus: number; latencyMs: number; errorMessage?: string }>(
          `/api/v1/organizations/${encodeURIComponent(slug)}/security/siem/endpoints/${encodeURIComponent(item.id)}/test`,
          { method: "POST" }
        );
        if (res?.success) {
          toast.success(t("settings.siem.test_success", { status: res.httpStatus, latency: res.latencyMs }));
        } else {
          toast.error(t("settings.siem.test_failed", { status: res?.httpStatus ?? 0, error: res?.errorMessage || "HTTP error" }));
        }
        await loadEndpoints();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : String(err));
      } finally {
        setTestingId(null);
      }
    },
    [loadEndpoints, slug, t, testingId]
  );

  const handleReEnableEndpoint = React.useCallback(
    async (item: SiemEndpointItem) => {
      if (!slug || reEnablingId) return;
      setReEnablingId(item.id);
      try {
        const { apiClient } = await import("../../lib/api-client");
        await apiClient(
          `/api/v1/organizations/${encodeURIComponent(slug)}/security/siem/endpoints/${encodeURIComponent(item.id)}/re-enable`,
          { method: "POST" }
        );
        toast.success(t("settings.siem.re_enabled_success"));
        await loadEndpoints();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : String(err));
      } finally {
        setReEnablingId(null);
      }
    },
    [loadEndpoints, reEnablingId, slug, t]
  );

  const loadDeliveries = React.useCallback(
    async (item: SiemEndpointItem) => {
      if (!slug) return;
      setDeliveriesTarget(item);
      setLoadingDeliveries(true);
      try {
        const { apiClient } = await import("../../lib/api-client");
        const data = await apiClient<SiemDeliveryItem[]>(
          `/api/v1/organizations/${encodeURIComponent(slug)}/security/siem/endpoints/${encodeURIComponent(item.id)}/deliveries?limit=50`
        );
        setDeliveries(Array.isArray(data) ? data : []);
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : String(err));
      } finally {
        setLoadingDeliveries(false);
      }
    },
    [slug]
  );

  const handleReplayDelivery = React.useCallback(
    async (deliveryId: string) => {
      if (!slug || !deliveriesTarget) return;
      setReplayingId(deliveryId);
      try {
        const { apiClient } = await import("../../lib/api-client");
        const updated = await apiClient<SiemDeliveryItem>(
          `/api/v1/organizations/${encodeURIComponent(slug)}/security/siem/endpoints/${encodeURIComponent(deliveriesTarget.id)}/deliveries/${encodeURIComponent(deliveryId)}/replay`,
          { method: "POST" }
        );
        if (updated?.deliveryStatus === "DELIVERED") {
          toast.success(t("settings.siem.replay_success", { status: updated.httpStatusCode ?? 200 }));
        } else {
          toast.error(t("settings.siem.replay_failed", { status: updated?.httpStatusCode ?? 0, error: updated?.errorMessage || "Delivery failed" }));
        }
        await loadDeliveries(deliveriesTarget);
        await loadEndpoints();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : String(err));
      } finally {
        setReplayingId(null);
      }
    },
    [deliveriesTarget, loadDeliveries, loadEndpoints, slug, t]
  );

  const handleConfirmAction = async () => {
    if (!slug || !confirmTarget || !confirmKind) return;
    setConfirmBusy(true);
    try {
      const { apiClient } = await import("../../lib/api-client");
      if (confirmKind === "delete") {
        await apiClient(
          `/api/v1/organizations/${encodeURIComponent(slug)}/security/siem/endpoints/${encodeURIComponent(confirmTarget.id)}`,
          { method: "DELETE" }
        );
        toast.success(t("settings.siem.deleted_success"));
      } else {
        const res = await apiClient<SiemEndpointItem>(
          `/api/v1/organizations/${encodeURIComponent(slug)}/security/siem/endpoints/${encodeURIComponent(confirmTarget.id)}/roll-secret`,
          { method: "POST" }
        );
        if (res?.plainTextSecret) setRevealedSecret(res.plainTextSecret);
      }
      setConfirmTarget(null);
      setConfirmKind(null);
      await loadEndpoints();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setConfirmBusy(false);
    }
  };

  const columns = React.useMemo(
    () =>
      buildSiemColumns({
        t,
        canManage,
        testingId,
        reEnablingId,
        onReEnable: handleReEnableEndpoint,
        onTest: handleTestEndpoint,
        onLogs: loadDeliveries,
        onEdit: (item) => {
          setEditingItem(item);
          setFormOpen(true);
        },
        onConfirmAction: (item, kind) => {
          setConfirmTarget(item);
          setConfirmKind(kind);
        },
      }),
    [canManage, handleReEnableEndpoint, handleTestEndpoint, loadDeliveries, reEnablingId, t, testingId]
  );

  if (!isEnterpriseAllowed) {
    return (
      <Card className="p-5 border-border/60 bg-card space-y-3 shadow-xs">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-muted border border-border/60 shrink-0">
            <Lock className="size-4 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground">{t("settings.siem.enterprise_locked_title")}</h3>
              <Badge variant="outline" className="text-[10px] font-mono">{t("settings.siem.enterprise_badge")}</Badge>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{t("settings.siem.enterprise_locked_desc")}</p>
          </div>
        </div>
      </Card>
    );
  }

  const activeCount = endpoints.filter((e) => e.isActive).length;
  const autoDisabledCount = endpoints.filter((e) => !e.isActive && Boolean(e.autoDisabledAt)).length;
  const totalDlq = endpoints.reduce((acc, item) => acc + (item.dlqCount || 0), 0);

  return (
    <Card className="p-5 border-border/60 bg-card space-y-4 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40 pb-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Webhook className="size-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">{t("settings.siem.title")}</h3>
            <Badge variant="outline" className="text-[10px] font-mono">{t("settings.siem.enterprise_badge")}</Badge>
          </div>
          <p className="text-xs text-muted-foreground">{t("settings.siem.desc")}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button type="button" size="sm" variant="outline" onClick={loadEndpoints} disabled={isLoading} className="gap-1.5">
            <RefreshCw className={`size-3.5 ${isLoading ? "animate-spin" : ""}`} />
            {t("settings.siem.refresh_btn")}
          </Button>
          {canManage && (
            <Button
              type="button"
              size="sm"
              onClick={() => {
                setEditingItem(null);
                setFormOpen(true);
              }}
              className="gap-1.5"
            >
              <Plus className="size-3.5" />
              {t("settings.siem.add_endpoint_btn")}
            </Button>
          )}
        </div>
      </div>

      <SiemStatsRow activeCount={activeCount} autoDisabledCount={autoDisabledCount} totalDlq={totalDlq} />

      {autoDisabledCount > 0 && (
        <div className="flex items-start gap-2.5 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-destructive">
          <AlertTriangle className="size-4 shrink-0 mt-0.5" />
          <div className="space-y-0.5 text-xs">
            <div className="font-semibold">{t("settings.siem.auto_disabled_banner_title")}</div>
            <div className="opacity-90">{t("settings.siem.auto_disabled_banner_desc")}</div>
          </div>
        </div>
      )}

      <DataTable
        columns={columns}
        data={endpoints}
        isLoading={isLoading}
        density="compact"
        emptyState={{
          icon: <ShieldCheck className="size-6 mx-auto text-muted-foreground/60 mb-2" />,
          title: t("settings.siem.empty_title"),
          description: t("settings.siem.empty_desc"),
        }}
      />

      <SiemEndpointFormModal open={formOpen} onOpenChange={setFormOpen} editingItem={editingItem} isSaving={isSaving} onSubmit={handleSaveEndpoint} />
      <SiemSecretRevealModal secretValue={revealedSecret} onClose={() => setRevealedSecret(null)} />
      <SiemDeliveriesModal
        endpoint={deliveriesTarget}
        deliveries={deliveries}
        isLoading={loadingDeliveries}
        replayingId={replayingId}
        onClose={() => setDeliveriesTarget(null)}
        onRefresh={() => (deliveriesTarget ? loadDeliveries(deliveriesTarget) : Promise.resolve())}
        onReplay={handleReplayDelivery}
      />
      <SiemConfirmDialog
        open={Boolean(confirmTarget && confirmKind)}
        title={confirmKind === "delete" ? t("settings.siem.delete_confirm_title") : t("settings.siem.roll_confirm_title")}
        description={
          confirmKind === "delete"
            ? t("settings.siem.delete_confirm_desc", { name: confirmTarget?.name || "" })
            : t("settings.siem.roll_confirm_desc", { name: confirmTarget?.name || "" })
        }
        submitLabel={confirmKind === "delete" ? t("settings.siem.delete_confirm_submit") : t("settings.siem.roll_confirm_submit")}
        destructive={confirmKind === "delete"}
        isBusy={confirmBusy}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmTarget(null);
            setConfirmKind(null);
          }
        }}
        onConfirm={handleConfirmAction}
      />
    </Card>
  );
}
