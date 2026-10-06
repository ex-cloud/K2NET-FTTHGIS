import * as React from "react";
import { Link } from "@tanstack/react-router";
import {
  Box,
  Users,
  Layers,
  Network,
  ArrowRight,
  Server,
  Map,
  MoreVertical,
  MapPin,
  Download,
  Copy,
  Settings,
  Trash2,
  Activity,
} from "lucide-react";
import {
  Card,
  Button,
  Badge,
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  cn,
} from "@k2net/ui";
import { type Project } from "../../hooks/useProjects";
import { useTranslation } from "@k2net/i18n";
import { toast } from "sonner";

interface ProjectCardGridProps {
  projects: Project[];
  viewMode?: "grid" | "list";
  onDeleteProject?: (id: string) => void;
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case "PRODUCTION":
    case "ACTIVE":
      return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
    case "PLANNING":
      return "bg-sky-500/10 text-sky-400 border-sky-500/20";
    case "MAINTENANCE":
      return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    default:
      return "bg-muted text-muted-foreground border-border/60";
  }
};

const handleExportSpatial = (project: Project, successMessage: string) => {
  const exportData = {
    type: "FeatureCollection",
    projectName: project.name,
    projectCode: project.code,
    exportedAt: new Date().toISOString(),
    features: [],
  };
  const blob = new Blob([JSON.stringify(exportData, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${project.code.toLowerCase()}_spatial_export.geojson`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast.success(successMessage || `${project.code} GeoJSON exported!`);
};

const handleDuplicateStructure = (project: Project, successMessage: string) => {
  navigator.clipboard.writeText(
    JSON.stringify(
      {
        name: `${project.name} (Copy)`,
        code: `${project.code}-COPY`,
        description: project.description,
        status: "PLANNING",
      },
      null,
      2
    )
  );
  toast.success(successMessage || `Structure ${project.code} copied!`);
};

function ProjectActionMenu({
  project,
  onDeleteProject,
}: {
  project: Project;
  onDeleteProject?: (id: string) => void;
}) {
  const { t } = useTranslation();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-foreground cursor-pointer"
        >
          <MoreVertical className="h-3.5 w-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 text-xs">
        <DropdownMenuItem asChild>
          <Link to="/project/$projectId/overview" params={{ projectId: project.id }}>
            <Activity className="h-3.5 w-3.5 mr-2" />
            {t("projects.open_summary")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link
            to="/project/$projectId/infrastructure/topology"
            params={{ projectId: project.id }}
          >
            <Map className="h-3.5 w-3.5 mr-2" />
            {t("projects.open_gis_map")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExportSpatial(project, t("projects.import_success"))}>
          <Download className="h-3.5 w-3.5 mr-2" />
          {t("projects.export_spatial_data")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleDuplicateStructure(project, t("common.copied_to_clipboard"))}>
          <Copy className="h-3.5 w-3.5 mr-2" />
          {t("projects.duplicate_project")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link
            to="/project/$projectId/settings/general"
            params={{ projectId: project.id }}
          >
            <Settings className="h-3.5 w-3.5 mr-2" />
            {t("projects.project_settings")}
          </Link>
        </DropdownMenuItem>
        {onDeleteProject && (
          <DropdownMenuItem
            onClick={() => onDeleteProject(project.id)}
            className="text-destructive focus:bg-destructive/10 cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5 mr-2" />
            {t("projects.delete_project")}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ProjectCardItem({
  project,
  onDeleteProject,
}: {
  project: Project;
  onDeleteProject?: (id: string) => void;
}) {
  const { t, formatNumber } = useTranslation();
  const isDegraded = project.status === "MAINTENANCE";
  const oltHealthLabel = `${project.oltCount || 1} OLT ${
    isDegraded ? t("projects.olt_degraded") : t("projects.olt_online")
  }`;

  return (
    <Card
      glowingEffect
      className="group relative flex flex-col justify-between p-5 border-border/60 bg-card transition-all duration-200"
    >
      <div className="space-y-3">
        {/* Header Row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              to="/project/$projectId/overview"
              params={{ projectId: project.id }}
              className="focus:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded-lg shrink-0"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted/50 border border-border/80 text-foreground/80 hover:bg-muted hover:text-foreground transition-colors cursor-pointer">
                <Box className="h-5 w-5" />
              </div>
            </Link>
            <div className="min-w-0">
              <Link
                to="/project/$projectId/overview"
                params={{ projectId: project.id }}
                className="focus:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded truncate block"
              >
                <h3 className="text-sm font-bold text-foreground truncate hover:text-primary transition-colors cursor-pointer">
                  {project.name}
                </h3>
              </Link>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded bg-muted/60 text-muted-foreground border border-border/60">
                  {project.code}
                </span>
                <span className="text-[11px] text-muted-foreground flex items-center gap-1 font-medium">
                  <MapPin className="h-3 w-3 text-muted-foreground/70 shrink-0" />
                  {project.slug ? `${project.slug} Region` : "Coverage Area"}
                </span>
              </div>
            </div>
          </div>

          {/* Right Status Badge + Action Menu */}
          <div className="flex items-center gap-1.5 shrink-0">
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] font-mono font-semibold uppercase tracking-wider px-2 py-0.5",
                getStatusBadge(project.status)
              )}
            >
              {project.status === "ACTIVE" ? t("projects.status_active") : project.status}
            </Badge>
            <ProjectActionMenu project={project} onDeleteProject={onDeleteProject} />
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-muted-foreground line-clamp-2 min-h-[32px] leading-relaxed">
          {project.description || "FTTH network infrastructure operational deployment area."}
        </p>

        {/* Asset Metrics Grid */}
        <div className="grid grid-cols-2 gap-2 pt-3 border-groove-t">
          <div
            className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 border border-border/40"
            title={t("projects.stats_total_subscribers")}
          >
            <Users className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="text-[11px] truncate">
              <span className="font-mono font-bold text-foreground">
                {formatNumber(project.totalSubscribers || 0)}
              </span>{" "}
              <span className="text-muted-foreground text-[10px]">{t("projects.unit_subscribers")}</span>
            </div>
          </div>

          <div
            className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 border border-border/40"
            title={t("projects.stats_cable_length")}
          >
            <Network className="h-4 w-4 text-sky-400 shrink-0" />
            <div className="text-[11px] truncate">
              <span className="font-mono font-bold text-foreground">
                {(project.cableLengthKm || 0).toFixed(1)}
              </span>{" "}
              <span className="text-muted-foreground text-[10px]">{t("projects.unit_km_cable")}</span>
            </div>
          </div>

          <div
            className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 border border-border/40"
            title={t("gis.odc_odp_devices")}
          >
            <Layers className="h-4 w-4 text-amber-400 shrink-0" />
            <div className="text-[11px] truncate">
              <span className="font-mono font-bold text-foreground">
                {project.odcCount || 0}
              </span>{" "}
              <span className="text-muted-foreground text-[10px]">ODC</span> /{" "}
              <span className="font-mono font-bold text-foreground">
                {project.odpCount || 0}
              </span>{" "}
              <span className="text-muted-foreground text-[10px]">ODP</span>
            </div>
          </div>

          <div
            className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 border border-border/40"
            title={t("projects.col_olt_health")}
          >
            <Server className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="text-[11px] flex items-center gap-1.5 truncate">
              <span
                className={cn(
                  "h-2 w-2 rounded-full shrink-0",
                  isDegraded ? "bg-amber-500" : "bg-emerald-500"
                )}
              />
              <span className="font-mono font-bold text-foreground truncate">
                {oltHealthLabel}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Card Footer Actions */}
      <div className="flex items-center justify-between gap-2 pt-3 mt-3 border-groove-t">
        <Button
          asChild
          variant="outline"
          size="sm"
          className="h-7.5 px-3 text-xs gap-1.5 font-medium border-border/80 hover:bg-muted/60 cursor-pointer"
        >
          <Link
            to="/project/$projectId/infrastructure/topology"
            params={{ projectId: project.id }}
          >
            <Map className="h-3.5 w-3.5" />
            <span>{t("projects.open_map_editor")}</span>
          </Link>
        </Button>

        <Button asChild size="sm" className="h-7.5 px-3.5 text-xs gap-1.5 font-medium cursor-pointer">
          <Link to="/project/$projectId/overview" params={{ projectId: project.id }}>
            <span>{t("projects.open_project")}</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </Button>
      </div>
    </Card>
  );
}

function ProjectTableRowItem({
  project,
  onDeleteProject,
}: {
  project: Project;
  onDeleteProject?: (id: string) => void;
}) {
  const { t, formatNumber } = useTranslation();
  const isDegraded = project.status === "MAINTENANCE";
  const oltHealthLabel = `${project.oltCount || 1} OLT ${
    isDegraded ? t("projects.olt_degraded") : t("projects.olt_online")
  }`;

  return (
    <TableRow className="text-xs hover:bg-muted/30 border-b border-border/40 transition-colors">
      {/* Col 1: Project & Region */}
      <TableCell className="py-3 px-4">
        <div className="flex items-center gap-3">
          <Link
            to="/project/$projectId/overview"
            params={{ projectId: project.id }}
            className="focus:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded-lg shrink-0"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted/50 border border-border/80 text-foreground/80 hover:bg-muted hover:text-foreground transition-colors cursor-pointer">
              <Box className="h-4.5 w-4.5" />
            </div>
          </Link>
          <div className="min-w-0">
            <Link
              to="/project/$projectId/overview"
              params={{ projectId: project.id }}
              className="focus:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded truncate block"
            >
              <span className="font-bold text-foreground hover:text-primary transition-colors cursor-pointer block truncate text-sm">
                {project.name}
              </span>
            </Link>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded bg-muted/60 text-muted-foreground border border-border/60">
                {project.code}
              </span>
              <span className="text-[11px] text-muted-foreground flex items-center gap-1 truncate font-medium">
                <MapPin className="h-3 w-3 text-muted-foreground/70 shrink-0" />
                {project.slug ? `${project.slug} Region` : "Coverage Area"}
              </span>
            </div>
          </div>
        </div>
      </TableCell>

      {/* Col 2: Status */}
      <TableCell className="py-3 px-4">
        <Badge
          variant="outline"
          className={cn(
            "text-[10px] font-mono font-semibold uppercase tracking-wider px-2 py-0.5",
            getStatusBadge(project.status)
          )}
        >
          {project.status === "ACTIVE" ? t("projects.status_active") : project.status}
        </Badge>
      </TableCell>

      {/* Col 3: OLT Health */}
      <TableCell className="py-3 px-4">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "h-2 w-2 rounded-full",
              isDegraded ? "bg-amber-500" : "bg-emerald-500"
            )}
          />
          <span className="font-mono text-xs text-foreground/90 font-medium">
            {oltHealthLabel}
          </span>
        </div>
      </TableCell>

      {/* Col 4: Network Metrics */}
      <TableCell className="py-3 px-4">
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5" title={t("projects.stats_total_subscribers")}>
            <Users className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-mono font-bold text-foreground">
              {formatNumber(project.totalSubscribers || 0)}
            </span>
            <span className="text-[10px] text-muted-foreground">Plg</span>
          </div>
          <div className="flex items-center gap-1.5" title={t("projects.stats_cable_length")}>
            <Network className="h-3.5 w-3.5 text-sky-400" />
            <span className="font-mono font-bold text-foreground">
              {(project.cableLengthKm || 0).toFixed(1)}
            </span>
            <span className="text-[10px] text-muted-foreground">Km</span>
          </div>
          <div className="flex items-center gap-1.5" title={t("gis.odc_odp_devices")}>
            <Layers className="h-3.5 w-3.5 text-amber-400" />
            <span className="font-mono font-bold text-foreground">
              {project.odcCount || 0}
            </span>
            <span className="text-[10px] text-muted-foreground">ODC</span>
            <span className="text-muted-foreground/60">/</span>
            <span className="font-mono font-bold text-foreground">
              {project.odpCount || 0}
            </span>
            <span className="text-[10px] text-muted-foreground">ODP</span>
          </div>
        </div>
      </TableCell>

      {/* Col 5: Actions */}
      <TableCell className="py-3 px-4 text-right">
        <div className="flex items-center justify-end gap-2">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="h-7.5 px-2.5 text-xs gap-1.5 font-medium border-border/80 hover:bg-muted/60 cursor-pointer"
          >
            <Link
              to="/project/$projectId/infrastructure/topology"
              params={{ projectId: project.id }}
            >
              <Map className="h-3.5 w-3.5" />
              <span className="hidden xl:inline">{t("projects.open_map_editor")}</span>
            </Link>
          </Button>

          <Button
            asChild
            size="sm"
            className="h-7.5 px-3 text-xs gap-1.5 font-medium cursor-pointer"
          >
            <Link to="/project/$projectId/overview" params={{ projectId: project.id }}>
              <span>{t("projects.open_project")}</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </Button>

          <ProjectActionMenu project={project} onDeleteProject={onDeleteProject} />
        </div>
      </TableCell>
    </TableRow>
  );
}

export function ProjectCardGrid({
  projects,
  viewMode = "grid",
  onDeleteProject,
}: ProjectCardGridProps) {
  const { t } = useTranslation();

  if (viewMode === "list") {
    return (
      <div className="rounded-xl border border-border/60 bg-card overflow-hidden shadow-xs">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 text-[10px] uppercase font-bold tracking-wider text-muted-foreground border-b border-border/60">
              <TableHead className="py-2.5 px-4">{t("projects.col_project_region")}</TableHead>
              <TableHead className="py-2.5 px-4">{t("projects.col_status")}</TableHead>
              <TableHead className="py-2.5 px-4">{t("projects.col_olt_health")}</TableHead>
              <TableHead className="py-2.5 px-4">{t("projects.col_network_metrics")}</TableHead>
              <TableHead className="py-2.5 px-4 text-right">{t("projects.col_actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.map((project) => (
              <ProjectTableRowItem
                key={project.id}
                project={project}
                onDeleteProject={onDeleteProject}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {projects.map((project) => (
        <ProjectCardItem
          key={project.id}
          project={project}
          onDeleteProject={onDeleteProject}
        />
      ))}
    </div>
  );
}
