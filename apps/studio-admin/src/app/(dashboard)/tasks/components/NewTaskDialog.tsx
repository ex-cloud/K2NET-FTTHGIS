"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@k2net/ui";
import {
  Loader2,
  User,
  AlertCircle,
  Paperclip,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { httpClient } from "@/lib/httpClient";
import { getBackendBaseUrl } from "@/lib/api-config";
import { cn } from "@/lib/utils";
import { STATUS_CONFIG, PRIORITY_CONFIG } from "./configs";
import { type TaskScope } from "@/hooks/useTasksQuery";
import { TaskLabelPicker } from "./TaskLabelPicker";
import { TaskProjectPicker } from "./TaskProjectPicker";

export interface NewTaskDefaultValues {
  title?: string;
  description?: string;
  scope?: TaskScope;
  type?: "TICKET" | "PROJECT";
  project?: string;
  priority?: "URGENT" | "HIGH" | "NORMAL" | "LOW";
  status?: string;
}

interface NewTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  assigneesList?: string[];
  projectsList?: string[];
  defaultValues?: NewTaskDefaultValues;
}

export function NewTaskDialog({
  open,
  onOpenChange,
  onSuccess,
  assigneesList = [],
  projectsList = [],
  defaultValues,
}: NewTaskDialogProps) {
  const { data: session } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createMore, setCreateMore] = useState(false);

  // Form states
  const [type, setType] = useState<"TICKET" | "PROJECT">("TICKET");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"URGENT" | "HIGH" | "NORMAL" | "LOW">("NORMAL");
  const [status, setStatus] = useState("TODO");
  const [assigneeId, setAssigneeId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);

  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync default values when opened
  useEffect(() => {
    if (open) {
      if (defaultValues) {
        setTitle(defaultValues.title ?? "");
        setDescription(defaultValues.description ?? "");
        setType(defaultValues.type ?? "TICKET");
        setPriority(defaultValues.priority ?? "NORMAL");
        setStatus(defaultValues.status ?? "TODO");
        setSelectedProject(defaultValues.project ?? null);
      } else {
        setTitle("");
        setDescription("");
        setType("TICKET");
        setPriority("NORMAL");
        setStatus("TODO");
        setAssigneeId("");
        setDueDate("");
        setSelectedProject(null);
        setSelectedLabels([]);
      }
    }
  }, [open, defaultValues]);

  // ── File Upload Handler ─────────────────────────────────────────────────────

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    setIsUploadingFile(true);
    toast.info("Mengunggah dan mengompresi berkas via MinIO storage-gateway...");
    try {
      const { uploadTaskAttachment } = await import("@/lib/storage-client");
      const res = await uploadTaskAttachment(file, session?.accessToken);
      if (res.url) {
        const isImg = file.type.startsWith("image/");
        const markdown = isImg ? `\n\n![${file.name}](${res.url})` : `\n\n[📎 ${file.name}](${res.url})`;
        setDescription((prev) => prev + markdown);
        toast.success(`Berkas ${file.name} berhasil diunggah dan dikompresi ke MinIO`);
      }
    } catch (err: any) {
      toast.error("Gagal mengunggah berkas: " + (err.message ?? "Storage error"));
    } finally {
      setIsUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // ── Submit Handler ──────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Judul task wajib diisi");
      return;
    }
    if (!session?.accessToken) {
      toast.error("Sesi Anda kedaluwarsa. Silakan login kembali.");
      return;
    }

    setIsSubmitting(true);
    try {
      const baseUrl = getBackendBaseUrl();
      
      const payload: Record<string, any> = {
        type: defaultValues?.type ?? type,
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        status,
        assigneeId: assigneeId || undefined,
        scope: defaultValues?.scope ?? "PLATFORM_INTERNAL",
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
      };

      if (selectedProject) {
        payload.obsidianRef = selectedProject;
      }

      const res = await httpClient(`${baseUrl}/tasks`, {
        method: "POST",
        token: session.accessToken,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ?? "Gagal membuat task baru");
      }

      const created = await res.json();
      toast.success(
        selectedProject
          ? `Issue terdaftar dalam ${selectedProject} — Ref: ${created.obsidianRef ?? created.id}`
          : "Issue baru berhasil dibuat"
      );

      if (createMore) {
        setTitle("");
        setDescription("");
        onSuccess();
      } else {
        onOpenChange(false);
        onSuccess();
      }
    } catch (err: any) {
      toast.error(err.message ?? "Terjadi kesalahan sistem saat membuat task");
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentStatus = STATUS_CONFIG[status] ?? STATUS_CONFIG.TODO;
  const StatusIcon = currentStatus.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={true}
        className="w-full sm:max-w-[660px] p-0 bg-card/95 backdrop-blur-2xl border border-border shadow-2xl rounded-2xl overflow-hidden flex flex-col gap-0"
      >
        {/* ── Linear-Style Header Bar ──────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border/50 bg-background/50 shrink-0">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-primary/10 text-primary">
              <Sparkles className="h-3 w-3" />
              K2N
            </span>
            <span>›</span>
            <span className="text-foreground">
              {type === "PROJECT" || selectedProject ? "New Project Issue" : "New Issue"}
            </span>
          </div>

          <div className="flex items-center gap-1 pr-6">
            <button
              type="button"
              onClick={() => setType(type === "TICKET" ? "PROJECT" : "TICKET")}
              className={cn(
                "text-[10px] font-semibold px-2 py-0.5 rounded-md transition-colors border",
                type === "PROJECT"
                  ? "bg-primary/15 text-primary border-primary/30"
                  : "bg-muted text-muted-foreground border-transparent hover:text-foreground"
              )}
            >
              {type === "PROJECT" ? "Project Mode" : "Ticket Mode"}
            </button>
          </div>
        </div>

        {/* ── Form Canvas ──────────────────────────────────────────────── */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="p-5 space-y-4 flex-1 overflow-y-auto">
            {/* Title input */}
            <input
              type="text"
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Issue title..."
              className="w-full text-lg font-bold text-foreground bg-transparent border-none outline-none placeholder:text-muted-foreground/40 focus:ring-0"
            />

            {/* Description textarea */}
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add description... (supports markdown)"
              rows={4}
              className="w-full text-sm text-foreground/90 bg-transparent border-none outline-none resize-none placeholder:text-muted-foreground/40 focus:ring-0 leading-relaxed"
            />
          </div>

          {/* ── Linear Inline Pill Bar (Modular Components) ─────────────── */}
          <div className="px-5 py-3 border-t border-border/50 bg-background/30 flex flex-wrap items-center gap-2">
            {/* 1. Status Pill */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border border-border/60 bg-card hover:bg-muted/50 transition-colors",
                    currentStatus.className
                  )}
                >
                  <StatusIcon className="h-3 w-3 shrink-0" />
                  <span>{currentStatus.label}</span>
                  <ChevronDown className="h-3 w-3 opacity-60 ml-0.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="min-w-36 z-[100] p-1">
                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
                  const Icon = cfg.icon;
                  return (
                    <DropdownMenuItem
                      key={key}
                      onClick={() => setStatus(key)}
                      className={cn(
                        "flex items-center gap-2 text-xs py-1.5 px-2.5 rounded-md cursor-pointer",
                        status === key ? "bg-primary/10 text-primary font-semibold" : "hover:bg-muted/50 text-foreground"
                      )}
                    >
                      <Icon className="h-3 w-3" />
                      {cfg.label}
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
                  className={cn(
                    "inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border border-border/60 bg-card hover:bg-muted/50 transition-colors",
                    PRIORITY_CONFIG[priority]?.className ?? "text-muted-foreground"
                  )}
                >
                  <AlertCircle className="h-3 w-3 shrink-0" />
                  <span>{PRIORITY_CONFIG[priority]?.label ?? priority}</span>
                  <ChevronDown className="h-3 w-3 opacity-60 ml-0.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="min-w-32 z-[100] p-1">
                {Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => (
                  <DropdownMenuItem
                    key={key}
                    onClick={() => setPriority(key as any)}
                    className={cn(
                      "flex items-center gap-2 text-xs py-1.5 px-2.5 rounded-md cursor-pointer",
                      priority === key ? "bg-primary/10 text-primary font-semibold" : "hover:bg-muted/50 text-foreground"
                    )}
                  >
                    <span className={cn("text-xs font-bold", cfg.className.split(" ")[0])}>{cfg.label}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* 3. Assignee Pill */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 text-xs text-foreground font-medium px-2.5 py-1 rounded-lg border border-border/60 bg-card hover:bg-muted/50 transition-colors"
                >
                  <User className="h-3 w-3 text-muted-foreground shrink-0" />
                  <span className="truncate max-w-[100px]">
                    {assigneeId ? assigneeId.split("@")[0] : "Assignee"}
                  </span>
                  <ChevronDown className="h-3 w-3 opacity-60 ml-0.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="min-w-44 z-[100] p-1">
                <DropdownMenuItem
                  onClick={() => setAssigneeId("")}
                  className={cn(
                    "text-xs py-1.5 px-2.5 rounded-md cursor-pointer",
                    !assigneeId ? "bg-primary/10 text-primary font-semibold" : "text-muted-foreground"
                  )}
                >
                  Unassigned
                </DropdownMenuItem>
                {assigneesList.map((uid) => (
                  <DropdownMenuItem
                    key={uid}
                    onClick={() => setAssigneeId(uid)}
                    className={cn(
                      "text-xs py-1.5 px-2.5 rounded-md cursor-pointer font-mono",
                      assigneeId === uid ? "bg-primary/10 text-primary font-semibold" : "text-foreground"
                    )}
                  >
                    {uid.split("@")[0]}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* 4. Project Pill (Modular Sub-component) */}
            <TaskProjectPicker
              selectedProject={selectedProject}
              projectsList={projectsList}
              onChange={setSelectedProject}
            />

            {/* 5. Labels Pill (Modular Sub-component with 3-Step Linear Wizard) */}
            <TaskLabelPicker
              selectedLabelIds={selectedLabels}
              onChange={setSelectedLabels}
            />
          </div>

          {/* ── Footer Actions ─────────────────────────────────────────── */}
          <div className="flex items-center justify-between px-5 py-3 border-t border-border/50 bg-background/50 shrink-0">
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileUpload}
              />
              <button
                type="button"
                disabled={isUploadingFile}
                onClick={() => fileInputRef.current?.click()}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors disabled:opacity-50"
                title="Attach file (Upload & compress via MinIO storage-gateway)"
              >
                {isUploadingFile ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : <Paperclip className="h-4 w-4" />}
              </button>
            </div>

            <div className="flex items-center gap-3">
              {/* Create more toggle switch */}
              <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={createMore}
                  onChange={(e) => setCreateMore(e.target.checked)}
                  className="rounded border-border/80 text-primary focus:ring-0 cursor-pointer"
                />
                <span>Create more</span>
              </label>

              <button
                type="submit"
                disabled={!title.trim() || isSubmitting}
                className={cn(
                  "inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-md active:scale-95",
                  title.trim() && !isSubmitting
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                )}
              >
                {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Create {type === "PROJECT" || selectedProject ? "Project Issue" : "Issue"}
              </button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
