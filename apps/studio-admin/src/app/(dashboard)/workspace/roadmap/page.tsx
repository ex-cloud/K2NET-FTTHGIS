import { useRouter } from "@/lib/navigation-compat";
import { useTranslation } from "@k2net/i18n";
import { Plus, Milestone, HelpCircle, CheckCircle2, AlertTriangle, Calendar } from "lucide-react";
import { Card, Button } from "@k2net/ui";
import { ProjectTimelineView } from "@/components/tasks/projects/ProjectTimelineView";
import { useProjectsHub } from "@/components/tasks/projects/use-projects-hub";
import { cn } from "@/lib/utils";

export default function WorkspaceRoadmapPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const hub = useProjectsHub();

  return (
    <div className="relative flex flex-col w-full h-full bg-background pt-6 pb-0 gap-5 overflow-hidden">
      {/* ── Page Header ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 md:px-6 shrink-0">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2 tracking-tight">
            <Milestone className="h-5 w-5 text-primary" />
            {t("workspace.roadmap_title")}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t("workspace.roadmap_subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => router.push("/workspace/plans/new?type=PROJECT")}
            className="px-2.5 h-7 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 font-medium text-xs flex items-center gap-1.5 active:scale-[0.98] transition-all shadow-xs cursor-pointer"
          >
            <Plus className="size-3.5" />
            <span>{t("workspace.action_new_plan")}</span>
          </Button>
        </div>
      </div>

      {/* ── Inline KPI Stats Bar ─────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground/90 font-medium px-4 md:px-6 shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-foreground font-mono">{hub.activeCount}</span>
          <span>{t("workspace.kpi_active_initiatives")}</span>
          <span title={t("workspace.kpi_active_desc")} className="cursor-help text-muted-foreground/60 hover:text-foreground">
            <HelpCircle className="h-3.5 w-3.5" />
          </span>
        </div>
        <span className="text-muted-foreground/30 px-1">/</span>
        <div className="flex items-center gap-1.5">
          <span className={cn("font-bold font-mono", hub.atRiskCount > 0 ? "text-destructive" : "text-foreground")}>
            {hub.atRiskCount}
          </span>
          <span>{t("workspace.kpi_at_risk")}</span>
          <span title={t("workspace.kpi_at_risk_desc")} className="cursor-help text-muted-foreground/60 hover:text-foreground">
            <HelpCircle className="h-3.5 w-3.5" />
          </span>
        </div>
        <span className="text-muted-foreground/30 px-1">/</span>
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-foreground font-mono">{hub.completedCount}</span>
          <span>{t("workspace.kpi_completed_plans")}</span>
          <span title={t("workspace.kpi_completed_desc")} className="cursor-help text-muted-foreground/60 hover:text-foreground">
            <HelpCircle className="h-3.5 w-3.5" />
          </span>
        </div>
        <span className="text-muted-foreground/30 px-1">/</span>
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-foreground font-mono">{hub.projects.length}</span>
          <span>{t("workspace.kpi_total_plans")}</span>
        </div>
      </div>

      {/* ── KPI Cards Strip ─────────────────────────────────────────── */}
      <div className="px-4 md:px-6 shrink-0">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card glowingEffect className="p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-foreground/75 dark:text-muted-foreground font-bold tracking-wider uppercase">
                {t("workspace.kpi_active_initiatives")}
              </span>
              <Calendar className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground font-mono">{hub.activeCount}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{hub.activeCount} {t("workspace.kpi_active_desc")}</p>
            </div>
          </Card>

          <Card glowingEffect className="p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-foreground/75 dark:text-muted-foreground font-bold tracking-wider uppercase">
                {t("workspace.kpi_at_risk")}
              </span>
              <AlertTriangle className={cn("h-4 w-4", hub.atRiskCount > 0 ? "text-destructive" : "text-muted-foreground")} />
            </div>
            <div>
              <p className={cn("text-2xl font-bold font-mono", hub.atRiskCount > 0 ? "text-destructive" : "text-foreground")}>
                {hub.atRiskCount}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {hub.atRiskCount > 0 ? t("workspace.kpi_at_risk_desc") : t("workspace.kpi_all_on_schedule")}
              </p>
            </div>
          </Card>

          <Card glowingEffect className="p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-foreground/75 dark:text-muted-foreground font-bold tracking-wider uppercase">
                {t("workspace.kpi_completed_plans")}
              </span>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground font-mono">{hub.completedCount}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{hub.completedCount} {t("workspace.kpi_completed_desc")}</p>
            </div>
          </Card>
        </div>
      </div>

      {/* ── Main Timeline View ───────────────────────────────────────── */}
      <div className="flex-1 min-h-0 flex gap-4 px-4 md:px-6 pb-6 overflow-hidden">
        <div className="flex-1 min-h-0 border border-border bg-card/10 rounded-xl overflow-hidden flex flex-col">
          <ProjectTimelineView
            projects={hub.filteredProjects}
            onProjectClick={(id) => router.push(`/workspace/plans/${id}`)}
          />
        </div>
      </div>
    </div>
  );
}
