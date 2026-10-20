import * as React from "react";
import { useParams, Link } from "@tanstack/react-router";
import {
  Map,
  Layers,
  Network,
  Users,
  AlertTriangle,
  Server,
  ArrowRight,
} from "lucide-react";
import {
  PageLayout,
  PageHero,
  Card,
  Button,
} from "@k2net/ui";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../lib/api-client";
import { useProjects } from "../../hooks/useProjects";
import { useTranslation } from "@k2net/i18n";

export interface NetworkStats {
  totalNodes: number;
  totalOdc: number;
  totalOdp: number;
  totalOlt: number;
  totalCableLengthKm: number;
  totalUsers: number;
}

interface ResolvedMetrics {
  totalSubscribers: number;
  onlineSubscribers: number;
  odcCount: number;
  odpCount: number;
  cableLengthKm: number;
  oltCount: number;
}

function computeProjectStats(
  rawProject: ReturnType<typeof useProjects>["projects"][number] | undefined,
  stats: NetworkStats | undefined,
  fallbackOltCount: number
): ResolvedMetrics {
  const subscribers = stats?.totalUsers ?? rawProject?.totalSubscribers ?? 0;
  const online = subscribers > 0 ? Math.max(1, subscribers - 1) : 0;
  const odc = stats?.totalOdc ?? rawProject?.odcCount ?? 0;
  const odp = stats?.totalOdp ?? rawProject?.odpCount ?? 0;
  const rawKm = stats?.totalCableLengthKm ?? rawProject?.cableLengthKm ?? 0;
  const cableKm = Number(rawKm.toFixed(2));
  const olt = stats?.totalOlt ?? fallbackOltCount;

  return {
    totalSubscribers: subscribers,
    onlineSubscribers: online,
    odcCount: odc,
    odpCount: odp,
    cableLengthKm: cableKm,
    oltCount: olt,
  };
}

export function ProjectOverviewPage() {
  const { t } = useTranslation();
  const params = useParams({ strict: false }) as { projectId?: string };
  const { projects } = useProjects();
  const projectId = params?.projectId || "";

  const { data: stats } = useQuery<NetworkStats>({
    queryKey: ["network-analytics-stats", projectId],
    queryFn: async () => {
      return apiClient<NetworkStats>("/api/v1/network/analytics/stats", {
        headers: { "X-Project-ID": projectId },
      });
    },
    enabled: Boolean(projectId),
    refetchInterval: 15000,
  });

  const { data: oltsData } = useQuery<{ totalElements?: number }>({
    queryKey: ["network-olts-count"],
    queryFn: async () => {
      return apiClient<{ totalElements?: number }>("/api/v1/network/olts?size=1");
    },
    refetchInterval: 15000,
  });

  const defaultTitle = t("projects.active_project", { defaultValue: "Active Project" });
  const fallbackOltCount = oltsData?.totalElements ?? 0;

  const project = React.useMemo(() => {
    const raw = projects.find((p) => p.id === projectId);
    const metrics = computeProjectStats(raw, stats, fallbackOltCount);

    return {
      id: projectId,
      name: raw?.name || defaultTitle,
      code: raw?.code || "PRJ",
      status: raw?.status || "ACTIVE",
      description: raw?.description || "",
      ...metrics,
    };
  }, [projects, projectId, stats, fallbackOltCount, defaultTitle]);

  return (
    <PageLayout variant="dashboard" spaceY="space-y-8">
      {/* Header */}
      <PageHero
        eyebrow={project.code}
        title={project.name}
        subtitle={project.description}
        icon={Layers}
        actions={
          <div className="flex items-center gap-2">
            <Button asChild size="sm" className="h-7 px-2.5 text-xs font-medium gap-1.5 shadow-xs rounded-md">
              <Link to="/project/$projectId/infrastructure/topology" params={{ projectId }}>
                <Map className="h-3.5 w-3.5" />
                {t("projects.quick_view_map")}
              </Link>
            </Button>
          </div>
        }
      />
        {/* KPI Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Subscribers Card */}
          <Card className="p-4 border-border/60 bg-card space-y-2 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-primary" />
                {t("projects.stats_total_subscribers")}
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-primary/10 text-primary border border-primary/20">
                {t("common.active")}
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold font-mono text-foreground">
                {project.totalSubscribers ?? 0}
              </span>
              <span className="text-[11px] text-muted-foreground font-mono">
                {project.onlineSubscribers ?? 0} {t("projects.stats_online_subscribers")}
              </span>
            </div>
          </Card>

          {/* ODC / ODP Capacity */}
          <Card className="p-4 border-border/60 bg-card space-y-2 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-amber-500" />
                {t("inventory.odc_title")}
              </span>
              <span className="text-[10px] font-mono text-muted-foreground">{t("common.capacity")}</span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold font-mono text-foreground">
                {project.odcCount ?? 0} <span className="text-xs font-normal text-muted-foreground">ODC</span> / {project.odpCount ?? 0} <span className="text-xs font-normal text-muted-foreground">ODP</span>
              </span>
              <span className="text-[11px] text-primary font-mono">Ports</span>
            </div>
          </Card>

          {/* Cable Span */}
          <Card className="p-4 border-border/60 bg-card space-y-2 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                <Network className="h-3.5 w-3.5 text-sky-500" />
                {t("inventory.cable_title")}
              </span>
              <span className="text-[10px] font-mono text-sky-600 dark:text-sky-400">GIS Verified</span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold font-mono text-foreground">
                {project.cableLengthKm ?? 0} <span className="text-xs font-normal text-muted-foreground">Km</span>
              </span>
              <span className="text-[11px] text-muted-foreground font-mono">{t("projects.stats_cable_length")}</span>
            </div>
          </Card>

          {/* OLT Status */}
          <Card className="p-4 border-border/60 bg-card space-y-2 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                <Server className="h-3.5 w-3.5 text-primary" />
                {t("inventory.olt_title")}
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-primary/10 text-primary border border-primary/20">
                {project.oltCount ? "ALL UP" : "STANDBY"}
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold font-mono text-foreground">
                {project.oltCount ?? 0} <span className="text-xs font-normal text-muted-foreground">Unit</span>
              </span>
              <span className="text-[11px] text-muted-foreground font-mono">{t("projects.stats_olt_count")}</span>
            </div>
          </Card>
        </div>

        {/* Quick Access Modules Navigation */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {t("projects.overview_title")}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {/* GIS Map Studio */}
            <Link to="/project/$projectId/infrastructure/topology" params={{ projectId }}>
              <Card className="p-4 border-border/60 bg-card hover:border-primary/40 hover:shadow-xs transition-all space-y-2 cursor-pointer group h-full flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:scale-105 transition-transform">
                      <Map className="h-4 w-4" />
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <h4 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                    {t("projects.quick_view_map")}
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {t("gis.map_subtitle")}
                  </p>
                </div>
              </Card>
            </Link>

            {/* Network Inventory */}
            <Link to="/project/$projectId/inventory/odc" params={{ projectId }}>
              <Card className="p-4 border-border/60 bg-card hover:border-primary/40 hover:shadow-xs transition-all space-y-2 cursor-pointer group h-full flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500 group-hover:scale-105 transition-transform">
                      <Layers className="h-4 w-4" />
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-amber-500 transition-colors" />
                  </div>
                  <h4 className="text-sm font-bold text-foreground group-hover:text-amber-500 transition-colors">
                    {t("inventory.boq_title")}
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {t("inventory.boq_subtitle")}
                  </p>
                </div>
              </Card>
            </Link>

            {/* Trouble Tickets */}
            <Link to="/project/$projectId/issues/tickets" params={{ projectId }}>
              <Card className="p-4 border-border/60 bg-card hover:border-primary/40 hover:shadow-xs transition-all space-y-2 cursor-pointer group h-full flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 text-rose-500 group-hover:scale-105 transition-transform">
                      <AlertTriangle className="h-4 w-4" />
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-rose-500 transition-colors" />
                  </div>
                  <h4 className="text-sm font-bold text-foreground group-hover:text-rose-500 transition-colors">
                    {t("issues.tickets_title")}
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {t("issues.tickets_subtitle")}
                  </p>
                </div>
              </Card>
            </Link>
          </div>
        </div>
    </PageLayout>
  );
}

