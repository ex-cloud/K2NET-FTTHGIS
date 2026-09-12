import React from "react";
import { PanelLeftClose, SlidersHorizontal, Download, Minimize2, X } from "lucide-react";
import { ActionTooltip } from "@k2net/ui";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/hooks/useAiChatStream";

interface FullscreenHeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  rightPanelOpen: boolean;
  setRightPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setRightPanelView: (v: "summary" | "permissions") => void;
  messages: ChatMessage[];
  exportChatToMarkdown: (messages: ChatMessage[]) => void;
  onExitFullscreen: () => void;
}

export function FullscreenHeader({
  sidebarOpen,
  setSidebarOpen,
  rightPanelOpen,
  setRightPanelOpen,
  setRightPanelView,
  messages,
  exportChatToMarkdown,
  onExitFullscreen,
}: FullscreenHeaderProps) {
  return (
    <header className="flex items-center justify-between px-6 py-2.5 border-b border-border/60 bg-background/95 backdrop-blur-md flex-shrink-0">
      <div className="flex items-center gap-3">
        {!sidebarOpen && (
          <ActionTooltip label="Buka Sidebar Riwayat" shortcut="Alt+S" side="bottom">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <PanelLeftClose className="w-3.5 h-3.5 rotate-180" />
            </button>
          </ActionTooltip>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <ActionTooltip label="K2 Agent Configuration Panel" shortcut="Alt+P" side="bottom">
          <button
            onClick={() => {
              setRightPanelOpen((prev) => !prev);
              setRightPanelView("summary");
            }}
            className={cn(
              "flex items-center gap-1.5 h-7 px-2.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer",
              rightPanelOpen
                ? "bg-primary/15 border-primary/40 text-primary"
                : "bg-card hover:bg-muted border-border/70 text-muted-foreground hover:text-foreground"
            )}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Config</span>
          </button>
        </ActionTooltip>

        {messages.length > 0 && (
          <ActionTooltip label="Ekspor Percakapan (Markdown)" shortcut="Ctrl+E" side="bottom">
            <button
              onClick={() => exportChatToMarkdown(messages)}
              className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </ActionTooltip>
        )}

        <ActionTooltip label="Kembali ke Mode Floating Drawer" shortcut="Alt+F" side="bottom">
          <button
            onClick={onExitFullscreen}
            className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>
        </ActionTooltip>

        <ActionTooltip label="Tutup Mode Layar Penuh" shortcut="Esc" side="bottom">
          <button
            onClick={onExitFullscreen}
            className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </ActionTooltip>
      </div>
    </header>
  );
}
