"use client";

/**
 * K2NET Floating AI Assistant — Orchestrator
 *
 * Architecture:
 *   FloatingAiAssistant  ← this file (state + sheet shell, ~250 lines)
 *   ├── AiDrawerOnboarding    (ai-drawer-onboarding.tsx)
 *   ├── AiDrawerPermissions   (ai-drawer-permissions.tsx — onboarding step 2)
 *   ├── AiDrawerSettings      (ai-drawer-permissions.tsx — manage permissions)
 *   └── AiDrawerChat          (ai-drawer-chat.tsx — main chat + ideas)
 *       └── MessageBubble     (ai-message-bubble.tsx)
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, Badge } from "@k2net/ui";
import { Sparkles, X, ChevronRight, GripVertical, Maximize2, Plus, History, SlidersHorizontal, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  fetchActiveChatModels,
  incrementAiPromptUsage,
  SuggestedPromptItem,
  fetchAgentAuthorization,
  AgentAuthorizationData,
  PermissionCatalogData,
} from "@/lib/actions/gateways";
import { useAiChatStream, exportChatToMarkdown } from "@/hooks/useAiChatStream";
import { AiDrawerOnboarding } from "./ai-drawer-onboarding";
import { AiDrawerPermissions, AiDrawerSettings, type PermTier } from "./ai-drawer-permissions";
import { AiDrawerChat } from "./ai-drawer-chat";
import { AiFullscreenLayout } from "./ai-fullscreen-layout";

// ─── Constants ────────────────────────────────────────────────────────────────
const DEFAULT_DRAWER_WIDTH = 540;
const MIN_DRAWER_WIDTH = 440;
const MAX_DRAWER_WIDTH = 1200;
const WIDE_DRAWER_WIDTH = 860;
const STORAGE_WIDTH_KEY = "k2net_ai_drawer_width";

const MODELS = [
  { value: "gemini-3.7-flash",              label: "Gemini 3.7 Flash",      badge: "Google" },
  { value: "gemini-2.5-flash",              label: "Gemini 2.5 Flash",      badge: "Google" },
  { value: "gemini-2.5-pro",               label: "Gemini 2.5 Pro (2M)",   badge: "Google" },
  { value: "gemini-2.0-flash-thinking-exp", label: "Gemini Thinking",       badge: "Reasoning" },
  { value: "deep-research-preview-04-2026", label: "Gemini Deep Research",  badge: "Agent" },
  { value: "gpt-4o-mini",                  label: "GPT-4o Mini",           badge: "OpenAI" },
  { value: "gpt-4o",                       label: "GPT-4o",                badge: "OpenAI" },
  { value: "deepseek-chat",                label: "DeepSeek V3",           badge: "DeepSeek" },
  { value: "deepseek-reasoner",            label: "DeepSeek R1",           badge: "DeepSeek" },
  { value: "llama3.2",                     label: "Local Ollama (Llama 3)", badge: "Local" },
  { value: "deepseek-r1:7b",               label: "Local DeepSeek-R1",     badge: "Local" },
];

const FALLBACK_PINNED: SuggestedPromptItem[] = [
  { id: "fb-1", icon: "Zap",          title: "Diagnosa OLT & Redaman Optik",  description: "Troubleshooting OLT ZTE C320/Huawei, LOS & redaman nominal", prompt: "Bagaimana cara troubleshooting OLT ZTE C320 jika port PON statusnya LOS dan berapa standar redaman optik nominalnya?", category: "OLT_TROUBLESHOOTING", target_role: "ALL",         is_pinned: true, is_active: true, is_trending: false, usage_count: 42 },
  { id: "fb-2", icon: "MapPin",       title: "Analisis Jaringan Spasial GIS", description: "PostGIS SRID 4326, kapasitas splitter 1:8 / 1:16",            prompt: "Jelaskan arsitektur database spasial PostGIS SRID 4326 dan standar penempatan ODP pada jaringan distribusi FTTH.", category: "GIS_SPATIAL",          target_role: "ALL",         is_pinned: true, is_active: true, is_trending: false, usage_count: 38 },
  { id: "fb-3", icon: "Activity",     title: "Health Check 12 Microservices", description: "Status poller, kong, postgres, keycloak, minio, audit",       prompt: "Jelaskan port map dan arsitektur 12 microservices gateway internal K2NET.",                                          category: "DEVOPS_INFRA",         target_role: "SUPER_ADMIN", is_pinned: true, is_active: true, is_trending: false, usage_count: 29 },
];

type DrawerView = "chat" | "onboarding" | "permissions" | "settings";

// ─── View title / subtitle helpers ───────────────────────────────────────────
const VIEW_TITLE: Record<DrawerView, string> = {
  chat:        "K2NET Ask AI",
  onboarding:  "K2 Agent Access",
  permissions: "Review Permissions",
  settings:    "K2 Agent Settings",
};

// ─── Main Component ───────────────────────────────────────────────────────────
export function FloatingAiAssistant() {
  // ── Layout & Drawer ──────────────────────────────────────────────────────────
  const [isOpen,        setIsOpen]        = useState(false);
  const [isFullscreen,  setIsFullscreen]  = useState(false);
  const [drawerWidth,   setDrawerWidth]   = useState(DEFAULT_DRAWER_WIDTH);
  const [isWide,        setIsWide]        = useState(false);
  const [isDragging,    setIsDragging]    = useState(false);

  // ── View State ───────────────────────────────────────────────────────────────
  const [view, setView] = useState<DrawerView>("chat");

  // ── Chat ─────────────────────────────────────────────────────────────────────
  const [input,            setInput]            = useState("");
  const [selectedModel,    setSelectedModel]    = useState("gemini-2.5-flash");
  const [availableModels,  setAvailableModels]  = useState(MODELS);
  const [showTokenMenu,    setShowTokenMenu]    = useState(false);
  const [pinnedIdeas,      setPinnedIdeas]      = useState<SuggestedPromptItem[]>([]);

  // ── Authorization ────────────────────────────────────────────────────────────
  const [agentAuth, setAgentAuth] = useState<AgentAuthorizationData | null>(null);

  // ── Permissions (shared between onboarding step 2 and settings view) ────────
  const [permCatalog,        setPermCatalog]        = useState<PermissionCatalogData | null>(null);
  const [permLoading,        setPermLoading]        = useState(false);
  const [permTier,           setPermTier]           = useState<PermTier>("FULL");
  const [permSelected,       setPermSelected]       = useState<Set<string>>(new Set());
  const [permSearch,         setPermSearch]         = useState("");
  const [permExpandedDomains,setPermExpandedDomains]= useState<Set<string>>(new Set());
  const [permSaving,         setPermSaving]         = useState(false);
  const [permRevoking,       setPermRevoking]       = useState(false);

  const [showHistoryInDrawer, setShowHistoryInDrawer] = useState(false);

  const {
    messages,
    isStreaming,
    error,
    sessions,
    activeSessionId,
    sendMessage,
    stopStreaming,
    clearMessages,
    createNewSession,
    loadSession,
    deleteSession,
  } = useAiChatStream({
    model:              selectedModel,
    userScope:          agentAuth?.user_scope        || "PLATFORM_INTERNAL",
    accessTier:         agentAuth?.access_tier       || "FULL",
    grantedPermissions: agentAuth?.granted_permissions || [],
  });

  // ── Load pinned ideas (deduplicated, is_pinned only) ─────────────────────────
  const loadPinnedIdeas = useCallback(async () => {
    try {
      const { fetchAiPromptIdeas } = await import("@/lib/actions/gateways");
      const all = await fetchAiPromptIdeas();
      const seen = new Set<string>();
      setPinnedIdeas(all.filter((p) => p.is_pinned && !seen.has(p.title.toLowerCase().trim()) && seen.add(p.title.toLowerCase().trim()) !== undefined));
    } catch {
      setPinnedIdeas(FALLBACK_PINNED);
    }
  }, []);

  // ── Load auth + models on mount ──────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const [activeRes, authRes] = await Promise.allSettled([
          fetchActiveChatModels(),
          fetchAgentAuthorization("PLATFORM_INTERNAL"),
        ]);
        if (activeRes.status === "fulfilled" && activeRes.value?.models?.length > 0) {
          setAvailableModels(activeRes.value.models.map((m) => ({
            value: m.id.replace("models/", ""),
            label: m.name,
            badge: m.badge || (m.category.includes("Gemini") ? "Google" : m.category.includes("OpenAI") ? "OpenAI" : m.category.includes("DeepSeek") ? "DeepSeek" : "Local"),
          })));
        }
        if (activeRes.status === "fulfilled" && activeRes.value?.default_model) {
          setSelectedModel(activeRes.value.default_model);
        }
        if (authRes.status === "fulfilled" && authRes.value) {
          setAgentAuth(authRes.value);
          if (!authRes.value.is_authorized) setView("onboarding");
        }
      } catch { /* silent */ }
    })();
    loadPinnedIdeas();
  }, [loadPinnedIdeas]);

  // ── Auto-refresh pinned ideas (visibility + custom event) ────────────────────
  useEffect(() => {
    const onVis   = () => { if (!document.hidden) loadPinnedIdeas(); };
    const onPinned = () => loadPinnedIdeas();
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("k2net-prompt-pinned", onPinned);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("k2net-prompt-pinned", onPinned);
    };
  }, [loadPinnedIdeas]);

  // ── Load permission catalog when entering permissions/settings view ──────────
  useEffect(() => {
    if ((view !== "permissions" && view !== "settings") || permCatalog) return;
    setPermLoading(true);
    Promise.all([
      import("@/lib/actions/gateways").then(({ fetchAgentPermissionsCatalog }) =>
        fetchAgentPermissionsCatalog("PLATFORM_INTERNAL")
      ),
    ])
      .then(([cat]) => {
        setPermCatalog(cat);
        setPermExpandedDomains(new Set(cat.domains.map((d) => d.id)));
        const existing = agentAuth?.granted_permissions;
        setPermSelected(
          existing?.length
            ? new Set(existing)
            : new Set(cat.domains.flatMap((d) => d.permissions.map((p) => p.id)))
        );
        setPermTier((agentAuth?.access_tier as PermTier) || "FULL");
      })
      .catch(console.error)
      .finally(() => setPermLoading(false));
  }, [view, permCatalog, agentAuth]);

  // ── Keyboard shortcut + custom events ───────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "j") { e.preventDefault(); setIsOpen((p) => !p); }
      if (e.key === "Escape" && isOpen) setIsOpen(false);
    };
    const onToggle = () => setIsOpen((p) => !p);
    const onPrompt = (e: Event) => {
      const ce = e as CustomEvent<{ prompt: string }>;
      if (ce.detail?.prompt) { setInput(ce.detail.prompt); setIsOpen(true); setView("chat"); }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("k2net-toggle-ai-assistant", onToggle);
    window.addEventListener("k2net-ai-prompt-input", onPrompt);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("k2net-toggle-ai-assistant", onToggle);
      window.removeEventListener("k2net-ai-prompt-input", onPrompt);
    };
  }, [isOpen]);

  // ── Restore saved width ──────────────────────────────────────────────────────
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_WIDTH_KEY);
      if (saved) {
        const w = parseInt(saved, 10);
        if (w >= MIN_DRAWER_WIDTH && w <= MAX_DRAWER_WIDTH) setDrawerWidth(w);
      }
    } catch { /* ignore */ }
  }, []);

  // ── Drag to resize ───────────────────────────────────────────────────────────
  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    const onMove = (me: MouseEvent) => {
      const w = window.innerWidth - me.clientX;
      if (w >= MIN_DRAWER_WIDTH && w <= Math.min(MAX_DRAWER_WIDTH, window.innerWidth - 60)) setDrawerWidth(w);
    };
    const onUp = () => {
      setIsDragging(false);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      try { localStorage.setItem(STORAGE_WIDTH_KEY, String(drawerWidth)); } catch { /* ignore */ }
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [drawerWidth]);

  const toggleWide = useCallback(() => {
    setIsWide((prev) => {
      const w = prev ? DEFAULT_DRAWER_WIDTH : WIDE_DRAWER_WIDTH;
      setDrawerWidth(w);
      try { localStorage.setItem(STORAGE_WIDTH_KEY, String(w)); } catch { /* ignore */ }
      return !prev;
    });
  }, []);

  // ── Permission helpers ───────────────────────────────────────────────────────
  const applyTier = useCallback((tier: PermTier) => {
    setPermTier(tier);
    if (!permCatalog) return;
    if (tier === "FULL") {
      setPermSelected(new Set(permCatalog.domains.flatMap((d) => d.permissions.map((p) => p.id))));
    } else if (tier === "READ_ONLY") {
      setPermSelected(new Set(permCatalog.domains.flatMap((d) => d.permissions.filter((p) => p.scope === "Read").map((p) => p.id))));
    }
  }, [permCatalog]);

  const togglePerm = useCallback((id: string) => {
    setPermTier("CUSTOM");
    setPermSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const toggleDomain = useCallback((id: string) => {
    setPermExpandedDomains((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const handleAuthorize = useCallback(async () => {
    try {
      setPermSaving(true);
      const { saveAgentAuthorization } = await import("@/lib/actions/gateways");
      const res = await saveAgentAuthorization({ agent_name: "K2 Agent", user_scope: "PLATFORM_INTERNAL", access_tier: permTier, granted_permissions: Array.from(permSelected) });
      setAgentAuth(res);
      setView("chat");
      (await import("sonner")).toast.success("K2 Agent berhasil diotorisasi!");
    } catch {
      (await import("sonner")).toast.error("Gagal menyimpan otorisasi");
    } finally {
      setPermSaving(false);
    }
  }, [permTier, permSelected]);

  const handleRevoke = useCallback(async () => {
    if (!confirm("Cabut akses K2 Agent?")) return;
    try {
      setPermRevoking(true);
      const { revokeAgentAuthorization } = await import("@/lib/actions/gateways");
      await revokeAgentAuthorization();
      setAgentAuth(null); setPermCatalog(null); setView("onboarding");
      (await import("sonner")).toast.success("Otorisasi berhasil dicabut");
    } catch {
      (await import("sonner")).toast.error("Gagal mencabut otorisasi");
    } finally {
      setPermRevoking(false);
    }
  }, []);

  // Shared props for permissions domain list
  const permSharedProps = {
    catalog: permCatalog, loading: permLoading, tier: permTier, selected: permSelected,
    search: permSearch, expandedDomains: permExpandedDomains,
    onSetTier: applyTier, onTogglePermission: togglePerm, onToggleDomain: toggleDomain,
    onSearchChange: setPermSearch,
  };

  // ── Header subtitle ──────────────────────────────────────────────────────────
  const subtitle =
    view === "chat"
      ? "160+ Dokumen FTTH • Spasial PostGIS"
      : view === "settings"
      ? `Scope: PLATFORM_INTERNAL • ${agentAuth?.access_tier || "FULL"}`
      : "K2NET Core Platform (Root HQ)";

  return (
    <>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent
        side="right"
        showCloseButton={false}
        style={{ width: `${drawerWidth}px`, maxWidth: "95vw" }}
        className={cn(
          "p-0 flex flex-col bg-background border-l border-border transition-[width] duration-75 select-text",
          isDragging && "transition-none select-none"
        )}
      >
        {/* Drag resize handle */}
        <div
          onMouseDown={startResizing}
          className={cn("absolute -left-1.5 top-0 bottom-0 w-3 cursor-ew-resize group z-50 flex items-center justify-center", isDragging && "bg-primary/20")}
        >
          <div className="w-1 h-12 rounded-full bg-border group-hover:bg-primary/70 transition-colors flex items-center justify-center">
            <GripVertical className="w-2.5 h-2.5 text-muted-foreground group-hover:text-primary opacity-60" />
          </div>
        </div>

        {/* ── Header (Unified Single Top Header) ── */}
        <SheetHeader className="px-4 py-2.5 border-b border-border bg-background/95 backdrop-blur-md flex-shrink-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              {/* Back button */}
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
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-primary/40 text-primary bg-primary/10">
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
                  {/* New Chat Button */}
                  <button
                    type="button"
                    onClick={createNewSession}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-muted text-foreground text-xs font-semibold border border-border/70 transition-colors cursor-pointer"
                    title="New Chat"
                  >
                    <Plus className="w-3.5 h-3.5 text-primary" />
                    <span>New</span>
                  </button>

                  {/* History Button */}
                  <button
                    type="button"
                    onClick={() => setShowHistoryInDrawer((p) => !p)}
                    className={cn(
                      "p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer relative",
                      showHistoryInDrawer && "text-primary bg-primary/10 border border-primary/20"
                    )}
                    title="Riwayat Percakapan"
                  >
                    <History className="w-4 h-4" />
                    {sessions.length > 0 && (
                      <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-primary text-primary-foreground text-[8px] font-bold flex items-center justify-center">
                        {sessions.length}
                      </span>
                    )}
                  </button>

                  {/* Config / Permissions Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowHistoryInDrawer(false);
                      setShowTokenMenu(false);
                      setPermSearch("");
                      setView("settings");
                    }}
                    className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    title="K2 Agent Permissions & Settings"
                  >
                    <SlidersHorizontal className="w-4 h-4" />
                  </button>

                  {/* Export Markdown */}
                  {messages.length > 0 && (
                    <button
                      type="button"
                      onClick={() => exportChatToMarkdown(messages)}
                      className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      title="Export Markdown"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  )}

                  {/* Fullscreen Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowHistoryInDrawer(false);
                      setIsOpen(false);
                      setIsFullscreen(true);
                    }}
                    className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    title="Full Screen View (Cloudflare Style)"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                </>
              )}

              {/* Close Drawer Button */}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </SheetHeader>

        {/* ── Views ── */}
        {view === "onboarding" && (
          <AiDrawerOnboarding onReviewPermissions={() => { setPermSearch(""); setView("permissions"); }} />
        )}

        {view === "permissions" && (
          <AiDrawerPermissions
            {...permSharedProps}
            saving={permSaving}
            onCancel={() => setView("onboarding")}
            onAuthorize={handleAuthorize}
          />
        )}

        {view === "settings" && (
          <AiDrawerSettings
            {...permSharedProps}
            accessTier={agentAuth?.access_tier || "FULL"}
            saving={permSaving}
            revoking={permRevoking}
            onSave={handleAuthorize}
            onRevoke={handleRevoke}
          />
        )}

        {view === "chat" && (
          <AiDrawerChat
            messages={messages}
            pinnedIdeas={pinnedIdeas}
            input={input}
            onInputChange={setInput}
            onSend={async () => {
              const msg = input.trim();
              if (!msg || isStreaming) return;
              setInput("");
              await sendMessage(msg);
            }}
            onStop={stopStreaming}
            onClear={clearMessages}
            onSelectIdea={(idea) => {
              setInput(idea.prompt);
              if (idea.id && !idea.id.startsWith("fb-")) incrementAiPromptUsage(idea.id);
            }}
            isStreaming={isStreaming}
            error={error}
            sessions={sessions}
            activeSessionId={activeSessionId}
            onNewChat={createNewSession}
            onLoadSession={loadSession}
            onDeleteSession={deleteSession}
            showHistory={showHistoryInDrawer}
            onToggleHistory={() => setShowHistoryInDrawer((p) => !p)}
          />
        )}
      </SheetContent>
    </Sheet>

    {/* ── Fullscreen Viewport Mode (Cloudflare Style) ── */}
    {isFullscreen && (
      <AiFullscreenLayout
        messages={messages}
        pinnedIdeas={pinnedIdeas}
        input={input}
        onInputChange={setInput}
        onSend={async () => {
          const msg = input.trim();
          if (!msg || isStreaming) return;
          setInput("");
          await sendMessage(msg);
        }}
        onStop={stopStreaming}
        onClear={clearMessages}
        onSelectIdea={(idea) => {
          setInput(idea.prompt);
          if (idea.id && !idea.id.startsWith("fb-")) incrementAiPromptUsage(idea.id);
        }}
        onConfigurePermissions={() => {
          setIsFullscreen(false);
          setIsOpen(true);
          setShowTokenMenu(false);
          setPermSearch("");
          setView("settings");
        }}
        isStreaming={isStreaming}
        error={error}
        agentAuth={agentAuth}
        showTokenMenu={showTokenMenu}
        onToggleTokenMenu={() => setShowTokenMenu((p) => !p)}
        selectedModel={selectedModel}
        onModelChange={setSelectedModel}
        availableModels={availableModels}
        onExitFullscreen={() => {
          setIsFullscreen(false);
          setIsOpen(true);
        }}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onNewChat={createNewSession}
        onLoadSession={loadSession}
        onDeleteSession={deleteSession}
      />
    )}
    </>
  );
}
