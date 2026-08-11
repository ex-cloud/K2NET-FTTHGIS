"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  Calendar,
} from "@k2net/ui";
import { Loader2, FolderKanban, ClipboardList, Calendar as CalendarIcon, User, Cpu, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { httpClient } from "@/lib/httpClient";
import { getBackendBaseUrl } from "@/lib/api-config";
import { cn } from "@/lib/utils";
import { STATUS_CONFIG, PRIORITY_CONFIG } from "./configs";

interface NewTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  assigneesList: string[]; // Keycloak user ID list proxy
}

export function NewTaskDialog({
  open,
  onOpenChange,
  onSuccess,
  assigneesList,
}: NewTaskDialogProps) {
  const { data: session } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states matching Linear design variables
  const [type, setType] = useState<"TICKET" | "PROJECT">("TICKET");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"URGENT" | "HIGH" | "NORMAL" | "LOW">("NORMAL");
  const [status, setStatus] = useState("TODO");
  const [assigneeId, setAssigneeId] = useState("");
  const [dueDate, setDueDate] = useState("");

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
      const res = await httpClient(`${baseUrl}/tasks`, {
        method: "POST",
        token: session.accessToken,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          title: title.trim(),
          description: description.trim() || undefined,
          priority,
          status,
          assigneeId: assigneeId || undefined,
          scope: "PLATFORM_INTERNAL", // always platform internal in admin portal
          dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ?? "Gagal membuat task baru");
      }

      const created = await res.json();
      toast.success(
        type === "PROJECT"
          ? `Proyek berhasil dibuat — Ref: ${created.obsidianRef ?? created.id}`
          : "Tiket berhasil dibuat"
      );
      
      // Reset form states
      setTitle("");
      setDescription("");
      setPriority("NORMAL");
      setStatus("TODO");
      setAssigneeId("");
      setDueDate("");
      
      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      toast.error(err.message ?? "Terjadi kesalahan");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-card border border-border shadow-2xl p-6 rounded-xl overflow-hidden">
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* ── Header Breadcrumbs ── */}
          <DialogHeader className="mb-2">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest select-none">
              <span>Tasks</span>
              <span>/</span>
              <span className="text-primary font-bold">New {type === "PROJECT" ? "Project" : "Issue"}</span>
            </div>
            <DialogTitle className="text-lg font-light text-foreground tracking-tight flex items-center gap-2 mt-1">
              {type === "PROJECT" ? (
                <FolderKanban className="h-5 w-5 text-primary" />
              ) : (
                <ClipboardList className="h-5 w-5 text-primary" />
              )}
              <span>Buat Baru di Platform Internal</span>
            </DialogTitle>
          </DialogHeader>

          {/* ── Title Input (Clean Borderless Style) ── */}
          <div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={type === "PROJECT" ? "Project name..." : "Issue title..."}
              className="w-full bg-transparent border-b border-border/60 py-2 text-base font-semibold text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/80 transition-all duration-200"
              required
              autoFocus
            />
          </div>

          {/* ── Interactive Attribute Selectors Row ── */}
          <div className="flex flex-wrap items-center gap-2 py-1.5">
            {/* Type selector */}
            <div className="flex items-center border border-border rounded-lg p-0.5 bg-muted/40">
              <button
                type="button"
                onClick={() => setType("TICKET")}
                className={cn(
                  "px-2.5 py-1 rounded text-xs font-semibold uppercase tracking-wider transition-all",
                  type === "TICKET" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                )}
              >
                Ticket
              </button>
              <button
                type="button"
                onClick={() => setType("PROJECT")}
                className={cn(
                  "px-2.5 py-1 rounded text-xs font-semibold uppercase tracking-wider transition-all",
                  type === "PROJECT" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                )}
              >
                Project
              </button>
            </div>

            {/* Status Select Badge */}
            <div className="flex items-center gap-1.5 border border-border/80 px-2 py-1 rounded-lg bg-muted/20">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Status:</span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="bg-transparent border-0 p-0 text-xs font-semibold text-foreground focus:ring-0 focus:outline-none cursor-pointer"
              >
                {Object.entries(STATUS_CONFIG).map(([key, val]) => (
                  <option key={key} value={key} className="bg-card text-foreground">
                    {val.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority Select Badge */}
            <div className="flex items-center gap-1.5 border border-border/80 px-2 py-1 rounded-lg bg-muted/20">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Priority:</span>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="bg-transparent border-0 p-0 text-xs font-semibold text-foreground focus:ring-0 focus:outline-none cursor-pointer"
              >
                {Object.entries(PRIORITY_CONFIG).map(([key, val]) => (
                  <option key={key} value={key} className="bg-card text-foreground">
                    {val.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Assignee Select Badge */}
            <div className="flex items-center gap-1.5 border border-border/80 px-2 py-1 rounded-lg bg-muted/20">
              <User className="h-3.5 w-3.5 text-muted-foreground" />
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="bg-transparent border-0 p-0 text-xs font-semibold text-foreground focus:ring-0 focus:outline-none cursor-pointer font-mono"
              >
                <option value="" className="bg-card text-muted-foreground">Assignee</option>
                {assigneesList.map((id) => (
                  <option key={id} value={id} className="bg-card text-foreground">
                    {`…${id.slice(-8)}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Target Date Select Badge (Interactive Calendar Dropdown) */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-1.5 border border-border/80 px-2 py-1 rounded-lg bg-muted/20 hover:bg-muted/40 text-foreground transition-all"
                >
                  <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-semibold">
                    {dueDate ? new Date(dueDate).toLocaleDateString("id-ID") : "Tenggat"}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="p-0 border border-border shadow-xl">
                <Calendar
                  mode="single"
                  selected={dueDate ? new Date(dueDate) : undefined}
                  onSelect={(date) => {
                    setDueDate(date ? date.toISOString() : "");
                  }}
                  className="bg-card rounded-xl"
                />
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* ── Rich Text Description Textarea ── */}
          <div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add short description or collect project criteria..."
              rows={6}
              className="w-full bg-background border border-border rounded-lg p-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all duration-200 resize-none"
            />
          </div>

          {/* ── GIS exclusion notice (Linear platform tasks are non-spatial) ── */}
          <div className="flex items-start gap-2.5 p-3 bg-amber-500/5 border border-amber-500/15 rounded-lg select-none">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
            <p className="text-[10px] text-amber-600 dark:text-amber-400 leading-normal">
              <strong>Info:</strong> Task platform internal NOC bersifat non-spasial (tidak menyertakan koordinat GIS).
            </p>
          </div>

          {/* ── Footer Actions ── */}
          <DialogFooter className="pt-2 border-t border-border/40 gap-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 border border-border rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all duration-200"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50 transition-all duration-200"
            >
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>{isSubmitting ? "Creating…" : `Create ${type === "PROJECT" ? "Project" : "Issue"}`}</span>
            </button>
          </DialogFooter>

        </form>
      </DialogContent>
    </Dialog>
  );
}
