import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "@/lib/navigation-compat";
import { useSession } from "@/lib/auth-compat";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useTasksQuery, type Task, type TaskComment } from "@/hooks/useTasksQuery";
import { httpClient } from "@/lib/httpClient";
import { getBackendBaseUrl } from "@/lib/api-config";
import { TaskEmojiPicker } from "@/components/tasks/TaskEmojiPicker";
import { TaskCommentsSection } from "@/components/tasks/TaskCommentsSection";
import { TaskPropertiesPanel } from "@/components/tasks/TaskPropertiesPanel";
import { TaskSubIssuesSection } from "@/components/tasks/TaskSubIssuesSection";
import { TaskDetailTopBar } from "@/components/tasks/TaskDetailTopBar";

export default function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
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
      document.title = `Tasks › ${task.title} | FTTH GIS K2NET`;
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
    <div className="relative flex flex-col w-full h-full bg-background overflow-hidden">
      <TaskDetailTopBar task={task} saving={saving} isDirty={isDirty} />

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
  );
}
