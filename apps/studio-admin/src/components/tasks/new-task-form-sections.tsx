import React from "react";
import { type UseFormRegister, type FieldErrors } from "react-hook-form";
import { Cpu, AlertTriangle } from "lucide-react";
import { useTranslation } from "@k2net/i18n";
import { cn } from "@/lib/utils";

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
  const { t } = useTranslation();

  const typeConfig = {
    TICKET: {
      emoji: "🎫",
      label: t("tasks.type_ticket_label"),
      desc: t("tasks.type_ticket_desc"),
      hint: t("tasks.type_ticket_hint"),
    },
    PROJECT: {
      emoji: "📋",
      label: t("tasks.type_project_label"),
      desc: t("tasks.type_project_desc"),
      hint: t("tasks.type_project_hint"),
    },
  }[selectedType] ?? {
    emoji: "🎫",
    label: t("tasks.type_ticket_label"),
    desc: t("tasks.type_ticket_desc"),
    hint: t("tasks.type_ticket_hint"),
  };

  const typeOptions = [
    {
      key: "TICKET" as const,
      emoji: "🎫",
      label: t("tasks.type_ticket_label"),
      desc: t("tasks.type_ticket_desc"),
    },
    {
      key: "PROJECT" as const,
      emoji: "📋",
      label: t("tasks.type_project_label"),
      desc: t("tasks.type_project_desc"),
    },
  ];

  return (
    <>
      {/* ── Section 1: Classification ── */}
      <div className="bg-card border border-border rounded-lg p-6 space-y-5">
        <p className="text-xs font-semibold text-foreground/75 dark:text-muted-foreground uppercase tracking-wide">
          {t("tasks.section_classification")}
        </p>

        {/* Type selector */}
        <div>
          <FieldLabel required>{t("tasks.task_type")}</FieldLabel>
          <div className="grid grid-cols-2 gap-3">
            {typeOptions.map((opt) => (
              <label
                key={opt.key}
                className={cn(
                  "flex flex-col gap-1.5 p-4 border rounded-md cursor-pointer transition-colors",
                  selectedType === opt.key
                    ? "border-primary bg-primary/5 text-foreground"
                    : "border-border bg-muted/30 text-muted-foreground hover:border-border/80"
                )}
              >
                <input
                  type="radio"
                  value={opt.key}
                  {...register("type")}
                  className="sr-only"
                />
                <span className="text-sm font-semibold">
                  {opt.emoji} {opt.label}
                </span>
                <span className="text-xs leading-relaxed">{opt.desc}</span>
              </label>
            ))}
          </div>
          <FieldError message={errors.type?.message} />
        </div>

        {/* Scope info banner */}
        <div className="flex items-start gap-2.5 p-3 bg-blue-500/5 border border-blue-500/20 rounded-md">
          <Cpu className="h-3.5 w-3.5 text-blue-500 mt-0.5 shrink-0" />
          <p className="text-xs text-blue-600 dark:text-blue-400 leading-relaxed">
            {typeConfig.hint}
          </p>
        </div>
      </div>

      {/* ── Section 2: Detail ── */}
      <div className="bg-card border border-border rounded-lg p-6 space-y-5">
        <p className="text-xs font-semibold text-foreground/75 dark:text-muted-foreground uppercase tracking-wide">
          {t("tasks.section_detail")}
        </p>

        {/* Title */}
        <div>
          <FieldLabel required>{t("tasks.col_title")}</FieldLabel>
          <input
            {...register("title")}
            className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
            placeholder={
              selectedType === "PROJECT"
                ? t("tasks.project_title_placeholder")
                : t("tasks.ticket_title_placeholder")
            }
          />
          <FieldError message={errors.title?.message} />
        </div>

        {/* Description */}
        <div>
          <FieldLabel>{t("common.description")}</FieldLabel>
          <textarea
            {...register("description")}
            rows={4}
            className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-colors resize-none"
            placeholder={
              selectedType === "PROJECT"
                ? t("tasks.project_desc_placeholder")
                : t("tasks.ticket_desc_placeholder")
            }
          />
        </div>
      </div>

      {/* ── Section 3: Scheduling ── */}
      <div className="bg-card border border-border rounded-lg p-6 space-y-5">
        <p className="text-xs font-semibold text-foreground/75 dark:text-muted-foreground uppercase tracking-wide">
          {t("tasks.section_schedule")}
        </p>

        {/* Priority + Due Date */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <FieldLabel>{t("tasks.priority")}</FieldLabel>
            <select
              {...register("priority")}
              className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
            >
              <option value="URGENT">{t("tasks.priority_urgent_desc")}</option>
              <option value="HIGH">{t("tasks.priority_high_desc")}</option>
              <option value="NORMAL">{t("tasks.priority_normal_desc")}</option>
              <option value="LOW">{t("tasks.priority_low_desc")}</option>
            </select>
          </div>
          <div>
            <FieldLabel>{t("tasks.due_date_target")}</FieldLabel>
            <input
              type="date"
              {...register("dueDate")}
              className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
            />
          </div>
        </div>

        {/* Assignee */}
        <div>
          <FieldLabel>{t("tasks.assignee_keycloak_id")}</FieldLabel>
          <input
            {...register("assigneeId")}
            className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
            placeholder={t("tasks.assignee_placeholder")}
          />
        </div>
      </div>

      {/* ── GIS Exclusion Notice ── */}
      <div className="flex items-start gap-2.5 p-3 bg-amber-500/5 border border-amber-500/20 rounded-md">
        <AlertTriangle className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
        <div className="text-xs text-amber-600 dark:text-amber-400 space-y-0.5">
          <p className="font-semibold">{t("tasks.gis_exclusion_title")}</p>
          <p className="opacity-80">
            {t("tasks.gis_exclusion_desc")}
          </p>
        </div>
      </div>
    </>
  );
}
