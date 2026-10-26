import { useState, useEffect, useCallback } from "react";
import { Link } from "@/lib/navigation-compat";
import { useTranslation, type TranslationKey } from "@k2net/i18n";
import { useSession } from "@/lib/auth-compat";
import { httpClient } from "@/lib/httpClient";
import { getBackendBaseUrl } from "@/lib/api-config";
import {
  ShieldAlert,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Zap,
  TrendingUp,
  Activity,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { Card, Button, Badge } from "@k2net/ui";

type TranslateFn = (key: TranslationKey, params?: Record<string, string | number>) => string;

interface SlaMetrics {
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  urgentBreachRisk: number;
  slaComplianceRate: number;
  avgResolutionHours: number;
  sev1Total: number;
  sev1Open: number;
  sev1Resolved: number;
  sev1ComplianceRate: number;
  sev2Total: number;
  sev2Open: number;
  sev2Resolved: number;
  sev2ComplianceRate: number;
  sev3Total: number;
  sev3Open: number;
  sev3Resolved: number;
  sev3ComplianceRate: number;
}

function calculateUptimePct(services: Record<string, string> | undefined): number | null {
  if (!services) return null;
  const totalSvc = Object.keys(services).length;
  if (totalSvc === 0) return null;
  const upSvc = Object.values(services).filter((s) => {
    const val = s.toUpperCase();
    return val === "UP" || val === "ONLINE";
  }).length;
  return Math.round(((upSvc / totalSvc) * 100.0) * 10.0) / 10.0;
}

interface SlaTierConfig {
  id: string;
  name: string;
  desc: string;
  initialResponse: string;
  mttr: string;
  total: number;
  open: number;
  complianceRate: number;
  color: string;
  dotColor: string;
}

function buildSlaTiers(metrics: SlaMetrics | null, t: TranslateFn): SlaTierConfig[] {
  return [
    {
      id: "sev1",
      name: t("support.sev1_label"),
      desc: t("support.sev1_desc"),
      initialResponse: "< 15 min",
      mttr: "< 2.0 h",
      total: metrics?.sev1Total ?? 0,
      open: metrics?.sev1Open ?? 0,
      complianceRate: metrics?.sev1ComplianceRate ?? 100,
      color: "text-destructive",
      dotColor: "bg-destructive",
    },
    {
      id: "sev2",
      name: t("support.sev2_label"),
      desc: t("support.sev2_desc"),
      initialResponse: "< 30 min",
      mttr: "< 4.0 h",
      total: metrics?.sev2Total ?? 0,
      open: metrics?.sev2Open ?? 0,
      complianceRate: metrics?.sev2ComplianceRate ?? 100,
      color: "text-amber-500",
      dotColor: "bg-amber-500",
    },
    {
      id: "sev3",
      name: t("support.sev3_label"),
      desc: t("support.sev3_desc"),
      initialResponse: "< 2.0 h",
      mttr: "< 24.0 h",
      total: metrics?.sev3Total ?? 0,
      open: metrics?.sev3Open ?? 0,
      complianceRate: metrics?.sev3ComplianceRate ?? 100,
      color: "text-muted-foreground",
      dotColor: "bg-muted-foreground",
    },
  ];
}

interface SlaSeverityRowProps {
  tier: SlaTierConfig;
  loading: boolean;
  hasMetrics: boolean;
  t: TranslateFn;
}

function SlaSeverityRow({ tier, loading, hasMetrics, t }: SlaSeverityRowProps) {
  const isBreached = tier.open > 0 && tier.id === "sev1";
  return (
    <tr className="hover:bg-muted/10">
      <td className={`py-3 px-3 font-semibold ${tier.color} flex items-center gap-1.5`}>
        <span className={`size-2 rounded-full ${tier.dotColor} inline-block`} />
        {tier.name}
      </td>
      <td className="py-3 px-3 text-foreground/90">
        <div>{tier.desc}</div>
        <div className="text-[10px] text-muted-foreground mt-0.5">
          {t("support.tier_tickets_count", { open: tier.open, total: tier.total })}
        </div>
      </td>
      <td className="py-3 px-3 font-mono text-foreground font-semibold">{tier.initialResponse}</td>
      <td className="py-3 px-3 font-mono text-foreground font-semibold">{tier.mttr}</td>
      <td className="py-3 px-3">
        {loading || !hasMetrics ? (
          <span className="text-muted-foreground font-mono text-xs">...</span>
        ) : isBreached ? (
          <Badge
            variant="destructive"
            className="text-[10px] bg-destructive/10 text-destructive border-destructive/20 font-medium"
          >
            {t("support.status_open_outage", { count: tier.open })}
          </Badge>
        ) : (
          <Badge
            variant="default"
            className="text-[10px] bg-green-500/10 text-green-500 border-green-500/20 font-medium"
          >
            {t("support.status_compliant_rate", {
              rate: tier.complianceRate.toFixed(1),
            })}
          </Badge>
        )}
      </td>
    </tr>
  );
}

function getResponseSubtitle(metrics: SlaMetrics | null, t: TranslateFn): string {
  if (!metrics) return t("support.loading_metrics");
  if (metrics.openTickets > 0) return t("support.kpi_active_queue_count", { count: metrics.openTickets });
  return t("support.kpi_queue_clear");
}

function getResolutionSubtitle(metrics: SlaMetrics | null, t: TranslateFn): string {
  if (!metrics || metrics.resolvedTickets === 0) return t("support.kpi_no_resolved_yet");
  return t("support.kpi_based_on_resolved", { count: metrics.resolvedTickets });
}

export default function SupportSlaPage() {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const [metrics, setMetrics] = useState<SlaMetrics | null>(null);
  const [uptimePct, setUptimePct] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchMetrics = useCallback(async () => {
    if (!session?.accessToken) return;
    setLoading(true);
    try {
      const baseUrl = getBackendBaseUrl();
      const [slaRes, healthRes] = await Promise.all([
        httpClient(`${baseUrl}/api/v1/system/support/sla-metrics`, {
          token: session.accessToken,
        }),
        httpClient(`${baseUrl}/api/v1/system/health-metrics`, {
          token: session.accessToken,
        }).catch(() => null),
      ]);

      if (slaRes.ok) {
        const data = await slaRes.json();
        setMetrics(data as SlaMetrics);
      }

      if (healthRes && healthRes.ok) {
        const healthData = await healthRes.json();
        const services = healthData.services as Record<string, string> | undefined;
        setUptimePct(calculateUptimePct(services));
      }
    } catch {
      // Retain previous state on network failure
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  const tiers = buildSlaTiers(metrics, t);

  return (
    <div className="relative flex flex-col w-full h-full bg-background pt-6 pb-6 gap-6 px-4 md:px-6 overflow-y-auto custom-scrollbar-thin">
      {/* ── Page Header ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2 tracking-tight">
            <ShieldAlert className="h-5 w-5 text-primary" />
            {t("support.sla_title")}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t("support.sla_subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={fetchMetrics}
            disabled={loading}
            className="px-2.5 h-7 text-xs font-medium flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>{t("workspace.refresh")}</span>
          </Button>
          <Link href="/support/tickets?quick=urgent">
            <Button
              size="sm"
              className="px-2.5 h-7 rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 font-medium text-xs flex items-center gap-1.5 active:scale-[0.98] transition-all shadow-xs cursor-pointer"
            >
              <AlertTriangle className="size-3.5" />
              <span>{t("support.kpi_urgent_tickets")}</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* ── Top Metric Cards Row ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        <Card glowingEffect className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              {t("support.kpi_sla_compliance")}
            </span>
            <CheckCircle2 className="size-4 text-green-500" />
          </div>
          <div className="mt-2">
            <p className="text-2xl font-bold font-mono text-foreground">
              {metrics ? `${metrics.slaComplianceRate.toFixed(1)}%` : "—"}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {t("support.kpi_sla_compliance_desc")}
            </p>
          </div>
        </Card>

        <Card glowingEffect className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              {t("support.kpi_target_response")}
            </span>
            <Zap className="size-4 text-amber-500" />
          </div>
          <div className="mt-2">
            <p className="text-2xl font-bold font-mono text-foreground">
              {t("support.kpi_target_response_val")}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {getResponseSubtitle(metrics, t)}
            </p>
          </div>
        </Card>

        <Card glowingEffect className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              {t("support.kpi_avg_resolution")}
            </span>
            <Clock className="size-4 text-muted-foreground" />
          </div>
          <div className="mt-2">
            <p className="text-2xl font-bold font-mono text-foreground">
              {metrics && metrics.avgResolutionHours > 0
                ? `${metrics.avgResolutionHours.toFixed(1)}h`
                : "—"}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {getResolutionSubtitle(metrics, t)}
            </p>
          </div>
        </Card>

        <Card glowingEffect className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              {t("support.kpi_platform_uptime")}
            </span>
            <Activity className="size-4 text-primary" />
          </div>
          <div className="mt-2">
            <p className="text-2xl font-bold font-mono text-foreground">
              {uptimePct !== null ? `${uptimePct.toFixed(1)}%` : "100.0%"}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {t("support.kpi_all_services_healthy")}
            </p>
          </div>
        </Card>
      </div>

      {/* ── B2B SLA Severity Matrix Table ────────────────────────────── */}
      <Card className="p-5 border border-border/70 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <TrendingUp className="size-4 text-primary" />
              <span>{t("support.matrix_title")}</span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t("support.matrix_subtitle")}
            </p>
          </div>
          <Badge variant="outline" className="text-xs font-mono">
            {t("support.contract_badge")}
          </Badge>
        </div>

        <div className="border border-border/50 rounded-lg overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/30 border-b border-border/50 text-muted-foreground">
              <tr>
                <th className="py-2.5 px-3 font-medium">{t("support.col_severity")}</th>
                <th className="py-2.5 px-3 font-medium">{t("support.col_scope")}</th>
                <th className="py-2.5 px-3 font-medium">{t("support.col_initial_response")}</th>
                <th className="py-2.5 px-3 font-medium">{t("support.col_target_mttr")}</th>
                <th className="py-2.5 px-3 font-medium">{t("support.col_status")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {tiers.map((tier) => (
                <SlaSeverityRow
                  key={tier.id}
                  tier={tier}
                  loading={loading}
                  hasMetrics={Boolean(metrics)}
                  t={t}
                />
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-muted-foreground">
            {t("support.summary_monitored", {
              total: metrics?.totalTickets ?? 0,
              breached: metrics?.urgentBreachRisk ?? 0,
            })}
          </span>
          <Link href="/support/tickets">
            <Button size="sm" variant="outline" className="h-7 text-xs flex items-center gap-1 cursor-pointer">
              <span>{t("support.tab_all_tickets")}</span>
              <ArrowRight className="size-3" />
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
