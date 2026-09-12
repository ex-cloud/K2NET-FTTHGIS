import { useState, useCallback } from "react";
import type { Task } from "@/hooks/useTasksQuery";

export function useTaskDialogsState() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [shortcutsHelpOpen, setShortcutsHelpOpen] = useState(false);
  const [sheetTask, setSheetTask] = useState<Task | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const handleOpenSheet = useCallback((task: Task) => {
    setSheetTask(task);
    setSheetOpen(true);
  }, []);

  const handleCloseSheet = useCallback((open: boolean) => {
    setSheetOpen(open);
    if (!open) setSheetTask(null);
  }, []);

  return {
    dialogOpen,
    setDialogOpen,
    shortcutsHelpOpen,
    setShortcutsHelpOpen,
    sheetTask,
    sheetOpen,
    handleOpenSheet,
    handleCloseSheet,
  };
}
