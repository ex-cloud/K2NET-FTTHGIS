import * as React from "react";
import {
  LogsDetailDrawerCore,
  LogsDetailOverviewRow,
  type StandardLogsDetailModel,
} from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import { useNavigate } from "@tanstack/react-router";
import type { TenantAuditEvent } from "../../types/tenant-audit";

export interface TenantAuditDetailDrawerProps {
  event: TenantAuditEvent | null;
  open: boolean;
  onClose: () => void;
  currentIndex?: number;
  totalLogsCount?: number;
  onPrevLog?: () => void;
  onNextLog?: () => void;
  hasPrevLog?: boolean;
  hasNextLog?: boolean;
}

function resolveMethodAndStatus(action: string, severity: string): { method: string; statusCode: number } {
  const s = severity.toUpperCase();
  const statusCode = s === "ERROR" || s === "CRITICAL" ? 500 : s === "WARN" ? 400 : 200;
  const a = action.toUpperCase();
  const method = a.includes("CREATE") || a.includes("ADD") ? "POST" : a.includes("DELETE") ? "DELETE" : a.includes("UPDATE") || a.includes("EDIT") ? "PUT" : "RPC";
  return { method, statusCode };
}

function formatEventMessage(action: string, resourceType?: string, resourceId?: string): string {
  const rawAction = (action || "EVENT").replace(/_/g, " ").toUpperCase();
  const rawResType = (resourceType || "RESOURCE").toUpperCase();
  const rawResId = resourceId ? `[${resourceId}]` : "";
  return `${rawAction} ON ${rawResType} ${rawResId}`.trim();
}

function mapEventToDetailModel(event: TenantAuditEvent): StandardLogsDetailModel {
  const { method, statusCode } = resolveMethodAndStatus(event.action, event.severity || "INFO");
  const message = formatEventMessage(event.action, event.resourceType, event.resourceId);
  const isImpersonated = Boolean(event.metadata?.impersonatedBy) || Boolean(event.metadata?.superAdmin) || event.actorRole === "super_admin";

  return {
    id: event.id,
    timestamp: event.occurredAt,
    severity: event.severity || "INFO",
    action: event.action,
    resourceType: event.resourceType,
    resourceId: event.resourceId,
    serviceSource: event.category,
    tenantSlug: event.tenantSlug,
    scope: event.scope,
    projectName: event.projectName,
    projectId: event.projectId,
    actor: event.actorEmail || event.actorId,
    actorRole: event.actorRole,
    actorIp: event.actorIp,
    method,
    statusCode,
    pathname: `${event.resourceType.toLowerCase()}/${event.resourceId || ""}`,
    message,
    hash: (event.metadata?.hash || event.metadata?.prevHash) as string | undefined,
    prevHash: event.metadata?.prevHash as string | undefined,
    isImpersonated,
    realActorId: String(event.metadata?.impersonatedBy || event.metadata?.realActor || ""),
    impersonationSessionId: event.metadata?.impersonationSessionId as string | undefined,
    oldValue: event.oldValue,
    newValue: event.newValue,
    metadata: event.metadata,
    rawJson: event,
  };
}

export function TenantAuditDetailDrawer({
  event,
  open,
  onClose,
  currentIndex,
  totalLogsCount,
  onPrevLog,
  onNextLog,
  hasPrevLog = false,
  hasNextLog = false,
}: TenantAuditDetailDrawerProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const detailModel = React.useMemo(() => (event ? mapEventToDetailModel(event) : null), [event]);

  const handleNavigateToGis = React.useCallback(() => {
    if (!event?.projectId) return;
    onClose();
    navigate({
      to: "/project/$projectId/infrastructure/topology",
      params: { projectId: event.projectId },
    });
  }, [event?.projectId, onClose, navigate]);

  const customOverviewRows = React.useMemo(() => {
    if (!event) return null;
    const meta = (event.metadata || {}) as Record<string, unknown>;
    const lat = meta.lat ?? meta.latitude;
    const lng = meta.lng ?? meta.longitude;
    const attenuation = meta.attenuationDbm ?? meta.opticalPower ?? meta.lossDbm;
    const lengthMeters = meta.lengthMeters ?? meta.cableLengthMeters;
    const coreCount = meta.coreCount ?? meta.totalCores;
    const usedCores = meta.usedCores;

    return (
      <>
        {event.projectName && (
          <LogsDetailOverviewRow label="Project Scope">
            <span className="text-foreground font-semibold truncate">
              {event.projectName} {event.projectId ? `(${event.projectId})` : ""}
            </span>
          </LogsDetailOverviewRow>
        )}

        {lat !== undefined && lng !== undefined && (
          <LogsDetailOverviewRow
            label="GIS Coordinates"
            copyValue={`${lat}, ${lng}`}
            onCopyValue={(_, val) => {
              navigator.clipboard.writeText(val);
            }}
          >
            <span className="text-foreground font-mono truncate">
              📍 {String(lat)}, {String(lng)}
            </span>
          </LogsDetailOverviewRow>
        )}

        {attenuation !== undefined && (
          <LogsDetailOverviewRow label="Optical Telemetry">
            <span className="text-amber-400 font-bold font-mono">
              ⚡ {String(attenuation)} dBm
            </span>
          </LogsDetailOverviewRow>
        )}

        {(lengthMeters !== undefined || coreCount !== undefined) && (
          <LogsDetailOverviewRow label="Physical Specs">
            <span className="text-foreground font-mono">
              {lengthMeters !== undefined ? `📏 ${String(lengthMeters)}m` : ""}
              {coreCount !== undefined ? ` • ${String(coreCount)} Cores` : ""}
              {usedCores !== undefined ? ` (${String(usedCores)} used)` : ""}
            </span>
          </LogsDetailOverviewRow>
        )}
      </>
    );
  }, [event]);

  if (!open || !event || !detailModel) return null;

  return (
    <LogsDetailDrawerCore
      detail={detailModel}
      open={open}
      onClose={onClose}
      title={t("observability.log_details") || "Log Details"}
      currentIndex={currentIndex}
      totalLogsCount={totalLogsCount}
      onPrevLog={onPrevLog}
      onNextLog={onNextLog}
      hasPrevLog={hasPrevLog}
      hasNextLog={hasNextLog}
      onNavigateToGis={handleNavigateToGis}
      customOverviewRowsSlot={customOverviewRows}
    />
  );
}
