import { useTranslation } from "@k2net/i18n";
import { VIEW_LABELS, type QuickView } from "@/components/tasks/taskViewFilters";
import type { TaskScope } from "@/hooks/useTasksQuery";

interface TaskActiveFilterChipsProps {
  quickParam: QuickView;
  projectParam: string | null;
  typeParam: string | null;
  scopeParam: TaskScope | null;
  defaultScope?: TaskScope | null;
  onReset: () => void;
}

export function TaskActiveFilterChips({
  quickParam,
  projectParam,
  typeParam,
  scopeParam,
  defaultScope = "PLATFORM_INTERNAL",
  onReset,
}: TaskActiveFilterChipsProps) {
  const { t } = useTranslation();

  const isCustomFilter =
    quickParam !== "all" ||
    projectParam ||
    typeParam ||
    (scopeParam && scopeParam !== defaultScope);

  if (!isCustomFilter) return null;

  return (
    <div className="px-4 py-2 flex items-center gap-2 border-b border-border/40 bg-background/30 shrink-0">
      <span className="text-xs text-muted-foreground">{t("common.showing")}</span>
      {quickParam !== "all" && (
        <span className="text-xs font-medium text-foreground bg-muted px-2 py-0.5 rounded-full border border-border">
          {VIEW_LABELS[quickParam] ?? quickParam}
        </span>
      )}
      {typeParam === "PROJECT" && (
        <span className="text-xs font-medium text-foreground bg-muted px-2 py-0.5 rounded-full border border-border">
          {t("workspace.tab_plans")}
        </span>
      )}
      {scopeParam && scopeParam !== defaultScope && scopeParam === "TENANT_TO_PLATFORM" && (
        <span className="text-xs font-medium text-foreground bg-muted border border-border px-2 py-0.5 rounded-full">
          {t("support.tickets_title")}
        </span>
      )}
      {projectParam && (
        <span className="text-xs font-medium text-foreground bg-muted px-2 py-0.5 rounded-full border border-border flex items-center gap-1">
          <span>Project:</span> {projectParam}
        </span>
      )}
      <button
        onClick={onReset}
        className="text-[10px] text-muted-foreground hover:text-foreground transition-colors underline ml-1 cursor-pointer"
      >
        {t("common.reset_filter")}
      </button>
    </div>
  );
}
