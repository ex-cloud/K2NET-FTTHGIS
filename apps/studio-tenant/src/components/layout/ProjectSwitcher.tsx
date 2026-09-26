import * as React from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Box,
  Check,
  ChevronsUpDown,
  Plus,
  ArrowLeft,
  Search,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Input,
  cn,
} from "@k2net/ui";
import { useProjects, type Project } from "../../hooks/useProjects";
import { useMapStore } from "../../store/map-store";

interface ProjectSwitcherProps {
  activeProjectId?: string;
  onNewProject?: () => void;
}

export function ProjectSwitcher({ activeProjectId, onNewProject }: ProjectSwitcherProps) {
  const navigate = useNavigate();
  const { projects, isLoading } = useProjects();
  const setActiveProjectId = useMapStore((s) => s.setActiveProjectId);
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchFilter, setSearchFilter] = React.useState("");

  const activeProject = React.useMemo(() => {
    if (!projects || projects.length === 0) return null;
    if (activeProjectId) {
      return projects.find((p) => p.id === activeProjectId) || projects[0];
    }
    return projects[0];
  }, [projects, activeProjectId]);

  React.useEffect(() => {
    if (activeProject?.id) {
      setActiveProjectId(activeProject.id);
    }
  }, [activeProject?.id, setActiveProjectId]);

  const filteredProjects = React.useMemo(() => {
    if (!searchFilter.trim()) return projects;
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
        p.code.toLowerCase().includes(searchFilter.toLowerCase())
    );
  }, [projects, searchFilter]);

  const handleSelectProject = (project: Project) => {
    setActiveProjectId(project.id);
    setIsOpen(false);
    navigate({ to: `/project/${project.id}/overview` });
  };

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

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 h-7 sm:h-8 px-1.5 sm:px-2 rounded-md hover:bg-muted/60 text-foreground transition-all duration-150 cursor-pointer max-w-[150px] xs:max-w-[200px] sm:max-w-[260px] md:max-w-[320px] focus:outline-none focus-visible:ring-1 focus-visible:ring-primary select-none group shrink-0"
        >
          <Box className="size-3.5 text-muted-foreground group-hover:text-foreground shrink-0 transition-colors" />
          <span className="text-xs sm:text-sm font-semibold tracking-tight text-foreground truncate group-hover:opacity-90">
            {isLoading ? "Memuat..." : activeProject?.name || "Pilih Proyek FTTH"}
          </span>

          {activeProject?.status && (
            <span
              className={cn(
                "hidden sm:inline-flex text-[9px] font-mono font-semibold px-1.5 py-0.2 rounded border shrink-0 transition-colors",
                getStatusBadge(activeProject.status)
              )}
            >
              {activeProject.status}
            </span>
          )}
          <ChevronsUpDown className="size-3 text-muted-foreground/70 group-hover:text-foreground shrink-0 transition-colors ml-0.5" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-80 p-1.5" align="start" sideOffset={6}>
        <div className="px-2 py-1.5 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Daftar Proyek Operasional
            </span>
            <span className="text-[10px] font-mono text-muted-foreground">
              {projects.length} Proyek
            </span>
          </div>
          <div className="relative">
            <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Cari nama / kode proyek..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="h-7 pl-7 text-xs bg-muted/40"
            />
          </div>
        </div>

        <DropdownMenuSeparator />

        <div className="max-h-60 overflow-y-auto custom-scrollbar py-1 space-y-0.5">
          {filteredProjects.map((project) => {
            const isSelected = activeProject?.id === project.id;
            return (
              <DropdownMenuItem
                key={project.id}
                onClick={() => handleSelectProject(project)}
                className={`flex items-start gap-2.5 p-2 rounded-md cursor-pointer transition-colors ${
                  isSelected ? "bg-accent text-accent-foreground font-medium" : ""
                }`}
              >
                <div
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded ${
                    isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  <Box className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-semibold truncate text-foreground">
                      {project.name}
                    </span>
                    <span
                      className={`text-[8px] font-mono font-medium px-1 rounded border shrink-0 ${getStatusBadge(
                        project.status
                      )}`}
                    >
                      {project.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground font-mono">
                    <span>{project.code}</span>
                    {project.totalSubscribers !== undefined && (
                      <>
                        <span>•</span>
                        <span>{project.totalSubscribers} Pelanggan</span>
                      </>
                    )}
                  </div>
                </div>
                {isSelected && <Check className="h-3.5 w-3.5 text-primary shrink-0 mt-1" />}
              </DropdownMenuItem>
            );
          })}

          {filteredProjects.length === 0 && (
            <div className="py-4 text-center text-xs text-muted-foreground">
              Tidak ada proyek yang sesuai pencarian.
            </div>
          )}
        </div>

        <DropdownMenuSeparator />

        {onNewProject && (
          <DropdownMenuItem
            onClick={onNewProject}
            className="flex items-center gap-2 text-xs font-medium text-primary hover:bg-primary/10 cursor-pointer p-2 rounded-md"
          >
            <Plus className="h-4 w-4" />
            <span>+ Buat Proyek Baru</span>
          </DropdownMenuItem>
        )}

        <DropdownMenuItem asChild>
          <Link
            to="/projects"
            className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground cursor-pointer p-2 rounded-md"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Semua Proyek (Scope Organisasi)</span>
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
