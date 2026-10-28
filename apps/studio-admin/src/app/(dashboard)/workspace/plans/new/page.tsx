import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "@/lib/navigation-compat";
import { useSession } from "@/lib/auth-compat";
import { PageHeader, Card } from "@k2net/ui";
import {
  FileText,
  Lightbulb,
  FolderKanban,
  BookOpen,
  Save,
  Loader2,
  Calendar,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { useTranslation } from "@k2net/i18n";
import { useTeamUsers } from "@/hooks/useTeamUsers";
import { httpClient } from "@/lib/httpClient";
import { getBackendBaseUrl } from "@/lib/api-config";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ProjectOverviewPlanEditor } from "@/components/tasks/projects/ProjectOverviewPlanEditor";

type WorkspaceDocType = "PLAN" | "IDEA" | "PROJECT" | "DOC";

const DEFAULT_TEMPLATES: Record<WorkspaceDocType, string> = {
  PLAN: `## 🎯 Objective & Business Goals
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
Langkah kontinjensi jika deployment memicu degradasi performa atau lonjakan latency.`,

  IDEA: `## 💡 Problem Statement & Context
Uraikan permasalahan lapangan atau peluang arsitektural yang melatarbelakangi ide/RFC ini.

## 🔬 Proposed Hypothesis & Solution
Hipotesis teknis atau solusi alternatif yang diusulkan untuk dievaluasi tim engineering.

## ⚖️ Trade-offs & Alternatives Considered
Kelebihan, kekurangan, dan risiko dari alternatif pendekatan lain.

## 🚀 Next Steps & Decision Criteria
Langkah validasi, PoC yang diperlukan, dan kriteria keputusan untuk adopsi.`,

  PROJECT: `## 🚀 Project Charter & Executive Summary
Ringkasan proyek inisiatif kuartal, latar belakang bisnis, dan target delivery.

## 🎯 Key Milestones & Target Dates
Target pencapaian milestone utama dan jadwal sprint pengerjaan.

## 📦 Deliverables & Team Ownership
Daftar deliverables yang akan dipecah menjadi subtask issues.`,

  DOC: `## 📚 Overview & Documentation Scope
Dokumentasi SOP, panduan teknis, wiki operasional platform, atau arsitektur sistem.

## 📖 Standard Operating Procedures
Langkah-langkah operasional dan konfigurasi standar.

## 🔗 References & Related Guides
Tautan dokumentasi internal dan referensi arsitektur.`,
};

export default function WorkspaceNewPlanPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const { users: teamUsers } = useTeamUsers();

  // Determine initial docType from query param (e.g. ?type=ideas)
  const initialTypeParam = (searchParams.get("type") || "").toUpperCase();
  const validInitialType: WorkspaceDocType =
    initialTypeParam.includes("IDEA") ? "IDEA"
    : initialTypeParam.includes("DOC") ? "DOC"
    : initialTypeParam.includes("PROJECT") ? "PROJECT"
    : "PLAN";

  const [docType, setDocType] = useState<WorkspaceDocType>(validInitialType);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState(DEFAULT_TEMPLATES[validInitialType]);
  const [priority, setPriority] = useState("NORMAL");
  const [assigneeId, setAssigneeId] = useState<string | null>(null);
  const [dueDate, setDueDate] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Switch template when user clicks another docType if text has not been deeply edited
  const handleSelectDocType = useCallback((newType: WorkspaceDocType) => {
    setDocType((prevType) => {
      if (prevType !== newType) {
        setDescription((currentDesc) => {
          if (currentDesc === DEFAULT_TEMPLATES[prevType] || !currentDesc.trim()) {
            return DEFAULT_TEMPLATES[newType];
          }
          return currentDesc;
        });
      }
      return newType;
    });
  }, []);

  const handleCreateDocument = async () => {
    const finalTitle = title.trim() || `${t("workspace.new_doc_title")} (${docType})`;
    setIsSubmitting(true);
    try {
      const baseUrl = getBackendBaseUrl();
      const payload = {
        title: finalTitle,
        description,
        priority,
        assigneeId: assigneeId || null,
        referenceType: docType,
        dueDate: docType === "PROJECT" && dueDate ? dueDate : null,
        scope: "PLATFORM_INTERNAL",
        type: "PROJECT",
      };

      const res = await httpClient(`${baseUrl}/api/v1/system/workspace/plans`, {
        method: "POST",
        token: session?.accessToken ?? "",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Failed to create workspace plan");
      }

      const created = await res.json();

      // Post initial creation audit trail event to timeline
      const authorName = session?.user?.name || session?.user?.username || "Super Admin";
      await httpClient(`${baseUrl}/tasks/${created.id}/comments`, {
        method: "POST",
        token: session?.accessToken ?? "",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: `[SYSTEM_EVENT: DOC_CREATED | by: ${authorName}]`,
        }),
      }).catch(() => {});

      toast.success(t("workspace.toast_workspace_created"));
      router.replace(`/workspace/plans/${created.id}`);
    } catch {
      toast.error(t("workspace.toast_workspace_update_failed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const subtypeOptions: Array<{ type: WorkspaceDocType; label: string; icon: typeof FileText }> = [
    { type: "PLAN", label: t("workspace.tab_plans"), icon: FileText },
    { type: "IDEA", label: t("workspace.tab_ideas"), icon: Lightbulb },
    { type: "PROJECT", label: t("workspace.tab_projects"), icon: FolderKanban },
    { type: "DOC", label: t("workspace.tab_docs"), icon: BookOpen },
  ];

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      {/* ── 1. Top Header with Actions ─────────────────────────────── */}
      <PageHeader
        breadcrumbs={[
          { label: t("workspace.plans_title"), href: "/workspace/plans" },
          { label: t("workspace.new_doc_title"), icon: FileText },
        ]}
        actions={
          <>
            <button
              type="button"
              onClick={() => router.push("/workspace/plans")}
              className="flex items-center gap-1.5 h-7 px-2.5 rounded-md border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground text-xs font-medium shadow-2xs transition-colors cursor-pointer"
            >
              <span>{t("common.cancel")}</span>
            </button>
            <button
              type="button"
              onClick={handleCreateDocument}
              disabled={isSubmitting}
              className="flex items-center gap-1.5 h-7 px-2.5 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Save className="size-3.5" />
              )}
              <span>
                {isSubmitting
                  ? t("workspace.btn_creating_workspace")
                  : t("workspace.btn_create_workspace")}
              </span>
            </button>
          </>
        }
      />

      {/* ── 2. Unified Document Canvas (Creation Mode) ─────────────── */}
      <div className="flex-1 min-h-0 overflow-auto custom-scrollbar-thin p-4 md:p-6 w-full">
        <div className="flex flex-col lg:flex-row gap-6 max-w-7xl mx-auto">
          {/* ── Left Column: Subtype Selector & Markdown Canvas ──────── */}
          <div className="flex-1 min-w-0 space-y-6">
            {/* Segmented Subtype Selector */}
            <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-lg border border-border/60 w-fit">
              {subtypeOptions.map((opt) => {
                const Icon = opt.icon;
                const isSelected = docType === opt.type;
                return (
                  <button
                    key={opt.type}
                    type="button"
                    onClick={() => handleSelectDocType(opt.type)}
                    className={cn(
                      "flex items-center gap-1.5 text-xs px-3 h-7 rounded-md font-medium transition-all cursor-pointer",
                      isSelected
                        ? "bg-background text-foreground shadow-xs font-semibold border border-border/50"
                        : "text-muted-foreground hover:text-foreground hover:bg-background/40"
                    )}
                  >
                    <Icon className="size-3.5" />
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>

            {/* TipTap Full Canvas Markdown Editor */}
            <ProjectOverviewPlanEditor
              title={title}
              setTitle={setTitle}
              originalTitle=""
              description={description}
              setDescription={setDescription}
              onSaveField={async () => {}}
              docType={docType}
            />

            {/* Draft Notice for Subtasks & Activity */}
            <div className="p-4 rounded-xl border border-dashed border-border/80 bg-muted/20 flex items-center gap-3 text-xs text-muted-foreground">
              <AlertCircle className="size-4 shrink-0 text-primary" />
              <span>{t("workspace.draft_subtasks_notice")}</span>
            </div>
          </div>

          {/* ── Right Column: Property Pills & Initial Setup ──────────── */}
          <div className="w-full lg:w-80 xl:w-96 shrink-0 space-y-4">
            <Card className="border border-border/60 bg-card/60 rounded-xl p-4 space-y-4 shadow-xs">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                {t("workspace.label_properties")}
              </h3>

              {/* Priority */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-muted-foreground">
                  {t("workspace.label_priority")}
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full h-8 px-2.5 text-xs rounded-md bg-background border border-border text-foreground outline-none focus:border-border cursor-pointer"
                >
                  <option value="LOW">{t("tasks.priority_low")}</option>
                  <option value="NORMAL">{t("tasks.priority_normal")}</option>
                  <option value="HIGH">{t("tasks.priority_high")}</option>
                  <option value="URGENT">{t("tasks.priority_urgent")}</option>
                </select>
              </div>

              {/* Lead / Assignee */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-muted-foreground">
                  {t("workspace.label_lead")}
                </label>
                <select
                  value={assigneeId || ""}
                  onChange={(e) => setAssigneeId(e.target.value || null)}
                  className="w-full h-8 px-2.5 text-xs rounded-md bg-background border border-border text-foreground outline-none focus:border-border cursor-pointer"
                >
                  <option value="">{t("tasks.unassigned")}</option>
                  {teamUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name || u.email}
                    </option>
                  ))}
                </select>
              </div>

              {/* Target Date (Only for PROJECT) */}
              {docType === "PROJECT" && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                    <Calendar className="size-3" />
                    <span>{t("tasks.due_date")}</span>
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full h-8 px-2.5 text-xs rounded-md bg-background border border-border text-foreground outline-none focus:border-border cursor-pointer"
                  />
                </div>
              )}

              {/* Initial Status Pill Info */}
              <div className="pt-2 border-t border-border/40 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{t("workspace.label_status")}</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-muted text-muted-foreground border border-border/40">
                  <Sparkles className="size-3 text-muted-foreground" />
                  <span>
                    {docType === "PROJECT"
                      ? t("workspace.status_planned")
                      : docType === "IDEA"
                      ? t("workspace.lifecycle_proposed")
                      : docType === "DOC"
                      ? t("workspace.doc_metadata_wiki")
                      : t("workspace.lifecycle_draft")}
                  </span>
                </span>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
