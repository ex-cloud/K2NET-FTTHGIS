"use client";

import React, { useRef } from "react";
import {
  Sparkles, Send, Square, Trash2, Check, ChevronRight,
  SlidersHorizontal, Download, Maximize2, Minimize2, PlusCircle,
  Zap, MapPin, Activity, Database, GitPullRequest, ShieldCheck, Cpu, Search,
} from "lucide-react";
import { ScrollArea, Badge, Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@k2net/ui";
import { cn } from "@/lib/utils";
import { MessageBubble } from "@/components/ai/ai-message-bubble";
import type { ChatMessage } from "@/hooks/useAiChatStream";
import type { SuggestedPromptItem } from "@/lib/actions/gateways";
import type { AgentAuthorizationData } from "@/lib/actions/gateways";
import { exportChatToMarkdown } from "@/hooks/useAiChatStream";

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
}

/**
 * The main chat view — greeting, pinned ideas, message stream, and input bar.
 * Extracted from FloatingAiAssistant to keep the orchestrator lean.
 */
export function AiDrawerChat({
  messages, pinnedIdeas, input, onInputChange, onSend, onStop, onClear,
  onSelectIdea, onConfigurePermissions, isStreaming, error, agentAuth,
  showTokenMenu, onToggleTokenMenu, selectedModel, onModelChange,
  availableModels, isWide, onToggleWide, onToggleFullscreen,
}: AiDrawerChatProps) {
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

  return (
    <>
      {/* ── Toolbar row (model + actions) ── */}
      <div className="px-4 py-1.5 border-b border-border/50 bg-background/80 flex items-center gap-1.5 flex-shrink-0">
        <Select value={selectedModel} onValueChange={onModelChange}>
          <SelectTrigger className="h-7 text-xs w-[145px] border-border/60 bg-muted/40 font-medium">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            {availableModels.map((m) => (
              <SelectItem key={m.value} value={m.value} className="text-xs">
                <div className="flex items-center justify-between w-full gap-2">
                  <span className="truncate">{m.label}</span>
                  <Badge variant="outline" className="text-[9px] px-1 py-0 font-mono shrink-0">{m.badge}</Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex-1" />

        <button onClick={onClear} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer" title="New Chat">
          <PlusCircle className="w-4 h-4" />
        </button>
        {onToggleFullscreen && (
          <button onClick={onToggleFullscreen} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer" title="Full Screen View (Cloudflare Style)">
            <Maximize2 className="w-4 h-4" />
          </button>
        )}
        {messages.length > 0 && (
          <button onClick={() => exportChatToMarkdown(messages)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer" title="Export Markdown">
            <Download className="w-4 h-4" />
          </button>
        )}
        {messages.length > 0 && (
          <button onClick={onClear} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-destructive transition-colors cursor-pointer" title="Clear chat">
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* ── Messages / Empty State ── */}
      <ScrollArea className="flex-1 min-h-0 overflow-x-hidden">
        <div className="px-4 py-4 space-y-4 overflow-x-hidden w-full">
          {messages.length === 0 ? (
            <div className="space-y-4 py-2">
              {/* Greeting */}
              <div className="text-center py-2 space-y-2">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary/30 via-primary/15 to-amber-500/20 border border-primary/30 flex items-center justify-center shadow-md shadow-primary/10 mx-auto">
                  <Sparkles className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">{greeting}</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">What are we doing today?</p>
                </div>
              </div>

              {/* Pinned Ideas — no badges */}
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

              <p className="text-[10px] text-muted-foreground text-center pt-1">
                Chats are recorded to improve the service in accordance with our Privacy Policy.
              </p>
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

      {/* ── Input Area — Cloudflare-style clean row ── */}
      <div className="px-3 pt-2 pb-3 border-t border-border/60 bg-background/95 backdrop-blur-md flex-shrink-0">
        <div className="flex items-end gap-2">
          {/* Input wrapper */}
          <div className="relative flex-1 flex items-end rounded-2xl border border-border bg-muted/40 focus-within:ring-1 focus-within:ring-primary focus-within:border-primary transition-all">
            {/* "Ask" leaf badge — left inside */}
            <div className="absolute left-3 bottom-[9px] pointer-events-none">
              <Badge variant="outline" className="text-[9px] font-mono px-1.5 py-0.5 border-primary/30 text-primary bg-primary/10 select-none gap-1">
                <Sparkles className="w-2.5 h-2.5" />
                Ask
              </Badge>
            </div>

            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => onInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type @ to tag a resource or ? for shortcuts..."
              rows={1}
              className={cn(
                "flex-1 w-full resize-none bg-transparent pl-16 pr-9 py-[10px] text-[13px]",
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

            {/* Sliders icon — right inside */}
            <div className="absolute right-2.5 bottom-[7px]">
              <button
                type="button"
                onClick={onToggleTokenMenu}
                className={cn(
                  "p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer",
                  showTokenMenu && "text-primary bg-primary/10"
                )}
                title="K2 Agent Settings"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
              </button>

              {/* Token active popover */}
              {showTokenMenu && (
                <div className="absolute bottom-10 right-0 w-64 p-2 bg-card border border-border rounded-2xl shadow-2xl shadow-black/20 space-y-1.5 text-xs z-20 animate-in fade-in slide-in-from-bottom-2 duration-150">
                  {/* Status */}
                  <div className="p-2.5 rounded-xl bg-primary/5 border border-primary/20">
                    <div className="flex items-center gap-1.5 font-bold text-primary text-xs mb-0.5">
                      <Check className="w-3.5 h-3.5" />
                      <span>API token active</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      K2 Agent can access your account ({agentAuth?.access_tier || "Full"})
                    </p>
                  </div>
                  {/* Configure */}
                  <button
                    type="button"
                    onClick={onConfigurePermissions}
                    className="w-full px-2.5 py-2 rounded-xl hover:bg-muted/60 text-foreground text-[13px] font-semibold flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <span className="text-base">⚙</span>
                    <span>Configure permissions</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Send / Stop — full circle like Cloudflare */}
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
      </div>
    </>
  );
}
