"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Sparkles, X, Plus, Search, MessageSquare, PanelLeftClose,
  Maximize2, Download, Trash2, Send, Square, SlidersHorizontal,
  Check, Minimize2, Clock, ShieldCheck, Cpu, Database,
  Activity, MapPin, GitPullRequest, Settings, ArrowLeft, Loader2, Save,
} from "lucide-react";
import { Badge, ScrollArea, Button, ActionTooltip } from "@k2net/ui";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { MessageBubble } from "@/components/ai/ai-message-bubble";
import { exportChatToMarkdown } from "@/hooks/useAiChatStream";
import type { ChatMessage, StoredChatSession } from "@/hooks/useAiChatStream";
import {
  SuggestedPromptItem,
  AgentAuthorizationData,
  fetchAgentPermissionsCatalog,
  saveAgentAuthorization,
  revokeAgentAuthorization,
  PermissionCatalogData,
} from "@/lib/actions/gateways";
import { Zap } from "lucide-react";
import { AiSpatialNetworkGraphic } from "@/components/ai/AiSpatialNetworkGraphic";
import { AiDrawerSettings, type PermTier } from "./ai-drawer-permissions";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Zap, MapPin, Activity, Database, GitPullRequest, ShieldCheck, Sparkles, Cpu, Search,
};

const DOMAIN_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Cpu, Activity, MapPin, Database, ShieldCheck, GitPullRequest, Sparkles,
};

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
  // Multi-session history props
  sessions?: StoredChatSession[];
  activeSessionId?: string;
  onNewChat?: () => void;
  onLoadSession?: (sessionId: string) => void;
  onDeleteSession?: (sessionId: string) => void;
}

/**
 * Full-viewport AI chat layout — Cloudflare style:
 * - Left sidebar: Responsive multi-session chat history with smooth auto-truncation.
 * - Center: Centered spatial GIS map graphic and spacious chat area.
 * - Header: Clean and minimal without distracting model pill text.
 * - Right sidebar: Embedded K2NET Agent Configuration & Permissions Management (no mode switching).
 */
export function AiFullscreenLayout({
  messages, pinnedIdeas, input, onInputChange, onSend, onStop, onClear,
  onSelectIdea, onConfigurePermissions, isStreaming, error, agentAuth,
  showTokenMenu, onToggleTokenMenu, selectedModel, onModelChange,
  availableModels, onExitFullscreen,
  sessions = [], activeSessionId, onNewChat, onLoadSession, onDeleteSession,
}: AiFullscreenLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [rightPanelView, setRightPanelView] = useState<"summary" | "permissions">("summary");
  const [sidebarSearch, setSidebarSearch] = useState("");
  const inputRef = React.useRef<HTMLTextAreaElement>(null);
  const bottomRef = React.useRef<HTMLDivElement>(null);

  // Embedded Permissions State inside Right Panel
  const [permCatalog, setPermCatalog] = useState<PermissionCatalogData | null>(null);
  const [permLoading, setPermLoading] = useState(false);
  const [permSaving, setPermSaving] = useState(false);
  const [permRevoking, setPermRevoking] = useState(false);
  const [permTier, setPermTier] = useState<PermTier>(
    agentAuth?.access_tier === "READ_ONLY" ? "READ_ONLY" : agentAuth?.access_tier === "CUSTOM" ? "CUSTOM" : "FULL"
  );
  const [permSelected, setPermSelected] = useState<Set<string>>(
    new Set(agentAuth?.granted_permissions || [])
  );
  const [permSearch, setPermSearch] = useState("");
  const [permExpandedDomains, setPermExpandedDomains] = useState<Set<string>>(new Set());

  // Load permissions data when switching to permissions view
  useEffect(() => {
    if (rightPanelOpen && rightPanelView === "permissions" && !permCatalog) {
      setPermLoading(true);
      fetchAgentPermissionsCatalog(agentAuth?.user_scope || "PLATFORM_INTERNAL")
        .then((catRes) => {
          setPermCatalog(catRes);
          setPermExpandedDomains(new Set(catRes.domains.map((d) => d.id)));
          if (permTier === "FULL") {
            setPermSelected(new Set(catRes.domains.flatMap((d) => d.permissions.map((p) => p.id))));
          } else if (permTier === "READ_ONLY") {
            setPermSelected(new Set(catRes.domains.flatMap((d) => d.permissions.filter((p) => p.scope === "Read").map((p) => p.id))));
          }
        })
        .catch((err) => toast.error("Gagal memuat katalog izin: " + String(err)))
        .finally(() => setPermLoading(false));
    }
  }, [rightPanelOpen, rightPanelView, permCatalog, agentAuth?.user_scope, permTier]);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  React.useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 150);
  }, []);

  // Auto-resize textarea dynamically on input state changes
  React.useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = `${Math.max(44, Math.min(inputRef.current.scrollHeight, 200))}px`;
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(); }
    if (e.key === "Escape") onExitFullscreen();
  };

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning.";
    if (h < 18) return "Good afternoon.";
    return "Good evening.";
  })();

  const activeModelLabel = availableModels.find((m) => m.value === selectedModel)?.label || "Gemini 2.5 Flash";

  // Categorize past sessions
  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => s.title.toLowerCase().includes(sidebarSearch.toLowerCase()));
  }, [sessions, sidebarSearch]);

  const categorizedSessions = useMemo(() => {
    const today: StoredChatSession[] = [];
    const yesterday: StoredChatSession[] = [];
    const older: StoredChatSession[] = [];

    const now = new Date();
    const todayStr = now.toDateString();
    const yestDate = new Date(now);
    yestDate.setDate(yestDate.getDate() - 1);
    const yestStr = yestDate.toDateString();

    filteredSessions.forEach((s) => {
      const d = new Date(s.updatedAt || s.createdAt);
      const dStr = d.toDateString();
      if (dStr === todayStr) today.push(s);
      else if (dStr === yestStr) yesterday.push(s);
      else older.push(s);
    });

    return { today, yesterday, older };
  }, [filteredSessions]);

  // Handle saving permissions right inside the panel
  const handleSavePermissions = async () => {
    setPermSaving(true);
    try {
      const permissionsToGrant = permTier === "FULL"
        ? (permCatalog ? permCatalog.domains.flatMap((d) => d.permissions.map((p) => p.id)) : Array.from(permSelected))
        : Array.from(permSelected);

      await saveAgentAuthorization({
        user_scope: agentAuth?.user_scope || "PLATFORM_INTERNAL",
        access_tier: permTier,
        granted_permissions: permissionsToGrant,
      });

      toast.success("Otorisasi K2 Agent berhasil disimpan");
      setRightPanelView("summary");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan otorisasi");
    } finally {
      setPermSaving(false);
    }
  };

  const handleRevokePermissions = async () => {
    setPermRevoking(true);
    try {
      await revokeAgentAuthorization();
      setPermSelected(new Set());
      setPermTier("CUSTOM");
      toast.success("Otorisasi K2 Agent berhasil dicabut.");
      setRightPanelView("summary");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal mencabut otorisasi");
    } finally {
      setPermRevoking(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] p-2.5 sm:p-4 md:p-5 lg:p-6 bg-black/60 dark:bg-black/75 backdrop-blur-md flex items-center justify-center animate-in fade-in duration-200 overflow-hidden">
      {/* Floating Canvas Card (Cloudflare Floating Style) */}
      <div className="w-full h-full max-w-[1680px] rounded-2xl md:rounded-3xl border border-border/80 bg-background text-foreground shadow-2xl flex overflow-hidden relative">
        {/* ── Left Sidebar (History & New Chat) ── */}
        <aside
          className={cn(
            "flex-shrink-0 flex flex-col border-r border-border/60 bg-muted/20 transition-[width] duration-200 overflow-hidden min-w-0",
            sidebarOpen ? "w-72" : "w-0"
          )}
        >
          <div className="flex flex-col h-full w-72 min-w-0">
            {/* Sidebar Header */}
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

            {/* New Chat Button */}
            <div className="p-3">
              <button
                type="button"
                onClick={onNewChat || onClear}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-card hover:bg-muted/80 text-foreground text-xs font-semibold transition-all cursor-pointer border border-border/70 hover:border-primary/40 shadow-xs"
              >
                <Plus className="w-4 h-4 text-primary" />
                <span>New chat</span>
              </button>
            </div>

            {/* Search */}
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

            {/* Chat History List (Responsive, Auto-Truncated, Tooltip Enabled) */}
            <ScrollArea className="flex-1 px-3 py-1 min-w-0">
              {filteredSessions.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <MessageSquare className="w-8 h-8 text-muted-foreground/30 mx-auto" />
                  <p className="text-xs text-muted-foreground">No chat history yet</p>
                </div>
              ) : (
                <div className="space-y-4 pb-4 min-w-0">
                  {/* Today */}
                  {categorizedSessions.today.length > 0 && (
                    <div className="space-y-1 min-w-0">
                      <p className="text-[10px] font-bold tracking-wider text-muted-foreground/60 uppercase px-1 pb-0.5">Today</p>
                      {categorizedSessions.today.map((s) => (
                        <div
                          key={s.id}
                          onClick={() => onLoadSession?.(s.id)}
                          className={cn(
                            "group flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl text-xs font-medium cursor-pointer transition-all border min-w-0 w-full",
                            s.id === activeSessionId
                              ? "bg-primary/10 border-primary/30 text-foreground font-semibold"
                              : "bg-transparent hover:bg-muted/60 border-transparent hover:border-border text-muted-foreground hover:text-foreground"
                          )}
                          title={s.title}
                        >
                          <span className="truncate flex-1 min-w-0 block text-xs">{s.title}</span>
                          {onDeleteSession && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteSession(s.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all cursor-pointer shrink-0"
                              title="Delete chat"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Yesterday */}
                  {categorizedSessions.yesterday.length > 0 && (
                    <div className="space-y-1 min-w-0">
                      <p className="text-[10px] font-bold tracking-wider text-muted-foreground/60 uppercase px-1 pb-0.5">Yesterday</p>
                      {categorizedSessions.yesterday.map((s) => (
                        <div
                          key={s.id}
                          onClick={() => onLoadSession?.(s.id)}
                          className={cn(
                            "group flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl text-xs font-medium cursor-pointer transition-all border min-w-0 w-full",
                            s.id === activeSessionId
                              ? "bg-primary/10 border-primary/30 text-foreground font-semibold"
                              : "bg-transparent hover:bg-muted/60 border-transparent hover:border-border text-muted-foreground hover:text-foreground"
                          )}
                          title={s.title}
                        >
                          <span className="truncate flex-1 min-w-0 block text-xs">{s.title}</span>
                          {onDeleteSession && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteSession(s.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all cursor-pointer shrink-0"
                              title="Delete chat"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Older */}
                  {categorizedSessions.older.length > 0 && (
                    <div className="space-y-1 min-w-0">
                      <p className="text-[10px] font-bold tracking-wider text-muted-foreground/60 uppercase px-1 pb-0.5">Previous 7 Days</p>
                      {categorizedSessions.older.map((s) => (
                        <div
                          key={s.id}
                          onClick={() => onLoadSession?.(s.id)}
                          className={cn(
                            "group flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl text-xs font-medium cursor-pointer transition-all border min-w-0 w-full",
                            s.id === activeSessionId
                              ? "bg-primary/10 border-primary/30 text-foreground font-semibold"
                              : "bg-transparent hover:bg-muted/60 border-transparent hover:border-border text-muted-foreground hover:text-foreground"
                          )}
                          title={s.title}
                        >
                          <span className="truncate flex-1 min-w-0 block text-xs">{s.title}</span>
                          {onDeleteSession && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteSession(s.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all cursor-pointer shrink-0"
                              title="Delete chat"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>
          </div>
        </aside>

        {/* ── Main Chat Area ── */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-background">
          {/* ── Top Header (Clean: Removed model pill text as requested) ── */}
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

            {/* Right Header Actions */}
            <div className="flex items-center gap-1.5">
              {/* Toggle K2 Agent Settings Right Panel */}
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

              {/* Export Markdown */}
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

              {/* Minimize back to drawer */}
              <ActionTooltip label="Kembali ke Mode Floating Drawer" shortcut="Alt+F" side="bottom">
                <button
                  onClick={onExitFullscreen}
                  className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  <Minimize2 className="w-3.5 h-3.5" />
                </button>
              </ActionTooltip>

              {/* Close fullscreen */}
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

          {/* ── Middle: Centered Chat Content (Cloudflare Style with spacious side margins) ── */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            <div className="w-full max-w-3xl mx-auto px-6 py-8 space-y-6">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-6 text-center">
                  {/* Greeting with Spatial City Map Topology Graphic */}
                  <div className="space-y-3">
                    <AiSpatialNetworkGraphic size="lg" className="mx-auto" />
                    <div>
                      <h2 className="text-2xl font-bold text-foreground">{greeting}</h2>
                      <p className="text-sm text-muted-foreground mt-0.5">What are we doing today?</p>
                    </div>
                  </div>

                  {/* Pinned Ideas — 2-column grid in fullscreen */}
                  {pinnedIdeas.length > 0 && (
                    <div className="w-full max-w-2xl">
                      <p className="text-[10px] font-bold tracking-widest text-muted-foreground/60 uppercase mb-3">IDEAS &amp; QUICK ACTIONS</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {pinnedIdeas.map((idea) => {
                          const Icon = ICON_MAP[idea.icon] || Zap;
                          return (
                            <button
                              key={idea.id}
                              type="button"
                              onClick={() => onSelectIdea(idea)}
                              className={cn(
                                "flex items-start gap-3.5 p-4 rounded-2xl text-left",
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
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                                  {idea.description || idea.prompt}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
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

          {/* ── Input Area (Centered with Cloudflare margins, Ask badge & duplicate sliders removed) ── */}
          <div className="flex-shrink-0 border-t border-border/60 bg-background/95 backdrop-blur-md px-6 py-4">
            <div className="w-full max-w-3xl mx-auto space-y-2">
              <div className="flex items-end gap-3">
                {/* Input wrapper */}
                <div className="relative flex-1 flex items-end rounded-2xl border border-border bg-muted/40 focus-within:ring-1 focus-within:ring-primary focus-within:border-primary transition-all shadow-xs">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => onInputChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type @ to tag a resource or ask any FTTH question..."
                    rows={1}
                    className="flex-1 w-full resize-none bg-transparent px-4 py-2.5 text-sm focus:outline-none placeholder:text-muted-foreground text-foreground min-h-[44px] max-h-48 overflow-y-auto leading-relaxed"
                  />
                </div>

                {/* Send / Stop circle button */}
                <button
                  type="button"
                  onClick={isStreaming ? onStop : onSend}
                  disabled={!input.trim() && !isStreaming}
                  className={cn(
                    "h-11 w-11 rounded-full flex items-center justify-center flex-shrink-0 shadow-md transition-all cursor-pointer",
                    "disabled:opacity-40 disabled:cursor-not-allowed",
                    isStreaming
                      ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                      : "bg-primary hover:bg-primary/90 text-primary-foreground hover:scale-105"
                  )}
                  title={isStreaming ? "Stop" : "Send"}
                >
                  {isStreaming
                    ? <Square className="w-4 h-4 fill-current" />
                    : <Send className="w-4 h-4 -translate-x-px" />}
                </button>
              </div>

              {/* Privacy Disclaimer */}
              <p className="text-[11px] text-muted-foreground text-center pt-1">
                Chats are recorded to improve the service in accordance with our Privacy Policy.
              </p>
            </div>
          </div>
        </div>

        {/* ── Right Collapsible Configuration Panel (Embedded Permissions Manager) ── */}
        {rightPanelOpen && (
          <aside className="w-88 flex-shrink-0 flex flex-col border-l border-border/60 bg-card/90 backdrop-blur-md animate-in slide-in-from-right-2 duration-200 overflow-hidden z-20">
            {/* Header of Right Panel */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/60 bg-background/50">
              <div className="flex items-center gap-2">
                {rightPanelView === "permissions" ? (
                  <button
                    type="button"
                    onClick={() => setRightPanelView("summary")}
                    className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer flex items-center gap-1 text-xs font-semibold"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>
                ) : (
                  <>
                    <Settings className="w-4 h-4 text-primary" />
                    <span className="text-sm font-bold text-foreground">K2 Agent Config</span>
                  </>
                )}
              </div>
              <button
                type="button"
                onClick={() => setRightPanelOpen(false)}
                className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* View 1: Summary */}
            {rightPanelView === "summary" && (
              <ScrollArea className="flex-1 p-4 space-y-4">
                {/* Status Card */}
                <div className="p-3.5 rounded-2xl bg-primary/5 border border-primary/20 space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-primary text-xs">
                    <Check className="w-3.5 h-3.5" />
                    <span>API Token Active</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Scope: <span className="font-semibold text-foreground">{agentAuth?.user_scope || "PLATFORM_INTERNAL"}</span>
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-2">
                    Access Tier: <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary/30 text-primary">{agentAuth?.access_tier || "FULL"}</Badge>
                  </p>
                </div>

                {/* Active Model Info */}
                <div className="p-3.5 rounded-2xl bg-muted/40 border border-border space-y-1.5">
                  <p className="text-xs font-semibold text-foreground">Active Model Engine</p>
                  <p className="text-xs text-primary font-mono font-semibold">{activeModelLabel}</p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Model default dikonfigurasi terpusat oleh Super Admin untuk efisiensi kuota tenant.
                  </p>
                </div>

                {/* Manage Permissions Button */}
                <div className="pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setRightPanelView("permissions")}
                    className="w-full text-xs font-semibold flex items-center justify-center gap-2 py-2 rounded-xl"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-primary" />
                    <span>Manage Permissions</span>
                  </Button>
                </div>
              </ScrollArea>
            )}

            {/* View 2: Embedded Permissions Checklist (Exact match to Gambar 2) */}
            {rightPanelView === "permissions" && (
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                <AiDrawerSettings
                  catalog={permCatalog}
                  loading={permLoading}
                  tier={permTier}
                  selected={permSelected}
                  search={permSearch}
                  expandedDomains={permExpandedDomains}
                  onSetTier={(t) => {
                    setPermTier(t);
                    if (t === "FULL" && permCatalog) {
                      setPermSelected(new Set(permCatalog.domains.flatMap((d) => d.permissions.map((p) => p.id))));
                    } else if (t === "READ_ONLY" && permCatalog) {
                      setPermSelected(new Set(permCatalog.domains.flatMap((d) => d.permissions.filter((p) => p.scope === "Read").map((p) => p.id))));
                    }
                  }}
                  onTogglePermission={(id) => {
                    const next = new Set(permSelected);
                    if (next.has(id)) next.delete(id);
                    else next.add(id);
                    setPermSelected(next);
                    if (permTier !== "CUSTOM") setPermTier("CUSTOM");
                  }}
                  onToggleDomain={(id) => {
                    const next = new Set(permExpandedDomains);
                    if (next.has(id)) next.delete(id);
                    else next.add(id);
                    setPermExpandedDomains(next);
                  }}
                  onSearchChange={setPermSearch}
                  accessTier={permTier === "FULL" ? "Full access" : permTier === "READ_ONLY" ? "Read only" : "Custom"}
                  saving={permSaving}
                  revoking={permRevoking}
                  onSave={handleSavePermissions}
                  onRevoke={handleRevokePermissions}
                />
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}
