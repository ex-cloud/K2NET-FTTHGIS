import * as React from "react";
import type { Table, VisibilityState } from "@tanstack/react-table";
import type { AuditStreamEntry } from "@/hooks/use-audit-log-stream";
import { LogsColumnPickerCore, type LogsColumnItem } from "@k2net/ui";

export interface ColumnPickerProps {
  table: Table<AuditStreamEntry>;
  columnVisibility: VisibilityState;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  onClose: () => void;
}

export function ColumnPicker({ table, columnVisibility, anchorRef, onClose }: ColumnPickerProps) {
  const allColumns = table.getAllLeafColumns().filter((col) => col.id !== "select" && col.id !== "level");

  const columnItems: LogsColumnItem[] = React.useMemo(() => {
    return allColumns.map((col) => ({
      id: col.id,
      label: (col.columnDef.meta as { label?: string })?.label ?? col.id,
      visible: (columnVisibility as Record<string, boolean>)?.[col.id] !== false,
    }));
  }, [allColumns, columnVisibility]);

  const handleToggleColumn = React.useCallback((columnId: string, visible: boolean) => {
    const col = table.getColumn(columnId);
    col?.toggleVisibility(visible);
  }, [table]);

  return (
    <LogsColumnPickerCore
      columns={columnItems}
      onToggleColumn={handleToggleColumn}
      anchorRef={anchorRef}
      onClose={onClose}
    />
  );
}
