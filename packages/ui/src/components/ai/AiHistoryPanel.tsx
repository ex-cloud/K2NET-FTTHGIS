import React, { useState } from "react";
import { History, MessageSquare, Clock, Trash2, Search, X } from "lucide-react";
import { cn } from "../../utils";
import { ScrollArea } from "../scroll-area";
import type { StoredChatSession } from "./types";

interface AiHistoryPanelProps {
  open: boolean;
  onClose: () => void;
  sessions: StoredChatSession[];
  activeSessionId?: string | null;
  onSelectSession: (sessionId: string) => void;
  onDeleteSession?: (sessionId: string) => void;
  className?: string;
}

export function AiHistoryPanel({
  open,
  onClose,
  sessions = [],
  activeSessionId,
  onSelectSession,
  onDeleteSession,
  className,
}: AiHistoryPanelProps) {
  const [search, setSearch] = useState("");

  if (!open) return null;

  const filtered = sessions.filter((s) =>
    s.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div
      className={cn(
        "absolute inset-0 z-30 bg-background/98 backdrop-blur-md p-4 flex flex-col animate-in fade-in slide-in-from-top-2 duration-150 select-none",
        className
      )}
    >
      <div className="flex items-center justify-between pb-3 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-primary" />
          <span className="text-sm font-bold text-foreground">Riwayat Percakapan</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
          title="Tutup riwayat"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="py-2.5 shrink-0">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Cari percakapan lama..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-muted/40 border border-border focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground"
          />
        </div>
      </div>

      <ScrollArea className="flex-1 -mx-1 px-1 min-h-0">
        {filtered.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <MessageSquare className="w-8 h-8 text-muted-foreground/30 mx-auto" />
            <p className="text-xs text-muted-foreground">Belum ada riwayat percakapan tersimpan</p>
          </div>
        ) : (
          <div className="space-y-1.5 py-1">
            {filtered.map((s) => {
              const isActive = s.id === activeSessionId;
              return (
                <div
                  key={s.id}
                  onClick={() => {
                    onSelectSession(s.id);
                    onClose();
                  }}
                  className={cn(
                    "group flex items-center justify-between gap-2 p-2.5 rounded-xl text-left text-xs cursor-pointer transition-all border",
                    isActive
                      ? "bg-primary/10 border-primary/30 text-foreground font-semibold"
                      : "bg-card hover:bg-muted/60 border-border text-foreground hover:border-primary/20"
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 leading-snug break-words text-xs text-foreground group-hover:text-primary transition-colors">
                      {s.title}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1 font-mono">
                      <Clock className="w-2.5 h-2.5" />
                      {new Date(s.updatedAt || s.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {s.messages && (
                        <span className="text-[9px] text-muted-foreground/60">
                          • {s.messages.length} pesan
                        </span>
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
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all cursor-pointer"
                      title="Hapus percakapan"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
