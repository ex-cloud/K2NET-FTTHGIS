"use client";

import React, { useState } from "react";
import {
  Sparkles, X, Plus, Search, MessageSquare, PanelLeftClose,
  Maximize2, Download, Trash2, Send, Square, SlidersHorizontal,
  Check, ChevronRight, Minimize2,
} from "lucide-react";
import { Badge, ScrollArea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@k2net/ui";
import { cn } from "@/lib/utils";
import { MessageBubble } from "@/components/ai/ai-message-bubble";
import { exportChatToMarkdown } from "@/hooks/useAiChatStream";
import type { ChatMessage } from "@/hooks/useAiChatStream";
import type { SuggestedPromptItem, AgentAuthorizationData } from "@/lib/actions/gateways";
import {
  Zap, MapPin, Activity, Database, GitPullRequest, ShieldCheck, Cpu,
} from "lucide-react";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Zap, MapPin, Activity, Database, GitPullRequest, ShieldCheck, Sparkles, Cpu, Search,
};

interface ChatSession {
  id: string;
  title: string;
  createdAt: Date;
}

interface AiFullscreenLayoutProps {
  // Chat state
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
  // Fullscreen control
  onExitFullscreen: () => void;
}

/**
 * Full-viewport AI chat layout — Cloudflare style.
 * Left sidebar: new chat, search, history.
 * Right: full-width chat area with header and input.
 */
export function AiFullscreenLayout({
  messages, pinnedIdeas, input, onInputChange, onSend, onStop, onClear,
  onSelectIdea, onConfigurePermissions, isStreaming, error, agentAuth,
  showTokenMenu, onToggleTokenMenu, selectedModel, onModelChange,
  availableModels, onExitFullscreen,
}: AiFullscreenLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarSearch, setSidebarSearch] = useState("");
  const inputRef = React.useRef<HTMLTextAreaElement>(null);
  const bottomRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  React.useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 150);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(); }
    if (e.key === "Escape") onExitFullscreen();
  };

  // Derive a chat "title" from the first user message
  const chatTitle = messages.find((m) => m.role === "user")?.content.slice(0, 40) || null;

  // Mock past sessions for sidebar (real implementation would use persistent storage)
  const pastSessions: ChatSession[] = chatTitle
    ? [{ id: "current", title: chatTitle, createdAt: new Date() }]
    : [];

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning.";
    if (h < 18) return "Good afternoon.";
    return "Good evening.";
  })();

  return (
    // Full viewport overlay
    <div className="fixed inset-0 z-[200] flex bg-background text-foreground animate-in fade-in duration-200">
      {/* ── Left Sidebar ── */}
      <aside
        className={cn(
          "flex-shrink-0 flex flex-col border-r border-border/60 bg-muted/20 transition-[width] duration-200 overflow-hidden",
          sidebarOpen ? "w-56" : "w-0"
        )}
      >
        <div className="flex flex-col h-full w-56">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between px-3 pt-4 pb-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-primary-foreground" />
              </div>
              <span className="text-sm font-bold text-foreground">Chat</span>
            </div>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </div>

          {/* New Chat */}
          <button
            type="button"
            onClick={onClear}
            className="mx-3 mt-1 mb-1 flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-muted/70 text-foreground text-xs font-semibold transition-colors cursor-pointer border border-border/50 hover:border-primary/30"
          >
            <Plus className="w-3.5 h-3.5" />
            New chat
          </button>

          {/* Search */}
          <div className="px-3 mb-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="Search"
                value={sidebarSearch}
                onChange={(e) => setSidebarSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-background border border-border focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground text-foreground"
              />
            </div>
          </div>

          {/* Chat History */}
          <div className="flex-1 overflow-y-auto px-3 py-1 space-y-1">
            {pastSessions.length === 0 ? (
              <div className="py-6 text-center">
                <MessageSquare className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-[11px] text-muted-foreground">No chat history yet</p>
              </div>
            ) : (
              <>
                <p className="text-[10px] font-bold tracking-wider text-muted-foreground/60 uppercase px-1 pb-1 pt-1">Today</p>
                {pastSessions.map((s) => (
                  <div
                    key={s.id}
                    className="px-2.5 py-2 rounded-lg bg-primary/10 border border-primary/20 text-xs text-foreground font-medium cursor-pointer truncate hover:bg-primary/15 transition-colors"
                    title={s.title}
                  >
                    {s.title}…
                  </div>
                ))}
              </>
            )}

            {/* K2 Agent status chip */}
            {agentAuth?.is_authorized && (
              <div className="mt-4 p-2.5 rounded-xl bg-background border border-border text-[10px]">
                <div className="flex items-center gap-1.5 text-primary font-bold mb-0.5">
                  <Check className="w-3 h-3" />
                  <span>API token active</span>
                </div>
                <p className="text-muted-foreground">{agentAuth.access_tier} access</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ── Main Chat Area ── */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* ── Header ── */}
        <header className="flex items-center justify-between px-5 py-3 border-b border-border/60 bg-background/95 backdrop-blur-md flex-shrink-0">
          <div className="flex items-center gap-3">
            {!sidebarOpen && (
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                title="Open sidebar"
              >
                <PanelLeftClose className="w-4 h-4 rotate-180" />
              </button>
            )}

            {/* Model selector */}
            <Select value={selectedModel} onValueChange={onModelChange}>
              <SelectTrigger className="h-7 text-xs w-[160px] border-border/60 bg-muted/40 font-medium">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {availableModels.map((m) => (
                  <SelectItem key={m.value} value={m.value} className="text-xs">
                    <div className="flex items-center justify-between w-full gap-3">
                      <span className="truncate">{m.label}</span>
                      <Badge variant="outline" className="text-[9px] px-1 py-0 font-mono shrink-0">{m.badge}</Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Badge variant="outline" className="text-[10px] px-1.5 border-primary/40 text-primary bg-primary/10">
              RAG Live
            </Badge>

            <Badge variant="outline" className="text-[10px] px-1.5 border-border text-muted-foreground font-mono">
              STABLE
            </Badge>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1.5">
            {/* Configure permissions */}
            <button
              onClick={onConfigurePermissions}
              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              title="Configure permissions"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>

            {/* Minimize to drawer */}
            <button
              onClick={onExitFullscreen}
              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              title="Exit fullscreen (back to drawer)"
            >
              <Minimize2 className="w-4 h-4" />
            </button>

            {/* Export */}
            {messages.length > 0 && (
              <button
                onClick={() => exportChatToMarkdown(messages)}
                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                title="Export Markdown"
              >
                <Download className="w-4 h-4" />
              </button>
            )}

            {/* Clear */}
            {messages.length > 0 && (
              <button
                onClick={onClear}
                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                title="Clear chat"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            {/* Close fullscreen */}
            <button
              onClick={onExitFullscreen}
              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* ── Messages ── */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className={cn("mx-auto py-6 px-4 space-y-5 w-full", sidebarOpen ? "max-w-3xl" : "max-w-3xl")}>
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[55vh] space-y-6 text-center">
                {/* Greeting */}
                <div className="space-y-2">
                  <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-primary/30 via-primary/15 to-amber-500/20 border border-primary/30 flex items-center justify-center shadow-lg shadow-primary/10 mx-auto">
                    <Sparkles className="w-10 h-10 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">{greeting}</h2>
                  <p className="text-sm text-muted-foreground">What are we doing today?</p>
                </div>

                {/* Pinned Ideas — 2-column grid in fullscreen */}
                {pinnedIdeas.length > 0 && (
                  <div className="w-full max-w-2xl">
                    <p className="text-[10px] font-bold tracking-widest text-muted-foreground/60 uppercase mb-3">IDEAS &amp; QUICK ACTIONS</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {pinnedIdeas.map((idea) => {
                        const Icon = ICON_MAP[idea.icon] || Zap;
                        return (
                          <button
                            key={idea.id}
                            type="button"
                            onClick={() => onSelectIdea(idea)}
                            className={cn(
                              "flex items-start gap-3 p-4 rounded-2xl text-left",
                              "bg-card hover:bg-muted/60 border border-border hover:border-primary/40",
                              "transition-all duration-150 group cursor-pointer shadow-xs"
                            )}
                          >
                            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary/20 group-hover:scale-105 transition-all mt-0.5">
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                                {idea.title}
                              </p>
                              <p className="text-[12px] text-muted-foreground mt-0.5 line-clamp-2">
                                {idea.description || idea.prompt}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <p className="text-[11px] text-muted-foreground/70 max-w-sm">
                  Chats are recorded to improve the service and are processed in accordance with our Privacy Policy.
                </p>
              </div>
            ) : (
              <>
                {messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)}
                {error && (
                  <div className="px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/20 text-sm text-destructive">
                    ⚠️ {error}
                  </div>
                )}
              </>
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        {/* ── Input Area ── */}
        <div className="flex-shrink-0 border-t border-border/60 bg-background/95 backdrop-blur-md px-4 py-3">
          <div className={cn("mx-auto w-full", sidebarOpen ? "max-w-3xl" : "max-w-3xl")}>
            <div className="flex items-end gap-3">
              {/* Input wrapper */}
              <div className="relative flex-1 flex items-end rounded-2xl border border-border bg-muted/40 focus-within:ring-1 focus-within:ring-primary focus-within:border-primary transition-all">
                {/* Ask badge */}
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
                  className="flex-1 w-full resize-none bg-transparent pl-16 pr-11 py-[10px] text-sm focus:outline-none placeholder:text-muted-foreground text-foreground max-h-48 overflow-y-auto leading-relaxed"
                  style={{ height: "auto" }}
                  onInput={(e) => {
                    const t = e.target as HTMLTextAreaElement;
                    t.style.height = "auto";
                    t.style.height = `${Math.min(t.scrollHeight, 192)}px`;
                  }}
                />

                {/* Sliders */}
                <div className="absolute right-2.5 bottom-[7px]">
                  <button
                    type="button"
                    onClick={onToggleTokenMenu}
                    className={cn(
                      "p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer",
                      showTokenMenu && "text-primary bg-primary/10"
                    )}
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                  </button>

                  {showTokenMenu && (
                    <div className="absolute bottom-10 right-0 w-64 p-2 bg-card border border-border rounded-2xl shadow-2xl shadow-black/20 space-y-1.5 text-xs z-20 animate-in fade-in slide-in-from-bottom-2 duration-150">
                      <div className="p-2.5 rounded-xl bg-primary/5 border border-primary/20">
                        <div className="flex items-center gap-1.5 font-bold text-primary text-xs mb-0.5">
                          <Check className="w-3.5 h-3.5" />
                          <span>API token active</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                          K2 Agent can access your account ({agentAuth?.access_tier || "Full"})
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={onConfigurePermissions}
                        className="w-full px-2.5 py-2 rounded-xl hover:bg-muted/60 text-foreground text-[13px] font-semibold flex items-center gap-2 cursor-pointer"
                      >
                        <span className="text-base">⚙</span>
                        <span>Configure permissions</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Send/Stop circle */}
              <button
                type="button"
                onClick={isStreaming ? onStop : onSend}
                disabled={!input.trim() && !isStreaming}
                className={cn(
                  "h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-md transition-all cursor-pointer",
                  "disabled:opacity-40 disabled:cursor-not-allowed",
                  isStreaming
                    ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                    : "bg-primary hover:bg-primary/90 text-primary-foreground hover:scale-105"
                )}
              >
                {isStreaming
                  ? <Square className="w-4 h-4 fill-current" />
                  : <Send className="w-4 h-4 -translate-x-px" />}
              </button>
            </div>

            <p className="text-[10px] text-muted-foreground text-center mt-2">
              Chats are recorded to improve the service in accordance with our Privacy Policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
