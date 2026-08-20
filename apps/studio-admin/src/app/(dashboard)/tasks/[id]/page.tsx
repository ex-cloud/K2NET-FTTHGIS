"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  ChevronLeft,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { useTasksQuery, type Task, type TaskComment } from "@/hooks/useTasksQuery";
import { httpClient } from "@/lib/httpClient";
import { getBackendBaseUrl } from "@/lib/api-config";
import { ScopeBadge } from "@/components/tasks/ScopeBadge";
import { TaskEmojiPicker } from "@/components/tasks/TaskEmojiPicker";
import { TaskCommentsSection } from "@/components/tasks/TaskCommentsSection";
import { TaskPropertiesPanel } from "@/components/tasks/TaskPropertiesPanel";
import { TaskSubIssuesSection } from "@/components/tasks/TaskSubIssuesSection";

export default function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const { task, loading, error, refresh } = useTasksQuery(id);

  // Editable state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [assigneeId, setAssigneeId] = useState<string | null>(null);
  const [dueDate, setDueDate] = useState<string | undefined>();
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [titleEmoji, setTitleEmoji] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Comments
  const [comments, setComments] = useState<TaskComment[]>([]);

  // Auto-save debounce ref
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);

  // Sync from task
  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description ?? "");
      setStatus(task.status);
      setPriority(task.priority);
      setAssigneeId(task.assigneeId ?? null);
      setDueDate(task.dueDate);
      setComments(task.comments ?? []);
      setIsDirty(false);
    }
  }, [task]);

  const markDirty = () => setIsDirty(true);

  const saveChanges = useCallback(async (fields: Partial<Task>) => {
    const baseUrl = getBackendBaseUrl();
    const res = await httpClient(`${baseUrl}/tasks/${id}`, {
      method: "PUT",
      token: session?.accessToken ?? "",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields),
    });
    if (!res.ok) {
      toast.error(`Failed to save: HTTP ${res.status}`);
      throw new Error(`HTTP ${res.status}`);
    }
    refresh();
  }, [id, session?.accessToken, refresh]);

  // Auto-save on title/description change
  useEffect(() => {
    if (!isDirty || !task) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(async () => {
      setSaving(true);
      try {
        await saveChanges({
          title,
          description,
          status,
          priority,
          assigneeId: assigneeId ?? undefined,
          dueDate,
        });
        toast.success("Saved", { duration: 1500 });
        setIsDirty(false);
      } catch {
        // toast already shown inside saveChanges
      } finally {
        setSaving(false);
      }
    }, 1500);
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, description]);

  const handlePropertyChange = async (field: Partial<Task>) => {
    const merged: Partial<Task> = {
      title,
      description,
      status,
      priority,
      assigneeId: assigneeId ?? undefined,
      dueDate,
      ...field,
    };
    if (field.status) setStatus(field.status as string);
    if (field.priority) setPriority(field.priority as string);
    if ("assigneeId" in field) setAssigneeId(field.assigneeId ?? null);
    if (field.dueDate !== undefined) setDueDate(field.dueDate);
    try {
      await saveChanges(merged);
      toast.success("Updated", { duration: 1500 });
    } catch { /* handled */ }
  };

  if (error) toast.error("Failed to load task");
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  if (!task) return null;

  return (
    <>
      <div className="relative flex flex-col w-full h-full bg-background overflow-hidden">
        {/* ── Top Bar with Linear Breadcrumbs ─────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-border/60 bg-background/95 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => router.push(task.type === "PROJECT" ? "/tasks/projects" : "/tasks")}
              className="text-muted-foreground hover:text-foreground font-medium transition-colors flex items-center gap-1"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>{task.type === "PROJECT" ? "Projects" : "Tasks & Tickets"}</span>
            </button>
            <span className="text-muted-foreground/50">›</span>
            {task.obsidianRef ? (
              <span className="text-foreground/80 font-medium font-mono">
                {task.obsidianRef}
              </span>
            ) : (
              <span className="text-foreground/80 font-medium">
                {task.scope === "PLATFORM_INTERNAL" ? "Internal K2NET" : "B2B Mitra"}
              </span>
            )}
            <span className="text-muted-foreground/50">›</span>
            <span className="font-semibold text-foreground truncate max-w-[220px]">
              {task.title}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <ScopeBadge scope={task.scope} />
            {saving && (
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground/60">
                <Loader2 className="h-3 w-3 animate-spin" /> Saving...
              </span>
            )}
            {isDirty && !saving && (
              <span className="text-amber-500 text-[10px]">● Unsaved</span>
            )}
            {task.obsidianRef && (
              <a
                href={`obsidian://open?vault=K2NET_Engineering_Vault&file=${task.obsidianRef}`}
                className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground bg-muted/30 hover:bg-muted/60 px-2 py-1 rounded-md transition-colors"
                title="Open in Obsidian"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Obsidian
              </a>
            )}
          </div>
        </div>

        {/* ── Main Content ─────────────────────────────────────────────── */}
        <div className="flex-1 min-h-0 overflow-auto">
          <div className="max-w-[1100px] mx-auto px-6 py-8 flex flex-col lg:flex-row gap-8">

            {/* ── LEFT COLUMN: Canvas ─────────────────────────────────── */}
            <div className="flex-1 min-w-0 space-y-6">

              {/* Title + Emoji */}
              <div className="relative">
                <div className="flex items-start gap-3">
                  <div className="relative shrink-0 mt-1">
                    <button
                      onClick={() => setShowEmojiPicker((v) => !v)}
                      className="text-2xl hover:bg-muted/50 rounded-lg p-1 transition-colors"
                      title="Add emoji"
                    >
                      {titleEmoji || "📋"}
                    </button>
                    {showEmojiPicker && (
                      <TaskEmojiPicker
                        onSelect={(e) => setTitleEmoji(e)}
                        onClose={() => setShowEmojiPicker(false)}
                      />
                    )}
                  </div>

                  <textarea
                    value={title}
                    onChange={(e) => { setTitle(e.target.value); markDirty(); }}
                    rows={1}
                    style={{ height: "auto" }}
                    onInput={(e) => {
                      const el = e.currentTarget;
                      el.style.height = "auto";
                      el.style.height = el.scrollHeight + "px";
                    }}
                    className="flex-1 text-2xl font-bold text-foreground bg-transparent border-none outline-none resize-none leading-tight placeholder:text-muted-foreground/40 focus:ring-0"
                    placeholder="Issue title..."
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <textarea
                  value={description}
                  onChange={(e) => { setDescription(e.target.value); markDirty(); }}
                  placeholder="Add description... (supports markdown)"
                  className="w-full min-h-[120px] text-sm text-foreground/85 bg-transparent border border-border/30 hover:border-border focus:border-primary/50 outline-none resize-none rounded-xl p-4 placeholder:text-muted-foreground/40 focus:ring-0 transition-colors"
                />
              </div>

              {/* Sub-issues Section (Linear-style Inline Accordion) */}
              <TaskSubIssuesSection parentTask={task} />

              {/* Activity & Comments (Modular Component) */}
              <TaskCommentsSection
                taskId={task.id}
                comments={comments}
                onCommentAdded={(c) => setComments((prev) => [...prev, c])}
              />

            </div>

            {/* ── RIGHT COLUMN: Properties (Modular Component) ─────────── */}
            <div className="w-full lg:w-64 xl:w-72 shrink-0">
              <TaskPropertiesPanel
                task={task}
                status={status}
                priority={priority}
                assigneeId={assigneeId}
                dueDate={dueDate}
                onPropertyChange={handlePropertyChange}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
