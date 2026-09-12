import { type UseFormRegister, type FieldErrors } from "react-hook-form";
import { Cpu, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export const TYPE_CONFIG = {
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

export interface CreateTaskFormValues {
  type: "TICKET" | "PROJECT";
  title: string;
  description?: string;
  priority: "URGENT" | "HIGH" | "NORMAL" | "LOW";
  assigneeId?: string;
  dueDate?: string;
}

export function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs font-semibold text-foreground/75 dark:text-muted-foreground uppercase tracking-wide mb-1.5">
      {children}
      {required && <span className="text-destructive ml-0.5">*</span>}
    </label>
  );
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-destructive mt-1">{message}</p>;
}

interface NewTaskFormSectionsProps {
  register: UseFormRegister<CreateTaskFormValues>;
  errors: FieldErrors<CreateTaskFormValues>;
  selectedType: "TICKET" | "PROJECT";
}

export function NewTaskFormSections({
  register,
  errors,
  selectedType,
}: NewTaskFormSectionsProps) {
  const typeConfig = TYPE_CONFIG[selectedType] ?? TYPE_CONFIG.TICKET;

  return (
    <>
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
                    selectedType === t
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
    </>
  );
}
