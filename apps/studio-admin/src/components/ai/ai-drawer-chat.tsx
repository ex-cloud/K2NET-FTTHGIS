"use client";

import React, { useRef, useState } from "react";
import {
  Sparkles, Send, Square, Trash2, Check, ChevronRight,
  SlidersHorizontal, Download, Maximize2, Plus,
  History, MessageSquare, Clock, Zap, MapPin, Activity, Database,
  GitPullRequest, ShieldCheck, Cpu, Search, X,
} from "lucide-react";
import { ScrollArea, Badge } from "@k2net/ui";
import { cn } from "@/lib/utils";
import { MessageBubble } from "@/components/ai/ai-message-bubble";
import type { ChatMessage, StoredChatSession } from "@/hooks/useAiChatStream";
import type { SuggestedPromptItem, AgentAuthorizationData } from "@/lib/actions/gateways";
import { exportChatToMarkdown } from "@/hooks/useAiChatStream";

import { AiSpatialNetworkGraphic } from "@/components/ai/AiSpatialNetworkGraphic";

// ─── Icon Map for Prompt Ideas ────────────────────────────────────────────────
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Zap, MapPin, Activity, Database, GitPullRequest, ShieldCheck, Sparkles, Cpu, Search,
};

interface AiDrawerChatProps {
  messages: ChatMessage[];
  pinnedIdeas: SuggestedPromptItem[];
  input: string;
  onInputChange: (v: string) => void;
  onSend: () => void;
  onStop: () => void;
  onClear: () => void;
  onSelectIdea: (idea: SuggestedPromptItem) => void;
  onConfigurePermissions: () => void;
  isStreaming: boolean;
  error?: string | null;
  agentAuth: AgentAuthorizationData | null;
  showTokenMenu: boolean;
  onToggleTokenMenu: () => void;
  selectedModel: string;
  onModelChange: (m: string) => void;
  availableModels: Array<{ value: string; label: string; badge: string }>;
  isWide?: boolean;
  onToggleWide?: () => void;
  onToggleFullscreen?: () => void;
  // Multi-session history
  sessions?: StoredChatSession[];
  activeSessionId?: string;
  onNewChat?: () => void;
  onLoadSession?: (sessionId: string) => void;
  onDeleteSession?: (sessionId: string) => void;
}

/**
 * The main chat view in drawer mode:
 * - Top header with New Chat (+), History (Clock), Settings (Sliders), Fullscreen, Export.
 * - Clean input area without clutter (Ask badge & duplicate sliders removed).
 * - Full multi-session history slide-over drawer.
 */
export function AiDrawerChat({
  messages, pinnedIdeas, input, onInputChange, onSend, onStop, onClear,
  onSelectIdea, onConfigurePermissions, isStreaming, error, agentAuth,
  showTokenMenu, onToggleTokenMenu, selectedModel, onModelChange,
  availableModels, isWide, onToggleWide, onToggleFullscreen,
  sessions = [], activeSessionId, onNewChat, onLoadSession, onDeleteSession,
}: AiDrawerChatProps) {
  const [showHistory, setShowHistory] = useState(false);
  const [historySearch, setHistorySearch] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Scroll on new messages
  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  React.useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning.";
    if (h < 18) return "Good afternoon.";
    return "Good evening.";
  })();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const activeModelLabel = availableModels.find((m) => m.value === selectedModel)?.label || "Gemini 2.5 Flash";

  const filteredSessions = sessions.filter((s) =>
    s.title.toLowerCase().includes(historySearch.toLowerCase())
  );

  return (
    <div className="relative flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* ── Toolbar row (Model Pill + New Chat + History + Settings + Fullscreen) ── */}
      <div className="px-4 py-2 border-b border-border/50 bg-background/80 flex items-center justify-between gap-2 flex-shrink-0">
        {/* Model Status Pill (Quota Protection: Clean Badge rather than open selector for all tiers) */}
        <div className="flex items-center gap-2 min-w-0">
          <Badge variant="outline" className="text-[11px] px-2.5 py-0.5 border-primary/30 text-primary bg-primary/10 font-medium truncate gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            {activeModelLabel}
          </Badge>
          <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-border text-muted-foreground font-mono">
            RAG Live
          </Badge>
        </div>

        {/* Top Header Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {/* New Chat Button */}
          <button
            type="button"
            onClick={onNewChat || onClear}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-muted/80 text-foreground text-xs font-semibold border border-border/60 hover:border-primary/40 transition-colors cursor-pointer"
            title="New Chat (Mulai percakapan baru)"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New</span>
          </button>

          {/* History Button */}
          <button
            type="button"
            onClick={() => setShowHistory((prev) => !prev)}
            className={cn(
              "p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer relative",
              showHistory && "text-primary bg-primary/10 border border-primary/20"
            )}
            title="Riwayat Percakapan (Chat History)"
          >
            <History className="w-4 h-4" />
            {sessions.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center">
                {sessions.length}
              </span>
            )}
          </button>

          {/* K2NET Settings Button */}
          <button
            type="button"
            onClick={onConfigurePermissions}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="K2 Agent Permissions & Settings"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>

          {/* Fullscreen Toggle */}
          {onToggleFullscreen && (
            <button
              type="button"
              onClick={onToggleFullscreen}
              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              title="Tampilan Penuh (Cloudflare Fullscreen)"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          )}

          {/* Export Markdown */}
          {messages.length > 0 && (
            <button
              type="button"
              onClick={() => exportChatToMarkdown(messages)}
              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              title="Ekspor Chat ke Markdown"
            >
              <Download className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ── Slide-over Chat History Panel ── */}
      {showHistory && (
        <div className="absolute inset-x-0 top-[45px] bottom-0 z-30 bg-background/98 backdrop-blur-md border-b border-border p-4 flex flex-col animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-primary" />
              <span className="text-sm font-bold text-foreground">Riwayat Percakapan</span>
            </div>
            <button
              type="button"
              onClick={() => setShowHistory(false)}
              className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="py-2.5">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="Cari percakapan lama..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-muted/40 border border-border focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </div>

          <ScrollArea className="flex-1 -mx-1 px-1">
            {filteredSessions.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <MessageSquare className="w-8 h-8 text-muted-foreground/30 mx-auto" />
                <p className="text-xs text-muted-foreground">Belum ada riwayat percakapan tersimpan</p>
              </div>
            ) : (
              <div className="space-y-1.5 py-1">
                {filteredSessions.map((s) => {
                  const isActive = s.id === activeSessionId;
                  return (
                    <div
                      key={s.id}
                      onClick={() => {
                        onLoadSession?.(s.id);
                        setShowHistory(false);
                      }}
                      className={cn(
                        "group flex items-center justify-between gap-2 p-2.5 rounded-xl text-left text-xs cursor-pointer transition-all border",
                        isActive
                          ? "bg-primary/10 border-primary/30 text-foreground font-semibold"
                          : "bg-card hover:bg-muted/60 border-border text-foreground hover:border-primary/20"
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs text-foreground group-hover:text-primary transition-colors">
                          {s.title}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          {new Date(s.updatedAt || s.createdAt).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                          <span className="text-[9px] text-muted-foreground/60">• {s.messages.length} pesan</span>
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
      )}

      {/* ── Messages / Empty State ── */}
      <ScrollArea className="flex-1 min-h-0 overflow-x-hidden">
        <div className="px-4 py-4 space-y-4 overflow-x-hidden w-full">
          {messages.length === 0 ? (
            <div className="space-y-4 py-2">
              {/* Greeting with Spatial Network Map Graphic */}
              <div className="text-center py-2 space-y-2.5">
                <AiSpatialNetworkGraphic size="md" className="mx-auto" />
                <div>
                  <h2 className="text-lg font-bold text-foreground">{greeting}</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">What are we doing today?</p>
                </div>
              </div>

              {/* Pinned Ideas */}
              {pinnedIdeas.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold tracking-wider text-muted-foreground/70 uppercase px-0.5">
                    IDEAS &amp; QUICK ACTIONS
                  </p>
                  {pinnedIdeas.map((idea) => {
                    const Icon = ICON_MAP[idea.icon] || Zap;
                    return (
                      <button
                        key={idea.id}
                        type="button"
                        onClick={() => onSelectIdea(idea)}
                        className={cn(
                          "w-full flex items-center gap-3 p-3 rounded-xl text-left",
                          "bg-card hover:bg-muted/60 border border-border hover:border-primary/40",
                          "transition-all duration-150 group cursor-pointer shadow-xs"
                        )}
                      >
                        <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary/20 group-hover:scale-105 transition-all">
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                            {idea.title}
                          </p>
                          <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                            {idea.description || idea.prompt}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)
          )}

          {error && (
            <div className="px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive">
              ⚠️ {error}
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* ── Input Area (Clear & Uncluttered, Ask badge & duplicate sliders removed) ── */}
      <div className="px-3 pt-2 pb-3 border-t border-border/60 bg-background/95 backdrop-blur-md flex-shrink-0">
        <div className="flex items-end gap-2">
          {/* Input wrapper */}
          <div className="relative flex-1 flex items-end rounded-2xl border border-border bg-muted/40 focus-within:ring-1 focus-within:ring-primary focus-within:border-primary transition-all">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => onInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type @ to tag a resource or ask any FTTH question..."
              rows={1}
              className={cn(
                "flex-1 w-full resize-none bg-transparent pl-4 pr-3 py-[10px] text-[13px]",
                "focus:outline-none placeholder:text-muted-foreground text-foreground",
                "max-h-32 overflow-y-auto leading-relaxed"
              )}
              style={{ height: "auto" }}
              onInput={(e) => {
                const t = e.target as HTMLTextAreaElement;
                t.style.height = "auto";
                t.style.height = `${Math.min(t.scrollHeight, 128)}px`;
              }}
            />
          </div>

          {/* Send / Stop circle button */}
          <button
            type="button"
            onClick={isStreaming ? onStop : onSend}
            disabled={!input.trim() && !isStreaming}
            className={cn(
              "h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0 shadow-md transition-all cursor-pointer",
              "disabled:opacity-40 disabled:cursor-not-allowed",
              isStreaming
                ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                : "bg-primary hover:bg-primary/90 text-primary-foreground hover:scale-105"
            )}
            title={isStreaming ? "Stop" : "Send"}
          >
            {isStreaming
              ? <Square className="w-3.5 h-3.5 fill-current" />
              : <Send className="w-3.5 h-3.5 -translate-x-px" />}
          </button>
        </div>

        {/* Privacy Note at Bottom */}
        <p className="text-[10px] text-muted-foreground text-center pt-2">
          Chats are recorded to improve the service in accordance with our Privacy Policy.
        </p>
      </div>
    </div>
  );
}
