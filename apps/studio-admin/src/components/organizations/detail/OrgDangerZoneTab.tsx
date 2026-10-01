import { useState } from "react";
import { Button, Card, ActionTooltip } from "@k2net/ui";
import { httpClient } from "@/lib/httpClient";
import { getBackendBaseUrl } from "@/lib/api-config";
import { useSession } from "@/lib/auth-compat";
import { usePermissions } from "@/hooks/use-permissions";
import { useTranslation } from "@k2net/i18n";
import {
  PauseCircle,
  PlayCircle,
  ExternalLink,
  Trash2,
  Lock,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import type { EnrichedOrganization, OrganizationStatus } from "../types";

interface OrgDangerZoneTabProps {
  organization: EnrichedOrganization;
  onImpersonate: () => void;
  onUpdateStatus: (status: OrganizationStatus) => void;
  onDelete: () => void;
}

export function OrgDangerZoneTab({
  organization: org,
  onImpersonate,
  onUpdateStatus,
  onDelete,
}: OrgDangerZoneTabProps) {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const { canAccess } = usePermissions();
  const canImpersonate = canAccess("system.support.impersonate");
  const canUpdateOrg = canAccess(["system.organizations.update", "system.organizations.manage"]);
  const canManageSecurity = canAccess("system.security.manage");
  const canDeleteOrg = canAccess("system.organizations.delete");

  const [resettingRealm, setResettingRealm] = useState(false);

  const handleResetRealm = async () => {
    if (!session?.accessToken) return;
    setResettingRealm(true);
    try {
      const baseUrl = getBackendBaseUrl();
      const res = await httpClient(`${baseUrl}/organizations/${org.slug}/reset-realm`, {
        method: "POST",
        token: session.accessToken,
      });
      if (res.ok) {
        toast.success(t("organizations.reset_iam_success", { name: org.name }), {
          description: t("organizations.reset_iam_success_desc"),
        });
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(t("organizations.reset_iam_failed", { error: data.message || "Server error" }));
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Connection failed";
      toast.error(t("organizations.reset_iam_failed", { error: msg }));
    } finally {
      setResettingRealm(false);
    }
  };

  const isSuspended = org.status === "SUSPENDED";

  return (
    <div className="space-y-6">
      {/* Warning Notice */}
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs">
          <span className="font-bold text-foreground block">
            {t("organizations.danger_zone_title")}
          </span>
          <p className="text-muted-foreground leading-relaxed">
            {t("organizations.danger_zone_subtitle")}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {/* 1. Super Admin Impersonation */}
        <Card className="flex items-center justify-between p-3.5">
          <div className="space-y-0.5 max-w-xl">
            <span className="text-xs font-semibold text-foreground block">
              {t("organizations.impersonate_title")}
            </span>
            <p className="text-[11px] text-muted-foreground">
              {t("organizations.impersonate_desc")}
            </p>
          </div>
          <ActionTooltip
            label={
              canImpersonate
                ? t("organizations.impersonate_tooltip_allowed")
                : t("organizations.impersonate_tooltip_denied")
            }
            shortcut={canImpersonate ? "Ctrl+Enter" : undefined}
          >
            <Button
              size="sm"
              onClick={onImpersonate}
              disabled={!canImpersonate}
              className="h-7 px-2.5 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 shrink-0 shadow-xs disabled:opacity-50"
            >
              <span>{t("organizations.open_tenant_portal_btn")}</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          </ActionTooltip>
        </Card>

        {/* 2. Suspend / Freeze Tenant */}
        <Card className="flex items-center justify-between p-3.5">
          <div className="space-y-0.5 max-w-xl">
            <span className="text-xs font-semibold text-foreground block">
              {isSuspended ? t("organizations.resume_tenant_title") : t("organizations.suspend_tenant_title")}
            </span>
            <p className="text-[11px] text-muted-foreground">
              {isSuspended
                ? t("organizations.resume_tenant_desc")
                : t("organizations.suspend_tenant_desc")}
            </p>
          </div>
          <ActionTooltip
            label={
              !canUpdateOrg
                ? t("organizations.impersonate_tooltip_denied")
                : isSuspended
                ? t("organizations.resume_tenant_title")
                : t("organizations.suspend_tenant_title")
            }
          >
            <Button
              variant="outline"
              size="sm"
              onClick={() => onUpdateStatus(isSuspended ? "ACTIVE" : "SUSPENDED")}
              disabled={!canUpdateOrg}
              className={
                isSuspended
                  ? "h-7 px-2.5 text-xs font-semibold border-border bg-card hover:bg-primary/10 hover:text-primary gap-1.5 shrink-0 shadow-2xs disabled:opacity-50"
                  : "h-7 px-2.5 text-xs font-semibold border-border bg-card hover:bg-amber-500/10 hover:text-amber-500 hover:border-amber-500/30 gap-1.5 shrink-0 shadow-2xs disabled:opacity-50"
              }
            >
              {isSuspended ? <PlayCircle className="h-3.5 w-3.5" /> : <PauseCircle className="h-3.5 w-3.5" />}
              <span>{isSuspended ? t("organizations.resume_btn") : t("organizations.suspend_btn")}</span>
            </Button>
          </ActionTooltip>
        </Card>

        {/* 3. Reset Keycloak IAM Realm */}
        <Card className="flex items-center justify-between p-3.5">
          <div className="space-y-0.5 max-w-xl">
            <span className="text-xs font-semibold text-foreground block">
              {t("organizations.reset_iam_title")}
            </span>
            <p className="text-[11px] text-muted-foreground">
              {t("organizations.reset_iam_desc", { realm: `${org.slug}-realm` })}
            </p>
          </div>
          <ActionTooltip
            label={
              !canManageSecurity
                ? t("organizations.impersonate_tooltip_denied")
                : t("organizations.reset_iam_tooltip")
            }
          >
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetRealm}
              disabled={!canManageSecurity || resettingRealm}
              className="h-7 px-2.5 text-xs font-medium border-border bg-card hover:bg-muted text-foreground gap-1.5 shrink-0 shadow-2xs disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${resettingRealm ? "animate-spin text-primary" : ""}`} />
              <span>{t("organizations.reset_iam_btn")}</span>
            </Button>
          </ActionTooltip>
        </Card>

        {/* 4. Delete Organization Permanently */}
        {org.slug === "default" || org.id === "00000000-0000-0000-0000-000000000001" ? (
          <div className="flex items-center justify-between rounded-xl border border-border/70 bg-muted/20 p-3.5">
            <div className="space-y-0.5 max-w-xl">
              <div className="flex items-center gap-2">
                <Lock className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-semibold text-foreground block">
                  {t("organizations.root_tenant_title")}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {t("organizations.root_tenant_desc")}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled
              className="h-7 px-2.5 text-xs font-medium opacity-60 cursor-not-allowed gap-1.5 shrink-0"
            >
              <Lock className="h-3.5 w-3.5" />
              <span>{t("organizations.protected_deletion_btn")}</span>
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between rounded-xl border border-destructive/40 bg-destructive/5 p-3.5">
            <div className="space-y-0.5 max-w-xl">
              <span className="text-xs font-semibold text-destructive block">
                {t("organizations.delete_perm_title")}
              </span>
              <p className="text-[11px] text-muted-foreground">
                {t("organizations.delete_perm_desc")}
              </p>
            </div>
            <ActionTooltip
              label={
                canDeleteOrg
                  ? t("organizations.delete_perm_title")
                  : t("organizations.impersonate_tooltip_denied")
              }
            >
              <Button
                variant="destructive"
                size="sm"
                onClick={onDelete}
                disabled={!canDeleteOrg}
                className="h-7 px-2.5 text-xs font-medium bg-destructive hover:bg-destructive/90 text-destructive-foreground gap-1.5 shrink-0 shadow-xs disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>{t("organizations.delete_tenant_btn")}</span>
              </Button>
            </ActionTooltip>
          </div>
        )}
      </div>
    </div>
  );
}
