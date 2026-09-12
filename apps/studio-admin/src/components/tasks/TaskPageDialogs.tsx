import { TaskBulkActionBar } from "@/components/tasks/TaskBulkActionBar";
import { TaskShortcutsHelpDialog } from "@/components/tasks/TaskShortcutsHelpDialog";
import { TaskBatchDeleteDialog } from "@/components/tasks/TaskBatchDeleteDialog";
import { TaskDetailSheet } from "@/components/tasks/TaskDetailSheet";
import { NewTaskDialog } from "@/components/tasks/NewTaskDialog";
import type { useTaskDialogsState } from "@/components/tasks/use-task-dialogs-state";
import type { useTasksPageOperations } from "@/components/tasks/use-tasks-page-operations";

interface TaskPageDialogsProps {
  dialogs: ReturnType<typeof useTaskDialogsState>;
  operations: ReturnType<typeof useTasksPageOperations>;
  assigneesList: string[];
  dynamicProjectsList: string[];
  refresh: () => void;
}

export function TaskPageDialogs({
  dialogs,
  operations,
  assigneesList,
  dynamicProjectsList,
  refresh,
}: TaskPageDialogsProps) {
  return (
    <>
      <TaskBulkActionBar
        selectedCount={operations.selectedTaskIds.size}
        onClearSelection={operations.handleClearSelection}
        onBatchUpdateStatus={operations.handleBatchUpdateStatus}
        onBatchUpdatePriority={operations.handleBatchUpdatePriority}
        onBatchUpdateAssignee={operations.handleBatchUpdateAssignee}
        onBatchUpdateScope={operations.handleBatchUpdateScope}
        onBatchDelete={operations.handleRequestBatchDelete}
      />

      <TaskBatchDeleteDialog
        open={operations.deleteConfirmOpen}
        onOpenChange={operations.setDeleteConfirmOpen}
        selectedCount={operations.selectedTaskIds.size}
        onConfirmDelete={operations.handleConfirmBatchDelete}
        loading={operations.deleteLoading}
      />

      <TaskShortcutsHelpDialog
        open={dialogs.shortcutsHelpOpen}
        onOpenChange={dialogs.setShortcutsHelpOpen}
      />

      <TaskDetailSheet
        task={dialogs.sheetTask}
        open={dialogs.sheetOpen}
        onOpenChange={dialogs.handleCloseSheet}
        onSave={operations.handleSaveTask}
        onDelete={operations.handleDeleteTask}
        assigneesList={assigneesList}
      />

      <NewTaskDialog
        open={dialogs.dialogOpen}
        onOpenChange={dialogs.setDialogOpen}
        onSuccess={refresh}
        assigneesList={assigneesList}
        projectsList={dynamicProjectsList}
      />
    </>
  );
}
