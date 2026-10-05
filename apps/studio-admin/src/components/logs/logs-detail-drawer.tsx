import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  FileCode,
  X,
  Copy,
  ChevronUp,
  ChevronDown,
  Maximize2,
  Minimize2,
  Info,
  Layers,
  Code2,
} from "lucide-react";
import { Button, ActionTooltip, cn } from "@k2net/ui";
import { type AuditStreamEntry } from "@/hooks/use-audit-log-stream";
import { useTranslation } from "@k2net/i18n";
import { useLogsFilter, type AdvancedFilter } from "./logs-filter-context";
import { toast } from "sonner";
import {
  DrawerStatusBar,
  OverviewTab,
  MetadataDiffTab,
} from "./logs-detail-drawer-tabs";

export interface LogsDetailDrawerProps {
  selectedLog: AuditStreamEntry;
  onClose: () => void;
  onCopyLog: (log: AuditStreamEntry, e: React.MouseEvent) => void;
  onPrevLog?: () => void;
  onNextLog?: () => void;
  hasPrevLog?: boolean;
  hasNextLog?: boolean;
  currentIndex?: number;
  totalLogsCount?: number;
}

type TabKey = "overview" | "metadata" | "json";

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
  useEffect(() => {
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

function useDrawerResize(drawerWidth: number, setDrawerWidth: (w: number) => void) {
  const [isDragging, setIsDragging] = useState(false);
  const dragStartXRef = useRef(0);
  const dragStartWidthRef = useRef(drawerWidth);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartXRef.current = e.clientX;
    dragStartWidthRef.current = drawerWidth;
  }, [drawerWidth]);

  useEffect(() => {
    if (!isDragging) return;

    function handleMouseMove(e: MouseEvent) {
      const delta = dragStartXRef.current - e.clientX;
      const newWidth = Math.min(
        Math.max(380, dragStartWidthRef.current + delta),
        Math.min(960, window.innerWidth - 80)
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
  }, [isDragging, setDrawerWidth]);

  return { isDragging, handleMouseDown };
}

function DrawerHeader({
  currentIndex,
  totalLogsCount,
  onPrevLog,
  onNextLog,
  hasPrevLog,
  hasNextLog,
  isMaximized,
  setIsMaximized,
  onClose,
  t,
}: {
  currentIndex?: number;
  totalLogsCount?: number;
  onPrevLog?: () => void;
  onNextLog?: () => void;
  hasPrevLog: boolean;
  hasNextLog: boolean;
  isMaximized: boolean;
  setIsMaximized: React.Dispatch<React.SetStateAction<boolean>>;
  onClose: () => void;
  t: ReturnType<typeof useTranslation>["t"];
}) {
  return (
    <div className="p-2.5 px-3.5 border-groove-b flex items-center justify-between bg-muted/20 shrink-0">
      <div className="flex items-center gap-2 min-w-0">
        <FileCode className="w-4 h-4 text-muted-foreground shrink-0" />
        <span className="font-semibold text-foreground font-sans text-xs truncate">
          {t("observability.log_details") || "Log Details"}
        </span>
        {currentIndex !== undefined && totalLogsCount !== undefined && currentIndex >= 0 && (
          <span className="text-[10px] font-mono text-muted-foreground px-1.5 py-0.5 rounded bg-muted/60 border border-border/50 shrink-0">
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
              className="h-6.5 w-6.5 p-0 text-muted-foreground hover:text-foreground disabled:opacity-30 cursor-pointer"
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
              className="h-6.5 w-6.5 p-0 text-muted-foreground hover:text-foreground disabled:opacity-30 cursor-pointer"
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
            className="h-6.5 w-6.5 p-0 text-muted-foreground hover:text-foreground cursor-pointer"
          >
            {isMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </Button>
        </ActionTooltip>

        <ActionTooltip label="Close panel (Esc)" side="bottom">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-6.5 w-6.5 p-0 text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        </ActionTooltip>
      </div>
    </div>
  );
}

function DrawerTabsHeader({
  activeTab,
  setActiveTab,
  hasMetadataBadge,
}: {
  activeTab: TabKey;
  setActiveTab: (t: TabKey) => void;
  hasMetadataBadge: boolean;
}) {
  return (
    <div className="flex items-center border-groove-b bg-muted/20 px-3.5 pt-1.5 gap-2 shrink-0">
      <button
        type="button"
        onClick={() => setActiveTab("overview")}
        className={cn(
          "flex items-center gap-1.5 py-1.5 px-2.5 text-xs font-medium border-b-2 transition-colors cursor-pointer",
          activeTab === "overview"
            ? "border-foreground text-foreground font-semibold"
            : "border-transparent text-muted-foreground hover:text-foreground"
        )}
      >
        <Info className="w-3.5 h-3.5" />
        <span>Overview</span>
      </button>

      <button
        type="button"
        onClick={() => setActiveTab("metadata")}
        className={cn(
          "flex items-center gap-1.5 py-1.5 px-2.5 text-xs font-medium border-b-2 transition-colors cursor-pointer",
          activeTab === "metadata"
            ? "border-foreground text-foreground font-semibold"
            : "border-transparent text-muted-foreground hover:text-foreground"
        )}
      >
        <Layers className="w-3.5 h-3.5" />
        <span>Metadata & Diff</span>
        {hasMetadataBadge && <span className="w-1.5 h-1.5 rounded-full bg-foreground" />}
      </button>

      <button
        type="button"
        onClick={() => setActiveTab("json")}
        className={cn(
          "flex items-center gap-1.5 py-1.5 px-2.5 text-xs font-medium border-b-2 transition-colors cursor-pointer",
          activeTab === "json"
            ? "border-foreground text-foreground font-semibold"
            : "border-transparent text-muted-foreground hover:text-foreground"
        )}
      >
        <Code2 className="w-3.5 h-3.5" />
        <span>Raw JSON</span>
      </button>
    </div>
  );
}

function DrawerJsonTab({
  log,
  onCopyLog,
}: {
  log: AuditStreamEntry;
  onCopyLog: (log: AuditStreamEntry, e: React.MouseEvent) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
          Full Audit Event JSON
        </span>
        <button
          type="button"
          onClick={(e) => onCopyLog(log, e)}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground font-sans px-2 py-1 rounded border border-border/60 bg-card hover:bg-muted transition-colors cursor-pointer shadow-xs"
        >
          <Copy className="w-3 h-3" />
          <span>Copy Raw JSON</span>
        </button>
      </div>
      <pre className="bg-muted/20 p-3 rounded-lg border border-border/60 text-xs text-foreground/90 overflow-x-auto whitespace-pre-wrap font-mono select-text leading-relaxed">
        {JSON.stringify(log, null, 2)}
      </pre>
    </div>
  );
}

export function LogsDetailDrawer({
  selectedLog,
  onClose,
  onCopyLog,
  onPrevLog,
  onNextLog,
  hasPrevLog = false,
  hasNextLog = false,
  currentIndex,
  totalLogsCount,
}: LogsDetailDrawerProps) {
  const { t } = useTranslation();
  const { addAdvancedFilter } = useLogsFilter();

  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [drawerWidth, setDrawerWidth] = useState(480);
  const [isMaximized, setIsMaximized] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const { isDragging, handleMouseDown } = useDrawerResize(drawerWidth, setDrawerWidth);
  useDrawerKeyboardNav({ hasPrevLog, hasNextLog, onPrevLog, onNextLog, onClose });

  const hash = selectedLog.metadata?.hash as string | undefined;
  const hasMetadataDiff = Boolean(selectedLog.oldValue || selectedLog.newValue);
  const hasExtendedMetadata = Boolean(
    selectedLog.metadata &&
      Object.keys(selectedLog.metadata).some(
        (k) =>
          ![
            "oldValue",
            "newValue",
            "isImpersonated",
            "realActorId",
            "impersonationSessionId",
            "impersonatedTenantId",
            "scope",
            "projectId",
            "projectName",
            "severity",
            "logGroup",
            "hash",
            "prevHash",
          ].includes(k)
      )
  );

  const handleCopyValue = useCallback((key: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopiedKey(key);
    toast.success(`Copied ${key} to clipboard`);
    setTimeout(() => setCopiedKey(null), 1800);
  }, []);

  const handleQuickFilter = useCallback(
    (field: AdvancedFilter["field"], value: string, operator: AdvancedFilter["operator"] = "eq") => {
      addAdvancedFilter({
        id: crypto.randomUUID(),
        field,
        operator,
        value,
      });
      const opLabel = operator === "eq" ? "=" : "!=";
      toast.success(`Filter added: ${field} ${opLabel} "${value}"`);
    },
    [addAdvancedFilter]
  );

  return (
    <div
      style={{ width: isMaximized ? "min(1100px, 92vw)" : `${drawerWidth}px` }}
      className={cn(
        "absolute right-0 top-0 h-full max-w-full bg-card border-groove-l flex flex-col z-30 shadow-2xl transition-all duration-200",
        isDragging && "select-none transition-none"
      )}
    >
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

      <DrawerHeader
        currentIndex={currentIndex}
        totalLogsCount={totalLogsCount}
        onPrevLog={onPrevLog}
        onNextLog={onNextLog}
        hasPrevLog={hasPrevLog}
        hasNextLog={hasNextLog}
        isMaximized={isMaximized}
        setIsMaximized={setIsMaximized}
        onClose={onClose}
        t={t}
      />

      <DrawerStatusBar
        hash={hash}
        isImpersonated={selectedLog.isImpersonated}
        realActorId={selectedLog.realActorId}
        actor={selectedLog.actor}
        tenantSlug={selectedLog.tenantSlug}
        onCopyValue={handleCopyValue}
        copiedKey={copiedKey}
      />

      <DrawerTabsHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        hasMetadataBadge={hasMetadataDiff || hasExtendedMetadata}
      />

      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar text-xs">
        {activeTab === "overview" && (
          <OverviewTab
            log={selectedLog}
            onCopyValue={handleCopyValue}
            copiedKey={copiedKey}
            onQuickFilter={handleQuickFilter}
          />
        )}

        {activeTab === "metadata" && <MetadataDiffTab log={selectedLog} />}

        {activeTab === "json" && (
          <DrawerJsonTab log={selectedLog} onCopyLog={onCopyLog} />
        )}
      </div>

      <div className="p-3 border-groove-t bg-muted/20 flex items-center justify-between gap-2 shrink-0 select-none">
        <span className="text-[10px] text-muted-foreground font-mono hidden sm:inline">
          Use &apos;j&apos; / &apos;k&apos; to navigate • &apos;Esc&apos; to close
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => onCopyLog(selectedLog, e)}
          className="text-xs font-mono gap-1.5 h-7.5 px-3 border-border/70 bg-card hover:bg-muted cursor-pointer ml-auto shadow-xs"
        >
          <Copy className="w-3 h-3" />
          <span>{t("observability.copy_raw_event_json") || "Copy Raw JSON"}</span>
        </Button>
      </div>
    </div>
  );
}

