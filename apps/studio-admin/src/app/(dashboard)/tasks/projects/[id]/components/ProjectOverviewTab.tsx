"use client";

import React from "react";
import { Box, TrendingUp, CheckCircle2, Flame } from "lucide-react";
import {
  Card,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@k2net/ui";
import { type Task } from "@/hooks/useTasksQuery";
import { type TeamUser } from "@/hooks/useTeamUsers";
import { LinearDatePicker } from "../../../components/LinearDatePicker";
import { cn } from "@/lib/utils";

interface ProjectOverviewTabProps {
  title: string;
  setTitle: (title: string) => void;
  description: string;
  setDescription: (desc: string) => void;
  status: string;
  setStatus: (status: string) => void;
  priority: string;
  setPriority: (priority: string) => void;
  assigneeId: string | null;
  setAssigneeId: (assigneeId: string | null) => void;
  dueDate?: string;
  setDueDate?: (dueDate: string | undefined) => void;
  healthStatus: "On track" | "At risk" | "Off track";
  projectTask: Task;
  teamUsers: TeamUser[];
  onSaveField: (fields: Partial<Task>) => Promise<void>;
}

export function ProjectOverviewTab({
  title,
  setTitle,
  description,
  setDescription,
  status,
  setStatus,
  priority,
  setPriority,
  assigneeId,
  setAssigneeId,
  dueDate,
  setDueDate,
  healthStatus,
  projectTask,
  teamUsers,
  onSaveField,
}: ProjectOverviewTabProps) {
  return (
    <div className="space-y-6 animate-in fade-in-50 duration-150">
      {/* Project Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
            <Box className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => onSaveField({ title })}
              className="text-2xl font-bold text-foreground bg-transparent border-0 outline-none w-full tracking-tight hover:bg-muted/20 px-2 py-1 rounded-lg transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Interactive Properties Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-card/40 border border-border/60 rounded-xl p-3 text-xs">
        {/* Status */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="cursor-pointer hover:bg-muted/40 p-2 rounded-lg transition-colors border border-transparent hover:border-border/40">
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Status</span>
              <div className="mt-1 font-semibold flex items-center gap-1.5 text-foreground">
                <div className={cn("w-2 h-2 rounded-full", status === "RESOLVED" || status === "CLOSED" ? "bg-emerald-500" : "bg-amber-500")} />
                <span>{status}</span>
              </div>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-40 z-[100]">
            {["BACKLOG", "TODO", "IN_PROGRESS", "RESOLVED", "CLOSED"].map((st) => (
              <DropdownMenuItem
                key={st}
                onClick={() => {
                  setStatus(st);
                  onSaveField({ status: st });
                }}
                className={cn("text-xs cursor-pointer", status === st ? "bg-primary/10 text-primary font-bold" : "")}
              >
                {st}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Priority */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="cursor-pointer hover:bg-muted/40 p-2 rounded-lg transition-colors border border-transparent hover:border-border/40">
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Priority</span>
              <div className="mt-1 font-semibold flex items-center gap-1.5 text-foreground">
                <Flame className={cn("w-3.5 h-3.5", priority === "URGENT" ? "text-destructive" : priority === "HIGH" ? "text-amber-500" : "text-muted-foreground")} />
                <span>{priority}</span>
              </div>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-40 z-[100]">
            {["URGENT", "HIGH", "NORMAL", "LOW"].map((pr) => (
              <DropdownMenuItem
                key={pr}
                onClick={() => {
                  setPriority(pr);
                  onSaveField({ priority: pr });
                }}
                className={cn("text-xs cursor-pointer", priority === pr ? "bg-primary/10 text-primary font-bold" : "")}
              >
                {pr}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Lead */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="cursor-pointer hover:bg-muted/40 p-2 rounded-lg transition-colors border border-transparent hover:border-border/40">
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Lead</span>
              <div className="mt-1 flex items-center gap-1.5 text-foreground truncate">
                <div className="w-4 h-4 rounded-full bg-primary/20 text-primary text-[9px] font-bold flex items-center justify-center shrink-0">
                  {assigneeId ? assigneeId.substring(0, 1).toUpperCase() : "?"}
                </div>
                <span className="truncate">{assigneeId ? assigneeId.split("@")[0] : "Unassigned"}</span>
              </div>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 max-h-56 overflow-y-auto z-[100]">
            <DropdownMenuItem
              onClick={() => {
                setAssigneeId(null);
                onSaveField({ assigneeId: undefined });
              }}
              className="text-xs text-muted-foreground cursor-pointer"
            >
              Unassigned
            </DropdownMenuItem>
            {teamUsers.map((u) => (
              <DropdownMenuItem
                key={u.id}
                onClick={() => {
                  setAssigneeId(u.email);
                  onSaveField({ assigneeId: u.email });
                }}
                className={cn("text-xs cursor-pointer", assigneeId === u.email ? "bg-primary/10 text-primary font-bold" : "")}
              >
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-[9px]">
                    {(u.name || u.email).substring(0, 1).toUpperCase()}
                  </div>
                  <span>{u.name || u.email}</span>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Target Date */}
        <div className="p-2 rounded-lg hover:bg-muted/40 transition-colors border border-transparent hover:border-border/40 flex flex-col justify-center">
          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-0.5">Target date</span>
          <LinearDatePicker
            type="target"
            value={dueDate || undefined}
            onChange={(val) => {
              setDueDate?.(val);
              onSaveField({ dueDate: val ? new Date(val).toISOString() : undefined });
            }}
            buttonClassName="border-0 bg-transparent p-0 hover:bg-transparent text-xs font-mono font-semibold"
          />
        </div>
      </div>

      {/* Latest Update Card */}
      <Card className="border border-border/60 bg-card/60 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] uppercase font-bold text-muted-foreground tracking-wider">Latest update</span>
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full">
            <TrendingUp className="w-3 h-3" />
            {healthStatus}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="w-4 h-4 rounded-full bg-primary/20 text-primary text-[9px] font-bold flex items-center justify-center">
            {assigneeId ? assigneeId.substring(0, 1).toUpperCase() : "A"}
          </div>
          <span className="font-medium text-foreground">{assigneeId ? assigneeId.split("@")[0] : "Engineering Lead"}</span>
          <span>·</span>
          <span className="font-mono text-[11px]">
            {projectTask.updatedAt ? new Date(projectTask.updatedAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "Today"}
          </span>
        </div>

        <p className="text-xs text-foreground/85 leading-relaxed bg-background/40 p-3 rounded-lg border border-border/40">
          {description || "Projek sedang berjalan sesuai timeline SLA. Semua inisiatif internal platform aktif dikerjakan."}
        </p>
      </Card>

      {/* Description Markdown Editor */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Description</h3>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onBlur={() => onSaveField({ description })}
          placeholder="Add rich description and scope of this project initiative..."
          className="w-full min-h-[140px] text-xs text-foreground bg-card/30 border border-border/50 hover:border-border focus:border-primary/50 rounded-xl p-4 outline-none resize-none transition-colors"
        />
      </div>
    </div>
  );
}
