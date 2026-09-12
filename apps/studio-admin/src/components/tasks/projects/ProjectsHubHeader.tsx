import React from "react";
import {
  FolderKanban,
  Plus,
  HelpCircle,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { Card } from "@k2net/ui";
import { cn } from "@/lib/utils";

interface ProjectsHubHeaderProps {
  onNewProject: () => void;
  activeCount: number;
  atRiskCount: number;
  completedCount: number;
  totalProjects: number;
}

export const ProjectsHubHeader: React.FC<ProjectsHubHeaderProps> = ({
  onNewProject,
  activeCount,
  atRiskCount,
  completedCount,
  totalProjects,
}) => {
  return (
    <>
      {/* ── Page Header ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 md:px-6 shrink-0">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2 tracking-tight">
            <FolderKanban className="h-5 w-5 text-primary" />
            Projects &amp; Plans
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Platform &amp; DevOps engineering initiatives and milestones
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onNewProject}
            className="px-3.5 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-medium text-xs flex items-center gap-1.5 active:scale-[0.98] transition-all shadow-sm cursor-pointer"
            title="New Project"
          >
            <Plus className="h-4 w-4" />
            <span>New Project</span>
          </button>
        </div>
      </div>

      {/* ── Inline KPI Stats Bar ─────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground/90 font-medium px-4 md:px-6 shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-foreground font-mono">{activeCount}</span>
          <span>Active Projects</span>
          <span title="Total ongoing master projects" className="cursor-help text-muted-foreground/60 hover:text-foreground">
            <HelpCircle className="h-3.5 w-3.5" />
          </span>
        </div>
        <span className="text-muted-foreground/30 px-1">/</span>
        <div className="flex items-center gap-1.5">
          <span className={cn("font-bold font-mono", atRiskCount > 0 ? "text-destructive" : "text-foreground")}>
            {atRiskCount}
          </span>
          <span>At Risk</span>
          <span title="Projects with high priority or approaching SLA" className="cursor-help text-muted-foreground/60 hover:text-foreground">
            <HelpCircle className="h-3.5 w-3.5" />
          </span>
        </div>
        <span className="text-muted-foreground/30 px-1">/</span>
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-foreground font-mono">{completedCount}</span>
          <span>Completed</span>
          <span title="Completed project initiatives" className="cursor-help text-muted-foreground/60 hover:text-foreground">
            <HelpCircle className="h-3.5 w-3.5" />
          </span>
        </div>
        <span className="text-muted-foreground/30 px-1">/</span>
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-foreground font-mono">{totalProjects}</span>
          <span>Total Plans</span>
        </div>
      </div>

      {/* ── KPI Cards Strip with glowingEffect ──────────────────────── */}
      <div className="px-4 md:px-6 shrink-0">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Active Projects Card */}
          <Card glowingEffect className="p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-foreground/75 dark:text-muted-foreground font-bold tracking-wider uppercase">
                Active Projects
              </span>
              <FolderKanban className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground font-mono">{activeCount}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{activeCount} in progress</p>
            </div>
            <div>
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Utilization</span>
                <span>{totalProjects ? Math.round((activeCount / totalProjects) * 100) : 0}%</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-700"
                  style={{ width: `${totalProjects ? Math.round((activeCount / totalProjects) * 100) : 0}%` }}
                />
              </div>
            </div>
          </Card>

          {/* At Risk Card */}
          <Card glowingEffect className="p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-foreground/75 dark:text-muted-foreground font-bold tracking-wider uppercase">
                At Risk
              </span>
              <div className="relative flex items-center">
                {atRiskCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive" />
                  </span>
                )}
                <AlertTriangle className={cn("h-4 w-4", atRiskCount > 0 ? "text-destructive" : "text-muted-foreground")} />
              </div>
            </div>
            <div>
              <p className={cn("text-2xl font-bold font-mono", atRiskCount > 0 ? "text-destructive" : "text-foreground")}>
                {atRiskCount}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {atRiskCount > 0 ? "High priority / SLA risk" : "All plans on schedule"}
              </p>
            </div>
            <div>
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Risk Ratio</span>
                <span>{totalProjects ? Math.round((atRiskCount / totalProjects) * 100) : 0}%</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-700",
                    atRiskCount > 0 ? "bg-destructive" : "bg-muted-foreground/30"
                  )}
                  style={{ width: `${totalProjects ? Math.round((atRiskCount / totalProjects) * 100) : 0}%` }}
                />
              </div>
            </div>
          </Card>

          {/* Completed Plans Card */}
          <Card glowingEffect className="p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-foreground/75 dark:text-muted-foreground font-bold tracking-wider uppercase">
                Completed Plans
              </span>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground font-mono">{completedCount}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{completedCount} initiatives delivered</p>
            </div>
            <div>
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Completion</span>
                <span>{totalProjects ? Math.round((completedCount / totalProjects) * 100) : 0}%</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-green-500 transition-all duration-700"
                  style={{ width: `${totalProjects ? Math.round((completedCount / totalProjects) * 100) : 0}%` }}
                />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
};
