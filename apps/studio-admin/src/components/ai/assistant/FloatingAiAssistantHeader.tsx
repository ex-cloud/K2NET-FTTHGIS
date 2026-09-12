import React from "react";
import { SheetHeader, SheetTitle, Badge, ActionTooltip } from "@k2net/ui";
import {
  Sparkles,
  X,
  ChevronRight,
  Maximize2,
  Plus,
  History,
  SlidersHorizontal,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AgentAuthorizationData } from "@/lib/actions/gateways";
import type { Message } from "@/hooks/useAiChatStream";

export type DrawerView = "chat" | "onboarding" | "permissions" | "settings";

const VIEW_TITLE: Record<DrawerView, string> = {
  chat: "K2NET Ask AI",
  onboarding: "K2 Agent Access",
  permissions: "Review Permissions",
  settings: "K2 Agent Settings",
};

interface FloatingAiAssistantHeaderProps {
  view: DrawerView;
  agentAuth: AgentAuthorizationData | null;
  messages: Message[];
  sessionsCount: number;
  showHistoryInDrawer: boolean;
  setView: (v: DrawerView) => void;
  setIsOpen: (open: boolean) => void;
  setIsFullscreen: (fs: boolean) => void;
  setShowHistoryInDrawer: React.Dispatch<React.SetStateAction<boolean>>;
  setShowTokenMenu: (open: boolean) => void;
  setPermSearch: (s: string) => void;
  createNewSession: () => void;
  exportChatToMarkdown: (messages: Message[]) => void;
}

export function FloatingAiAssistantHeader({
  view,
  agentAuth,
  messages,
  sessionsCount,
  showHistoryInDrawer,
  setView,
  setIsOpen,
  setIsFullscreen,
  setShowHistoryInDrawer,
  setShowTokenMenu,
  setPermSearch,
  createNewSession,
  exportChatToMarkdown,
}: FloatingAiAssistantHeaderProps) {
  const subtitle =
    view === "chat"
      ? "160+ Dokumen FTTH • Spasial PostGIS"
      : view === "settings"
      ? `Scope: PLATFORM_INTERNAL • ${agentAuth?.access_tier || "FULL"}`
      : "K2NET Core Platform (Root HQ)";

  return (
    <SheetHeader className="px-4 py-2.5 border-b border-border bg-background/95 backdrop-blur-md flex-shrink-0">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          {(view === "permissions" || view === "settings") && (
            <button
              type="button"
              onClick={() => setView(view === "settings" ? "chat" : "onboarding")}
              className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer shrink-0"
            >
              <ChevronRight className="w-4 h-4 rotate-180" />
            </button>
          )}
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary via-primary/90 to-primary/70 flex items-center justify-center text-primary-foreground shadow-xs shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <SheetTitle className="text-xs sm:text-sm font-semibold text-foreground truncate">
                {VIEW_TITLE[view]}
              </SheetTitle>
              {view === "chat" && (
                <Badge
                  variant="outline"
                  className="text-[9px] px-1.5 py-0 border-primary/40 text-primary bg-primary/10"
                >
                  RAG Live
                </Badge>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground truncate">{subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {view === "chat" && (
            <>
              <ActionTooltip label="Mulai Sesi Baru" shortcut="Alt+N" side="bottom">
                <button
                  type="button"
                  onClick={createNewSession}
                  className="flex items-center gap-1 h-7 px-2 rounded-lg bg-card hover:bg-muted text-foreground text-xs font-semibold border border-border/70 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-primary" />
                  <span>New</span>
                </button>
              </ActionTooltip>

              <ActionTooltip label="Riwayat Percakapan" shortcut="Alt+H" side="bottom">
                <button
                  type="button"
                  onClick={() => setShowHistoryInDrawer((p) => !p)}
                  className={cn(
                    "h-7 w-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer relative",
                    showHistoryInDrawer && "text-primary bg-primary/10 border border-primary/20"
                  )}
                >
                  <History className="w-3.5 h-3.5" />
                  {sessionsCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-primary text-primary-foreground text-[7px] font-bold flex items-center justify-center">
                      {sessionsCount}
                    </span>
                  )}
                </button>
              </ActionTooltip>

              <ActionTooltip label="K2 Agent Permissions & Settings" shortcut="Alt+P" side="bottom">
                <button
                  type="button"
                  onClick={() => {
                    setShowHistoryInDrawer(false);
                    setShowTokenMenu(false);
                    setPermSearch("");
                    setView("settings");
                  }}
                  className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                </button>
              </ActionTooltip>

              {messages.length > 0 && (
                <ActionTooltip label="Ekspor Percakapan (Markdown)" shortcut="Ctrl+E" side="bottom">
                  <button
                    type="button"
                    onClick={() => exportChatToMarkdown(messages)}
                    className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </ActionTooltip>
              )}

              <ActionTooltip label="Mode Layar Penuh" shortcut="Alt+F" side="bottom">
                <button
                  type="button"
                  onClick={() => {
                    setShowHistoryInDrawer(false);
                    setIsOpen(false);
                    setIsFullscreen(true);
                  }}
                  className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </ActionTooltip>
            </>
          )}

          <ActionTooltip label="Tutup Assistant" shortcut="Esc" side="bottom">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </ActionTooltip>
        </div>
      </div>
    </SheetHeader>
  );
}
