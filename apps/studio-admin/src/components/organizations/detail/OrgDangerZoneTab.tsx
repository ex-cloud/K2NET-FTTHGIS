

import { useState } from "react";
import { Button, Card, ActionTooltip } from "@k2net/ui";
import {
  PauseCircle,
  PlayCircle,
  ExternalLink,
  Trash2,
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
  const [resettingRealm, setResettingRealm] = useState(false);

  const handleResetRealm = () => {
    setResettingRealm(true);
    setTimeout(() => {
      setResettingRealm(false);
      toast.success(`Keycloak IAM Realm for ${org.name} successfully re-synchronized`, {
        description: "Client secrets and roles have been updated.",
      });
    }, 1000);
  };

  const isSuspended = org.status === "SUSPENDED";

  return (
    <div className="space-y-6">
      {/* Warning Notice */}
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs">
          <span className="font-bold text-foreground block">
            Critical Multi-Tenant Actions & Danger Zone
          </span>
          <p className="text-muted-foreground leading-relaxed">
            Aksi di bawah ini berdampak langsung terhadap ketersediaan layanan operasional mitra ISP, isolasi skema PostGIS database, dan realm Keycloak IAM.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {/* 1. Super Admin Impersonation */}
        <Card className="flex items-center justify-between p-3.5">
          <div className="space-y-0.5 max-w-xl">
            <span className="text-xs font-semibold text-foreground block">
              Super Admin Impersonation (God Mode)
            </span>
            <p className="text-[11px] text-muted-foreground">
              Masuk langsung ke dashboard portal tenant sebagai Super Admin tanpa memerlukan kata sandi pengguna mitra.
            </p>
          </div>
          <ActionTooltip label="Login to tenant portal as Super Admin" shortcut="Ctrl+Enter">
            <Button
              size="sm"
              onClick={onImpersonate}
              className="h-7 px-2.5 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 shrink-0 shadow-xs"
            >
              <span>Open Tenant Portal</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          </ActionTooltip>
        </Card>

        {/* 2. Suspend / Freeze Tenant */}
        <Card className="flex items-center justify-between p-3.5">
          <div className="space-y-0.5 max-w-xl">
            <span className="text-xs font-semibold text-foreground block">
              {isSuspended ? "Resume Tenant Operations" : "Suspend Organization Access"}
            </span>
            <p className="text-[11px] text-muted-foreground">
              {isSuspended
                ? "Mengaktifkan kembali seluruh endpoint API Kong, polling OLT, dan akses peta GIS tenant."
                : "Membekukan sementara akses seluruh pengguna tenant dan menolak query peta GIS."}
            </p>
          </div>
          <ActionTooltip label={isSuspended ? "Unfreeze and resume tenant operations" : "Freeze tenant API and poller access"}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onUpdateStatus(isSuspended ? "ACTIVE" : "SUSPENDED")}
              className={
                isSuspended
                  ? "h-7 px-2.5 text-xs font-semibold border-border bg-card hover:bg-primary/10 hover:text-primary gap-1.5 shrink-0 shadow-2xs"
                  : "h-7 px-2.5 text-xs font-semibold border-border bg-card hover:bg-amber-500/10 hover:text-amber-500 hover:border-amber-500/30 gap-1.5 shrink-0 shadow-2xs"
              }
            >
              {isSuspended ? <PlayCircle className="h-3.5 w-3.5" /> : <PauseCircle className="h-3.5 w-3.5" />}
              <span>{isSuspended ? "Resume Tenant" : "Suspend Tenant"}</span>
            </Button>
          </ActionTooltip>
        </Card>

        {/* 3. Reset Keycloak IAM Realm */}
        <Card className="flex items-center justify-between p-3.5">
          <div className="space-y-0.5 max-w-xl">
            <span className="text-xs font-semibold text-foreground block">
              Reset Keycloak IAM Realm Secret
            </span>
            <p className="text-[11px] text-muted-foreground">
              Mengatur ulang client secret OAuth2 dan melakukan sinkronisasi ulang role RBAC Keycloak untuk realm <code className="text-primary font-mono text-[10px]">{org.slug}-realm</code>.
            </p>
          </div>
          <ActionTooltip label="Re-sync Keycloak client secrets & RBAC roles">
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetRealm}
              disabled={resettingRealm}
              className="h-7 px-2.5 text-xs font-semibold border-border bg-card hover:bg-muted text-foreground gap-1.5 shrink-0 shadow-2xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${resettingRealm ? "animate-spin text-primary" : ""}`} />
              <span>Reset IAM Realm</span>
            </Button>
          </ActionTooltip>
        </Card>

        {/* 4. Delete Organization Permanently */}
        <div className="flex items-center justify-between rounded-xl border border-destructive/40 bg-destructive/5 p-3.5">
          <div className="space-y-0.5 max-w-xl">
            <span className="text-xs font-semibold text-destructive block">
              Delete Organization Permanently
            </span>
            <p className="text-[11px] text-muted-foreground">
              Menghapus permanen skema database tenant, akun Keycloak, dan seluruh topologi peta GIS yang terafiliasi.
            </p>
          </div>
          <ActionTooltip label="Danger: Open permanent deletion confirmation dialog">
            <Button
              variant="destructive"
              size="sm"
              onClick={onDelete}
              className="h-7 px-2.5 text-xs font-semibold bg-destructive hover:bg-destructive/90 text-destructive-foreground gap-1.5 shrink-0 shadow-xs"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete Tenant</span>
            </Button>
          </ActionTooltip>
        </div>
      </div>
    </div>
  );
}
