import * as React from "react";
import { useTranslation } from "@k2net/i18n";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Badge,
  Card,
} from "@k2net/ui";
import {
  Activity,
  Cpu,
  Clock,
  Zap,
  Server,
  RefreshCw,
  Loader2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../lib/api-client";

export interface OltTelemetryPortMetric {
  portNumber: number;
  portName: string;
  adminStatus: string;
  operStatus: string;
  activeOnts: number;
  maxOnts: number;
  txPowerDbm: number;
  rxAvgPowerDbm: number;
  signalQuality: string;
}

export interface OltTelemetryData {
  oltId: string;
  code: string;
  name: string;
  ipAddress: string;
  status: string;
  snmpStatus: string;
  uptimeSeconds: number;
  formattedUptime: string;
  cpuUsagePercent: number;
  temperatureCelsius: number;
  responseTimeMs: number;
  ponPortsTotal: number;
  ponPortsActive: number;
  totalOnts: number;
  activeOnts: number;
  txOpticalPowerDbm: number;
  rxOpticalPowerAvgDbm: number;
  portMetrics: OltTelemetryPortMetric[];
  lastPolledAt: string;
  isLiveFromPoller: boolean;
  sysDescr?: string;
}

export interface OltTelemetryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  olt: { id: string; code: string; name: string; ipAddress?: string } | null;
}

function MetricSummaryCard({
  icon: Icon,
  title,
  value,
  subvalue,
}: {
  icon: React.ElementType;
  title: string;
  value: string;
  subvalue?: string;
}) {
  return (
    <Card className="p-3 bg-muted/20 border-border/70 space-y-1">
      <div className="flex items-center gap-1.5 text-[10px] uppercase font-mono text-muted-foreground">
        <Icon className="size-3.5 text-primary shrink-0" />
        <span>{title}</span>
      </div>
      <p className="text-sm font-bold font-mono text-foreground">{value}</p>
      {subvalue && (
        <p className="text-[10px] text-muted-foreground font-mono">{subvalue}</p>
      )}
    </Card>
  );
}

function PonPortRow({ port }: { port: OltTelemetryPortMetric }) {
  const isUp = port.operStatus === "UP";

  return (
    <tr className="border-b border-border/50 text-xs">
      <td className="py-2 px-2.5 font-mono font-semibold text-foreground">
        {port.portName}
      </td>
      <td className="py-2 px-2.5">
        <Badge
          variant="outline"
          className={`text-[9px] font-mono uppercase px-1.5 py-0 ${
            isUp
              ? "bg-primary/10 text-primary border-primary/20"
              : "bg-muted/40 text-muted-foreground border-border/60"
          }`}
        >
          {port.operStatus}
        </Badge>
      </td>
      <td className="py-2 px-2.5 font-mono text-muted-foreground">
        {isUp ? `${port.activeOnts} / ${port.maxOnts}` : "—"}
      </td>
      <td className="py-2 px-2.5 font-mono text-foreground">
        {isUp ? `+${port.txPowerDbm.toFixed(2)} dBm` : "—"}
      </td>
      <td className="py-2 px-2.5 font-mono text-foreground">
        {isUp ? `${port.rxAvgPowerDbm.toFixed(2)} dBm` : "—"}
      </td>
      <td className="py-2 px-2.5 text-right">
        <Badge
          variant="outline"
          className={`text-[9px] font-mono px-1.5 py-0 ${
            port.signalQuality === "EXCELLENT"
              ? "bg-primary/10 text-primary border-primary/20"
              : "bg-muted/30 text-muted-foreground border-border/60"
          }`}
        >
          {port.signalQuality}
        </Badge>
      </td>
    </tr>
  );
}

function TelemetryStatusBadge({
  isOnline,
  labelOnline,
  labelOffline,
}: {
  isOnline: boolean;
  labelOnline: string;
  labelOffline: string;
}) {
  return (
    <Badge
      variant="outline"
      className={`text-[10px] font-mono uppercase font-bold gap-1 ${
        isOnline
          ? "bg-primary/10 text-primary border-primary/20"
          : "bg-muted/40 text-muted-foreground border-border"
      }`}
    >
      {isOnline ? (
        <>
          <CheckCircle2 className="size-3 text-primary animate-pulse" />
          <span>{labelOnline}</span>
        </>
      ) : (
        <>
          <XCircle className="size-3 text-muted-foreground" />
          <span>{labelOffline}</span>
        </>
      )}
    </Badge>
  );
}

function TelemetryMetricsGrid({
  telemetry,
  labels,
}: {
  telemetry?: OltTelemetryData;
  labels: {
    uptime: string;
    cpuTemp: string;
    latency: string;
    opticalPower: string;
  };
}) {
  const uptimeVal = telemetry?.formattedUptime || "—";
  const uptimeSub = telemetry?.uptimeSeconds
    ? `${telemetry.uptimeSeconds.toLocaleString()}s`
    : undefined;

  const cpuVal = telemetry ? `${telemetry.cpuUsagePercent.toFixed(1)}%` : "—";
  const cpuSub = telemetry
    ? `${telemetry.temperatureCelsius.toFixed(1)}°C`
    : undefined;

  const latencyVal = telemetry
    ? `${telemetry.responseTimeMs.toFixed(1)} ms`
    : "—";

  const optVal = telemetry
    ? `${telemetry.rxOpticalPowerAvgDbm.toFixed(1)} dBm`
    : "—";
  const optSub = telemetry
    ? `Tx: +${telemetry.txOpticalPowerDbm.toFixed(2)} dBm`
    : undefined;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
      <MetricSummaryCard
        icon={Clock}
        title={labels.uptime}
        value={uptimeVal}
        subvalue={uptimeSub}
      />
      <MetricSummaryCard
        icon={Cpu}
        title={labels.cpuTemp}
        value={cpuVal}
        subvalue={cpuSub}
      />
      <MetricSummaryCard
        icon={Activity}
        title={labels.latency}
        value={latencyVal}
        subvalue="SNMP v2c RTT"
      />
      <MetricSummaryCard
        icon={Zap}
        title={labels.opticalPower}
        value={optVal}
        subvalue={optSub}
      />
    </div>
  );
}

function TelemetryPortMatrixTable({
  portMetrics,
  noDataLabel,
}: {
  portMetrics?: OltTelemetryPortMetric[];
  noDataLabel: string;
}) {
  const hasPorts = Boolean(portMetrics && portMetrics.length > 0);

  return (
    <div className="rounded-md border border-border/70 overflow-hidden max-h-56 overflow-y-auto">
      <table className="w-full text-left border-collapse">
        <thead className="bg-muted/40 text-[10px] font-mono uppercase text-muted-foreground sticky top-0 border-b border-border">
          <tr>
            <th className="py-1.5 px-2.5">Port</th>
            <th className="py-1.5 px-2.5">Status</th>
            <th className="py-1.5 px-2.5">Active ONTs</th>
            <th className="py-1.5 px-2.5">Tx Power</th>
            <th className="py-1.5 px-2.5">Rx Power</th>
            <th className="py-1.5 px-2.5 text-right">Signal</th>
          </tr>
        </thead>
        <tbody>
          {hasPorts && portMetrics ? (
            portMetrics.map((p) => <PonPortRow key={p.portNumber} port={p} />)
          ) : (
            <tr>
              <td
                colSpan={6}
                className="py-4 text-center text-muted-foreground"
              >
                {noDataLabel}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export function OltTelemetryModal({
  open,
  onOpenChange,
  olt,
}: OltTelemetryModalProps) {
  const { t } = useTranslation();

  const {
    data: telemetry,
    isLoading,
    isFetching,
    refetch,
  } = useQuery<OltTelemetryData>({
    queryKey: ["olt-telemetry", olt?.id],
    queryFn: async () => {
      if (!olt?.id) throw new Error("No OLT selected");
      return await apiClient<OltTelemetryData>(
        `/api/v1/tenant/telemetry/olt/${olt.id}/status`
      );
    },
    enabled: open && Boolean(olt?.id),
    refetchInterval: open ? 5000 : false,
    staleTime: 3000,
  });

  if (!olt) return null;

  const isOnline = telemetry?.status === "ONLINE";
  const activePorts = telemetry?.ponPortsActive ?? 0;
  const totalPorts = telemetry?.ponPortsTotal ?? 16;
  const polledText = telemetry?.lastPolledAt
    ? `Polled: ${new Date(telemetry.lastPolledAt).toLocaleTimeString()}`
    : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-card border-border shadow-xl">
        <DialogHeader className="space-y-1.5 pb-3 border-b border-border">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                {t("inventory.telemetry_title")}
              </span>
              <TelemetryStatusBadge
                isOnline={isOnline}
                labelOnline={t("inventory.live_status_online")}
                labelOffline={t("inventory.live_status_offline")}
              />
            </div>

            <Button
              size="sm"
              variant="ghost"
              onClick={() => refetch()}
              disabled={isFetching}
              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
              title="Refresh"
            >
              <RefreshCw
                className={`size-3 ${isFetching ? "animate-spin" : ""}`}
              />
            </Button>
          </div>

          <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2 pt-1">
            <Server className="size-4 text-primary shrink-0" />
            <span>{olt.name || olt.code}</span>
          </DialogTitle>

          <DialogDescription className="font-mono text-xs text-muted-foreground flex items-center gap-2">
            <span>{olt.code}</span>
            <span>•</span>
            <span>{olt.ipAddress || "ftth-snmpsim"}</span>
            {telemetry?.sysDescr && (
              <>
                <span>•</span>
                <span className="truncate max-w-sm">{telemetry.sysDescr}</span>
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4 py-2 text-xs">
            <TelemetryMetricsGrid
              telemetry={telemetry}
              labels={{
                uptime: t("inventory.uptime"),
                cpuTemp: t("inventory.cpu_temp"),
                latency: t("inventory.latency"),
                opticalPower: t("inventory.optical_power"),
              }}
            />

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-foreground/80 uppercase font-mono tracking-wider">
                  {t("inventory.pon_matrix")}
                </span>
                <span className="text-[10px] font-mono text-muted-foreground">
                  {activePorts} / {totalPorts} Ports Active
                </span>
              </div>

              <TelemetryPortMatrixTable
                portMetrics={telemetry?.portMetrics}
                noDataLabel={t("common.no_data")}
              />
            </div>
          </div>
        )}

        <DialogFooter className="pt-3 border-t border-border flex items-center justify-between sm:justify-between">
          <span className="text-[10px] font-mono text-muted-foreground">
            {polledText}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-7 px-3 text-xs"
          >
            {t("common.close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
