import * as React from "react";
import { Search, Check } from "lucide-react";
import { createPortal } from "react-dom";
import type { Table, VisibilityState } from "@tanstack/react-table";
import type { AuditStreamEntry } from "@/hooks/use-audit-log-stream";
import { Checkbox } from "@k2net/ui";

export interface ColumnPickerProps {
  table: Table<AuditStreamEntry>;
  columnVisibility: VisibilityState;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  onClose: () => void;
}

export function ColumnPicker({ table, columnVisibility, anchorRef, onClose }: ColumnPickerProps) {
  const [mounted, setMounted] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [coords, setCoords] = React.useState({ top: 0, right: 0 });
  const panelRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setMounted(true);
    if (anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setCoords({ top: rect.bottom + window.scrollY + 4, right: window.innerWidth - rect.right + window.scrollX });
    }
  }, [anchorRef]);

  React.useEffect(() => {
    function handleOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (panelRef.current && !panelRef.current.contains(target) && anchorRef.current && !anchorRef.current.contains(target)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [onClose, anchorRef]);

  const allColumns = table.getAllLeafColumns().filter((col) => col.id !== "select" && col.id !== "level");
  const filtered = search.trim()
    ? allColumns.filter((col) => ((col.columnDef.meta as { label?: string })?.label ?? col.id).toLowerCase().includes(search.toLowerCase()))
    : allColumns;

  if (!mounted) return null;

  return createPortal(
    <div
      ref={panelRef}
      style={{ position: "absolute", top: `${coords.top}px`, right: `${coords.right}px` }}
      className="z-[9999] w-[220px] rounded-xl border border-border bg-card shadow-xl overflow-hidden font-mono text-xs text-foreground animate-in fade-in zoom-in-95 duration-100"
    >
      <div className="px-3 pt-3 pb-2 border-groove-b">
        <div className="relative">
          <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search columns..."
            className="w-full pl-6 pr-2 py-1.5 text-[11px] bg-muted/30 border border-border/60 rounded-md text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-border"
          />
        </div>
      </div>
      <div className="px-1.5 py-1.5 max-h-[280px] overflow-y-auto custom-scrollbar-thin">
        {filtered.map((col) => {
          const label = (col.columnDef.meta as { label?: string })?.label ?? col.id;
          const isVisible = (columnVisibility as Record<string, boolean>)?.[col.id] !== false;
          return (
            <label key={col.id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted/50 cursor-pointer transition-colors">
              <Checkbox
                checked={isVisible}
                onCheckedChange={(checked) => col.toggleVisibility(!!checked)}
                className="size-3.5 rounded-[3px]"
              />
              <span className="text-[11px] text-foreground/80">{label}</span>
              {isVisible && <Check className="w-3 h-3 text-foreground ml-auto shrink-0" />}
            </label>
          );
        })}
      </div>
    </div>,
    document.body
  );
}
