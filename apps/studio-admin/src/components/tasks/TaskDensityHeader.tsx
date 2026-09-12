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
      />

      {showKpiCards && (
        <div className="px-4 md:px-6 shrink-0 animate-in fade-in-50 duration-150">
          <TaskKpiStrip />
        </div>
      )}
    </>
  );
}
