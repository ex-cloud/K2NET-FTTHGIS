import * as React from "react";
import { Link } from "@tanstack/react-router";
import {
  FolderKanban,
  Users,
  Layers,
  Network,
  ArrowRight,
  Server,
  Map,
  MoreVertical,
} from "lucide-react";
import {
  Card,
  Button,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@k2net/ui";
import { type Project } from "../../hooks/useProjects";

interface ProjectCardGridProps {
  projects: Project[];
  viewMode?: "grid" | "list";
  onDeleteProject?: (id: string) => void;
}

export function ProjectCardGrid({
  projects,
  viewMode = "grid",
  onDeleteProject,
}: ProjectCardGridProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PRODUCTION":
      case "ACTIVE":
        return "bg-primary/10 text-primary border-primary/20";
      case "PLANNING":
        return "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20";
      case "MAINTENANCE":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  if (viewMode === "list") {
    return (
      <div className="space-y-2.5">
        {projects.map((project) => (
          <Card
            key={project.id}
            glowingEffect
            className="group p-3.5 sm:p-4 border-border/60 bg-card transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-3"
          >
            {/* Left: Icon + Info */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20 group-hover:scale-105 transition-transform">
                <FolderKanban className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">
                    {project.name}
                  </h3>
                  <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded bg-muted text-muted-foreground border border-border/60">
                    {project.code}
                  </span>
                  <span
                    className={`text-[9px] font-mono font-semibold px-1.5 py-0.2 rounded border ${getStatusBadge(
                      project.status
                    )}`}
                  >
                    {project.status}
                  </span>
                </div>
                {project.description && (
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {project.description}
                  </p>
                )}
              </div>
            </div>

            {/* Center: Metrics chips */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/30 border border-border/40">
                <Users className="h-3 w-3 text-primary" />
                <span className="font-mono font-bold text-foreground">{project.totalSubscribers || 0}</span>
                <span className="text-muted-foreground text-[10px]">Pllg</span>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/30 border border-border/40">
                <Network className="h-3 w-3 text-sky-500" />
                <span className="font-mono font-bold text-foreground">{project.cableLengthKm || 0}</span>
                <span className="text-muted-foreground text-[10px]">Km</span>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/30 border border-border/40">
                <Layers className="h-3 w-3 text-amber-500" />
                <span className="font-mono font-bold text-foreground">{project.odcCount || 0}</span>
                <span className="text-muted-foreground text-[10px]">ODC</span>
                <span className="text-muted-foreground">/</span>
                <span className="font-mono font-bold text-foreground">{project.odpCount || 0}</span>
                <span className="text-muted-foreground text-[10px]">ODP</span>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
              <Link
                to="/project/$projectId/infrastructure/topology"
                params={{ projectId: project.id }}
                className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1"
                title="Buka Peta Spasial"
              >
                <Map className="h-3.5 w-3.5" />
                <span className="hidden xl:inline">Peta</span>
              </Link>

              <Button asChild size="sm" className="h-7.5 px-2.5 text-xs gap-1 font-medium">
                <Link to="/project/$projectId/overview" params={{ projectId: project.id }}>
                  Buka Proyek
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
                    <MoreVertical className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44 text-xs">
                  <DropdownMenuItem asChild>
                    <Link to="/project/$projectId/overview" params={{ projectId: project.id }}>
                      Buka Ringkasan
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/project/$projectId/infrastructure/topology" params={{ projectId: project.id }}>
                      Buka Peta GIS
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/project/$projectId/settings/general" params={{ projectId: project.id }}>
                      Pengaturan Proyek
                    </Link>
                  </DropdownMenuItem>
                  {onDeleteProject && (
                    <DropdownMenuItem
                      onClick={() => onDeleteProject(project.id)}
                      className="text-destructive focus:bg-destructive/10"
                    >
                      Hapus Proyek
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {projects.map((project) => (
        <Card
          key={project.id}
          glowingEffect
          className="group relative flex flex-col justify-between p-5 border-border/60 bg-card transition-all duration-200"
        >
          {/* Header Row: Title, Code & Actions */}
          <div className="space-y-2.5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20 group-hover:scale-105 transition-transform">
                  <FolderKanban className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">
                    {project.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded bg-muted text-muted-foreground border border-border/60">
                      {project.code}
                    </span>
                    <span
                      className={`text-[9px] font-mono font-semibold px-1.5 py-0.2 rounded border ${getStatusBadge(
                        project.status
                      )}`}
                    >
                      {project.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Menu Actions */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
                    <MoreVertical className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44 text-xs">
                  <DropdownMenuItem asChild>
                    <Link to="/project/$projectId/overview" params={{ projectId: project.id }}>
                      Buka Ringkasan
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/project/$projectId/infrastructure/topology" params={{ projectId: project.id }}>
                      Buka Peta GIS
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/project/$projectId/settings/general" params={{ projectId: project.id }}>
                      Pengaturan Proyek
                    </Link>
                  </DropdownMenuItem>
                  {onDeleteProject && (
                    <DropdownMenuItem
                      onClick={() => onDeleteProject(project.id)}
                      className="text-destructive focus:bg-destructive/10"
                    >
                      Hapus Proyek
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Description */}
            <p className="text-xs text-muted-foreground line-clamp-2 min-h-[32px] leading-relaxed">
              {project.description || "Proyek operasional infrastruktur jaringan fiber optik FTTH."}
            </p>

            {/* Asset Metrics Grid with border-groove-t */}
            <div className="grid grid-cols-2 gap-2 pt-3 border-groove-t">
              <div className="flex items-center gap-2 p-1.5 rounded-md bg-muted/30 border border-border/40">
                <Users className="h-3.5 w-3.5 text-primary shrink-0" />
                <div className="text-[11px] truncate">
                  <span className="font-mono font-bold text-foreground">
                    {project.totalSubscribers || 0}
                  </span>{" "}
                  <span className="text-muted-foreground text-[10px]">Pelanggan</span>
                </div>
              </div>

              <div className="flex items-center gap-2 p-1.5 rounded-md bg-muted/30 border border-border/40">
                <Network className="h-3.5 w-3.5 text-sky-500 shrink-0" />
                <div className="text-[11px] truncate">
                  <span className="font-mono font-bold text-foreground">
                    {project.cableLengthKm || 0}
                  </span>{" "}
                  <span className="text-muted-foreground text-[10px]">Km Kabel</span>
                </div>
              </div>

              <div className="flex items-center gap-2 p-1.5 rounded-md bg-muted/30 border border-border/40">
                <Layers className="h-3.5 w-3.5 text-amber-500 shrink-0" />
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

              <div className="flex items-center gap-2 p-1.5 rounded-md bg-muted/30 border border-border/40">
                <Server className="h-3.5 w-3.5 text-primary shrink-0" />
                <div className="text-[11px] truncate">
                  <span className="font-mono font-bold text-foreground">
                    {project.oltCount || 1}
                  </span>{" "}
                  <span className="text-muted-foreground text-[10px]">OLT Active</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Card Footer Actions with border-groove-t */}
          <div className="flex items-center justify-between gap-2 pt-3 mt-3 border-groove-t">
            <Link
              to="/project/$projectId/infrastructure/topology"
              params={{ projectId: project.id }}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <Map className="h-3.5 w-3.5" />
              <span>Peta Spasial</span>
            </Link>

            <Button asChild size="sm" className="h-7.5 px-3 text-xs gap-1.5 font-medium">
              <Link to="/project/$projectId/overview" params={{ projectId: project.id }}>
                Buka Proyek
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
