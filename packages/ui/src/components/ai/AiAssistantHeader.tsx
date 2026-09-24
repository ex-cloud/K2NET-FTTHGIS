import React from "react";
import {
  Sparkles,
  X,
  Maximize2,
  Plus,
  History,
  SlidersHorizontal,
  Download,
  ChevronLeft,
} from "lucide-react";
import { cn } from "../../utils";
import { Badge } from "../badge";
import { ActionTooltip } from "../tooltip";
import type { DrawerView } from "./types";

export interface AiAssistantHeaderProps {
  view?: DrawerView;
  title?: string;
  subtitle?: string;
  badgeLabel?: string;
  sessionsCount?: number;
  showHistory?: boolean;
  showSettingsButton?: boolean;
  showExportButton?: boolean;
  hasMessages?: boolean;
  onBack?: () => void;
  onNewChat: () => void;
  onToggleHistory?: () => void;
  onToggleSettings?: () => void;
  onExportMarkdown?: () => void;
  onMaximize?: () => void;
  onClose: () => void;
  className?: string;
}

const VIEW_TITLES: Record<DrawerView, string> = {
  chat: "Ask AI",
  history: "Riwayat Percakapan",
  onboarding: "K2 Agent Access",
  permissions: "Review Permissions",
  settings: "K2 Agent Settings",
};

export function AiAssistantHeader({
  view = "chat",
  title,
  subtitle = "RAG Knowledge Base • Spasial PostGIS",
  badgeLabel,
  sessionsCount = 0,
  showHistory = false,
  showSettingsButton = false,
  showExportButton = false,
  hasMessages = false,
  onBack,
  onNewChat,
  onToggleHistory,
  onToggleSettings,
  onExportMarkdown,
  onMaximize,
  onClose,
  className,
}: AiAssistantHeaderProps) {
  const displayTitle = title || VIEW_TITLES[view] || "Ask AI";

  return (
    <div
      className={cn(
        "flex h-12 items-center justify-between border-b border-border/60 px-4 bg-background/95 backdrop-blur-md shrink-0 select-none",
        className
      )}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        {onBack && view !== "chat" && (
          <button
            type="button"
            onClick={onBack}
            className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer shrink-0"
            title="Kembali"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}

        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 border border-primary/30 text-primary shadow-2xs shrink-0">
          <Sparkles className="h-4 w-4" />
        </div>

        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-xs text-foreground truncate">{displayTitle}</span>
            {view === "chat" && badgeLabel && (
              <Badge
                variant="outline"
                className="border-primary/40 bg-primary/10 text-primary text-[9px] font-mono px-1 py-0 shrink-0"
              >
                {badgeLabel}
              </Badge>
            )}
          </div>
          {subtitle && (
            <span className="text-[10px] text-muted-foreground font-mono truncate">
              {subtitle}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {view === "chat" && (
          <>
            <ActionTooltip label="Mulai Percakapan Baru" shortcut="Alt+N" side="bottom">
              <button
                type="button"
                onClick={onNewChat}
                className="flex items-center gap-1 h-7 px-2 rounded-md bg-card hover:bg-muted text-foreground text-xs font-medium border border-border/70 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-primary" />
                <span className="hidden sm:inline">New</span>
              </button>
            </ActionTooltip>

            {onToggleHistory && (
              <ActionTooltip label="Riwayat Percakapan" shortcut="Alt+H" side="bottom">
                <button
                  type="button"
                  onClick={onToggleHistory}
                  className={cn(
                    "h-7 w-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer relative",
                    showHistory && "text-primary bg-primary/10 border border-primary/20"
                  )}
                >
                  <History className="w-3.5 h-3.5" />
                  {sessionsCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-primary text-primary-foreground text-[8px] font-bold flex items-center justify-center">
                      {sessionsCount}
                    </span>
                  )}
                </button>
              </ActionTooltip>
            )}

            {showSettingsButton && onToggleSettings && (
              <ActionTooltip label="Pengaturan Agen & Akses" shortcut="Alt+P" side="bottom">
                <button
                  type="button"
                  onClick={onToggleSettings}
                  className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                </button>
              </ActionTooltip>
            )}

            {showExportButton && hasMessages && onExportMarkdown && (
              <ActionTooltip label="Ekspor Percakapan (Markdown)" shortcut="Ctrl+E" side="bottom">
                <button
                  type="button"
                  onClick={onExportMarkdown}
                  className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </ActionTooltip>
            )}

            {onMaximize && (
              <ActionTooltip label="Mode Layar Penuh" shortcut="Alt+F" side="bottom">
                <button
                  type="button"
                  onClick={onMaximize}
                  className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </ActionTooltip>
            )}
          </>
        )}

        <ActionTooltip label="Tutup Assistant" shortcut="Esc" side="bottom">
          <button
            type="button"
            onClick={onClose}
            className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </ActionTooltip>
      </div>
    </div>
  );
}
