"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageLayout } from "@k2net/ui";
import { ChevronLeft, Loader2, ClipboardList } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "@/lib/utils";

// ─── Zod Validation Schema ───────────────────────────────────────────────────

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
  referenceType: z.string().optional(),
  referenceId: z.string().optional(),
  dueDate: z.string().optional(),
});

type CreateTaskForm = z.infer<typeof createTaskSchema>;

// ─── Form Field components ───────────────────────────────────────────────────

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

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function NewTaskPage() {
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

  const onSubmit = async (data: CreateTaskForm) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/v1/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
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

        {/* ── Header ── */}
        <button
          onClick={() => router.push("/tasks")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ChevronLeft className="h-4 w-4" />
          Kembali ke Tasks & Tickets
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-primary/10">
            <ClipboardList className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Buat Task Baru</h1>
            <p className="text-sm text-foreground/75 dark:text-muted-foreground">
              {selectedType === "PROJECT"
                ? "Proyek infrastruktur FTTH (penarikan kabel, instalasi tiang, dll.)"
                : "Tiket gangguan atau permintaan dukungan pelanggan"}
            </p>
          </div>
        </div>

        {/* ── Form ── */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="bg-card border border-border rounded-xl p-6 space-y-5">

            {/* Type selector */}
            <div>
              <FieldLabel required>Tipe Task</FieldLabel>
              <div className="grid grid-cols-2 gap-3">
                {(["TICKET", "PROJECT"] as const).map((t) => (
                  <label
                    key={t}
                    className={cn(
                      "flex flex-col gap-1 p-4 border rounded-xl cursor-pointer transition-colors",
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
                    <span className="text-sm font-semibold">{t === "TICKET" ? "🎫 Tiket" : "📋 Proyek"}</span>
                    <span className="text-xs">
                      {t === "TICKET"
                        ? "Gangguan, komplain, atau permintaan pelanggan"
                        : "Proyek penarikan kabel, instalasi tiang, splicing"}
                    </span>
                  </label>
                ))}
              </div>
              <FieldError message={errors.type?.message} />
            </div>

            {/* Title */}
            <div>
              <FieldLabel required>Judul</FieldLabel>
              <input
                {...register("title")}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                placeholder={
                  selectedType === "PROJECT"
                    ? "Cth: Ekspansi FTTH Area Dago Pakar Phase 2"
                    : "Cth: Fiber putus di ODP-BDG-012 Area Gegerkalong"
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
                placeholder="Deskripsikan detail masalah atau lingkup pekerjaan..."
              />
            </div>

            {/* Priority + Due Date */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel>Prioritas</FieldLabel>
                <select
                  {...register("priority")}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                >
                  <option value="URGENT">🔴 URGENT</option>
                  <option value="HIGH">🟠 HIGH</option>
                  <option value="NORMAL">🟡 NORMAL</option>
                  <option value="LOW">⬜ LOW</option>
                </select>
              </div>
              <div>
                <FieldLabel>Tenggat (SLA)</FieldLabel>
                <input
                  type="date"
                  {...register("dueDate")}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                />
              </div>
            </div>

            {/* GIS Reference */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel>Tipe Referensi GIS</FieldLabel>
                <select
                  {...register("referenceType")}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                >
                  <option value="">— Tidak ada —</option>
                  <option value="ODP">ODP</option>
                  <option value="ODC">ODC</option>
                  <option value="FIBER_CABLE">Kabel Fiber</option>
                  <option value="CUSTOMER">Pelanggan</option>
                  <option value="OLT">OLT</option>
                </select>
              </div>
              <div>
                <FieldLabel>ID Referensi GIS</FieldLabel>
                <input
                  {...register("referenceId")}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                  placeholder="Cth: ODP-BDG-012"
                />
              </div>
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
              {isSubmitting ? "Membuat..." : selectedType === "PROJECT" ? "Buat Proyek" : "Buat Tiket"}
            </button>
          </div>
        </form>

      </div>
    </PageLayout>
  );
}
