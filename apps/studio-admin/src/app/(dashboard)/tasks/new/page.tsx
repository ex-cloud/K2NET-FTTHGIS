import { useState } from "react";
import { useRouter, useSearchParams } from "@/lib/navigation-compat";
import { PageLayout } from "@k2net/ui";
import { ChevronLeft, Loader2, ClipboardList, Cpu } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSession } from "@/lib/auth-compat";
import { httpClient } from "@/lib/httpClient";
import { getBackendBaseUrl } from "@/lib/api-config";
import {
  NewTaskFormSections,
  type CreateTaskFormValues,
} from "@/components/tasks/new-task-form-sections";
import { useTranslation } from "@k2net/i18n";

const STUDIO_ADMIN_SCOPE = "PLATFORM_INTERNAL" as const;

const createTaskSchema = z.object({
  type: z.enum(["TICKET", "PROJECT"] as const, {
    message: "Task type is required",
  }),
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(500, "Title must not exceed 500 characters"),
  description: z.string().optional(),
  priority: z.enum(["URGENT", "HIGH", "NORMAL", "LOW"] as const),
  assigneeId: z.string().optional(),
  dueDate: z.string().optional(),
});

export default function NewTaskPage() {
  const { t } = useTranslation();
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
  } = useForm<CreateTaskFormValues>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      type: defaultType,
      priority: "NORMAL",
    },
  });

  const selectedType = watch("type");

  const onSubmit = async (data: CreateTaskFormValues) => {
    if (!session?.accessToken) {
      toast.error(t("tasks.session_expired_login_again"));
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
          scope: STUDIO_ADMIN_SCOPE,
          dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ?? t("tasks.failed_create_task"));
      }

      const created = await res.json();
      toast.success(
        selectedType === "PROJECT"
          ? t("tasks.project_created_success_ref", { ref: created.obsidianRef ?? created.id })
          : t("tasks.ticket_created_success")
      );
      router.push(`/tasks/${created.id}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t("tasks.failed_create_task"));
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
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4" />
          {t("tasks.back_to_tasks_tickets")}
        </button>

        {/* ── Header ── */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-primary/10">
            {selectedType === "PROJECT" ? (
              <Cpu className="h-5 w-5 text-primary" />
            ) : (
              <ClipboardList className="h-5 w-5 text-primary" />
            )}
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">{t("tasks.create_task")}</h1>
            <p className="text-sm text-foreground/75 dark:text-muted-foreground">
              Main Portal — Scope: <span className="font-mono text-primary text-xs">PLATFORM_INTERNAL</span>
            </p>
          </div>
        </div>

        {/* ── Form ── */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <NewTaskFormSections
            register={register}
            errors={errors}
            selectedType={selectedType}
          />

          {/* ── Actions ── */}
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => router.push("/tasks")}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground border border-border rounded-lg transition-colors cursor-pointer"
            >
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors cursor-pointer"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSubmitting
                ? "Creating..."
                : selectedType === "PROJECT"
                ? "Create Platform Project"
                : "Create Internal Ticket"}
            </button>
          </div>
        </form>
      </div>
    </PageLayout>
  );
}
