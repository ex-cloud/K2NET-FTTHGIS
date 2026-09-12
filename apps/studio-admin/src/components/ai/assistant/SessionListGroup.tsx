import React from "react";
import { Trash2 } from "lucide-react";
import { ActionTooltip } from "@k2net/ui";
import { cn } from "@/lib/utils";
import type { StoredChatSession } from "@/hooks/useAiChatStream";

interface SessionListGroupProps {
  label: string;
  sessions: StoredChatSession[];
  activeSessionId?: string;
  onLoadSession?: (id: string) => void;
  onDeleteSession?: (id: string) => void;
}

export function SessionListGroup({
  label,
  sessions,
  activeSessionId,
  onLoadSession,
  onDeleteSession,
}: SessionListGroupProps) {
  if (sessions.length === 0) return null;

  return (
    <div className="space-y-1 min-w-0">
      <p className="text-[10px] font-bold tracking-wider text-muted-foreground/60 uppercase px-1 pb-0.5">
        {label}
      </p>
      {sessions.map((s) => (
        <ActionTooltip
          key={s.id}
          label={s.title}
          side="right"
          align="start"
          className="max-w-xs text-xs"
        >
          <div
            onClick={() => onLoadSession?.(s.id)}
            className={cn(
              "group flex items-start justify-between gap-2 px-2.5 py-2 rounded-xl text-xs font-medium cursor-pointer transition-all border min-w-0 w-full text-left",
              s.id === activeSessionId
                ? "bg-primary/10 border-primary/30 text-foreground font-semibold"
                : "bg-transparent hover:bg-muted/60 border-transparent hover:border-border text-muted-foreground hover:text-foreground"
            )}
          >
            <span className="line-clamp-2 leading-snug flex-1 min-w-0 block text-xs break-words">
              {s.title}
            </span>
            {onDeleteSession && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteSession(s.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all cursor-pointer shrink-0 mt-0.5"
                title="Delete chat"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        </ActionTooltip>
      ))}
    </div>
  );
}
