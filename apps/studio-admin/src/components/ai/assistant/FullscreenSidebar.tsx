import React from "react";
import { Sparkles, PanelLeftClose, Plus, Search, MessageSquare } from "lucide-react";
import { ScrollArea } from "@k2net/ui";
import { cn } from "@/lib/utils";
import type { StoredChatSession } from "@/hooks/useAiChatStream";
import { SessionListGroup } from "./SessionListGroup";

interface FullscreenSidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  sidebarSearch: string;
  setSidebarSearch: (q: string) => void;
  filteredSessions: StoredChatSession[];
  categorizedSessions: {
    today: StoredChatSession[];
    yesterday: StoredChatSession[];
    older: StoredChatSession[];
  };
  activeSessionId?: string;
  onNewChat?: () => void;
  onLoadSession?: (id: string) => void;
  onDeleteSession?: (id: string) => void;
}

export function FullscreenSidebar({
  sidebarOpen,
  setSidebarOpen,
  sidebarSearch,
  setSidebarSearch,
  filteredSessions,
  categorizedSessions,
  activeSessionId,
  onNewChat,
  onLoadSession,
  onDeleteSession,
}: FullscreenSidebarProps) {
  return (
    <aside
      className={cn(
        "flex-shrink-0 flex flex-col border-r border-border/60 bg-muted/20 transition-[width] duration-200 overflow-hidden min-w-0",
        sidebarOpen ? "w-72" : "w-0"
      )}
    >
      <div className="flex flex-col h-full w-80 min-w-0">
        <div className="flex items-center justify-between px-3.5 pt-3.5 pb-2 border-b border-border/40">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <span className="text-sm font-bold text-foreground">Chat</span>
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="Tutup sidebar"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3">
          <button
            type="button"
            onClick={onNewChat}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-card hover:bg-muted/80 text-foreground text-xs font-semibold transition-all cursor-pointer border border-border/70 hover:border-primary/40 shadow-xs"
          >
            <Plus className="w-4 h-4 text-primary" />
            <span>New chat</span>
          </button>
        </div>

        <div className="px-3 mb-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Search history..."
              value={sidebarSearch}
              onChange={(e) => setSidebarSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-background border border-border focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground text-foreground"
            />
          </div>
        </div>

        <ScrollArea className="flex-1 px-3 py-1 min-w-0">
          {filteredSessions.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <MessageSquare className="w-8 h-8 text-muted-foreground/30 mx-auto" />
              <p className="text-xs text-muted-foreground">No chat history yet</p>
            </div>
          ) : (
            <div className="space-y-4 pb-4 min-w-0">
              <SessionListGroup
                label="Today"
                sessions={categorizedSessions.today}
                activeSessionId={activeSessionId}
                onLoadSession={onLoadSession}
                onDeleteSession={onDeleteSession}
              />
              <SessionListGroup
                label="Yesterday"
                sessions={categorizedSessions.yesterday}
                activeSessionId={activeSessionId}
                onLoadSession={onLoadSession}
                onDeleteSession={onDeleteSession}
              />
              <SessionListGroup
                label="Previous 7 Days"
                sessions={categorizedSessions.older}
                activeSessionId={activeSessionId}
                onLoadSession={onLoadSession}
                onDeleteSession={onDeleteSession}
              />
            </div>
          )}
        </ScrollArea>
      </div>
    </aside>
  );
}
