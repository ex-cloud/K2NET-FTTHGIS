"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Box,
  TrendingUp,
  User,
  Plus,
  CheckCircle2,
  Circle,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { Card } from "@k2net/ui";
import { toast } from "sonner";
import { useTasksQuery, type Task, type TaskComment } from "@/hooks/useTasksQuery";
import { httpClient } from "@/lib/httpClient";
import { getBackendBaseUrl } from "@/lib/api-config";
import { STATUS_CONFIG, PRIORITY_CONFIG } from "../../components/configs";
import { NewTaskDialog } from "../../components/NewTaskDialog";
import { cn } from "@/lib/utils";

type ProjectTab = "overview" | "activity" | "issues";

export default function ProjectHubDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useSession();

  const [activeTab, setActiveTab] = useState<ProjectTab>("overview");
  const { task: projectTask, tasks: allTasks, loading, refresh } = useTasksQuery(id);

  // Editable fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("IN_PROGRESS");
  const [priority, setPriority] = useState("NORMAL");
  const [assigneeId, setAssigneeId] = useState<string | null>(null);
  const [dueDate, setDueDate] = useState<string | undefined>();
  const [healthStatus, setHealthStatus] = useState<"On track" | "At risk" | "Off track">("On track");

  // Activity update draft
  const [updateMode, setUpdateMode] = useState<"update" | "comment">("update");
  const [updateText, setUpdateText] = useState("");
  const [postingUpdate, setPostingUpdate] = useState(false);
  const [comments, setComments] = useState<TaskComment[]>([]);

  // Issue creation modal for this project
  const [newIssueOpen, setNewIssueOpen] = useState(false);

  // Sync project data
  useEffect(() => {
    if (projectTask) {
      setTitle(projectTask.title);
      setDescription(projectTask.description ?? "");
      setStatus(projectTask.status);
      setPriority(projectTask.priority);
      setAssigneeId(projectTask.assigneeId ?? null);
      setDueDate(projectTask.dueDate);
      setComments(projectTask.comments ?? []);
    }
  }, [projectTask]);

  // All issues associated with this project
  const projectIssues = useMemo(() => {
    if (!projectTask) return [];
    return allTasks.filter(
      (t) =>
        t.id !== projectTask.id &&
        ((projectTask.obsidianRef && t.obsidianRef === projectTask.obsidianRef) ||
          t.parentTaskId === projectTask.id ||
          t.title.toLowerCase().includes(projectTask.title.toLowerCase()))
    );
  }, [allTasks, projectTask]);

  const resolvedIssuesCount = projectIssues.filter(
    (t) => t.status === "RESOLVED" || t.status === "CLOSED"
  ).length;
  const totalIssuesCount = projectIssues.length;
  const progressPercent =
    totalIssuesCount > 0
      ? Math.round((resolvedIssuesCount / totalIssuesCount) * 100)
      : status === "RESOLVED" || status === "CLOSED"
      ? 100
      : 0;

  // Save changes to backend
  const handleSaveField = async (fields: Partial<Task>) => {
    try {
      const baseUrl = getBackendBaseUrl();
      const res = await httpClient(`${baseUrl}/tasks/${id}`, {
        method: "PUT",
        token: session?.accessToken ?? "",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      if (res.ok) {
        toast.success("Project updated");
        refresh();
      }
    } catch {
      toast.error("Failed to update project");
    }
  };

  // Post update / comment in Activity tab
  const handlePostUpdate = async () => {
    if (!updateText.trim()) return;
    setPostingUpdate(true);
    try {
      const baseUrl = getBackendBaseUrl();
      const res = await httpClient(`${baseUrl}/tasks/${id}/comments`, {
        method: "POST",
        token: session?.accessToken ?? "",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: updateText.trim() }),
      });
      if (res.ok) {
        const comment: TaskComment = await res.json();
        setComments((prev) => [...prev, comment]);
        setUpdateText("");
        toast.success("Project update posted");
      }
    } catch {
      toast.error("Failed to post update");
    } finally {
      setPostingUpdate(false);
    }
  };

  // Quick toggle issue status in Issues tab
  const handleToggleIssueStatus = async (issue: Task) => {
    const nextStatus =
      issue.status === "RESOLVED" || issue.status === "CLOSED" ? "TODO" : "RESOLVED";
    try {
      const baseUrl = getBackendBaseUrl();
      await httpClient(`${baseUrl}/tasks/${issue.id}`, {
        method: "PUT",
        token: session?.accessToken ?? "",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      refresh();
    } catch {
      // ignore
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!projectTask) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <p>Project tidak ditemukan.</p>
        <button
          onClick={() => router.push("/tasks/projects")}
          className="mt-3 text-xs text-primary underline"
        >
          Kembali ke All Projects
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      {/* ── 1. Top Header with Linear Breadcrumbs ──────────────────────── */}
      <div className="px-6 py-3.5 border-b border-border/50 shrink-0 flex items-center justify-between bg-background/95 backdrop-blur-sm">
        <div className="flex items-center gap-2 text-xs">
          <Link
            href="/tasks/projects"
            className="text-muted-foreground hover:text-foreground font-medium transition-colors"
          >
            Projects
          </Link>
          <span className="text-muted-foreground/60">›</span>
          <div className="flex items-center gap-1.5 font-semibold text-foreground">
            <Box className="w-3.5 h-3.5 text-purple-400" />
            <span>{title || projectTask.title}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {projectTask.obsidianRef && (
            <a
              href={`obsidian://open?vault=K2NET_Engineering_Vault&file=${projectTask.obsidianRef}`}
              className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground bg-muted/40 hover:bg-muted/70 px-2 py-1 rounded-md transition-colors font-mono"
            >
              <ExternalLink className="w-3 h-3" />
              <span>{projectTask.obsidianRef}</span>
            </a>
          )}
          <button
            onClick={() => setNewIssueOpen(true)}
            className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shadow-sm transition-colors"
          >
            <Plus className="w-3 h-3" />
            <span>Add issue</span>
          </button>
        </div>
      </div>

      {/* ── 2. Linear Tabs Bar ─────────────────────────────────────────── */}
      <div className="px-6 border-b border-border/40 shrink-0 bg-background/50 flex items-center gap-1">
        <button
          onClick={() => setActiveTab("overview")}
          className={cn(
            "px-3 py-2 text-xs font-semibold border-b-2 transition-colors",
            activeTab === "overview"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab("activity")}
          className={cn(
            "px-3 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5",
            activeTab === "activity"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <span>Activity</span>
          {comments.length > 0 && (
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-muted text-muted-foreground">
              {comments.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("issues")}
          className={cn(
            "px-3 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5",
            activeTab === "issues"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <span>Issues</span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-primary/10 text-primary font-bold">
            {resolvedIssuesCount}/{totalIssuesCount}
          </span>
        </button>
      </div>

      {/* ── 3. Tab Contents ────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-auto custom-scrollbar-thin p-6 md:p-8">
        <div className="max-w-4xl mx-auto">
          {/* ──────────────── TAB 1: OVERVIEW (Image 2) ────────────────── */}
          {activeTab === "overview" && (
            <div className="space-y-6 animate-in fade-in-50 duration-150">
              {/* Project Header */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
                    <Box className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      onBlur={() => handleSaveField({ title })}
                      className="text-xl md:text-2xl font-bold text-foreground bg-transparent border-none outline-none focus:ring-0 w-full"
                      placeholder="Project title..."
                    />
                  </div>
                </div>

                <p className="text-xs text-muted-foreground/80 pl-13">
                  {description ? description.slice(0, 120) + "..." : "Add a short summary..."}
                </p>
              </div>

              {/* Properties Bar */}
              <div className="p-4 rounded-xl border border-border/50 bg-card/40 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                {/* Status */}
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Status</span>
                  <div className="mt-1 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                    <span className="font-semibold text-foreground capitalize">{status}</span>
                  </div>
                </div>

                {/* Priority */}
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Priority</span>
                  <div className="mt-1 font-semibold text-foreground">{priority}</div>
                </div>

                {/* Lead */}
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Lead</span>
                  <div className="mt-1 flex items-center gap-1.5 text-foreground truncate">
                    <div className="w-4 h-4 rounded-full bg-primary/20 text-primary text-[9px] font-bold flex items-center justify-center">
                      {assigneeId ? assigneeId.substring(0, 1).toUpperCase() : "?"}
                    </div>
                    <span className="truncate">{assigneeId ? assigneeId.split("@")[0] : "Unassigned"}</span>
                  </div>
                </div>

                {/* Target Date */}
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Target date</span>
                  <div className="mt-1 font-mono text-foreground font-semibold">
                    {dueDate ? new Date(dueDate).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "No target date"}
                  </div>
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
                  onBlur={() => handleSaveField({ description })}
                  placeholder="Add rich description and scope of this project initiative..."
                  className="w-full min-h-[140px] text-xs text-foreground bg-card/30 border border-border/50 hover:border-border focus:border-primary/50 rounded-xl p-4 outline-none resize-none transition-colors"
                />
              </div>
            </div>
          )}

          {/* ──────────────── TAB 2: ACTIVITY (Image 3) ────────────────── */}
          {activeTab === "activity" && (
            <div className="space-y-6 animate-in fade-in-50 duration-150">
              {/* Update Composer */}
              <Card className="border border-border/60 bg-card/60 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-border/40 pb-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setUpdateMode("update")}
                      className={cn(
                        "text-xs px-2.5 py-1 rounded-md font-semibold transition-colors",
                        updateMode === "update"
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      Update
                    </button>
                    <button
                      onClick={() => setUpdateMode("comment")}
                      className={cn(
                        "text-xs px-2.5 py-1 rounded-md font-semibold transition-colors",
                        updateMode === "comment"
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      Comment
                    </button>
                  </div>

                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full">
                    <TrendingUp className="w-3 h-3" />
                    On track
                  </span>
                </div>

                <textarea
                  value={updateText}
                  onChange={(e) => setUpdateText(e.target.value)}
                  placeholder="Write a project update..."
                  className="w-full min-h-[80px] text-xs bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground/40 focus:ring-0 resize-none"
                />

                <div className="flex items-center justify-between pt-2 border-t border-border/40">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>
                      Progress: <strong className="text-foreground font-mono">{progressPercent}%</strong>
                    </span>
                  </div>

                  <button
                    onClick={handlePostUpdate}
                    disabled={!updateText.trim() || postingUpdate}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                  >
                    {postingUpdate && <Loader2 className="w-3 h-3 animate-spin" />}
                    <span>Post update</span>
                  </button>
                </div>
              </Card>

              {/* Activity Timeline Feed */}
              <div className="space-y-4 pt-2">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Timeline History</h4>

                {comments.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-8">Belum ada linimasa pembaruan.</p>
                ) : (
                  comments.map((c, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-card/30 border border-border/40 text-xs">
                      <div className="w-6 h-6 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center shrink-0 mt-0.5 text-[10px]">
                        {c.authorId ? c.authorId.substring(0, 1).toUpperCase() : "A"}
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-foreground">{c.authorId ? c.authorId.split("@")[0] : "Team Member"}</span>
                          <span className="text-[10px] font-mono text-muted-foreground">
                            {new Date(c.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <p className="text-foreground/90 leading-relaxed">{c.content}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ──────────────── TAB 3: ISSUES (Image 4) ──────────────────── */}
          {activeTab === "issues" && (
            <div className="space-y-4 animate-in fade-in-50 duration-150">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-foreground">Project Issues</span>
                  <span className="text-xs font-mono text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full">
                    {resolvedIssuesCount}/{totalIssuesCount} resolved
                  </span>
                </div>

                <button
                  onClick={() => setNewIssueOpen(true)}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New issue</span>
                </button>
              </div>

              {projectIssues.length === 0 ? (
                <Card className="p-8 text-center text-muted-foreground border-dashed border-border/60 bg-card/20 rounded-xl space-y-2">
                  <p className="text-xs">Belum ada issue atau tugas yang terhubung ke projek ini.</p>
                  <button
                    onClick={() => setNewIssueOpen(true)}
                    className="text-xs text-primary font-semibold hover:underline"
                  >
                    + Tambahkan Issue Pertama
                  </button>
                </Card>
              ) : (
                <div className="space-y-2">
                  {projectIssues.map((issue) => {
                    const isDone = issue.status === "RESOLVED" || issue.status === "CLOSED";
                    const StatusIcon = STATUS_CONFIG[issue.status]?.icon ?? Circle;

                    return (
                      <div
                        key={issue.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-card/40 border border-border/40 hover:border-border transition-colors group"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <button
                            onClick={() => handleToggleIssueStatus(issue)}
                            className={cn(
                              "shrink-0 p-0.5 rounded hover:bg-muted transition-colors",
                              isDone ? "text-green-500" : "text-muted-foreground"
                            )}
                            title="Click to toggle status"
                          >
                            <StatusIcon className="w-4 h-4" />
                          </button>

                          <Link
                            href={`/tasks/${issue.id}`}
                            className={cn(
                              "text-xs font-medium hover:text-primary transition-colors truncate max-w-[400px]",
                              isDone ? "line-through text-muted-foreground/60" : "text-foreground"
                            )}
                          >
                            {issue.title}
                          </Link>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 text-xs">
                          {issue.priority && issue.priority !== "NORMAL" && (
                            <span
                              className={cn(
                                "text-[9px] font-mono px-1.5 py-0.2 rounded font-semibold",
                                PRIORITY_CONFIG[issue.priority]?.className ?? ""
                              )}
                            >
                              {issue.priority}
                            </span>
                          )}

                          <div className="w-5 h-5 rounded-full bg-muted/60 text-muted-foreground flex items-center justify-center text-[10px] font-mono">
                            {issue.assigneeId ? issue.assigneeId.substring(0, 1).toUpperCase() : <User className="w-3 h-3" />}
                          </div>

                          <span className="text-[11px] font-mono text-muted-foreground">
                            {new Date(issue.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* New Issue in this project */}
      <NewTaskDialog
        open={newIssueOpen}
        onOpenChange={setNewIssueOpen}
        onSuccess={refresh}
        defaultValues={{
          project: projectTask.obsidianRef || projectTask.title,
          scope: projectTask.scope,
        }}
      />
    </div>
  );
}
