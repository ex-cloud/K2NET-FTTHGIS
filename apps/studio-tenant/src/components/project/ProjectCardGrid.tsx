import { Link } from "@tanstack/react-router";
import {
  Box,
  Users,
  Layers,
  Network,
  ArrowRight,
  Server,
  Map,
  MapPin,
  RotateCcw,
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
  cn,
} from "@k2net/ui";
import { type Project } from "../../hooks/useProjects";
import { useTranslation } from "@k2net/i18n";
import { getProjectStatusInfo } from "./project-utils";
import { ProjectActionMenu } from "./ProjectActionMenu";

export interface ProjectCardGridProps {
  projects: Project[];
  viewMode?: "grid" | "list";
  onDeleteProject?: (id: string) => void;
  onArchiveProject?: (id: string) => void;
  onUnarchiveProject?: (id: string) => void;
}

function ProjectCardItem({
  project,
  onDeleteProject,
  onArchiveProject,
  onUnarchiveProject,
}: {
  project: Project;
  onDeleteProject?: (id: string) => void;
  onArchiveProject?: (id: string) => void;
  onUnarchiveProject?: (id: string) => void;
}) {
  const { t, formatNumber } = useTranslation();
  const statusInfo = getProjectStatusInfo(project.status, t);
  const isArchived = project.status === "ARCHIVED";
  const oltHealthLabel = isArchived
    ? t("projects.archived_badge")
    : `${project.oltCount || 1} OLT ${t("projects.olt_online")}`;

  return (
    <Card
      glowingEffect={!isArchived}
      className={cn(
        "group relative flex flex-col justify-between p-4 sm:p-4.5 border-border/60 bg-card transition-all duration-200",
        isArchived && "opacity-75 bg-muted/20 border-dashed border-border/80"
      )}
    >
      <div className="space-y-2.5">
        {/* Header Row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <Link
              to="/project/$projectId/overview"
              params={{ projectId: project.id }}
              className="focus:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded-lg shrink-0"
            >
              <div
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-colors cursor-pointer",
                  isArchived
                    ? "bg-muted/30 border-border/60 text-muted-foreground"
                    : "bg-muted/50 border-border/80 text-foreground/80 hover:bg-muted hover:text-foreground"
                )}
              >
                <Box className="size-4.5" />
              </div>
            </Link>
            <div className="min-w-0">
              <Link
                to="/project/$projectId/overview"
                params={{ projectId: project.id }}
                className="focus:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded truncate block"
              >
                <h3
                  className={cn(
                    "text-xs sm:text-sm font-bold truncate transition-colors cursor-pointer",
                    isArchived
                      ? "text-muted-foreground hover:text-foreground"
                      : "text-foreground hover:text-primary"
                  )}
                >
                  {project.name}
                </h3>
              </Link>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded bg-muted/60 text-muted-foreground border border-border/60">
                  {project.code}
                </span>
                <span className="text-[11px] text-muted-foreground flex items-center gap-1 font-medium truncate max-w-[140px]">
                  <MapPin className="size-3 text-muted-foreground/70 shrink-0" />
                  <span className="truncate">{project.region || (project.slug ? `${project.slug} Region` : "Coverage Area")}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Right Status Badge + Action Menu */}
          <div className="flex items-center gap-1 shrink-0">
            <Badge
              variant="outline"
              className={cn(
                "text-[9px] font-mono font-semibold uppercase tracking-wider px-1.5 py-0.2",
                statusInfo.badgeClass
              )}
            >
              {statusInfo.shortLabel}
            </Badge>
            <ProjectActionMenu
              project={project}
              onDeleteProject={onDeleteProject}
              onArchiveProject={onArchiveProject}
              onUnarchiveProject={onUnarchiveProject}
            />
          </div>
        </div>

        {/* Description */}
        <p className="text-[11px] text-muted-foreground line-clamp-2 min-h-[30px] leading-relaxed">
          {project.description || (isArchived ? t("projects.archived_read_only_hint") : "FTTH network infrastructure operational deployment area.")}
        </p>

        {/* Asset Metrics Grid */}
        <div className="grid grid-cols-2 gap-1.5 pt-2.5 border-groove-t">
          <div
            className="flex items-center gap-1.5 p-1.5 rounded-md bg-muted/30 border border-border/40 min-w-0"
            title={t("projects.stats_total_subscribers")}
          >
            <Users className="size-3.5 text-muted-foreground shrink-0" />
            <div className="text-[11px] truncate">
              <span className="font-mono font-bold text-foreground">
                {formatNumber(project.totalSubscribers || 0)}
              </span>{" "}
              <span className="text-muted-foreground text-[10px]">{t("projects.unit_subscribers")}</span>
            </div>
          </div>

          <div
            className="flex items-center gap-1.5 p-1.5 rounded-md bg-muted/30 border border-border/40 min-w-0"
            title={t("projects.stats_cable_length")}
          >
            <Network className="size-3.5 text-sky-400 shrink-0" />
            <div className="text-[11px] truncate">
              <span className="font-mono font-bold text-foreground">
                {(project.cableLengthKm || 0).toFixed(1)}
              </span>{" "}
              <span className="text-muted-foreground text-[10px]">{t("projects.unit_km_cable")}</span>
            </div>
          </div>

          <div
            className="flex items-center gap-1.5 p-1.5 rounded-md bg-muted/30 border border-border/40 min-w-0"
            title={t("gis.odc_odp_devices")}
          >
            <Layers className="size-3.5 text-amber-400 shrink-0" />
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
            className="flex items-center gap-1.5 p-1.5 rounded-md bg-muted/30 border border-border/40 min-w-0"
            title={t("projects.col_olt_health")}
          >
            <Server className="size-3.5 text-muted-foreground shrink-0" />
            <div className="text-[11px] flex items-center gap-1.5 truncate">
              <span
                className={cn(
                  "size-2 rounded-full shrink-0",
                  isArchived ? "bg-muted-foreground/60" : "bg-emerald-500"
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
      <div className="flex items-center justify-between gap-1.5 pt-2.5 mt-2.5 border-groove-t">
        {isArchived ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onUnarchiveProject?.(project.id)}
            className="h-7 px-2.5 text-xs gap-1.5 font-medium border-border/80 bg-card hover:bg-accent text-primary cursor-pointer"
          >
            <RotateCcw className="size-3.5" />
            <span>{t("projects.restore_project")}</span>
          </Button>
        ) : (
          <Button
            asChild
            variant="outline"
            size="sm"
            className="h-7 px-2 text-xs gap-1 font-medium border-border/80 bg-card hover:bg-accent text-foreground cursor-pointer"
          >
            <Link
              to="/project/$projectId/infrastructure/topology"
              params={{ projectId: project.id }}
            >
              <Map className="size-3" />
              <span>{t("projects.open_map_editor")}</span>
            </Link>
          </Button>
        )}

        <Button
          asChild
          size="sm"
          className="h-7 px-2 text-xs gap-1 font-medium cursor-pointer shadow-xs"
        >
          <Link to="/project/$projectId/overview" params={{ projectId: project.id }}>
            <span>{t("projects.open_project")}</span>
            <ArrowRight className="size-3" />
          </Link>
        </Button>
      </div>
    </Card>
  );
}

function ProjectTableRowItem({
  project,
  onDeleteProject,
  onArchiveProject,
  onUnarchiveProject,
}: {
  project: Project;
  onDeleteProject?: (id: string) => void;
  onArchiveProject?: (id: string) => void;
  onUnarchiveProject?: (id: string) => void;
}) {
  const { t, formatNumber } = useTranslation();
  const statusInfo = getProjectStatusInfo(project.status, t);
  const isArchived = project.status === "ARCHIVED";
  const oltHealthLabel = isArchived
    ? t("projects.archived_badge")
    : `${project.oltCount || 1} OLT ${t("projects.olt_online")}`;

  return (
    <TableRow
      className={cn(
        "text-xs border-b border-border/40 transition-colors",
        isArchived ? "opacity-75 bg-muted/10 hover:bg-muted/20" : "hover:bg-muted/30"
      )}
    >
      {/* Col 1: Project & Region */}
      <TableCell className="py-2.5 px-3.5">
        <div className="flex items-center gap-3">
          <Link
            to="/project/$projectId/overview"
            params={{ projectId: project.id }}
            className="focus:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded-lg shrink-0"
          >
            <div
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors cursor-pointer",
                isArchived
                  ? "bg-muted/30 border-border/60 text-muted-foreground"
                  : "bg-muted/50 border-border/80 text-foreground/80 hover:bg-muted hover:text-foreground"
              )}
            >
              <Box className="size-4" />
            </div>
          </Link>
          <div className="min-w-0">
            <Link
              to="/project/$projectId/overview"
              params={{ projectId: project.id }}
              className="focus:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded truncate block"
            >
              <span
                className={cn(
                  "font-bold transition-colors cursor-pointer block truncate text-xs",
                  isArchived ? "text-muted-foreground hover:text-foreground" : "text-foreground hover:text-primary"
                )}
              >
                {project.name}
              </span>
            </Link>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded bg-muted/60 text-muted-foreground border border-border/60">
                {project.code}
              </span>
              <span className="text-[11px] text-muted-foreground flex items-center gap-1 truncate font-medium">
                <MapPin className="size-3 text-muted-foreground/70 shrink-0" />
                {project.region || (project.slug ? `${project.slug} Region` : "Coverage Area")}
              </span>
            </div>
          </div>
        </div>
      </TableCell>

      {/* Col 2: Status */}
      <TableCell className="py-2.5 px-3.5">
        <Badge
          variant="outline"
          className={cn(
            "text-[10px] font-mono font-semibold uppercase tracking-wider px-1.5 py-0.2",
            statusInfo.badgeClass
          )}
        >
          {statusInfo.shortLabel}
        </Badge>
      </TableCell>

      {/* Col 3: OLT Health */}
      <TableCell className="py-2.5 px-3.5">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "size-2 rounded-full",
              isArchived ? "bg-muted-foreground/60" : "bg-emerald-500"
            )}
          />
          <span className="font-mono text-xs text-foreground/90 font-medium">
            {oltHealthLabel}
          </span>
        </div>
      </TableCell>

      {/* Col 4: Network Metrics */}
      <TableCell className="py-2.5 px-3.5">
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5" title={t("projects.stats_total_subscribers")}>
            <Users className="size-3.5 text-muted-foreground" />
            <span className="font-mono font-bold text-foreground">
              {formatNumber(project.totalSubscribers || 0)}
            </span>
            <span className="text-[10px] text-muted-foreground">Plg</span>
          </div>
          <div className="flex items-center gap-1.5" title={t("projects.stats_cable_length")}>
            <Network className="size-3.5 text-sky-400" />
            <span className="font-mono font-bold text-foreground">
              {(project.cableLengthKm || 0).toFixed(1)}
            </span>
            <span className="text-[10px] text-muted-foreground">Km</span>
          </div>
          <div className="flex items-center gap-1.5" title={t("gis.odc_odp_devices")}>
            <Layers className="size-3.5 text-amber-400" />
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
      <TableCell className="py-2.5 px-3.5 text-right">
        <div className="flex items-center justify-end gap-1.5">
          {isArchived ? (
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={() => onUnarchiveProject?.(project.id)}
              className="h-6 px-2 text-[11px] gap-1 font-medium border-border/80 bg-card hover:bg-accent text-primary cursor-pointer"
            >
              <RotateCcw className="size-3" />
              <span className="hidden xl:inline">{t("projects.restore_project")}</span>
            </Button>
          ) : (
            <Button
              asChild
              variant="outline"
              size="xs"
              className="h-6 px-2 text-[11px] gap-1 font-medium border-border/80 bg-card hover:bg-accent text-foreground cursor-pointer"
            >
              <Link
                to="/project/$projectId/infrastructure/topology"
                params={{ projectId: project.id }}
              >
                <Map className="size-3" />
                <span className="hidden xl:inline">{t("projects.open_map_editor")}</span>
              </Link>
            </Button>
          )}

          <Button
            asChild
            size="xs"
            className="h-6 px-2 text-[11px] gap-1 font-medium cursor-pointer shadow-xs"
          >
            <Link to="/project/$projectId/overview" params={{ projectId: project.id }}>
              <span>{t("projects.open_project")}</span>
              <ArrowRight className="size-3" />
            </Link>
          </Button>

          <ProjectActionMenu
            project={project}
            onDeleteProject={onDeleteProject}
            onArchiveProject={onArchiveProject}
            onUnarchiveProject={onUnarchiveProject}
            compact
          />
        </div>
      </TableCell>
    </TableRow>
  );
}

export function ProjectCardGrid({
  projects,
  viewMode = "grid",
  onDeleteProject,
  onArchiveProject,
  onUnarchiveProject,
}: ProjectCardGridProps) {
  const { t } = useTranslation();

  if (viewMode === "list") {
    return (
      <div className="rounded-xl border border-border/60 bg-card overflow-hidden shadow-xs">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 text-[10px] uppercase font-bold tracking-wider text-muted-foreground border-b border-border/60">
              <TableHead className="py-2 px-3.5">{t("projects.col_project_region")}</TableHead>
              <TableHead className="py-2 px-3.5">{t("projects.col_status")}</TableHead>
              <TableHead className="py-2 px-3.5">{t("projects.col_olt_health")}</TableHead>
              <TableHead className="py-2 px-3.5">{t("projects.col_network_metrics")}</TableHead>
              <TableHead className="py-2 px-3.5 text-right">{t("projects.col_actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.map((project) => (
              <ProjectTableRowItem
                key={project.id}
                project={project}
                onDeleteProject={onDeleteProject}
                onArchiveProject={onArchiveProject}
                onUnarchiveProject={onUnarchiveProject}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
      {projects.map((project) => (
        <ProjectCardItem
          key={project.id}
          project={project}
          onDeleteProject={onDeleteProject}
          onArchiveProject={onArchiveProject}
          onUnarchiveProject={onUnarchiveProject}
        />
      ))}
    </div>
  );
}
