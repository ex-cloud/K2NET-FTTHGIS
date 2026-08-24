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
  RichTextEditor,
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
  FileText,
  FileCode,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { httpClient } from "@/lib/httpClient";
import { getBackendBaseUrl } from "@/lib/api-config";
import { cn } from "@/lib/utils";
import { type TaskScope } from "@/hooks/useTasksQuery";
import { useTeamUsers } from "@/hooks/useTeamUsers";
import { TaskLabelPicker } from "./TaskLabelPicker";
import { LinearDatePicker } from "./LinearDatePicker";

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
  { id: "globe", icon: Globe, label: "Globe", color: "text-primary bg-primary/10 border-primary/30" },
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
  { id: "RESOLVED", label: "Completed", icon: CheckCircle2, color: "text-primary" },
];

const PROJECT_PRIORITIES = [
  { id: "NORMAL", label: "No priority", icon: CircleDot, color: "text-muted-foreground" },
  { id: "LOW", label: "Low", icon: CircleDot, color: "text-blue-500" },
  { id: "HIGH", label: "High", icon: AlertCircle, color: "text-amber-500" },
  { id: "URGENT", label: "Urgent", icon: AlertCircle, color: "text-destructive" },
];

const TEMPLATE_TECH_SPEC = `## 🎯 Objective & Business Goals
Jelaskan tujuan inisiatif arsitektur, platform reliability, atau optimasi GIS yang akan dicapai.

## 📐 Technical Architecture & Specification
- **Core Engine / Microservice**: 
- **Database Schema / PostGIS Migration**: 
- **API Contracts & Ingress (Kong/Traefik)**: 
- **Cache & Message Broker**: 

## 📋 Scope & Key Deliverables
- [ ] Core Logic & Service Ingestion
- [ ] UI Studio Dashboard Integration
- [ ] Security Guard & RBAC PreAuthorize Audit
- [ ] End-to-End Stress & Verification Testing

## 🛡️ Risk Mitigation & Rollback Plan
Langkah kontinjensi jika deployment memicu degradasi performa atau lonjakan latency.`;

const TEMPLATE_INITIATIVE = `## 💡 Background & Problem Statement
Latar belakang kebutuhan fitur baru atau integrasi tenant pada platform FTTH GIS.

## 🛠️ Proposed Solution Overview
Deskripsi solusi fungsional dan alur interaksi pengguna/teknisi lapangan.

## 📦 Impacted Modules & Gateways
- **Studio Frontend**: 
- **Spring Boot Backend**: 
- **Go Gateways**: 

## 📅 Target Rollout & Milestone Timeline
- **Phase 1**: Desain skema & prototipe awal
- **Phase 2**: Integrasi API & QA Sandbox
- **Phase 3**: Rilis produksi & monitoring telemetri`;

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

  const handleStartDateChange = (val: string | undefined) => {
    setStartDate(val || "");
    if (val && targetDate) {
      if (new Date(val) > new Date(targetDate)) {
        setTargetDate(val);
        toast.info("Target date disesuaikan agar sama atau setelah Start date");
      }
    }
  };

  const handleTargetDateChange = (val: string | undefined) => {
    setTargetDate(val || "");
    if (val && startDate) {
      if (new Date(val) < new Date(startDate)) {
        setStartDate(val);
        toast.info("Start date disesuaikan agar sama atau sebelum Target date");
      }
    }
  };

  const handleRemoveMilestone = (id: string) => {
    setMilestones((prev) => prev.filter((m) => m.id !== id));
  };

  // Image Upload Handler via MinIO storage-client
  const handleUploadImage = async (file: File): Promise<{ url: string; filename?: string }> => {
    try {
      const { uploadTaskAttachment } = await import("@/lib/storage-client");
      const res = await uploadTaskAttachment(file, session?.accessToken);
      if (res && res.url) {
        toast.success(`Gambar ${file.name} berhasil diunggah ke MinIO`);
        return { url: res.url, filename: file.name };
      }
      throw new Error("Invalid storage upload response");
    } catch (err: any) {
      toast.error("Gagal mengunggah gambar: " + (err.message ?? "Storage error"));
      throw err;
    }
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
        className="w-full sm:max-w-[860px] p-0 bg-card/95 backdrop-blur-2xl border border-border shadow-2xl rounded-2xl overflow-hidden flex flex-col gap-0 max-h-[90vh]"
      >
        {/* ── Top Header / Breadcrumb ────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-border/40 bg-muted/20 shrink-0">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-secondary/80 text-xs font-medium text-foreground">
            <FolderKanban className="w-3.5 h-3.5 text-amber-500" />
            <span>K2N</span>
            <span className="text-muted-foreground/60">›</span>
            <span className="font-semibold text-foreground">New project plan</span>
          </div>
          <span className="text-[11px] text-muted-foreground hidden sm:inline">
            Inisiatif Roadmap & Arsitektur Payung
          </span>
        </div>

        {/* ── Form Body ──────────────────────────────────────────────────── */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="px-6 pt-5 pb-4 space-y-4 overflow-y-auto flex-1 custom-scrollbar-thin">
            {/* Project Icon Selector + Name Input */}
            <div className="flex items-start gap-3.5">
              {/* Icon Selector Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    title="Pilih Icon Projek"
                    className={cn(
                      "w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 transition-all hover:scale-105 cursor-pointer shadow-sm mt-0.5",
                      activeIconObj.color
                    )}
                  >
                    <IconComponent className="w-5 h-5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48 p-1.5 grid grid-cols-4 gap-1.5 z-[150]">
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

              {/* Title & Summary Input */}
              <div className="flex-1 space-y-1 min-w-0">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Project plan name (e.g. Core Engine V2 Refactoring)"
                  autoFocus
                  required
                  className="w-full text-xl font-bold font-sans tracking-tight text-foreground bg-transparent border-0 focus:outline-none placeholder:text-muted-foreground/40 leading-tight"
                />
                <input
                  type="text"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Executive summary / tujuan ringkas inisiatif..."
                  className="w-full text-xs text-foreground/80 placeholder:text-muted-foreground/40 bg-transparent border-0 focus:outline-none"
                />
              </div>
            </div>

            {/* ── Linear Horizontal Property Pills ─────────────────────────── */}
            <div className="flex items-center gap-2 flex-wrap pt-2 pb-2 border-y border-border/30">
              {/* Status Pill */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-muted/40 hover:bg-muted/80 text-foreground border border-border/50 transition-colors cursor-pointer"
                  >
                    <StatusIcon className={cn("w-3.5 h-3.5", activeStatusObj.color)} />
                    <span>{activeStatusObj.label}</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-40 z-[150]">
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
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-muted/40 hover:bg-muted/80 text-foreground border border-border/50 transition-colors cursor-pointer"
                  >
                    <PriorityIcon className={cn("w-3.5 h-3.5", activePriorityObj.color)} />
                    <span>{activePriorityObj.label}</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-40 z-[150]">
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
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-muted/40 hover:bg-muted/80 text-foreground border border-border/50 transition-colors cursor-pointer"
                  >
                    <User className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>Lead: {leadName ? leadName.split("@")[0] : "Unassigned"}</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56 max-h-60 overflow-y-auto z-[150]">
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

              {/* Start Date Picker (Linear Standard Popover) */}
              <LinearDatePicker
                type="start"
                value={startDate}
                onChange={handleStartDateChange}
              />

              {/* Target Date Picker (Linear Standard Popover) */}
              <LinearDatePicker
                type="target"
                value={targetDate}
                referenceDate={startDate}
                onChange={handleTargetDateChange}
              />

              {/* Labels Pill (Modular Component) */}
              <TaskLabelPicker
                selectedLabelIds={selectedLabels}
                onChange={setSelectedLabels}
              />

              {/* Dependencies Pill */}
              <button
                type="button"
                onClick={() => toast.info("Dependencies dapat dikonfigurasi setelah master project dibuat")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-muted/40 hover:bg-muted/80 text-foreground border border-border/50 transition-colors cursor-pointer"
              >
                <Link2 className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Dependencies</span>
              </button>
            </div>

            {/* ── TipTap Markdown Project Plan Editor ───────────────────────── */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-primary" />
                  <span>Project Plan Specification (TipTap Markdown)</span>
                </label>
                
                {/* Quick Templates Selector */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-muted-foreground hidden sm:inline">Templates:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setDescription(TEMPLATE_TECH_SPEC);
                      toast.info("Template Technical Architecture Plan dimuat");
                    }}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-secondary text-foreground hover:bg-secondary/80 transition-colors cursor-pointer"
                  >
                    <FileCode className="w-3 h-3 text-cyan-500" />
                    <span>Tech Spec</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDescription(TEMPLATE_INITIATIVE);
                      toast.info("Template Platform Initiative dimuat");
                    }}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-secondary text-foreground hover:bg-secondary/80 transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>Initiative</span>
                  </button>
                  {description && (
                    <button
                      type="button"
                      onClick={() => setDescription("")}
                      title="Reset dokumen"
                      className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Rich Headless TipTap Editor */}
              <div className="rounded-xl border border-border/70 overflow-hidden bg-card/40 focus-within:border-primary/50 transition-colors shadow-xs">
                <RichTextEditor
                  value={description}
                  onChange={setDescription}
                  minHeight="180px"
                  placeholder="Tuliskan spesifikasi project plan, arsitektur sistem, tabel konfigurasi, dan deliverables teknis di sini..."
                  onUploadImage={handleUploadImage}
                />
              </div>
            </div>

            {/* ── Milestones Section ───────────────────────────────────────── */}
            <div className="pt-2 border-t border-border/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground/90 tracking-wide flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-amber-500" />
                  <span>Key Milestones & Checkpoints</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowMilestoneInput(true)}
                  className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer flex items-center gap-1 text-xs"
                  title="Tambah Milestone"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Milestone</span>
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
                        className="text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Inline Add Milestone Input */}
              {showMilestoneInput && (
                <div className="flex items-center gap-2 pt-1">
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
                    placeholder="Nama target milestone (e.g. Phase 1: Core Engine Integration)"
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
          <div className="flex items-center justify-between px-6 py-3 border-t border-border/40 bg-muted/20 shrink-0">
            <span className="text-[11px] text-muted-foreground">
              Tip: Gunakan TipTap Markdown untuk menyusun format tabel & checklist
            </span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="text-xs font-medium text-muted-foreground hover:text-foreground h-8 px-3 rounded-lg"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !name.trim()}
                className="h-8 px-4 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Membuat Project...</span>
                  </>
                ) : (
                  <span>Create project plan</span>
                )}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
