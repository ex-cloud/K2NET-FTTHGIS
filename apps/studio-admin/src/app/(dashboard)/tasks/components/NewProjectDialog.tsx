"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  Button,
} from "@k2net/ui";
import {
  FolderKanban,
  Box,
  Layers,
  Globe,
  Sparkles,
  Cpu,
  ShieldCheck,
  User,
  Calendar,
  Target,
  Tag,
  Link2,
  Plus,
  Loader2,
  CheckCircle2,
  CircleDot,
  AlertCircle,
  Clock,
  Trash2,
  Flame,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { httpClient } from "@/lib/httpClient";
import { getBackendBaseUrl } from "@/lib/api-config";
import { cn } from "@/lib/utils";
import { type TaskScope } from "@/hooks/useTasksQuery";
import { useTeamUsers } from "@/hooks/useTeamUsers";
import { TaskLabelPicker } from "./TaskLabelPicker";

interface NewProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  defaultValues?: {
    title?: string;
    summary?: string;
    description?: string;
    scope?: TaskScope;
    priority?: "URGENT" | "HIGH" | "NORMAL" | "LOW";
    status?: string;
    leadId?: string;
    targetDate?: string;
  };
}

const PROJECT_ICONS = [
  { id: "box", icon: Box, label: "Default Box", color: "text-amber-500 bg-amber-500/10 border-amber-500/30" },
  { id: "layers", icon: Layers, label: "Layers", color: "text-blue-500 bg-blue-500/10 border-blue-500/30" },
  { id: "globe", icon: Globe, label: "Globe", color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/30" },
  { id: "sparkles", icon: Sparkles, label: "Sparkles", color: "text-purple-500 bg-purple-500/10 border-purple-500/30" },
  { id: "cpu", icon: Cpu, label: "Core Infra", color: "text-cyan-500 bg-cyan-500/10 border-cyan-500/30" },
  { id: "shield", icon: ShieldCheck, label: "Security", color: "text-rose-500 bg-rose-500/10 border-rose-500/30" },
  { id: "flame", icon: Flame, label: "High Priority", color: "text-orange-500 bg-orange-500/10 border-orange-500/30" },
  { id: "zap", icon: Zap, label: "Fast Track", color: "text-yellow-500 bg-yellow-500/10 border-yellow-500/30" },
];

const PROJECT_STATUSES = [
  { id: "TODO", label: "Backlog", icon: CircleDot, color: "text-muted-foreground" },
  { id: "PLANNED", label: "Planned", icon: Clock, color: "text-cyan-500" },
  { id: "IN_PROGRESS", label: "In Progress", icon: Sparkles, color: "text-amber-500" },
  { id: "RESOLVED", label: "Completed", icon: CheckCircle2, color: "text-emerald-500" },
];

const PROJECT_PRIORITIES = [
  { id: "NORMAL", label: "No priority", icon: CircleDot, color: "text-muted-foreground" },
  { id: "LOW", label: "Low", icon: CircleDot, color: "text-blue-500" },
  { id: "HIGH", label: "High", icon: AlertCircle, color: "text-amber-500" },
  { id: "URGENT", label: "Urgent", icon: AlertCircle, color: "text-destructive" },
];

export function NewProjectDialog({
  open,
  onOpenChange,
  onSuccess,
  defaultValues,
}: NewProjectDialogProps) {
  const { data: session } = useSession();
  const { users: teamUsers } = useTeamUsers();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [selectedIconId, setSelectedIconId] = useState("box");
  const [name, setName] = useState("");
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("TODO");
  const [priority, setPriority] = useState<"URGENT" | "HIGH" | "NORMAL" | "LOW">("NORMAL");
  const [leadName, setLeadName] = useState(session?.user?.name || session?.user?.email || "andiansyah");
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [startDate, setStartDate] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [milestones, setMilestones] = useState<{ id: string; title: string }[]>([]);
  const [newMilestoneText, setNewMilestoneText] = useState("");
  const [showMilestoneInput, setShowMilestoneInput] = useState(false);

  // Reset or fill defaults
  useEffect(() => {
    if (open) {
      setName(defaultValues?.title || "");
      setSummary(defaultValues?.summary || "");
      setDescription(defaultValues?.description || "");
      setStatus(defaultValues?.status || "TODO");
      setPriority(defaultValues?.priority || "NORMAL");
      setTargetDate(defaultValues?.targetDate || "");
      setMilestones([]);
      setShowMilestoneInput(false);
    }
  }, [open, defaultValues]);

  const activeIconObj = PROJECT_ICONS.find((i) => i.id === selectedIconId) || PROJECT_ICONS[0];
  const IconComponent = activeIconObj.icon;
  const activeStatusObj = PROJECT_STATUSES.find((s) => s.id === status) || PROJECT_STATUSES[0];
  const StatusIcon = activeStatusObj.icon;
  const activePriorityObj = PROJECT_PRIORITIES.find((p) => p.id === priority) || PROJECT_PRIORITIES[0];
  const PriorityIcon = activePriorityObj.icon;

  const handleAddMilestone = () => {
    if (!newMilestoneText.trim()) return;
    setMilestones((prev) => [
      ...prev,
      { id: Math.random().toString(36).substring(2, 9), title: newMilestoneText.trim() },
    ]);
    setNewMilestoneText("");
    setShowMilestoneInput(false);
  };

  const handleRemoveMilestone = (id: string) => {
    setMilestones((prev) => prev.filter((m) => m.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Nama project wajib diisi");
      return;
    }
    if (!session?.accessToken) {
      toast.error("Sesi Anda kedaluwarsa. Silakan login kembali.");
      return;
    }

    setIsSubmitting(true);
    try {
      const baseUrl = getBackendBaseUrl();

      // Assemble full description including summary & milestones if provided
      let fullDescription = "";
      if (summary.trim()) {
        fullDescription += `> **Summary**: ${summary.trim()}\n\n`;
      }
      if (description.trim()) {
        fullDescription += `${description.trim()}\n\n`;
      }
      if (milestones.length > 0) {
        fullDescription += `### 🎯 Milestones\n`;
        milestones.forEach((m, idx) => {
          fullDescription += `- [ ] **M${idx + 1}**: ${m.title}\n`;
        });
      }

      const payload: Record<string, any> = {
        type: "PROJECT",
        title: name.trim(),
        description: fullDescription.trim() || undefined,
        priority: priority === "NORMAL" ? "NORMAL" : priority,
        status: status === "PLANNED" ? "TODO" : status,
        scope: defaultValues?.scope || "PLATFORM_INTERNAL",
        assigneeId: leadName || undefined,
        dueDate: targetDate ? new Date(targetDate).toISOString() : undefined,
      };

      const res = await httpClient(`${baseUrl}/tasks`, {
        method: "POST",
        token: session.accessToken,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ?? "Gagal membuat master project");
      }

      const created = await res.json();
      toast.success(
        `Project "${created.title}" berhasil dibuat! Ref: ${created.obsidianRef || created.id}`
      );
      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      toast.error(err.message ?? "Terjadi kesalahan sistem saat membuat project");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={true}
        className="w-full sm:max-w-[720px] p-0 bg-card/95 backdrop-blur-2xl border border-border shadow-2xl rounded-2xl overflow-hidden flex flex-col gap-0"
      >
        {/* ── Top Header / Breadcrumb ────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-border/40 bg-muted/20 shrink-0">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-secondary/80 text-xs font-medium text-foreground">
            <FolderKanban className="w-3.5 h-3.5 text-amber-500" />
            <span>K2N</span>
            <span className="text-muted-foreground/60">›</span>
            <span className="font-semibold text-foreground">New project</span>
          </div>
        </div>

        {/* ── Form Body ──────────────────────────────────────────────────── */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1">
          <div className="px-7 pt-6 pb-5 space-y-4 max-h-[75vh] overflow-y-auto">
            {/* Project Icon Selector + Name Input */}
            <div className="flex items-start gap-3.5">
              {/* Icon Selector Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    title="Pilih Icon Projek"
                    className={cn(
                      "w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 transition-all hover:scale-105 cursor-pointer shadow-sm",
                      activeIconObj.color
                    )}
                  >
                    <IconComponent className="w-5 h-5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48 p-1.5 grid grid-cols-4 gap-1.5">
                  {PROJECT_ICONS.map((item) => {
                    const ItemIcon = item.icon;
                    return (
                      <DropdownMenuItem
                        key={item.id}
                        onClick={() => setSelectedIconId(item.id)}
                        className={cn(
                          "p-2.5 rounded-lg flex items-center justify-center cursor-pointer transition-all",
                          selectedIconId === item.id ? "bg-accent border border-primary/40" : "hover:bg-muted"
                        )}
                      >
                        <ItemIcon className={cn("w-4 h-4", item.color.split(" ")[0])} />
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Title Input */}
              <div className="flex-1 space-y-1">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Project name"
                  autoFocus
                  required
                  className="w-full text-2xl font-bold font-sans tracking-tight text-foreground bg-transparent border-0 focus:outline-none placeholder:text-muted-foreground/40 leading-tight"
                />
                <input
                  type="text"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Add a short summary..."
                  className="w-full text-sm text-foreground/80 placeholder:text-muted-foreground/40 bg-transparent border-0 focus:outline-none"
                />
              </div>
            </div>

            {/* ── Linear Horizontal Property Pills ─────────────────────────── */}
            <div className="flex items-center gap-2 flex-wrap pt-2 pb-1 border-b border-border/30">
              {/* Status Pill */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-muted/40 hover:bg-muted/80 text-foreground border border-border/50 transition-colors"
                  >
                    <StatusIcon className={cn("w-3.5 h-3.5", activeStatusObj.color)} />
                    <span>{activeStatusObj.label}</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-40">
                  {PROJECT_STATUSES.map((st) => {
                    const StIcon = st.icon;
                    return (
                      <DropdownMenuItem
                        key={st.id}
                        onClick={() => setStatus(st.id)}
                        className="flex items-center gap-2 text-xs py-2 cursor-pointer"
                      >
                        <StIcon className={cn("w-3.5 h-3.5", st.color)} />
                        <span>{st.label}</span>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Priority Pill */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-muted/40 hover:bg-muted/80 text-foreground border border-border/50 transition-colors"
                  >
                    <PriorityIcon className={cn("w-3.5 h-3.5", activePriorityObj.color)} />
                    <span>{activePriorityObj.label}</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-40">
                  {PROJECT_PRIORITIES.map((pr) => {
                    const PrIcon = pr.icon;
                    return (
                      <DropdownMenuItem
                        key={pr.id}
                        onClick={() => setPriority(pr.id as any)}
                        className="flex items-center gap-2 text-xs py-2 cursor-pointer"
                      >
                        <PrIcon className={cn("w-3.5 h-3.5", pr.color)} />
                        <span>{pr.label}</span>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Lead Pill */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-muted/40 hover:bg-muted/80 text-foreground border border-border/50 transition-colors"
                  >
                    <User className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>Lead: {leadName ? leadName.split("@")[0] : "Unassigned"}</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56 max-h-60 overflow-y-auto z-[100]">
                  {teamUsers.length === 0 ? (
                    <DropdownMenuItem
                      onClick={() => setLeadName(session?.user?.name || session?.user?.email || "andiansyah")}
                      className="flex items-center gap-2 text-xs py-2 cursor-pointer"
                    >
                      <User className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>{session?.user?.name || session?.user?.email || "Current User"}</span>
                    </DropdownMenuItem>
                  ) : (
                    teamUsers.map((u) => (
                      <DropdownMenuItem
                        key={u.id}
                        onClick={() => setLeadName(u.name || u.email)}
                        className={cn(
                          "flex items-center gap-2 text-xs py-2 cursor-pointer",
                          leadName === (u.name || u.email) ? "bg-primary/10 text-primary font-semibold" : "text-foreground"
                        )}
                      >
                        <div className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-[10px] shrink-0">
                          {(u.name || u.email).substring(0, 1).toUpperCase()}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="truncate">{u.name || u.email}</span>
                          <span className="text-[10px] text-muted-foreground">{u.role}</span>
                        </div>
                      </DropdownMenuItem>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Start Date Pill */}
              <div className="relative inline-flex items-center">
                <label
                  htmlFor="project-start-date"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-muted/40 hover:bg-muted/80 text-foreground border border-border/50 transition-colors cursor-pointer"
                >
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>{startDate ? startDate : "Start"}</span>
                </label>
                <input
                  id="project-start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="sr-only"
                />
              </div>

              {/* Target Date Pill */}
              <div className="relative inline-flex items-center">
                <label
                  htmlFor="project-target-date"
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer",
                    targetDate
                      ? "bg-amber-500/10 border-amber-500/40 text-amber-500 font-semibold"
                      : "bg-muted/40 hover:bg-muted/80 text-foreground border-border/50"
                  )}
                >
                  <Target className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>{targetDate ? `Target: ${targetDate}` : "Target"}</span>
                </label>
                <input
                  id="project-target-date"
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="sr-only"
                />
              </div>

              {/* Labels Pill (Modular Component) */}
              <TaskLabelPicker
                selectedLabelIds={selectedLabels}
                onChange={setSelectedLabels}
              />

              {/* Dependencies Pill */}
              <button
                type="button"
                onClick={() => toast.info("Dependencies dapat dikonfigurasi setelah master project dibuat")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-muted/40 hover:bg-muted/80 text-foreground border border-border/50 transition-colors"
              >
                <Link2 className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Dependencies</span>
              </button>
            </div>

            {/* ── Main Description / Project Brief ─────────────────────────── */}
            <div className="pt-2">
              <textarea
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Write a description, a project brief, or collect ideas..."
                className="w-full text-sm text-foreground bg-transparent border-0 focus:outline-none placeholder:text-muted-foreground/40 resize-none leading-relaxed"
              />
            </div>

            {/* ── Milestones Section ───────────────────────────────────────── */}
            <div className="pt-3 border-t border-border/30 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground/80 tracking-wide">
                  Milestones
                </span>
                <button
                  type="button"
                  onClick={() => setShowMilestoneInput(true)}
                  className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                  title="Tambah Milestone"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* List Milestones */}
              {milestones.length > 0 && (
                <div className="space-y-1.5">
                  {milestones.map((m, idx) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-secondary/50 border border-border/40 text-xs text-foreground"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-amber-500">M{idx + 1}</span>
                        <span>{m.title}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveMilestone(m.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Inline Add Milestone Input */}
              {showMilestoneInput && (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newMilestoneText}
                    onChange={(e) => setNewMilestoneText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddMilestone();
                      }
                    }}
                    placeholder="Nama target milestone (e.g. Phase 1: Core Deployment)"
                    autoFocus
                    className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-background border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddMilestone}
                    className="h-7 text-xs px-2.5 bg-secondary text-foreground hover:bg-secondary/80"
                  >
                    Tambah
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowMilestoneInput(false)}
                    className="h-7 text-xs px-2"
                  >
                    Batal
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* ── Modal Footer ──────────────────────────────────────────────── */}
          <div className="flex items-center justify-end gap-2.5 px-6 py-3.5 border-t border-border/40 bg-muted/20 shrink-0">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-xs font-medium text-muted-foreground hover:text-foreground h-9 px-4 rounded-lg"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="h-9 px-5 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg shadow-md transition-all flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Membuat Project...</span>
                </>
              ) : (
                <span>Create project</span>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
