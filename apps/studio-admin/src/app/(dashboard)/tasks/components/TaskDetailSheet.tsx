"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  X,
  ExternalLink,
  CheckCircle2,
  Circle,
  Timer,
  Clock,
  User,
  CalendarDays,
  ChevronDown,
  MessageSquare,
  Send,
  Loader2,
  Flag,
  Layers,
  Tag,
  AlertCircle,
  ArrowUpRight,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetClose,
  Badge,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  Calendar,
  Textarea,
} from "@k2net/ui";
import { type Task, type TaskComment } from "@/hooks/useTasksQuery";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { httpClient } from "@/lib/httpClient";
import { getBackendBaseUrl } from "@/lib/api-config";
import { toast } from "sonner";
import { STATUS_CONFIG, PRIORITY_CONFIG } from "./configs";
import { ScopeBadge } from "./ScopeBadge";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Property Row ─────────────────────────────────────────────────────────────

function PropRow({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ElementType;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-border/30 last:border-0">
      <div className="flex items-center gap-2 w-28 shrink-0">
        <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <span className="text-xs text-muted-foreground font-medium">{label}</span>
      </div>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface TaskDetailSheetProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, fields: Partial<Task>) => Promise<void>;
  onDelete?: (id: string) => void;
  assigneesList: string[];
}

export function TaskDetailSheet({
  task,
  open,
  onOpenChange,
  onSave,
  onDelete,
  assigneesList,
}: TaskDetailSheetProps) {
  const { data: session } = useSession();

  // Local editable state — synced from `task` when sheet opens
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [assigneeId, setAssigneeId] = useState<string | null>(null);
  const [dueDate, setDueDate] = useState<string | undefined>();
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  // Comments
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  // Sync from task when opened
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
      setNewComment("");
    }
  }, [task]);

  const markDirty = () => setIsDirty(true);

  // ── Save ──────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!task || !isDirty) return;
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
      setIsDirty(false);
      toast.success("Task updated");
    } catch {
      // error toast handled in parent
    } finally {
      setSaving(false);
    }
  };

  // ── Add comment ───────────────────────────────────────────────────────────

  const handleAddComment = useCallback(async () => {
    if (!task || !newComment.trim() || !session?.accessToken) return;
    setSubmittingComment(true);
    try {
      const baseUrl = getBackendBaseUrl();
      const res = await httpClient(`${baseUrl}/tasks/${task.id}/comments`, {
        method: "POST",
        token: session.accessToken,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment.trim() }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const created: TaskComment = await res.json();
      setComments((prev) => [...prev, created]);
      setNewComment("");
      setTimeout(() => commentsEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (err: any) {
      toast.error("Failed to add comment: " + err.message);
    } finally {
      setSubmittingComment(false);
    }
  }, [task, newComment, session?.accessToken]);

  if (!task) return null;

  const StatusIcon = STATUS_CONFIG[status]?.icon ?? Circle;
  const statusClass = STATUS_CONFIG[status]?.className ?? "text-muted-foreground bg-muted";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[680px] p-0 flex flex-col bg-background border-l border-border overflow-hidden"
      >
        {/* ── Header bar ─────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border/60 bg-card/30 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[11px] font-mono text-muted-foreground bg-muted/50 px-2 py-0.5 rounded shrink-0">
              {task.type}
            </span>
            {task.obsidianRef && (
              <span className="text-[11px] font-mono text-primary bg-primary/10 px-2 py-0.5 rounded shrink-0">
                {task.obsidianRef}
              </span>
            )}
            <ScopeBadge scope={task.scope} />
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Open full page */}
            <a
              href={`/tasks/${task.id}`}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              title="Open full page"
            >
              <ArrowUpRight className="h-4 w-4" />
            </a>
            <SheetClose className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
              <X className="h-4 w-4" />
            </SheetClose>
          </div>
        </div>

        {/* ── Scrollable Body ────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="flex flex-col lg:flex-row h-full">

            {/* ── LEFT: Main content ──────────────────────────────────── */}
            <div className="flex-1 flex flex-col min-w-0 px-6 py-5 space-y-5">
              {/* Title — inline editable */}
              <textarea
                value={title}
                onChange={(e) => { setTitle(e.target.value); markDirty(); }}
                className="w-full text-xl font-bold text-foreground bg-transparent border-none outline-none resize-none leading-snug placeholder:text-muted-foreground/50 focus:ring-0"
                placeholder="Task title..."
                rows={title.length > 80 ? 3 : 2}
              />

              {/* Description — inline editable */}
              <div className="space-y-1.5">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Description
                </p>
                <Textarea
                  value={description}
                  onChange={(e) => { setDescription(e.target.value); markDirty(); }}
                  placeholder="Add a description..."
                  className="min-h-[120px] text-sm bg-muted/10 border-border/50 focus:border-primary/60 resize-none"
                />
              </div>

              {/* ── Activity & Comments ──────────────────────────────── */}
              <div className="space-y-3">
                <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5" />
                  Activity
                </h3>

                {comments.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">No comments yet.</p>
                ) : (
                  <div className="space-y-3">
                    {comments.map((c) => (
                      <div key={c.id} className="flex gap-3">
                        <div className="w-7 h-7 rounded-full bg-muted border border-border/40 flex items-center justify-center shrink-0">
                          <User className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2 mb-1">
                            <span className="text-[11px] font-semibold text-foreground truncate max-w-[160px]">
                              {c.authorId.split("-")[0]}
                            </span>
                            <span className="text-[10px] text-muted-foreground shrink-0">
                              {formatDateTime(c.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm text-foreground/85 bg-muted/20 border border-border/30 rounded-lg px-3 py-2 leading-relaxed">
                            {c.content}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={commentsEndRef} />
                  </div>
                )}

                {/* Comment input */}
                <div className="flex gap-2 items-end pt-1">
                  <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                    <User className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="flex-1 relative">
                    <Textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                          e.preventDefault();
                          handleAddComment();
                        }
                      }}
                      placeholder="Leave a comment... (Ctrl+Enter to submit)"
                      className="min-h-[72px] text-sm bg-muted/10 border-border/50 focus:border-primary/60 resize-none pr-10"
                    />
                    <button
                      onClick={handleAddComment}
                      disabled={!newComment.trim() || submittingComment}
                      className="absolute bottom-2 right-2 p-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-colors"
                    >
                      {submittingComment
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        : <Send className="h-3.5 w-3.5" />
                      }
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* ── RIGHT: Properties sidebar ────────────────────────── */}
            <div className="w-full lg:w-56 shrink-0 border-t lg:border-t-0 lg:border-l border-border/40 px-4 py-5 space-y-1 bg-card/20">
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-3">
                Properties
              </p>

              {/* Status */}
              <PropRow icon={CheckCircle2} label="Status">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className={cn(
                      "inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-md cursor-pointer hover:opacity-80 transition-opacity",
                      statusClass
                    )}>
                      <StatusIcon className="h-3 w-3 shrink-0" />
                      <span>{STATUS_CONFIG[status]?.label ?? status}</span>
                      <ChevronDown className="h-3 w-3 opacity-60" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="bg-popover border border-border shadow-xl rounded-xl p-1 min-w-36 z-[100]">
                    {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                      <DropdownMenuItem
                        key={key}
                        onClick={() => { setStatus(key); markDirty(); }}
                        className={cn(
                          "flex items-center gap-2 text-xs py-1.5 px-2.5 rounded-lg cursor-pointer",
                          status === key ? "bg-primary/10 text-primary font-semibold" : "hover:bg-muted/50 text-foreground"
                        )}
                      >
                        <cfg.icon className="h-3 w-3" />
                        {cfg.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </PropRow>

              {/* Priority */}
              <PropRow icon={Flag} label="Priority">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className={cn(
                      "inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-md cursor-pointer hover:opacity-80 transition-opacity",
                      PRIORITY_CONFIG[priority]?.className ?? "text-muted-foreground bg-muted"
                    )}>
                      <AlertCircle className="h-3 w-3 shrink-0" />
                      <span>{PRIORITY_CONFIG[priority]?.label ?? priority}</span>
                      <ChevronDown className="h-3 w-3 opacity-60" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="bg-popover border border-border shadow-xl rounded-xl p-1 min-w-32 z-[100]">
                    {Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => (
                      <DropdownMenuItem
                        key={key}
                        onClick={() => { setPriority(key); markDirty(); }}
                        className={cn(
                          "flex items-center gap-2 text-xs py-1.5 px-2.5 rounded-lg cursor-pointer",
                          priority === key ? "bg-primary/10 text-primary font-semibold" : "hover:bg-muted/50 text-foreground"
                        )}
                      >
                        <span className={cn("text-xs font-bold", cfg.className.split(" ")[0])}>{cfg.label}</span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </PropRow>

              {/* Assignee */}
              <PropRow icon={User} label="Assignee">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="inline-flex items-center gap-1.5 text-xs text-foreground hover:text-primary transition-colors cursor-pointer group">
                      <span className="font-medium truncate max-w-[120px]">
                        {assigneeId ? assigneeId.substring(0, 8) + "..." : "Unassigned"}
                      </span>
                      <ChevronDown className="h-3 w-3 opacity-40 group-hover:opacity-100" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="bg-popover border border-border shadow-xl rounded-xl p-1 min-w-44 z-[100]">
                    <DropdownMenuItem
                      onClick={() => { setAssigneeId(null); markDirty(); }}
                      className={cn(
                        "text-xs py-1.5 px-2.5 rounded-lg cursor-pointer",
                        !assigneeId ? "bg-primary/10 text-primary font-semibold" : "hover:bg-muted/50 text-muted-foreground"
                      )}
                    >
                      Unassigned
                    </DropdownMenuItem>
                    {assigneesList.map((uid) => (
                      <DropdownMenuItem
                        key={uid}
                        onClick={() => { setAssigneeId(uid); markDirty(); }}
                        className={cn(
                          "text-xs py-1.5 px-2.5 rounded-lg cursor-pointer font-mono",
                          assigneeId === uid ? "bg-primary/10 text-primary font-semibold" : "hover:bg-muted/50 text-foreground"
                        )}
                      >
                        {uid.substring(0, 12)}...
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </PropRow>

              {/* Due Date */}
              <PropRow icon={CalendarDays} label="Due Date">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="inline-flex items-center gap-1.5 text-xs text-foreground hover:text-primary transition-colors cursor-pointer group">
                      <span className={cn("font-medium", !dueDate && "text-muted-foreground")}>
                        {dueDate ? formatDate(dueDate) : "No due date"}
                      </span>
                      <ChevronDown className="h-3 w-3 opacity-40 group-hover:opacity-100" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="bg-popover border border-border shadow-xl rounded-xl p-3 z-[100]">
                    <Calendar
                      mode="single"
                      selected={dueDate ? new Date(dueDate) : undefined}
                      onSelect={(date) => {
                        setDueDate(date?.toISOString().split("T")[0]);
                        markDirty();
                      }}
                      className="rounded-lg"
                    />
                    {dueDate && (
                      <button
                        onClick={() => { setDueDate(undefined); markDirty(); }}
                        className="w-full mt-2 text-xs text-muted-foreground hover:text-destructive transition-colors text-center"
                      >
                        Clear due date
                      </button>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </PropRow>

              {/* Type (readonly) */}
              <PropRow icon={Layers} label="Type">
                <span className="text-xs font-medium text-foreground">{task.type}</span>
              </PropRow>

              {/* Scope (readonly) */}
              <PropRow icon={Tag} label="Scope">
                <ScopeBadge scope={task.scope} />
              </PropRow>

              {/* Created (readonly) */}
              <PropRow icon={Clock} label="Created">
                <span className="text-xs text-muted-foreground">{formatDateTime(task.createdAt)}</span>
              </PropRow>

              {/* Updated (readonly) */}
              <PropRow icon={Clock} label="Updated">
                <span className="text-xs text-muted-foreground">{formatDateTime(task.updatedAt)}</span>
              </PropRow>
            </div>
          </div>
        </div>

        {/* ── Footer: Save / Delete ──────────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-border/60 bg-card/20 shrink-0">
          <div className="flex items-center gap-2">
            {onDelete && (
              <button
                onClick={() => {
                  onDelete(task.id);
                  onOpenChange(false);
                }}
                className="text-xs text-destructive hover:text-destructive/80 transition-colors px-3 py-1.5 rounded-lg hover:bg-destructive/10 border border-transparent hover:border-destructive/20"
              >
                Delete
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenChange(false)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg border border-border bg-card"
            >
              Close
            </button>
            <button
              onClick={handleSave}
              disabled={!isDirty || saving}
              className={cn(
                "text-xs font-semibold px-4 py-1.5 rounded-lg transition-all",
                isDirty
                  ? "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98]"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              )}
            >
              {saving ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Saving...
                </span>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
