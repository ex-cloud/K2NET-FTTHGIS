"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageLayout } from "@k2net/ui";
import { ChevronLeft, Loader2, ClipboardList, Cpu, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSession } from 'next-auth/react';
import { httpClient } from '@/lib/httpClient';
import { getBackendBaseUrl } from '@/lib/api-config';
import { cn } from "@/lib/utils";

// ─── Scope constant (studio-admin always creates PLATFORM_INTERNAL tasks) ─────
// TENANT_INTERNAL is forbidden for Super Admin callers — enforced both here
// (never sent) and server-side (403 if somehow sent).
const STUDIO_ADMIN_SCOPE = "PLATFORM_INTERNAL" as const;

// ─── Zod Validation Schema ────────────────────────────────────────────────────

const createTaskSchema = z.object({
  type: z.enum(["TICKET", "PROJECT"] as const, {
    message: "Tipe task wajib dipilih",
  }),
  title: z
    .string()
    .min(3, "Judul minimal 3 karakter")
    .max(500, "Judul maksimal 500 karakter"),
  description: z.string().optional(),
  priority: z.enum(["URGENT", "HIGH", "NORMAL", "LOW"] as const).default("NORMAL"),
  assigneeId: z.string().optional(),
  dueDate: z.string().optional(),
});

type CreateTaskForm = z.infer<typeof createTaskSchema>;

// ─── Form field helpers ───────────────────────────────────────────────────────

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs font-semibold text-foreground/75 dark:text-muted-foreground uppercase tracking-wide mb-1.5">
      {children}
      {required && <span className="text-destructive ml-0.5">*</span>}
    </label>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-destructive mt-1">{message}</p>;
}

// ─── Type Card Config ─────────────────────────────────────────────────────────

const TYPE_CONFIG = {
  TICKET: {
    emoji: "🎫",
    label: "Tiket Internal / DevOps Alert",
    desc: "Insiden server, monitoring alert, bug kritis platform, atau permintaan dukungan teknis internal K2NET.",
    hint: "Tiket B2B dari mitra ISP masuk secara otomatis ke tab B2B Inbox di halaman Tasks.",
  },
  PROJECT: {
    emoji: "📋",
    label: "Proyek Platform Engineering",
    desc: "Rilis fitur baru, refactor codebase, migrasi database, setup infrastruktur, atau perencanaan sprint.",
    hint: "Proyek akan otomatis disinkronkan ke Obsidian Vault di folder 01_Projects/Platform/",
  },
} as const;

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function NewTaskPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultType = (searchParams.get("type") ?? "TICKET") as "TICKET" | "PROJECT";
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CreateTaskForm>({
    resolver: zodResolver(createTaskSchema) as any,
    defaultValues: {
      type: defaultType,
      priority: "NORMAL",
    },
  });

  const selectedType = watch("type");
  const typeConfig = TYPE_CONFIG[selectedType] ?? TYPE_CONFIG.TICKET;

  const onSubmit = async (data: CreateTaskForm) => {
    if (!session?.accessToken) {
      toast.error("Sesi Anda telah kedaluwarsa. Silakan login kembali.");
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
          ...data,
          // studio-admin always creates PLATFORM_INTERNAL tasks.
          // GIS fields (referenceType, referenceId, coordinates) are intentionally
          // omitted — those belong exclusively to studio-tenant (TENANT_INTERNAL).
          scope: STUDIO_ADMIN_SCOPE,
          dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ?? "Gagal membuat task");
      }

      const created = await res.json();
      toast.success(
        selectedType === "PROJECT"
          ? `Proyek berhasil dibuat — Ref: ${created.obsidianRef ?? created.id}`
          : "Tiket berhasil dibuat"
      );
      router.push(`/tasks/${created.id}`);
    } catch (err: any) {
      toast.error(err.message ?? "Terjadi kesalahan saat membuat task");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageLayout variant="dashboard">
      <div className="max-w-[56rem] mx-auto px-4 sm:px-6 py-6">

        {/* ── Back link ── */}
        <button
          onClick={() => router.push("/tasks")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ChevronLeft className="h-4 w-4" />
          Kembali ke Tasks &amp; Tickets
        </button>

        {/* ── Header ── */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-primary/10">
            {selectedType === "PROJECT"
              ? <Cpu className="h-5 w-5 text-primary" />
              : <ClipboardList className="h-5 w-5 text-primary" />}
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Buat Task Baru</h1>
            <p className="text-sm text-foreground/75 dark:text-muted-foreground">
              Portal Utama — Scope: <span className="font-mono text-primary text-xs">PLATFORM_INTERNAL</span>
            </p>
          </div>
        </div>

        {/* ── Form ── */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

          {/* ── Section 1: Classification ── */}
          <div className="bg-card border border-border rounded-xl p-6 space-y-5">
            <p className="text-xs font-semibold text-foreground/75 dark:text-muted-foreground uppercase tracking-wide">
              Klasifikasi
            </p>

            {/* Type selector */}
            <div>
              <FieldLabel required>Tipe Task</FieldLabel>
              <div className="grid grid-cols-2 gap-3">
                {(["TICKET", "PROJECT"] as const).map((t) => {
                  const cfg = TYPE_CONFIG[t];
                  return (
                    <label
                      key={t}
                      className={cn(
                        "flex flex-col gap-1.5 p-4 border rounded-xl cursor-pointer transition-colors",
                        watch("type") === t
                          ? "border-primary bg-primary/5 text-foreground"
                          : "border-border bg-muted/30 text-muted-foreground hover:border-border/80"
                      )}
                    >
                      <input
                        type="radio"
                        value={t}
                        {...register("type")}
                        className="sr-only"
                      />
                      <span className="text-sm font-semibold">
                        {cfg.emoji} {cfg.label}
                      </span>
                      <span className="text-xs leading-relaxed">{cfg.desc}</span>
                    </label>
                  );
                })}
              </div>
              <FieldError message={errors.type?.message} />
            </div>

            {/* Scope info banner */}
            <div className="flex items-start gap-2.5 p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg">
              <Cpu className="h-3.5 w-3.5 text-blue-500 mt-0.5 shrink-0" />
              <p className="text-xs text-blue-600 dark:text-blue-400 leading-relaxed">
                {typeConfig.hint}
              </p>
            </div>
          </div>

          {/* ── Section 2: Detail ── */}
          <div className="bg-card border border-border rounded-xl p-6 space-y-5">
            <p className="text-xs font-semibold text-foreground/75 dark:text-muted-foreground uppercase tracking-wide">
              Detail
            </p>

            {/* Title */}
            <div>
              <FieldLabel required>Judul</FieldLabel>
              <input
                {...register("title")}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                placeholder={
                  selectedType === "PROJECT"
                    ? "Cth: Migrate Auth Flow to PKCE — Sprint 24"
                    : "Cth: Kong Gateway CPU spike > 95% — Investigate"
                }
              />
              <FieldError message={errors.title?.message} />
            </div>

            {/* Description */}
            <div>
              <FieldLabel>Deskripsi</FieldLabel>
              <textarea
                {...register("description")}
                rows={4}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-colors resize-none"
                placeholder={
                  selectedType === "PROJECT"
                    ? "Jelaskan lingkup pekerjaan, tujuan, dan kriteria selesai (Definition of Done)..."
                    : "Deskripsikan insiden: waktu kejadian, dampak, langkah reproduksi, dan langkah investigasi awal..."
                }
              />
            </div>
          </div>

          {/* ── Section 3: Scheduling ── */}
          <div className="bg-card border border-border rounded-xl p-6 space-y-5">
            <p className="text-xs font-semibold text-foreground/75 dark:text-muted-foreground uppercase tracking-wide">
              Jadwal &amp; Penugasan
            </p>

            {/* Priority + Due Date */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel>Prioritas</FieldLabel>
                <select
                  {...register("priority")}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                >
                  <option value="URGENT">🔴 URGENT — Eskalasi segera</option>
                  <option value="HIGH">🟠 HIGH — Dalam 24 jam</option>
                  <option value="NORMAL">🟡 NORMAL — Standar sprint</option>
                  <option value="LOW">⬜ LOW — Backlog</option>
                </select>
              </div>
              <div>
                <FieldLabel>Tenggat (Target)</FieldLabel>
                <input
                  type="date"
                  {...register("dueDate")}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                />
              </div>
            </div>

            {/* Assignee */}
            <div>
              <FieldLabel>Assignee (Keycloak User ID)</FieldLabel>
              <input
                {...register("assigneeId")}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                placeholder="UUID Keycloak user — kosongkan jika belum ditugaskan"
              />
            </div>
          </div>

          {/* ── GIS Exclusion Notice ── */}
          <div className="flex items-start gap-2.5 p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
            <div className="text-xs text-amber-600 dark:text-amber-400 space-y-0.5">
              <p className="font-semibold">Field GIS tidak tersedia di Portal Utama</p>
              <p className="opacity-80">
                Referensi spasial (ODP/ODC/koordinat) hanya berlaku untuk proyek fisik FTTH
                di Portal Tenant. Task platform tidak memiliki keterikatan spasial.
              </p>
            </div>
          </div>

          {/* ── Actions ── */}
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => router.push("/tasks")}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground border border-border rounded-lg transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSubmitting
                ? "Membuat..."
                : selectedType === "PROJECT"
                ? "Buat Proyek Platform"
                : "Buat Tiket Internal"}
            </button>
          </div>

        </form>
      </div>
    </PageLayout>
  );
}
