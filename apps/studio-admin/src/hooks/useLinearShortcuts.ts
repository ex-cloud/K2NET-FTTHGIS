"use client";

import { useEffect, useCallback } from "react";

interface UseLinearShortcutsOptions {
  onNewTask?: () => void;
  onNewProject?: () => void;
  onNextRow?: () => void;
  onPrevRow?: () => void;
  onOpenSelected?: () => void;
  onToggleSelectRow?: () => void;
  onClearSelection?: () => void;
  onStatusShortcut?: () => void;
  onPriorityShortcut?: () => void;
  onAssigneeShortcut?: () => void;
  onToggleHelp?: () => void;
  enabled?: boolean;
}

export function useLinearShortcuts({
  onNewTask,
  onNewProject,
  onNextRow,
  onPrevRow,
  onOpenSelected,
  onToggleSelectRow,
  onClearSelection,
  onStatusShortcut,
  onPriorityShortcut,
  onAssigneeShortcut,
  onToggleHelp,
  enabled = true,
}: UseLinearShortcutsOptions) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;

      // Ignore if user is currently typing in an input, textarea, or contenteditable
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable ||
        target.closest("[role='dialog']")?.contains(target) && target.tagName !== "BODY"
      ) {
        // If Escape is pressed inside input/dialog, let it bubble normally
        return;
      }

      // Check key combinations
      const key = e.key;
      const isShift = e.shiftKey;
      const isCtrlOrMeta = e.ctrlKey || e.metaKey;

      if (isCtrlOrMeta) return; // Don't intercept browser/system shortcuts

      // 1. C -> New Task
      if (key === "c" || key === "C") {
        if (!isShift) {
          e.preventDefault();
          onNewTask?.();
          return;
        }
      }

      // 2. Shift + P -> New Project
      if (isShift && (key === "p" || key === "P")) {
        e.preventDefault();
        onNewProject?.();
        return;
      }

      // 3. J / Down Arrow -> Next Row
      if (key === "j" || key === "J" || key === "ArrowDown") {
        e.preventDefault();
        onNextRow?.();
        return;
      }

      // 4. K / Up Arrow -> Prev Row
      if (key === "k" || key === "K" || key === "ArrowUp") {
        e.preventDefault();
        onPrevRow?.();
        return;
      }

      // 5. Space / Enter -> Open Selected Task / Drawer
      if (key === "Enter" || key === " ") {
        e.preventDefault();
        onOpenSelected?.();
        return;
      }

      // 6. X -> Toggle Selection of Active Row
      if (key === "x" || key === "X") {
        e.preventDefault();
        onToggleSelectRow?.();
        return;
      }

      // 7. Escape -> Clear Selection
      if (key === "Escape") {
        e.preventDefault();
        onClearSelection?.();
        return;
      }

      // 8. S -> Quick Status Menu
      if (key === "s" || key === "S") {
        e.preventDefault();
        onStatusShortcut?.();
        return;
      }

      // 9. P -> Quick Priority Menu
      if (key === "p" || key === "P") {
        e.preventDefault();
        onPriorityShortcut?.();
        return;
      }

      // 10. A -> Quick Assignee Menu
      if (key === "a" || key === "A") {
        e.preventDefault();
        onAssigneeShortcut?.();
        return;
      }

      // 11. ? -> Keyboard Help Modal
      if (key === "?") {
        e.preventDefault();
        onToggleHelp?.();
        return;
      }
    },
    [
      enabled,
      onNewTask,
      onNewProject,
      onNextRow,
      onPrevRow,
      onOpenSelected,
      onToggleSelectRow,
      onClearSelection,
      onStatusShortcut,
      onPriorityShortcut,
      onAssigneeShortcut,
      onToggleHelp,
    ]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}
