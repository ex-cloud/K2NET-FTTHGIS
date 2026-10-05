import * as React from "react";
import {
  FileCode,
  X,
  ChevronUp,
  ChevronDown,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { Button } from "../button";
import { ActionTooltip } from "../tooltip";
import { cn } from "../../utils";

export interface LogsDetailDrawerTabItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  badge?: boolean;
}

export interface LogsDetailDrawerShellProps {
  title?: React.ReactNode;
  currentIndex?: number;
  totalLogsCount?: number;
  onPrevLog?: () => void;
  onNextLog?: () => void;
  hasPrevLog?: boolean;
  hasNextLog?: boolean;
  onClose: () => void;
  tabs?: LogsDetailDrawerTabItem[];
  activeTab?: string;
  onTabChange?: (tabKey: string) => void;
  statusBarSlot?: React.ReactNode;
  children: React.ReactNode;
  footerActionsSlot?: React.ReactNode;
  initialWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  className?: string;
}

function useDrawerResize(
  drawerWidth: number,
  setDrawerWidth: (w: number) => void,
  minWidth: number = 380,
  maxWidth: number = 960
) {
  const [isDragging, setIsDragging] = React.useState(false);
  const dragStartXRef = React.useRef(0);
  const dragStartWidthRef = React.useRef(drawerWidth);

  const handleMouseDown = React.useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartXRef.current = e.clientX;
    dragStartWidthRef.current = drawerWidth;
  }, [drawerWidth]);

  React.useEffect(() => {
    if (!isDragging) return;

    function handleMouseMove(e: MouseEvent) {
      const delta = dragStartXRef.current - e.clientX;
      const newWidth = Math.min(
        Math.max(minWidth, dragStartWidthRef.current + delta),
        Math.min(maxWidth, window.innerWidth - 80)
      );
      setDrawerWidth(newWidth);
    }

    function handleMouseUp() {
      setIsDragging(false);
    }

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, setDrawerWidth, minWidth, maxWidth]);

  return { isDragging, handleMouseDown };
}

function useDrawerKeyboardNav({
  hasPrevLog,
  hasNextLog,
  onPrevLog,
  onNextLog,
  onClose,
}: {
  hasPrevLog: boolean;
  hasNextLog: boolean;
  onPrevLog?: () => void;
  onNextLog?: () => void;
  onClose: () => void;
}) {
  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const activeEl = document.activeElement;
      const isInput =
        activeEl?.tagName === "INPUT" ||
        activeEl?.tagName === "TEXTAREA" ||
        (activeEl as HTMLElement)?.isContentEditable;

      if (isInput) return;

      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "k" || e.key === "ArrowUp") {
        if (hasPrevLog && onPrevLog) {
          e.preventDefault();
          onPrevLog();
        }
      } else if (e.key === "j" || e.key === "ArrowDown") {
        if (hasNextLog && onNextLog) {
          e.preventDefault();
          onNextLog();
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hasPrevLog, hasNextLog, onPrevLog, onNextLog, onClose]);
}

export function LogsDetailDrawerShell({
  title = "Log Details",
  currentIndex,
  totalLogsCount,
  onPrevLog,
  onNextLog,
  hasPrevLog = false,
  hasNextLog = false,
  onClose,
  tabs,
  activeTab,
  onTabChange,
  statusBarSlot,
  children,
  footerActionsSlot,
  initialWidth = 480,
  minWidth = 380,
  maxWidth = 960,
  className,
}: LogsDetailDrawerShellProps) {
  const [drawerWidth, setDrawerWidth] = React.useState(initialWidth);
  const [isMaximized, setIsMaximized] = React.useState(false);

  const { isDragging, handleMouseDown } = useDrawerResize(drawerWidth, setDrawerWidth, minWidth, maxWidth);
  useDrawerKeyboardNav({ hasPrevLog, hasNextLog, onPrevLog, onNextLog, onClose });

  return (
    <div
      style={{ width: isMaximized ? "min(1100px, 92vw)" : `${drawerWidth}px` }}
      className={cn(
        "absolute right-0 top-0 h-full max-w-full bg-card border-groove-l flex flex-col z-30 shadow-xl transition-all duration-200",
        isDragging && "select-none transition-none",
        className
      )}
    >
      {/* Resizable Drag Handle on the left border */}
      {!isMaximized && (
        <div
          onMouseDown={handleMouseDown}
          className={cn(
            "absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-muted-foreground/30 transition-colors z-40 group",
            isDragging && "bg-foreground w-2"
          )}
          title="Drag to resize panel"
        >
          <div className="absolute top-1/2 -translate-y-1/2 left-0 w-1 h-8 rounded-r bg-muted-foreground/30 group-hover:bg-foreground" />
        </div>
      )}

      {/* Header Bar */}
      <div className="p-2.5 px-3.5 border-groove-b flex items-center justify-between bg-muted/20 shrink-0 select-none">
        <div className="flex items-center gap-2 min-w-0">
          <FileCode className="w-4 h-4 text-muted-foreground shrink-0" />
          <span className="font-medium text-foreground font-sans text-xs truncate">
            {title}
          </span>
          {currentIndex !== undefined && totalLogsCount !== undefined && currentIndex >= 0 && (
            <span className="text-[10px] font-mono text-muted-foreground px-1.5 py-0.5 rounded bg-muted/60 border border-border/50 shrink-0 font-medium">
              {currentIndex + 1} / {totalLogsCount}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {onPrevLog && (
            <ActionTooltip label="Previous log (k or ↑)" side="bottom">
              <Button
                variant="ghost"
                size="sm"
                onClick={onPrevLog}
                disabled={!hasPrevLog}
                className="h-6.5 w-6.5 p-0 text-muted-foreground hover:text-foreground disabled:opacity-30 cursor-pointer font-medium"
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </Button>
            </ActionTooltip>
          )}

          {onNextLog && (
            <ActionTooltip label="Next log (j or ↓)" side="bottom">
              <Button
                variant="ghost"
                size="sm"
                onClick={onNextLog}
                disabled={!hasNextLog}
                className="h-6.5 w-6.5 p-0 text-muted-foreground hover:text-foreground disabled:opacity-30 cursor-pointer font-medium"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </Button>
            </ActionTooltip>
          )}

          <div className="h-3.5 w-px bg-border/60 mx-1" />

          <ActionTooltip label={isMaximized ? "Restore panel size" : "Expand panel"} side="bottom">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMaximized((m) => !m)}
              className="h-6.5 w-6.5 p-0 text-muted-foreground hover:text-foreground cursor-pointer font-medium"
            >
              {isMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </Button>
          </ActionTooltip>

          <ActionTooltip label="Close panel (Esc)" side="bottom">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6.5 w-6.5 p-0 text-muted-foreground hover:text-foreground cursor-pointer font-medium"
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </ActionTooltip>
        </div>
      </div>

      {/* Optional Status Bar / Metadata Subheader Slot */}
      {statusBarSlot}

      {/* Optional Tab Navigator Header */}
      {tabs && tabs.length > 0 && onTabChange && (
        <div className="flex items-center border-groove-b bg-muted/20 px-3.5 pt-1.5 gap-2 shrink-0 select-none">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                type="button"
                key={tab.key}
                onClick={() => onTabChange(tab.key)}
                className={cn(
                  "flex items-center gap-1.5 py-1.5 px-2.5 text-xs font-medium border-b-2 transition-colors cursor-pointer",
                  isActive
                    ? "border-foreground text-foreground font-medium"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {tab.badge && <span className="w-1.5 h-1.5 rounded-full bg-foreground" />}
              </button>
            );
          })}
        </div>
      )}

      {/* Scrollable Content Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar text-xs">
        {children}
      </div>

      {/* Footer Actions */}
      {footerActionsSlot && (
        <div className="p-3 border-groove-t bg-muted/20 flex items-center justify-between gap-2 shrink-0 select-none">
          {footerActionsSlot}
        </div>
      )}
    </div>
  );
}
