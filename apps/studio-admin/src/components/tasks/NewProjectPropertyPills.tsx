import React from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@k2net/ui";
import { User } from "lucide-react";
import { cn } from "@/lib/utils";
import { TaskLabelPicker } from "./TaskLabelPicker";
import { LinearDatePicker } from "./LinearDatePicker";
import {
  PROJECT_STATUSES,
  PROJECT_PRIORITIES,
  type WorkspaceSubtype,
} from "./new-project-constants";

interface UserItem {
  id: string;
  name?: string;
  email: string;
  role?: string;
}

interface NewProjectPropertyPillsProps {
  subtype?: WorkspaceSubtype;
  status: string;
  setStatus: (status: string) => void;
  priority: "URGENT" | "HIGH" | "NORMAL" | "LOW";
  setPriority: (priority: "URGENT" | "HIGH" | "NORMAL" | "LOW") => void;
  leadName: string;
  setLeadName: (name: string) => void;
  teamUsers: UserItem[];
  currentUserName?: string;
  currentUserEmail?: string;
  targetDate?: string;
  onTargetDateChange?: (date: string | undefined) => void;
  selectedLabels: string[];
  setSelectedLabels: (labels: string[]) => void;
}

export const NewProjectPropertyPills: React.FC<NewProjectPropertyPillsProps> = ({
  subtype,
  status,
  setStatus,
  priority,
  setPriority,
  leadName,
  setLeadName,
  teamUsers,
  currentUserName,
  currentUserEmail,
  targetDate = "",
  onTargetDateChange,
  selectedLabels,
  setSelectedLabels,
}) => {
  const activeStatusObj = PROJECT_STATUSES.find((s) => s.id === status) || PROJECT_STATUSES[0];
  const StatusIcon = activeStatusObj.icon;
  const activePriorityObj = PROJECT_PRIORITIES.find((p) => p.id === priority) || PROJECT_PRIORITIES[0];
  const PriorityIcon = activePriorityObj.icon;

  // Living initiatives (Plan, Idea, Doc) are living specs not bound by time. Only PROJECT has a delivery deadline.
  const isTargetDateAllowed = subtype === "PROJECT";

  return (
    <div className="flex items-center gap-2 flex-wrap pt-2 pb-2 border-y border-border/30">
      {/* 1. Status Pill */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-2.5 h-7 rounded-md text-xs font-medium bg-muted/40 hover:bg-muted/80 text-foreground border border-border/50 transition-colors cursor-pointer"
          >
            <StatusIcon className={cn("w-3.5 h-3.5", activeStatusObj.color)} />
            <span>{activeStatusObj.label}</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-40 z-[150]">
          {PROJECT_STATUSES.map((st) => {
            const StIcon = st.icon;
            return (
              <DropdownMenuItem
                key={st.id}
                onClick={() => setStatus(st.id)}
                className="flex items-center gap-2 text-xs py-2 cursor-pointer"
              >
                <StIcon className={cn("w-3.5 h-3.5", st.color)} />
                <span>{st.label}</span>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* 2. Priority Pill */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-2.5 h-7 rounded-md text-xs font-medium bg-muted/40 hover:bg-muted/80 text-foreground border border-border/50 transition-colors cursor-pointer"
          >
            <PriorityIcon className={cn("w-3.5 h-3.5", activePriorityObj.color)} />
            <span>{activePriorityObj.label}</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-40 z-[150]">
          {PROJECT_PRIORITIES.map((pr) => {
            const PrIcon = pr.icon;
            return (
              <DropdownMenuItem
                key={pr.id}
                onClick={() => setPriority(pr.id as "URGENT" | "HIGH" | "NORMAL" | "LOW")}
                className="flex items-center gap-2 text-xs py-2 cursor-pointer"
              >
                <PrIcon className={cn("w-3.5 h-3.5", pr.color)} />
                <span>{pr.label}</span>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* 3. Lead Pill */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-2.5 h-7 rounded-md text-xs font-medium bg-muted/40 hover:bg-muted/80 text-foreground border border-border/50 transition-colors cursor-pointer"
          >
            <User className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Lead: {leadName ? leadName.split("@")[0] : "Unassigned"}</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56 max-h-60 overflow-y-auto z-[150]">
          {teamUsers.length === 0 ? (
            <DropdownMenuItem
              onClick={() => setLeadName(currentUserName || currentUserEmail || "andiansyah")}
              className="flex items-center gap-2 text-xs py-2 cursor-pointer"
            >
              <User className="w-3.5 h-3.5 text-muted-foreground" />
              <span>{currentUserName || currentUserEmail || "Current User"}</span>
            </DropdownMenuItem>
          ) : (
            teamUsers.map((u) => (
              <DropdownMenuItem
                key={u.id}
                onClick={() => setLeadName(u.name || u.email)}
                className={cn(
                  "flex items-center gap-2 text-xs py-2 cursor-pointer",
                  leadName === (u.name || u.email) ? "bg-primary/10 text-primary font-semibold" : "text-foreground"
                )}
              >
                <div className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-[10px] shrink-0">
                  {(u.name || u.email).substring(0, 1).toUpperCase()}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="truncate">{u.name || u.email}</span>
                  <span className="text-[10px] text-muted-foreground">{u.role}</span>
                </div>
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* 4. Target Date Picker (Only if subtype is PROJECT) */}
      {isTargetDateAllowed && onTargetDateChange && (
        <LinearDatePicker
          type="target"
          value={targetDate}
          onChange={onTargetDateChange}
        />
      )}

      {/* 5. Labels Pill */}
      <TaskLabelPicker
        selectedLabelIds={selectedLabels}
        onChange={setSelectedLabels}
      />
    </div>
  );
};
