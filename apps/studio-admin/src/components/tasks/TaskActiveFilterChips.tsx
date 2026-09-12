import { VIEW_LABELS, type QuickView } from "@/components/tasks/taskViewFilters";
import type { TaskScope } from "@/hooks/useTasksQuery";

interface TaskActiveFilterChipsProps {
  quickParam: QuickView;
  projectParam: string | null;
  typeParam: string | null;
  scopeParam: TaskScope | null;
  onReset: () => void;
}

export function TaskActiveFilterChips({
  quickParam,
  projectParam,
  typeParam,
  scopeParam,
  onReset,
}: TaskActiveFilterChipsProps) {
  const isCustomFilter =
    quickParam !== "all" ||
    projectParam ||
    typeParam ||
    (scopeParam && scopeParam !== "PLATFORM_INTERNAL");

  if (!isCustomFilter) return null;

  return (
    <div className="px-4 py-2 flex items-center gap-2 border-b border-border/40 bg-background/30 shrink-0">
      <span className="text-xs text-muted-foreground">Showing:</span>
      {quickParam !== "all" && (
        <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
          {VIEW_LABELS[quickParam]}
        </span>
      )}
      {typeParam === "PROJECT" && (
        <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
          Projects &amp; Plans
        </span>
      )}
      {scopeParam === "TENANT_TO_PLATFORM" && (
        <span className="text-xs font-medium text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-full">
          B2B Mitra Escalations
        </span>
      )}
      {projectParam && (
        <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full flex items-center gap-1">
          <span>Project:</span> {projectParam}
        </span>
      )}
      <button
        onClick={onReset}
        className="text-[10px] text-muted-foreground hover:text-foreground transition-colors underline ml-1 cursor-pointer"
      >
        Reset filter
      </button>
    </div>
  );
}
