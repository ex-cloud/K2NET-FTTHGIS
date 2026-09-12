import { KanbanBoard } from "@k2net/ui";
import { TaskTable } from "@/components/tasks/TaskTable";
import { TaskCard } from "@/components/tasks/TaskCard";
import { KANBAN_COLUMNS } from "@/components/tasks/configs";
import { TaskTimelineView } from "@/components/tasks/TaskTimelineView";
import type { Task } from "@/hooks/useTasksQuery";
import type { DisplayPropertiesState } from "@/components/tasks/LinearDisplayOptionsPopover";

interface TaskViewContainerProps {
  viewMode: "list" | "kanban" | "timeline";
  tasks: Task[];
  localTasks: Task[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  onRowClick: (task: Task) => void;
  onUpdateTask: (itemId: string, fields: Partial<Task>) => void;
  onDeleteTask: (itemId: string) => void;
  onFetchMore: () => void;
  assigneesList: string[];
  selectedTaskIds: Set<string>;
  onToggleSelectTask: (id: string) => void;
  onSelectAllTasks: () => void;
  focusedIndex: number;
  displayProperties: DisplayPropertiesState;
  onCardDrop: (itemId: string, targetStatus: string) => void;
}

export function TaskViewContainer({
  viewMode,
  tasks,
  localTasks,
  loading,
  loadingMore,
  hasMore,
  onRowClick,
  onUpdateTask,
  onDeleteTask,
  onFetchMore,
  assigneesList,
  selectedTaskIds,
  onToggleSelectTask,
  onSelectAllTasks,
  focusedIndex,
  displayProperties,
  onCardDrop,
}: TaskViewContainerProps) {
  return (
    <div className="flex-1 min-h-0 overflow-auto custom-scrollbar-thin">
      {viewMode === "list" && (
        <TaskTable
          tasks={tasks}
          loading={loading}
          loadingMore={loadingMore}
          hasMore={hasMore}
          onRowClick={onRowClick}
          onUpdateTask={onUpdateTask}
          onDeleteTask={onDeleteTask}
          onFetchMore={onFetchMore}
          assigneesList={assigneesList}
          selectedTaskIds={selectedTaskIds}
          onToggleSelectTask={onToggleSelectTask}
          onSelectAllTasks={onSelectAllTasks}
          focusedIndex={focusedIndex}
          displayProperties={displayProperties}
        />
      )}

      {viewMode === "kanban" && (
        <div className="w-full p-4 overflow-x-auto">
          {loading && localTasks.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 animate-pulse">
              {KANBAN_COLUMNS.map((col) => (
                <div
                  key={col.id}
                  className="bg-card/40 border border-border/50 rounded-xl p-4 min-h-[450px]"
                />
              ))}
            </div>
          ) : (
            <KanbanBoard<Task>
              items={localTasks}
              columns={KANBAN_COLUMNS}
              getColumnId={(t) => t.status}
              onCardDrop={onCardDrop}
              renderCard={(task) => (
                <TaskCard task={task} onClick={() => onRowClick(task)} />
              )}
            />
          )}
        </div>
      )}

      {viewMode === "timeline" && (
        <TaskTimelineView
          tasks={tasks}
          onRowClick={onRowClick}
          displayProperties={displayProperties}
        />
      )}
    </div>
  );
}
