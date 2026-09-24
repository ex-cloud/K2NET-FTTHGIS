import React, { useMemo } from "react";
import { Plus, Search, MessageSquare, Trash2, Clock, PanelLeftClose, PanelLeft } from "lucide-react";
import { cn } from "../../utils";
import { ScrollArea } from "../scroll-area";
import type { StoredChatSession } from "./types";

interface AiFullscreenSidebarProps {
  open: boolean;
  onToggle: () => void;
  sessions: StoredChatSession[];
  activeSessionId?: string | null;
  search: string;
  onSearchChange: (search: string) => void;
  onNewChat: () => void;
  onSelectSession: (sessionId: string) => void;
  onDeleteSession?: (sessionId: string) => void;
  className?: string;
}

export function AiFullscreenSidebar({
  open,
  onToggle,
  sessions = [],
  activeSessionId,
  search,
  onSearchChange,
  onNewChat,
  onSelectSession,
  onDeleteSession,
  className,
}: AiFullscreenSidebarProps) {
  const filtered = useMemo(() => {
    return sessions.filter((s) =>
      s.title.toLowerCase().includes(search.toLowerCase())
    );
  }, [sessions, search]);

  const categorized = useMemo(() => {
    const today: StoredChatSession[] = [];
    const yesterday: StoredChatSession[] = [];
    const older: StoredChatSession[] = [];

    const now = new Date();
    const todayStr = now.toDateString();
    const yestDate = new Date(now);
    yestDate.setDate(yestDate.getDate() - 1);
    const yestStr = yestDate.toDateString();

    filtered.forEach((s) => {
      const d = new Date(s.updatedAt || s.createdAt);
      const dStr = d.toDateString();
      if (dStr === todayStr) today.push(s);
      else if (dStr === yestStr) yesterday.push(s);
      else older.push(s);
    });

    return { today, yesterday, older };
  }, [filtered]);

  if (!open) {
    return (
      <div className="p-3 border-r border-border flex flex-col items-center gap-2 bg-muted/20 shrink-0 select-none">
        <button
          type="button"
          onClick={onToggle}
          className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          title="Buka Sidebar Riwayat"
        >
          <PanelLeft className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={onNewChat}
          className="h-8 w-8 rounded-lg flex items-center justify-center bg-primary/10 text-primary hover:bg-primary/20 transition-colors cursor-pointer border border-primary/30"
          title="Mulai Percakapan Baru"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    );
  }

  const renderGroup = (title: string, groupSessions: StoredChatSession[]) => {
    if (groupSessions.length === 0) return null;
    return (
      <div className="space-y-1 py-1.5">
        <p className="px-2 text-[10px] font-bold text-muted-foreground/70 uppercase tracking-wider">
          {title}
        </p>
        <div className="space-y-1">
          {groupSessions.map((s) => {
            const isActive = s.id === activeSessionId;
            return (
              <div
                key={s.id}
                onClick={() => onSelectSession(s.id)}
                className={cn(
                  "group flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl text-xs cursor-pointer transition-all border",
                  isActive
                    ? "bg-primary/10 border-primary/30 text-foreground font-semibold"
                    : "bg-transparent hover:bg-muted/60 border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-xs truncate">
                    {s.title}
                  </p>
                  <p className="text-[10px] text-muted-foreground/80 mt-0.5 flex items-center gap-1 font-mono">
                    <Clock className="w-2.5 h-2.5" />
                    {new Date(s.updatedAt || s.createdAt).toLocaleDateString("id-ID", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {s.messages && (
                      <span className="text-[9px]">• {s.messages.length} pesan</span>
                    )}
                  </p>
                </div>

                {onDeleteSession && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSession(s.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all cursor-pointer"
                    title="Hapus percakapan"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div
      className={cn(
        "w-64 sm:w-72 md:w-80 h-full border-r border-border flex flex-col bg-muted/20 shrink-0 select-none",
        className
      )}
    >
      <div className="p-3 border-b border-border flex items-center justify-between gap-2 shrink-0">
        <button
          type="button"
          onClick={onNewChat}
          className="flex-1 flex items-center justify-center gap-1.5 h-8 px-3 rounded-lg bg-card hover:bg-muted border border-border text-xs font-medium text-foreground transition-colors cursor-pointer shadow-2xs"
        >
          <Plus className="w-3.5 h-3.5 text-primary" />
          <span>Chat Baru</span>
        </button>

        <button
          type="button"
          onClick={onToggle}
          className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          title="Tutup Sidebar"
        >
          <PanelLeftClose className="w-4 h-4" />
        </button>
      </div>

      <div className="p-3 border-b border-border/60 shrink-0">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Cari sesi chat..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-background border border-border focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground"
          />
        </div>
      </div>

      <ScrollArea className="flex-1 p-2 min-h-0">
        {filtered.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <MessageSquare className="w-8 h-8 text-muted-foreground/30 mx-auto" />
            <p className="text-xs text-muted-foreground">Belum ada riwayat tersimpan</p>
          </div>
        ) : (
          <div className="space-y-2">
            {renderGroup("Hari Ini", categorized.today)}
            {renderGroup("Kemarin", categorized.yesterday)}
            {renderGroup("Lebih Lama", categorized.older)}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
