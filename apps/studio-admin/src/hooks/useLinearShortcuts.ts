

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

function isEditableTarget(target: HTMLElement): boolean {
  return (
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT" ||
    target.isContentEditable ||
    Boolean(target.closest("[role='dialog']")?.contains(target) && target.tagName !== "BODY")
  );
}

function handleShortcutKey(
  key: string,
  isShift: boolean,
  options: UseLinearShortcutsOptions
): boolean {
  const lower = key.toLowerCase();

  if (isShift) {
    if (lower === "p" && options.onNewProject) {
      options.onNewProject();
      return true;
    }
    return false;
  }

  const actionMap: Record<string, (() => void) | undefined> = {
    c: options.onNewTask,
    j: options.onNextRow,
    arrowdown: options.onNextRow,
    k: options.onPrevRow,
    arrowup: options.onPrevRow,
    enter: options.onOpenSelected,
    " ": options.onOpenSelected,
    x: options.onToggleSelectRow,
    escape: options.onClearSelection,
    s: options.onStatusShortcut,
    p: options.onPriorityShortcut,
    a: options.onAssigneeShortcut,
    "?": options.onToggleHelp,
  };

  const action = actionMap[lower] ?? actionMap[key];
  if (action) {
    action();
    return true;
  }

  return false;
}

export function useLinearShortcuts(options: UseLinearShortcutsOptions) {
  const { enabled = true } = options;

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled || e.ctrlKey || e.metaKey) return;
      if (isEditableTarget(e.target as HTMLElement)) return;

      const handled = handleShortcutKey(e.key, e.shiftKey, options);
      if (handled) {
        e.preventDefault();
      }
    },
    [enabled, options]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}
