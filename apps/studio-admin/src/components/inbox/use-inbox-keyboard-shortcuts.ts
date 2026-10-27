import * as React from "react";
import type { InboxQueueItem } from "./inbox-types";

interface UseInboxKeyboardShortcutsParams {
  visibleItems: InboxQueueItem[];
  selectedItemId: string | null;
  selectedItem: InboxQueueItem | null;
  onSelectItem: (id: string) => void;
  onResolveAndNext?: (taskId: string) => Promise<void>;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
}

function isInputElement(target: HTMLElement | null): boolean {
  if (!target) return false;
  return target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;
}

function handleNavigationStep(
  e: KeyboardEvent,
  visibleItems: InboxQueueItem[],
  selectedItemId: string | null,
  onSelectItem: (id: string) => void
): boolean {
  const isDown = e.key === "j" || e.key === "ArrowDown";
  const isUp = e.key === "k" || e.key === "ArrowUp";
  if (!isDown && !isUp) return false;

  e.preventDefault();
  const currentIndex = visibleItems.findIndex((i) => i.id === selectedItemId);
  if (isDown && currentIndex < visibleItems.length - 1) {
    const nextItem = visibleItems[currentIndex + 1];
    if (nextItem) onSelectItem(nextItem.id);
  } else if (isUp && currentIndex > 0) {
    const prevItem = visibleItems[currentIndex - 1];
    if (prevItem) onSelectItem(prevItem.id);
  }
  return true;
}

function handleResolutionAction(
  e: KeyboardEvent,
  selectedItem: InboxQueueItem | null,
  onResolveAndNext?: (taskId: string) => Promise<void>
): boolean {
  const isActionKey = e.key === "e" || e.key === "x" || ((e.ctrlKey || e.metaKey) && e.key === "Enter");
  if (!isActionKey || !selectedItem || !onResolveAndNext) return false;

  const isResolvableTask =
    selectedItem.rawItem.type === "TASK" &&
    selectedItem.status !== "RESOLVED" &&
    selectedItem.status !== "CLOSED";

  if (isResolvableTask) {
    e.preventDefault();
    onResolveAndNext(selectedItem.id);
    return true;
  }
  return false;
}

export function useInboxKeyboardShortcuts({
  visibleItems,
  selectedItemId,
  selectedItem,
  onSelectItem,
  onResolveAndNext,
  searchInputRef,
}: UseInboxKeyboardShortcutsParams) {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;

      if (isInputElement(target)) {
        if (e.key === "Escape") target?.blur();
        return;
      }

      if (e.key === "/" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      if (handleNavigationStep(e, visibleItems, selectedItemId, onSelectItem)) {
        return;
      }

      handleResolutionAction(e, selectedItem, onResolveAndNext);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [visibleItems, selectedItemId, selectedItem, onSelectItem, onResolveAndNext, searchInputRef]);
}
