

import React, { useState, useCallback } from "react";
import {
  Box,
  TrendingUp,
  Flame,
  FileText,
  Save,
  Check,
  Loader2,
  FolderKanban,
  Target,
  Sparkles,
  Layers,
} from "lucide-react";
import {
  Card,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  Button,
  RichTextEditor,
} from "@k2net/ui";
import { type Task } from "@/hooks/useTasksQuery";
import { type TeamUser } from "@/hooks/useTeamUsers";
import { LinearDatePicker } from "@/components/tasks/LinearDatePicker";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useSession } from "@/lib/auth-compat";

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
  progressPercent?: number;
  resolvedIssuesCount?: number;
  totalIssuesCount?: number;
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
  progressPercent = 0,
  resolvedIssuesCount = 0,
  totalIssuesCount = 0,
  onSaveField,
}: ProjectOverviewTabProps) {
  const { data: session } = useSession();
  const [isSavingPlan, setIsSavingPlan] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Manual save handler for TipTap document
  const handleSaveDocument = async () => {
    setIsSavingPlan(true);
    try {
      await onSaveField({ description });
      setLastSaved(new Date());
      toast.success("Spesifikasi Rencana Proyek berhasil disimpan");
    } catch {
      toast.error("Gagal menyimpan dokumen rencana proyek");
    } finally {
      setIsSavingPlan(false);
    }
  };

  // Image upload handler via MinIO storage-client
  const handleUploadImage = useCallback(
    async (file: File): Promise<{ url: string; filename?: string }> => {
      try {
        const { uploadTaskAttachment } = await import("@/lib/storage-client");
        const res = await uploadTaskAttachment(file, session?.accessToken ?? undefined);
        if (res && res.url) {
          toast.success(`Gambar ${file.name} berhasil diunggah ke MinIO`);
          return { url: res.url, filename: file.name };
        }
        throw new Error("Invalid storage upload response");
      } catch (err: any) {
        toast.error("Gagal mengunggah gambar: " + (err.message ?? "Storage error"));
        throw err;
      }
    },
    [session?.accessToken]
  );

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-150">
      {/* ── 1. Project Title & Identifier Header ─────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 shadow-sm">
            <Box className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => {
                if (title.trim() && title.trim() !== projectTask.title) {
                  onSaveField({ title: title.trim() });
                }
              }}
              placeholder="Project plan title..."
              className="text-2xl font-bold text-foreground bg-transparent border-0 outline-none w-full tracking-tight hover:bg-muted/20 px-2 py-1 rounded-lg transition-colors"
            />
          </div>
          {projectTask.obsidianRef && (
            <span className="text-xs font-mono px-2.5 py-1 rounded-md bg-secondary/80 text-foreground border border-border/50 shrink-0">
              {projectTask.obsidianRef}
            </span>
          )}
        </div>
      </div>

      {/* ── 2. Interactive Properties Bar ────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-card/50 border border-border/60 rounded-xl p-3 text-xs shadow-xs">
        {/* Status */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="cursor-pointer hover:bg-muted/40 p-2 rounded-lg transition-colors border border-transparent hover:border-border/40">
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Status</span>
              <div className="mt-1 font-semibold flex items-center gap-1.5 text-foreground">
                <div
                  className={cn(
                    "w-2 h-2 rounded-full",
                    status === "RESOLVED" || status === "CLOSED"
                      ? "bg-primary"
                      : status === "IN_PROGRESS"
                      ? "bg-amber-500"
                      : "bg-cyan-500"
                  )}
                />
                <span>{status}</span>
              </div>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-40 z-[100]">
            {["TODO", "PLANNED", "IN_PROGRESS", "RESOLVED", "CLOSED"].map((st) => (
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
                <Flame
                  className={cn(
                    "w-3.5 h-3.5",
                    priority === "URGENT"
                      ? "text-destructive"
                      : priority === "HIGH"
                      ? "text-amber-500"
                      : "text-muted-foreground"
                  )}
                />
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

        {/* Delivery Progress */}
        <div className="p-2 rounded-lg bg-muted/20 border border-transparent flex flex-col justify-center col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Progress</span>
            <span className="text-[10px] font-mono font-bold text-foreground">{progressPercent}%</span>
          </div>
          <div className="mt-1.5 w-full h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
            />
          </div>
          <span className="text-[9px] text-muted-foreground font-mono mt-1">
            {resolvedIssuesCount}/{totalIssuesCount} issues resolved
          </span>
        </div>
      </div>

      {/* ── 3. Executive Summary / Latest Update Card ────────────────── */}
      <Card className="border border-border/60 bg-card/60 rounded-xl p-4 space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span>Latest Status Update</span>
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
            <TrendingUp className="w-3 h-3" />
            {healthStatus}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="w-4 h-4 rounded-full bg-primary/20 text-primary text-[9px] font-bold flex items-center justify-center">
            {assigneeId ? assigneeId.substring(0, 1).toUpperCase() : "E"}
          </div>
          <span className="font-medium text-foreground">{assigneeId ? assigneeId.split("@")[0] : "Engineering Lead"}</span>
          <span>·</span>
          <span className="font-mono text-[11px]">
            {projectTask.updatedAt
              ? new Date(projectTask.updatedAt).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              : "Today"}
          </span>
        </div>

        <p className="text-xs text-foreground/85 leading-relaxed bg-background/50 p-3 rounded-lg border border-border/40 font-mono">
          Projek payung ini bertindak sebagai master inisiatif platform. Tambahkan issue teknis di tab &apos;Issues&apos; untuk memecah pekerjaan.
        </p>
      </Card>

      {/* ── 4. TipTap Rich Headless Markdown Document ─────────────────── */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-primary" />
              <span>Project Plan Specification</span>
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Dokumen arsitektur, rincian teknis, dan lingkup inisiatif (TipTap Markdown WYSIWYG)
            </p>
          </div>

          <div className="flex items-center gap-2">
            {lastSaved && (
              <span className="text-[10px] text-muted-foreground font-mono flex items-center gap-1 hidden sm:inline-flex">
                <Check className="w-3 h-3 text-primary" />
                <span>Tersimpan {lastSaved.toLocaleTimeString("id-ID")}</span>
              </span>
            )}
            <Button
              type="button"
              size="sm"
              onClick={handleSaveDocument}
              disabled={isSavingPlan}
              className="h-8 px-3 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              {isSavingPlan ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Plan</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* TipTap WYSIWYG Editor Container */}
        <div className="rounded-xl border border-border/70 overflow-hidden bg-card/40 focus-within:border-primary/50 transition-colors shadow-xs">
          <RichTextEditor
            value={description}
            onChange={setDescription}
            minHeight="320px"
            placeholder="Tuliskan spesifikasi teknis lengkap, tabel arsitektur, API contracts, atau milestone rencana proyek di sini..."
            onUploadImage={handleUploadImage}
          />
        </div>
      </div>
    </div>
  );
}
