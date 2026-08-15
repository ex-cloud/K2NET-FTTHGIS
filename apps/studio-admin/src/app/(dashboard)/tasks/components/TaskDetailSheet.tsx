"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  X,
  ExternalLink,
  Loader2,
  ArrowUpRight,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetClose,
} from "@k2net/ui";
import { type Task, type TaskComment } from "@/hooks/useTasksQuery";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ScopeBadge } from "./ScopeBadge";
import { TaskEmojiPicker } from "./TaskEmojiPicker";
import { TaskCommentsSection } from "./TaskCommentsSection";
import { TaskPropertiesPanel } from "./TaskPropertiesPanel";

// ─── Component Props ──────────────────────────────────────────────────────────

interface TaskDetailSheetProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (taskId: string, fields: Partial<Task>) => Promise<void>;
  onDelete?: (taskId: string) => Promise<void>;
  assigneesList?: string[];
}

export function TaskDetailSheet({
  task,
  open,
  onOpenChange,
  onSave,
  onDelete,
  assigneesList = [],
}: TaskDetailSheetProps) {
  // Local edit states
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
  const [comments, setComments] = useState<TaskComment[]>([]);

  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);

  // Sync state when task changes
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

  // Auto-save on title/description change
  useEffect(() => {
    if (!isDirty || !task) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(async () => {
      setSaving(true);
      try {
        await onSave(task.id, {
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
        // toast handled inside onSave
      } finally {
        setSaving(false);
      }
    }, 1500);
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, description]);

  const handlePropertyChange = async (field: Partial<Task>) => {
    if (!task) return;
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
      await onSave(task.id, merged);
      toast.success("Updated", { duration: 1500 });
    } catch { /* handled */ }
  };

  if (!task) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="w-full sm:max-w-2xl lg:max-w-3xl p-0 bg-background/95 backdrop-blur-xl border-l border-border/80 flex flex-col h-full overflow-hidden shadow-2xl"
      >
        {/* ── Header ─────────────────────────────────────────────────── */}
        <SheetHeader className="px-6 py-3.5 border-b border-border/60 bg-background/60 flex flex-row items-center justify-between space-y-0 shrink-0">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-mono bg-muted px-2 py-0.5 rounded text-[11px] font-semibold">{task.type}</span>
            {task.obsidianRef && (
              <span className="font-mono bg-primary/10 text-primary px-2 py-0.5 rounded text-[11px] font-semibold">{task.obsidianRef}</span>
            )}
            <ScopeBadge scope={task.scope} />
            {saving && (
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground/60">
                <Loader2 className="h-3 w-3 animate-spin" /> Saving...
              </span>
            )}
            {isDirty && !saving && (
              <span className="text-amber-500 text-[10px]">● Unsaved</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {task.obsidianRef && (
              <a
                href={`obsidian://open?vault=K2NET_Engineering_Vault&file=${task.obsidianRef}`}
                className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground bg-muted/40 hover:bg-muted px-2 py-1 rounded-md transition-colors"
                title="Buka di Obsidian Vault"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Obsidian
              </a>
            )}
            <a
              href={`/tasks/${task.id}`}
              className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground bg-muted/40 hover:bg-muted px-2 py-1 rounded-md transition-colors"
              title="Buka Halaman Penuh"
            >
              <ArrowUpRight className="h-3.5 w-3.5" />
              Full Page
            </a>
            <SheetClose asChild>
              <button
                type="button"
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                title="Tutup Sheet"
              >
                <X className="h-4 w-4" />
              </button>
            </SheetClose>
          </div>
        </SheetHeader>

        {/* ── Content Body ───────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="p-6 flex flex-col md:flex-row gap-6">

            {/* ── Left Column: Title, Description, Comments ────────── */}
            <div className="flex-1 min-w-0 space-y-6">
              {/* Title inline editable */}
              <div className="relative">
                <div className="flex items-start gap-2">
                  <div className="relative shrink-0 mt-0.5">
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker((v) => !v)}
                      className="text-xl hover:bg-muted/50 rounded-lg p-0.5 transition-colors"
                      title="Emoji"
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
                    className="flex-1 text-lg font-bold text-foreground bg-transparent border-none outline-none resize-none leading-snug placeholder:text-muted-foreground/40 focus:ring-0"
                    placeholder="Issue title..."
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <textarea
                  value={description}
                  onChange={(e) => { setDescription(e.target.value); markDirty(); }}
                  placeholder="Add description... (supports markdown)"
                  rows={4}
                  className="w-full text-xs text-foreground/85 bg-transparent border border-border/30 hover:border-border focus:border-primary/50 outline-none resize-none rounded-xl p-3.5 placeholder:text-muted-foreground/40 focus:ring-0 transition-colors leading-relaxed"
                />
              </div>

              {/* Comments & Activity (Modular Component) */}
              <TaskCommentsSection
                taskId={task.id}
                comments={comments}
                onCommentAdded={(c) => setComments((prev) => [...prev, c])}
              />
            </div>

            {/* ── Right Column: Properties (Modular Component) ──────── */}
            <div className="w-full md:w-64 shrink-0">
              <TaskPropertiesPanel
                task={task}
                status={status}
                priority={priority}
                assigneeId={assigneeId}
                dueDate={dueDate}
                assigneesList={assigneesList}
                onPropertyChange={handlePropertyChange}
              />
            </div>

          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
