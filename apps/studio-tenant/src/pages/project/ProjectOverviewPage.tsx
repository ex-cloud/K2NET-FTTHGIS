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
  PageHeader,
  PageContentShell,
  Card,
  Button,
} from "@k2net/ui";
import { useProjects } from "../../hooks/useProjects";

export function ProjectOverviewPage() {
  const params = useParams({ strict: false }) as { projectId?: string };
  const { projects } = useProjects();
  const projectId = params?.projectId || "proj-bdg-01";

  const project = React.useMemo(() => {
    return (
      projects.find((p) => p.id === projectId) || {
        id: projectId,
        name: "FTTH Bandung Timur Cluster",
        code: "BDG-TMR",
        status: "PRODUCTION",
        description: "Area deployment fiber optik Bandung Timur & Arcamanik",
        totalSubscribers: 1420,
        onlineSubscribers: 1398,
        odcCount: 12,
        odpCount: 86,
        cableLengthKm: 48.6,
        oltCount: 4,
      }
    );
  }, [projects, projectId]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <PageHeader
        title={project.name}
        breadcrumbs={[
          { label: "Proyek", href: "/projects" },
          { label: project.name },
          { label: "Overview" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button asChild size="sm" className="h-8 px-3 text-xs font-medium gap-1.5 shadow-xs">
              <Link to="/project/$projectId/infrastructure/topology" params={{ projectId }}>
                <Map className="h-3.5 w-3.5" />
                Buka Map Studio
              </Link>
            </Button>
          </div>
        }
      />

      {/* Content */}
      <PageContentShell className="space-y-5 custom-scrollbar">
        {/* KPI Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Subscribers Card */}
          <Card className="p-4 border-border/60 bg-card space-y-2 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-primary" />
                Total Pelanggan Aktif
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-primary/10 text-primary border border-primary/20">
                98.4% Online
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold font-mono text-foreground">
                {project.totalSubscribers || 1420}
              </span>
              <span className="text-[11px] text-muted-foreground font-mono">
                {project.onlineSubscribers || 1398} Online
              </span>
            </div>
          </Card>

          {/* ODC / ODP Capacity */}
          <Card className="p-4 border-border/60 bg-card space-y-2 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-amber-500" />
                Enclosure Distribusi
              </span>
              <span className="text-[10px] font-mono text-muted-foreground">Kapasitas 82%</span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold font-mono text-foreground">
                {project.odcCount || 12} <span className="text-xs font-normal text-muted-foreground">ODC</span> / {project.odpCount || 86} <span className="text-xs font-normal text-muted-foreground">ODP</span>
              </span>
              <span className="text-[11px] text-primary font-mono">688 Port</span>
            </div>
          </Card>

          {/* Cable Span */}
          <Card className="p-4 border-border/60 bg-card space-y-2 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                <Network className="h-3.5 w-3.5 text-sky-500" />
                Bentang Kabel Optik
              </span>
              <span className="text-[10px] font-mono text-sky-600 dark:text-sky-400">GIS Verified</span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold font-mono text-foreground">
                {project.cableLengthKm || 48.6} <span className="text-xs font-normal text-muted-foreground">Km</span>
              </span>
              <span className="text-[11px] text-muted-foreground font-mono">Feeder & Drop</span>
            </div>
          </Card>

          {/* OLT Status */}
          <Card className="p-4 border-border/60 bg-card space-y-2 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                <Server className="h-3.5 w-3.5 text-primary" />
                Kesehatan OLT
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-primary/10 text-primary border border-primary/20">
                ALL UP
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold font-mono text-foreground">
                {project.oltCount || 4} <span className="text-xs font-normal text-muted-foreground">Unit</span>
              </span>
              <span className="text-[11px] text-muted-foreground font-mono">SNMP Telemetry</span>
            </div>
          </Card>
        </div>

        {/* Quick Access Modules Navigation */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Akses Cepat Modul Operasional Proyek
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
                    Map Studio & Vector Tiles
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Visualisasi spasial MapLibre, tracking kabel putus, dan inspector aset interaktif.
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
                    Katalog Inventaris & BOQ
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Data lengkap kabinet ODC, splitter, box ODP, kabel optik, serta kalkulator BOQ.
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
                    Trouble Tickets & Dispatcher
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Pantau tiket redaman tinggi, kabel putus, dan penugasan teknisi JIT lapangan.
                  </p>
                </div>
              </Card>
            </Link>
          </div>
        </div>
      </PageContentShell>
    </div>
  );
}
