"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Box,
  Plus,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useTasksQuery, type Task, type TaskComment, type TaskScope } from "@/hooks/useTasksQuery";
import { useTeamUsers } from "@/hooks/useTeamUsers";
import { httpClient } from "@/lib/httpClient";
import { getBackendBaseUrl } from "@/lib/api-config";
import { NewTaskDialog } from "../../components/NewTaskDialog";
import { ProjectOverviewTab } from "./components/ProjectOverviewTab";
import { ProjectActivityTab } from "./components/ProjectActivityTab";
import { ProjectIssuesTab } from "./components/ProjectIssuesTab";
import { cn } from "@/lib/utils";

type ProjectTab = "overview" | "activity" | "issues";

export default function ProjectHubDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const { users: teamUsers } = useTeamUsers();

  const [activeTab, setActiveTab] = useState<ProjectTab>("overview");
  const { task: projectTask, loading, refresh } = useTasksQuery(id);
  const [subtasks, setSubtasks] = useState<Task[]>([]);
  const [subtasksLoading, setSubtasksLoading] = useState(true);

  const fetchSubtasks = React.useCallback(async () => {
    if (!session?.accessToken || !id) return;
    try {
      setSubtasksLoading(true);
      const baseUrl = getBackendBaseUrl();
      const res = await httpClient(`${baseUrl}/tasks/${id}/subtasks`, {
        token: session.accessToken,
      });
      if (res.ok) {
        const data = await res.json();
        setSubtasks(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error("Failed to fetch project subtasks:", e);
    } finally {
      setSubtasksLoading(false);
    }
  }, [id, session?.accessToken]);

  useEffect(() => {
    fetchSubtasks();
  }, [fetchSubtasks]);

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
  const projectIssues = subtasks;

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
    await handleUpdateIssue(issue.id, { status: nextStatus });
  };

  const handleUpdateIssue = async (issueId: string, fields: Partial<Task>) => {
    try {
      const baseUrl = getBackendBaseUrl();
      const res = await httpClient(`${baseUrl}/tasks/${issueId}`, {
        method: "PUT",
        token: session?.accessToken ?? "",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      if (res.ok) {
        toast.success("Issue updated");
        fetchSubtasks();
        refresh();
      } else {
        toast.error("Failed to update issue");
      }
    } catch {
      toast.error("Network error while updating issue");
    }
  };

  const handleDeleteIssue = async (issueId: string) => {
    try {
      const baseUrl = getBackendBaseUrl();
      const res = await httpClient(`${baseUrl}/tasks/${issueId}`, {
        method: "DELETE",
        token: session?.accessToken ?? "",
      });
      if (res.ok) {
        toast.success("Issue deleted successfully");
        fetchSubtasks();
        refresh();
      } else {
        toast.error("Failed to delete issue");
      }
    } catch {
      toast.error("Network error while deleting issue");
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
          className="mt-3 text-xs text-primary underline cursor-pointer"
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
            className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shadow-sm transition-colors cursor-pointer"
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
            "px-3 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer",
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
            "px-3 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer",
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
            "px-3 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer",
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
          {activeTab === "overview" && (
            <ProjectOverviewTab
              title={title}
              setTitle={setTitle}
              description={description}
              setDescription={setDescription}
              status={status}
              setStatus={setStatus}
              priority={priority}
              setPriority={setPriority}
              assigneeId={assigneeId}
              setAssigneeId={setAssigneeId}
              dueDate={dueDate}
              setDueDate={setDueDate}
              healthStatus={healthStatus}
              projectTask={projectTask}
              teamUsers={teamUsers}
              onSaveField={handleSaveField}
            />
          )}

          {activeTab === "activity" && (
            <ProjectActivityTab
              updateMode={updateMode}
              setUpdateMode={setUpdateMode}
              updateText={updateText}
              setUpdateText={setUpdateText}
              postingUpdate={postingUpdate}
              progressPercent={progressPercent}
              comments={comments}
              onPostUpdate={handlePostUpdate}
            />
          )}

          {activeTab === "issues" && (
            <ProjectIssuesTab
              projectIssues={projectIssues}
              resolvedIssuesCount={resolvedIssuesCount}
              totalIssuesCount={totalIssuesCount}
              onNewIssueClick={() => setNewIssueOpen(true)}
              onToggleIssueStatus={handleToggleIssueStatus}
              onUpdateIssue={handleUpdateIssue}
              onDeleteIssue={handleDeleteIssue}
            />
          )}
        </div>
      </div>

      {/* New Issue in this project */}
      <NewTaskDialog
        open={newIssueOpen}
        onOpenChange={setNewIssueOpen}
        onSuccess={() => {
          fetchSubtasks();
          refresh();
        }}
        defaultValues={{
          parentTaskId: id,
          project: projectTask?.obsidianRef || projectTask?.title,
          scope: projectTask?.scope,
        }}
      />
    </div>
  );
}
