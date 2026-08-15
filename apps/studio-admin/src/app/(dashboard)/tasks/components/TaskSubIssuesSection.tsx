"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Loader2,
  Trash2,
  User,
  Check,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@k2net/ui";
import { toast } from "sonner";
import { type Task } from "@/hooks/useTasksQuery";
import { httpClient } from "@/lib/httpClient";
import { getBackendBaseUrl } from "@/lib/api-config";
import { STATUS_CONFIG, PRIORITY_CONFIG } from "./configs";
import { cn } from "@/lib/utils";

interface TaskSubIssuesSectionProps {
  parentTask: Task;
  onCountChange?: (count: number) => void;
}

export function TaskSubIssuesSection({
  parentTask,
  onCountChange,
}: TaskSubIssuesSectionProps) {
  const { data: session } = useSession();
  const [subIssues, setSubIssues] = useState<Task[]>([]);
  const [_loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [creating, setCreating] = useState(false);

  // New sub-issue draft state
  const [newTitle, setNewTitle] = useState("");
  const [newStatus, setNewStatus] = useState("TODO");
  const [newPriority, setNewPriority] = useState("NORMAL");
  const [newAssigneeId, setNewAssigneeId] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch sub-issues for this parent task
  const fetchSubIssues = useCallback(async () => {
    if (!parentTask.id) return;
    setLoading(true);
    try {
      const baseUrl = getBackendBaseUrl();
      const res = await httpClient(`${baseUrl}/tasks/${parentTask.id}/subtasks`, {
        token: session?.accessToken ?? "",
      });
      if (res.ok) {
        const data: Task[] = await res.json();
        setSubIssues(data);
        if (onCountChange) onCountChange(data.length);
      }
    } catch (_err) {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [parentTask.id, session?.accessToken, onCountChange]);

  useEffect(() => {
    fetchSubIssues();
  }, [fetchSubIssues]);

  // Focus input when adding begins
  useEffect(() => {
    if (isAdding) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isAdding]);

  // Count resolved
  const resolvedCount = subIssues.filter(
    (t) => t.status === "RESOLVED" || t.status === "CLOSED"
  ).length;
  const totalCount = subIssues.length;

  // Handle create sub-issue
  const handleCreateSubIssue = async () => {
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      const baseUrl = getBackendBaseUrl();
      const res = await httpClient(`${baseUrl}/tasks`, {
        method: "POST",
        token: session?.accessToken ?? "",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          scope: parentTask.scope,
          type: parentTask.type,
          priority: newPriority,
          status: newStatus,
          assigneeId: newAssigneeId ?? undefined,
          parentTaskId: parentTask.id,
          obsidianRef: parentTask.obsidianRef,
        }),
      });

      if (!res.ok) {
        toast.error(`Gagal membuat sub-issue: HTTP ${res.status}`);
        return;
      }

      const created: Task = await res.json();
      setSubIssues((prev) => [...prev, created]);
      setNewTitle("");
      setNewStatus("TODO");
      setNewPriority("NORMAL");
      setNewAssigneeId(null);
      setIsAdding(false);
      toast.success("Sub-issue ditambahkan");
    } catch {
      toast.error("Gagal terhubung ke server");
    } finally {
      setCreating(false);
    }
  };

  // Handle quick update status of a sub-issue
  const handleToggleStatus = async (sub: Task) => {
    const nextStatus =
      sub.status === "RESOLVED" || sub.status === "CLOSED" ? "TODO" : "RESOLVED";
    try {
      const baseUrl = getBackendBaseUrl();
      const res = await httpClient(`${baseUrl}/tasks/${sub.id}`, {
        method: "PUT",
        token: session?.accessToken ?? "",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        setSubIssues((prev) =>
          prev.map((item) =>
            item.id === sub.id ? { ...item, status: nextStatus } : item
          )
        );
      }
    } catch {
      // ignore
    }
  };

  // Handle delete sub-issue
  const handleDeleteSubIssue = async (subId: string) => {
    try {
      const baseUrl = getBackendBaseUrl();
      const res = await httpClient(`${baseUrl}/tasks/${subId}`, {
        method: "DELETE",
        token: session?.accessToken ?? "",
      });
      if (res.ok) {
        setSubIssues((prev) => prev.filter((item) => item.id !== subId));
        toast.success("Sub-issue dihapus");
      } else {
        toast.error("Hanya Super Admin yang dapat menghapus task");
      }
    } catch {
      toast.error("Gagal menghapus sub-issue");
    }
  };

  // ─── 1. Initial State when 0 Sub-issues and NOT adding (Matches Image 1) ─────
  if (totalCount === 0 && !isAdding) {
    return (
      <div className="pt-2">
        <button
          type="button"
          onClick={() => {
            setIsExpanded(true);
            setIsAdding(true);
          }}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors py-1 group"
        >
          <Plus className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
          <span>Add sub-issues</span>
        </button>
      </div>
    );
  }

  // ─── 2. State when Sub-issues exist or Inline Form is active (Matches Image 4) 
  return (
    <div className="space-y-1.5 pt-2">
      {/* Header bar */}
      <div className="flex items-center justify-between py-1 group/hdr">
        <button
          type="button"
          onClick={() => setIsExpanded((v) => !v)}
          className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          {isExpanded ? (
            <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" />
          )}
          <span>Sub-issues</span>

          {/* Linear Progress Counter e.g. 0/1 */}
          <span className="inline-flex items-center gap-1 text-[11px] font-mono text-muted-foreground/80 bg-muted/40 px-1.5 py-0.5 rounded ml-1">
            <span
              className={cn(
                "w-1.5 h-1.5 rounded-full",
                resolvedCount === totalCount && totalCount > 0
                  ? "bg-green-500"
                  : "bg-muted-foreground/50"
              )}
            />
            {resolvedCount}/{totalCount}
          </span>
        </button>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              setIsExpanded(true);
              setIsAdding(true);
            }}
            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            title="Add sub-issue"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Accordion Content */}
      {isExpanded && (
        <div className="space-y-1 pl-1">
          {/* Sub-issues List */}
          {subIssues.map((sub) => {
            const isDone = sub.status === "RESOLVED" || sub.status === "CLOSED";
            const StatusIcon =
              STATUS_CONFIG[sub.status]?.icon ?? STATUS_CONFIG.TODO.icon;

            return (
              <div
                key={sub.id}
                className="group flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-muted/30 transition-colors border border-transparent hover:border-border/40"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  {/* Clickable Status Icon */}
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(sub)}
                    className={cn(
                      "shrink-0 p-0.5 rounded hover:bg-muted transition-colors",
                      isDone ? "text-green-500" : "text-muted-foreground"
                    )}
                    title={`Status: ${sub.status} (Click to toggle)`}
                  >
                    <StatusIcon className="h-3.5 w-3.5" />
                  </button>

                  {/* Title Link */}
                  <Link
                    href={`/tasks/${sub.id}`}
                    className={cn(
                      "text-xs truncate transition-colors hover:text-primary",
                      isDone
                        ? "line-through text-muted-foreground/60"
                        : "text-foreground"
                    )}
                  >
                    {sub.title}
                  </Link>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Priority Tag */}
                  {sub.priority && sub.priority !== "NORMAL" && (
                    <span
                      className={cn(
                        "text-[9px] font-mono px-1.5 py-0.2 rounded font-semibold",
                        PRIORITY_CONFIG[sub.priority]?.className ?? ""
                      )}
                    >
                      {sub.priority}
                    </span>
                  )}

                  {/* Assignee */}
                  <div className="w-4 h-4 rounded-full bg-muted/60 text-muted-foreground flex items-center justify-center text-[9px] font-mono">
                    {sub.assigneeId ? (
                      sub.assigneeId.substring(0, 1).toUpperCase()
                    ) : (
                      <User className="h-2.5 w-2.5" />
                    )}
                  </div>

                  {/* Delete button (hover only) */}
                  <button
                    type="button"
                    onClick={() => handleDeleteSubIssue(sub.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground/50 hover:text-destructive transition-all rounded"
                    title="Delete sub-issue"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            );
          })}

          {/* Inline Sub-issue Creation Form (Accordion Dropdown) */}
          {isAdding && (
            <div className="mt-2 p-2.5 rounded-xl border border-border/80 bg-card/60 space-y-2.5 shadow-sm animate-in fade-in-50 slide-in-from-top-1 duration-150">
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleCreateSubIssue();
                    } else if (e.key === "Escape") {
                      setIsAdding(false);
                    }
                  }}
                  placeholder="Issue title..."
                  className="flex-1 text-xs bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground/40 focus:ring-0"
                />
              </div>

              {/* Form Controls & Action Buttons */}
              <div className="flex items-center justify-between pt-1 border-t border-border/40">
                <div className="flex items-center gap-1.5">
                  {/* Status Picker Pill */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {STATUS_CONFIG[newStatus]?.label ?? newStatus}
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-36">
                      {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
                        const Icon = cfg.icon;
                        return (
                          <DropdownMenuItem
                            key={key}
                            onClick={() => setNewStatus(key)}
                            className="flex items-center justify-between text-xs cursor-pointer"
                          >
                            <div className="flex items-center gap-1.5">
                              <Icon className="h-3.5 w-3.5" />
                              <span>{cfg.label}</span>
                            </div>
                            {newStatus === key && <Check className="h-3 w-3 text-primary" />}
                          </DropdownMenuItem>
                        );
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Priority Picker Pill */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {newPriority}
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-32">
                      {Object.keys(PRIORITY_CONFIG).map((p) => (
                        <DropdownMenuItem
                          key={p}
                          onClick={() => setNewPriority(p)}
                          className="flex items-center justify-between text-xs cursor-pointer"
                        >
                          <span>{p}</span>
                          {newPriority === p && <Check className="h-3 w-3 text-primary" />}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Actions: Create & Cancel */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAdding(false);
                      setNewTitle("");
                    }}
                    className="px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/40 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateSubIssue}
                    disabled={!newTitle.trim() || creating}
                    className="flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-sm"
                  >
                    {creating && <Loader2 className="h-3 w-3 animate-spin" />}
                    <span>Create</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Quick trigger under list if not currently adding */}
          {!isAdding && (
            <button
              type="button"
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors py-1 pl-1"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add sub-issue</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
