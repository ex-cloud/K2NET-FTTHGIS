import React from "react";
import { useRouter } from "@/lib/navigation-compat";
import {
  Box,
  TrendingUp,
  AlertTriangle,
  AlertCircle,
  User,
  CheckCircle2,
} from "lucide-react";
import { ProjectContextMenu } from "@/components/tasks/ProjectContextMenu";
import { type DisplayPropertiesState } from "@/components/tasks/LinearDisplayOptionsPopover";
import { type ProjectPlanItem } from "./projects-hub-helpers";
import { cn } from "@/lib/utils";

interface ProjectTableRowProps {
  proj: ProjectPlanItem;
  displayProperties: DisplayPropertiesState;
  onUpdateStatus: (projectId: string, status: string) => void;
  onUpdatePriority: (projectId: string, priority: string) => void;
  onUpdateHealth: (projectId: string, health: string) => void;
  onUpdateLead: (projectId: string, lead: string) => void;
  onUpdateDueDate: (projectId: string, dueDate?: string) => void;
  onDeleteProject: (projectId: string) => void;
}

export const ProjectTableRow: React.FC<ProjectTableRowProps> = ({
  proj,
  displayProperties,
  onUpdateStatus,
  onUpdatePriority,
  onUpdateHealth,
  onUpdateLead,
  onUpdateDueDate,
  onDeleteProject,
}) => {
  const router = useRouter();
  const isComplete = proj.percentage === 100;

  return (
    <ProjectContextMenu
      key={proj.id}
      project={proj}
      onUpdateStatus={(st) => onUpdateStatus(proj.id, st)}
      onUpdatePriority={(pr) => onUpdatePriority(proj.id, pr)}
      onUpdateHealth={(hl) => onUpdateHealth(proj.id, hl)}
      onUpdateLead={(ld) => onUpdateLead(proj.id, ld)}
      onUpdateDueDate={(dd) => onUpdateDueDate(proj.id, dd)}
      onDelete={() => onDeleteProject(proj.id)}
    >
      <div
        onClick={() => router.push(`/tasks/projects/${proj.id}`)}
        className="flex border-b border-border/40 hover:bg-muted/30 transition-colors group cursor-pointer items-stretch divide-x divide-border/45 text-xs"
      >
        {/* Name + Obsidian Ref */}
        <div className="px-4 py-3 flex items-center gap-2.5 min-w-[200px] flex-1">
          <div className="w-6 h-6 rounded-md bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0 text-amber-500 group-hover:scale-105 transition-transform">
            <Box className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
              {proj.name}
            </span>
            {proj.obsidianRef && (
              <span className="text-[10px] text-muted-foreground font-mono bg-muted/50 px-1.5 py-0.5 rounded shrink-0">
                {proj.obsidianRef}
              </span>
            )}
          </div>
        </div>

        {/* Health */}
        {displayProperties.health !== false && (
          <div className="px-4 py-3 flex items-center w-28 shrink-0">
            <div className="inline-flex items-center gap-1.5">
              {proj.health === "On track" ? (
                <>
                  <TrendingUp className="w-3.5 h-3.5 text-green-500" />
                  <span className="text-green-500 font-medium">On track</span>
                </>
              ) : proj.health === "At risk" ? (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-amber-500 font-medium">At risk</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-destructive" />
                  <span className="text-destructive font-medium">Off track</span>
                </>
              )}
            </div>
          </div>
        )}

        {/* Priority */}
        {displayProperties.priority !== false && (
          <div className="px-4 py-3 flex items-center w-24 shrink-0">
            {proj.priority === "URGENT" ? (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-destructive/10 text-destructive border border-destructive/30">
                URGENT
              </span>
            ) : proj.priority === "HIGH" ? (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/30">
                HIGH
              </span>
            ) : proj.priority === "LOW" ? (
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/10 text-blue-500 border border-blue-500/30">
                LOW
              </span>
            ) : (
              <span className="text-muted-foreground font-mono text-[11px]">---</span>
            )}
          </div>
        )}

        {/* Lead */}
        {displayProperties.lead !== false && (
          <div className="px-4 py-3 flex items-center gap-2 w-32 shrink-0 min-w-0">
            <div className="w-5 h-5 rounded-full bg-secondary text-foreground flex items-center justify-center font-bold text-[10px] shrink-0 border border-border">
              {proj.lead !== "Unassigned" ? (
                proj.lead.slice(0, 2).toUpperCase()
              ) : (
                <User className="w-3 h-3 text-muted-foreground" />
              )}
            </div>
            <span className="text-muted-foreground truncate">{proj.lead}</span>
          </div>
        )}

        {/* Target Date */}
        {displayProperties.targetDate !== false && (
          <div className="px-4 py-3 flex items-center text-muted-foreground font-mono text-[11px] w-28 shrink-0">
            {proj.dueDate
              ? new Date(proj.dueDate).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              : "---"}
          </div>
        )}

        {/* Created Date */}
        {displayProperties.created !== false && (
          <div className="px-4 py-3 flex items-center text-muted-foreground font-mono text-[11px] whitespace-nowrap w-28 shrink-0">
            {proj.createdAt
              ? new Date(proj.createdAt).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              : "---"}
          </div>
        )}

        {/* Issues Count */}
        {displayProperties.issues !== false && (
          <div className="px-4 py-3 flex items-center justify-center font-mono font-semibold text-muted-foreground w-20 shrink-0">
            {proj.issuesCount}
          </div>
        )}

        {/* Status / Percentage */}
        {displayProperties.status !== false && (
          <div className="px-4 py-3 flex items-center justify-end w-24 shrink-0">
            <div className="inline-flex items-center gap-1.5">
              <CheckCircle2
                className={cn(
                  "w-3.5 h-3.5",
                  isComplete ? "text-green-500" : "text-primary"
                )}
              />
              <span
                className={cn(
                  "font-mono font-bold text-xs",
                  isComplete ? "text-green-500" : "text-foreground"
                )}
              >
                {proj.percentage}%
              </span>
            </div>
          </div>
        )}
      </div>
    </ProjectContextMenu>
  );
};
