import { TaskHeaderStatsBar } from "./TaskHeaderStatsBar";
import { TaskKpiStrip } from "./TaskKpiStrip";
import type { TaskSummaryDto } from "@/hooks/useTaskSummary";

interface TaskDensityHeaderProps {
  pageTitle: string;
  scopeDescription: string;
  rightPanelOpen: boolean;
  onToggleRightPanel: () => void;
  onOpenShortcutsHelp: () => void;
  onOpenNewTask: () => void;
  showKpiCards: boolean;
  onToggleKpiCards: () => void;
  summary: TaskSummaryDto | null;
  totalElements: number;
  isSupport?: boolean;
  createButtonLabel?: string;
  activeStatLabel?: string;
}

export function TaskDensityHeader({
  pageTitle,
  scopeDescription,
  rightPanelOpen,
  onToggleRightPanel,
  onOpenShortcutsHelp,
  onOpenNewTask,
  showKpiCards,
  onToggleKpiCards,
  summary,
  totalElements,
  isSupport,
  createButtonLabel,
  activeStatLabel,
}: TaskDensityHeaderProps) {
  return (
    <>
      <TaskHeaderStatsBar
        pageTitle={pageTitle}
        scopeDescription={scopeDescription}
        rightPanelOpen={rightPanelOpen}
        onToggleRightPanel={onToggleRightPanel}
        onOpenShortcutsHelp={onOpenShortcutsHelp}
        onOpenNewTask={onOpenNewTask}
        showKpiCards={showKpiCards}
        onToggleKpiCards={onToggleKpiCards}
        summary={summary}
        totalElements={totalElements}
        createButtonLabel={createButtonLabel}
        activeStatLabel={activeStatLabel}
      />

      {showKpiCards && (
        <div className="px-4 md:px-6 shrink-0 animate-in fade-in-50 duration-150">
          <TaskKpiStrip summaryProp={summary} isSupport={isSupport} />
        </div>
      )}
    </>
  );
}
