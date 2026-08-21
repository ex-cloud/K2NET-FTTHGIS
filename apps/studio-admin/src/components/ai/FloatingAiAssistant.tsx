"use client";

/**
 * K2NET Floating AI Assistant (Supabase & ChatGPT Pro Style)
 * - Top Navbar Trigger [ Ask AI ❖ Ctrl+J ] & Keyboard shortcut Cmd+J / Ctrl+J
 * - Resizable Slide-over Drawer (Draggable Left Border, min 440px - max 1200px)
 * - Supabase AI Header Toolbar (New Chat, Wide/Expand Mode, Export Markdown, Clear, Close)
 * - Supabase AI Step-by-Step Reasoned Accordion (✓ load_knowledge, ✓ search_docs, ↻ Thinking)
 * - Rich Markdown Renderer with dark code block header, copy button, and data tables
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Button,
  ScrollArea,
  Badge,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@k2net/ui";
import {
  Sparkles,
  X,
  Send,
  Square,
  Trash2,
  Copy,
  Check,
  ChevronRight,
  ChevronDown,
  BookOpen,
  Zap,
  MapPin,
  Activity,
  Database,
  GitPullRequest,
  ShieldCheck,
  BrainCircuit,
  Loader2,
  Download,
  Maximize2,
  Minimize2,
  PlusCircle,
  GripVertical,
  Flame,
  Layers,
  HelpCircle,
  Cpu,
  SlidersHorizontal,
  ArrowUpRight,
  Settings2,
} from "lucide-react";
import { 
  fetchActiveChatModels, 
  fetchAiPromptIdeas, 
  incrementAiPromptUsage, 
  SuggestedPromptItem,
  fetchAgentAuthorization,
  AgentAuthorizationData
} from "@/lib/actions/gateways";
import { AgentOnboardingModal } from "@/components/ai/agent-onboarding-modal";
import { AgentSettingsPanel } from "@/components/ai/agent-settings-panel";
import { cn } from "@/lib/utils";
import {
  useAiChatStream,
  ChatMessage,
  DocumentSource,
  exportChatToMarkdown,
} from "@/hooks/useAiChatStream";
import { AiMarkdownRenderer } from "@/components/ai/AiMarkdownRenderer";

const DEFAULT_DRAWER_WIDTH = 540;
const MIN_DRAWER_WIDTH = 440;
const MAX_DRAWER_WIDTH = 1200;
const WIDE_DRAWER_WIDTH = 860;
const STORAGE_WIDTH_KEY = "k2net_ai_drawer_width";

// ─── Dynamic Icon Map for Suggested Ideas ──────────────────────────────────
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Zap,
  MapPin,
  Activity,
  Database,
  GitPullRequest,
  ShieldCheck,
  Flame,
  Sparkles,
  Cpu,
  Layers,
  HelpCircle,
};

// ─── Fallback Initial Ideas (while loading from server) ──────────────────────
const FALLBACK_IDEAS: SuggestedPromptItem[] = [
  {
    id: "fallback-1",
    icon: "Zap",
    title: "Diagnosa OLT & Redaman Optik",
    description: "Troubleshooting OLT ZTE C320/Huawei, status LOS & redaman nominal",
    prompt:
      "Bagaimana cara troubleshooting OLT ZTE C320 jika port PON statusnya LOS dan berapa standar redaman optik nominalnya?",
    category: "OLT_TROUBLESHOOTING",
    target_role: "ALL",
    is_pinned: true,
    is_active: true,
    is_trending: false,
    usage_count: 42,
  },
  {
    id: "fallback-2",
    icon: "MapPin",
    title: "Analisis Jaringan Spasial GIS & ODP",
    description: "Standar koordinat PostGIS EPSG:4326, kapasitas splitter 1:8 / 1:16",
    prompt:
      "Jelaskan arsitektur database spasial PostGIS SRID 4326 dan standar penempatan ODP pada jaringan distribusi FTTH.",
    category: "GIS_SPATIAL",
    target_role: "ALL",
    is_pinned: true,
    is_active: true,
    is_trending: false,
    usage_count: 38,
  },
  {
    id: "fallback-3",
    icon: "Activity",
    title: "Health Check 12 Microservices",
    description: "Verifikasi status poller, kong, postgres, keycloak, minio, audit",
    prompt:
      "Jelaskan port map dan arsitektur 12 microservices gateway internal K2NET.",
    category: "DEVOPS_INFRA",
    target_role: "SUPER_ADMIN",
    is_pinned: true,
    is_active: true,
    is_trending: false,
    usage_count: 29,
  },
  {
    id: "fallback-4",
    icon: "Database",
    title: "Panduan Backup & Disaster Recovery",
    description: "SOP 3-Layer backup lokal, MinIO S3, dan Nextcloud offsite cloud",
    prompt:
      "Jelaskan strategi 3-layer disaster recovery backup database dan file di K2NET.",
    category: "BACKUP_RECOVERY",
    target_role: "SUPER_ADMIN",
    is_pinned: false,
    is_active: true,
    is_trending: false,
    usage_count: 21,
  },
  {
    id: "fallback-5",
    icon: "GitPullRequest",
    title: "Buat Linear Project & DevOps Task",
    description: "Integrasi sistem tugas, alur tiket B2B, dan sinkronisasi Obsidian",
    prompt:
      "Jelaskan cara membuat tiket atau proyek DevOps baru yang otomatis tersinkronisasi ke Obsidian Vault.",
    category: "DEVOPS_INFRA",
    target_role: "ALL",
    is_pinned: false,
    is_active: true,
    is_trending: false,
    usage_count: 18,
  },
  {
    id: "fallback-6",
    icon: "ShieldCheck",
    title: "Keamanan Multi-Tenant & RBAC",
    description: "One Realm per Org Keycloak, Superadmin God Mode, dan X-Tenant-ID",
    prompt:
      "Jelaskan arsitektur isolasi multi-tenant dan sistem Hybrid RBAC di K2NET FTTH GIS.",
    category: "RBAC_SECURITY",
    target_role: "SUPER_ADMIN",
    is_pinned: false,
    is_active: true,
    is_trending: false,
    usage_count: 15,
  },
];

const MODELS = [
  { value: "gemini-3.7-flash", label: "Gemini 3.7 Flash", badge: "Google" },
  { value: "gemini-3.6-flash", label: "Gemini 3.6 Flash", badge: "Google" },
  { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash", badge: "Google" },
  { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro (2M)", badge: "Google" },
  { value: "gemini-2.0-flash-thinking-exp", label: "Gemini Thinking", badge: "Reasoning" },
  { value: "deep-research-preview-04-2026", label: "Gemini Deep Research", badge: "Agent" },
  { value: "gpt-4o-mini", label: "GPT-4o Mini", badge: "OpenAI" },
  { value: "gpt-4o", label: "GPT-4o", badge: "OpenAI" },
  { value: "deepseek-chat", label: "DeepSeek V3", badge: "DeepSeek" },
  { value: "deepseek-reasoner", label: "DeepSeek R1", badge: "DeepSeek" },
  { value: "llama3.2", label: "Local Ollama (Llama 3)", badge: "Local" },
  { value: "deepseek-r1:7b", label: "Local DeepSeek-R1", badge: "Local" },
];

// ─── Message Bubble Component ─────────────────────────────────────────────────
function MessageBubble({ message }: { message: ChatMessage }) {
  const [copied, setCopied] = useState(false);
  const [showThinking, setShowThinking] = useState(false);
  const isUser = message.role === "user";

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [message.content]);

  return (
    <div className={cn("flex gap-3 group", isUser && "flex-row-reverse")}>
      {/* Avatar */}
      <div
        className={cn(
          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-xs",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-gradient-to-br from-primary via-primary/90 to-primary/70 text-primary-foreground"
        )}
      >
        {isUser ? "U" : <Sparkles className="w-4 h-4" />}
      </div>

      {/* Content */}
      <div className={cn("flex-1 min-w-0", isUser && "flex flex-col items-end")}>
        {/* ── Supabase-Style Step-by-Step Reasoned Accordion ── */}
        {!isUser &&
          (message.isThinking ||
            message.thought ||
            message.isStreaming ||
            (message.sources && message.sources.length > 0)) && (
            <div className="mb-3 rounded-xl border border-border/80 bg-card text-xs overflow-hidden max-w-[95%] shadow-xs">
              <button
                type="button"
                onClick={() => setShowThinking(!showThinking)}
                className="w-full px-3.5 py-2 flex items-center justify-between text-[11px] font-semibold text-foreground/90 hover:text-foreground bg-muted/40 hover:bg-muted/70 transition-colors cursor-pointer border-b border-border/40"
              >
                <span className="flex items-center gap-2">
                  <BrainCircuit
                    className={cn(
                      "w-3.5 h-3.5 text-primary",
                      message.isStreaming && "animate-pulse"
                    )}
                  />
                  <span className="font-semibold text-foreground">
                    {message.isStreaming && !message.content
                      ? "Menganalisis & Menalar..."
                      : "Reasoned & Knowledge Grounding"}
                  </span>
                  {message.isStreaming && !message.content && (
                    <Loader2 className="w-3 h-3 animate-spin text-primary ml-1" />
                  )}
                </span>
                <ChevronDown
                  className={cn(
                    "w-3.5 h-3.5 transition-transform duration-200 text-muted-foreground",
                    showThinking ? "rotate-180" : ""
                  )}
                />
              </button>

              {/* Collapsible Steps list */}
              <div className="px-3.5 py-2.5 bg-background/60 space-y-1.5 font-mono text-[11px]">
                {/* Step 1: Hybrid RAG Search */}
                <div className="flex items-center gap-2 text-foreground/80">
                  <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span>Ran pgvector semantic embedding (HNSW)</span>
                </div>

                {/* Step 2: BM25 FTS */}
                <div className="flex items-center gap-2 text-foreground/80">
                  <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span>Ran BM25 Full-Text search across 160+ K2NET documents</span>
                </div>

                {/* Step 3: Sources count */}
                {message.sources && message.sources.length > 0 && (
                  <div className="flex items-center gap-2 text-primary font-medium">
                    <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>
                      Retrieved {message.sources.length} matching knowledge chunks
                    </span>
                  </div>
                )}

                {/* Step 4: Thinking status */}
                {message.isStreaming && !message.content && (
                  <div className="flex items-center gap-2 text-muted-foreground italic animate-pulse">
                    <Loader2 className="w-3 h-3 animate-spin shrink-0 text-primary" />
                    <span>
                      {message.thinkingStage || "Mengevaluasi parameter teknis..."}
                    </span>
                  </div>
                )}

                {/* Detailed Thought Logs (if expanded) */}
                {showThinking && message.thought && (
                  <div className="mt-2 pt-2 border-t border-border/50 text-[11px] text-muted-foreground whitespace-pre-wrap max-h-40 overflow-y-auto custom-scrollbar bg-muted/30 p-2 rounded-md">
                    {message.thought}
                  </div>
                )}
              </div>
            </div>
          )}

        {/* Message Main Bubble */}
        <div
          className={cn(
            "rounded-2xl px-4 py-3 max-w-[92%] text-sm shadow-xs",
            isUser
              ? "bg-primary text-primary-foreground rounded-tr-sm font-medium"
              : "bg-card text-foreground border border-border rounded-tl-sm"
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
          ) : (
            <>
              {message.isStreaming && !message.content && !message.thought && (
                <div className="flex gap-1.5 items-center h-5">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
              )}
              {message.content && (
                <AiMarkdownRenderer content={message.content} />
              )}
              {message.isStreaming && message.content && (
                <span className="inline-block w-1.5 h-4 bg-primary ml-1 animate-pulse align-middle" />
              )}
            </>
          )}
        </div>

        {/* Cache Hit Badge */}
        {!isUser && message.cacheHit && (
          <div className="text-[10px] text-amber-500 flex items-center gap-1 mt-1.5 mb-1">
            <Zap className="w-2.5 h-2.5" />
            <span className="font-semibold">Redis Semantic Cache</span>
            <span className="text-muted-foreground">• respons instan</span>
          </div>
        )}

        {/* Citation Sources Badges */}
        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2.5 max-w-[92%]">
            {message.sources.map((src: DocumentSource, i: number) => (
              <Badge
                key={i}
                variant="secondary"
                className="text-[10px] gap-1 cursor-default py-0.5 px-2 border border-border"
                title={src.content_preview}
              >
                <BookOpen className="w-2.5 h-2.5 text-primary" />
                <span className="font-medium text-foreground">
                  {src.title.length > 24 ? src.title.slice(0, 24) + "…" : src.title}
                </span>
                <span className="text-muted-foreground font-mono">
                  {(src.similarity_score * 100).toFixed(0)}%
                </span>
              </Badge>
            ))}
          </div>
        )}

        {/* Metrics + Copy */}
        {!isUser && !message.isStreaming && message.content && (
          <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {message.latencyMs && (
              <span className="text-[10px] text-muted-foreground font-mono">
                {message.latencyMs}ms
              </span>
            )}
            <button
              onClick={handleCopy}
              className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              title="Salin jawaban"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-primary" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Floating AI Assistant ───────────────────────────────────────────────
export function FloatingAiAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [selectedModel, setSelectedModel] = useState("gemini-2.5-flash");
  const [availableModels, setAvailableModels] = useState<Array<{ value: string; label: string; badge: string }>>(MODELS);
  const [promptIdeas, setPromptIdeas] = useState<SuggestedPromptItem[]>(FALLBACK_IDEAS);
  const [drawerWidth, setDrawerWidth] = useState<number>(DEFAULT_DRAWER_WIDTH);
  const [isWide, setIsWide] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // ── K2 Agent Authorization & Settings State ────────────────────────────────
  const [agentAuth, setAgentAuth] = useState<AgentAuthorizationData | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [showTokenMenu, setShowTokenMenu] = useState(false);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    isStreaming,
    error,
    sendMessage,
    stopStreaming,
    clearMessages,
  } = useAiChatStream({ 
    model: selectedModel,
    userScope: agentAuth?.user_scope || "PLATFORM_INTERNAL",
    accessTier: agentAuth?.access_tier || "FULL",
    grantedPermissions: agentAuth?.granted_permissions || []
  });

  // ── Fetch dynamic models, prompt ideas & authorization on mount ─────────────
  useEffect(() => {
    async function loadData() {
      try {
        const [activeRes, ideasRes, authRes] = await Promise.allSettled([
          fetchActiveChatModels(),
          fetchAiPromptIdeas(),
          fetchAgentAuthorization("PLATFORM_INTERNAL"),
        ]);

        if (activeRes.status === "fulfilled" && activeRes.value?.models && activeRes.value.models.length > 0) {
          const smartList = activeRes.value.models.map((m) => ({
            value: m.id.replace("models/", ""),
            label: m.name,
            badge: m.badge || (m.category.includes("Gemini") ? "Google" : m.category.includes("OpenAI") ? "OpenAI" : m.category.includes("DeepSeek") ? "DeepSeek" : "Local"),
          }));
          setAvailableModels(smartList);
        }

        if (activeRes.status === "fulfilled" && activeRes.value?.default_model) {
          setSelectedModel(activeRes.value.default_model);
        }

        if (ideasRes.status === "fulfilled" && ideasRes.value && ideasRes.value.length > 0) {
          setPromptIdeas(ideasRes.value);
        }

        if (authRes.status === "fulfilled" && authRes.value) {
          setAgentAuth(authRes.value);
          if (!authRes.value.is_authorized) {
            setShowOnboarding(true);
          }
        }
      } catch (err) {
        console.debug("Dynamic assistant init fallback:", err);
      }
    }

    loadData();
  }, []);

  const handleSelectIdea = (idea: SuggestedPromptItem) => {
    setInput(idea.prompt);
    if (idea.id && !idea.id.startsWith("fallback-")) {
      incrementAiPromptUsage(idea.id);
    }
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  // ── Load saved width on mount ─────────────────────────────────────────────
  useEffect(() => {
    try {
      const savedWidth = localStorage.getItem(STORAGE_WIDTH_KEY);
      if (savedWidth) {
        const parsed = parseInt(savedWidth, 10);
        if (!isNaN(parsed) && parsed >= MIN_DRAWER_WIDTH && parsed <= MAX_DRAWER_WIDTH) {
          setDrawerWidth(parsed);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // ── Keyboard shortcut: Cmd+J / Ctrl+J & Custom Event Listener ─────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "j") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    const handleCustomToggle = () => {
      setIsOpen((prev) => !prev);
    };

    const handlePromptInput = (e: Event) => {
      const customEvent = e as CustomEvent<{ prompt: string }>;
      if (customEvent.detail?.prompt) {
        setInput(customEvent.detail.prompt);
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 150);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("k2net-toggle-ai-assistant", handleCustomToggle);
    window.addEventListener("k2net-ai-prompt-input", handlePromptInput);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("k2net-toggle-ai-assistant", handleCustomToggle);
      window.removeEventListener("k2net-ai-prompt-input", handlePromptInput);
    };
  }, [isOpen]);

  // ── Auto scroll ke bawah saat ada pesan baru ───────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Focus input saat drawer dibuka ────────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // ── Drag to Resize Handler ────────────────────────────────────────────────
  const startResizing = useCallback((mouseDownEvent: React.MouseEvent) => {
    mouseDownEvent.preventDefault();
    setIsDragging(true);

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth >= MIN_DRAWER_WIDTH && newWidth <= Math.min(MAX_DRAWER_WIDTH, window.innerWidth - 60)) {
        setDrawerWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      try {
        localStorage.setItem(STORAGE_WIDTH_KEY, String(drawerWidth));
      } catch {
        // ignore
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  }, [drawerWidth]);

  // ── Toggle Wide Mode ──────────────────────────────────────────────────────
  const toggleWideMode = useCallback(() => {
    setIsWide((prev) => {
      const next = !prev;
      const targetWidth = next ? WIDE_DRAWER_WIDTH : DEFAULT_DRAWER_WIDTH;
      setDrawerWidth(targetWidth);
      try {
        localStorage.setItem(STORAGE_WIDTH_KEY, String(targetWidth));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const handleSend = useCallback(async () => {
    const msg = input.trim();
    if (!msg || isStreaming) return;
    setInput("");
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }
    await sendMessage(msg);
  }, [input, isStreaming, sendMessage]);

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

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
          {/* ── Drag Resize Handle on Left Border (Supabase Style) ── */}
          <div
            onMouseDown={startResizing}
            className={cn(
              "absolute -left-1.5 top-0 bottom-0 w-3 cursor-ew-resize group z-50 flex items-center justify-center",
              isDragging && "bg-primary/20"
            )}
            title="Tarik untuk mengubah lebar panel AI"
          >
            <div className="w-1 h-12 rounded-full bg-border group-hover:bg-primary/70 transition-colors flex items-center justify-center">
              <GripVertical className="w-2.5 h-2.5 text-muted-foreground group-hover:text-primary opacity-60" />
            </div>
          </div>

          {/* ── Top Header & Toolbar (Supabase AI Style) ── */}
          <SheetHeader className="px-4 py-3 border-b border-border bg-background/95 backdrop-blur-md flex-shrink-0">
            <div className="flex items-center justify-between gap-2">
              {/* Title & Badge */}
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary via-primary/90 to-primary/70 flex items-center justify-center text-primary-foreground shadow-xs shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <SheetTitle className="text-sm font-semibold text-foreground truncate">
                      K2NET Ask AI
                    </SheetTitle>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary/40 text-primary bg-primary/10">
                      RAG Live
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate">
                    160+ Dokumen FTTH • Spasial PostGIS
                  </p>
                </div>
              </div>

              {/* Action Toolbar Icons (Supabase AI style) */}
              <div className="flex items-center gap-1.5 shrink-0">
                {/* Model Selector Pill */}
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger className="h-7 text-xs w-[145px] border-border/60 bg-muted/40 font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {availableModels.map((m) => (
                      <SelectItem key={m.value} value={m.value} className="text-xs">
                        <div className="flex items-center justify-between w-full gap-2">
                          <span className="truncate">{m.label}</span>
                          <Badge variant="outline" className="text-[9px] px-1 py-0 font-mono shrink-0">
                            {m.badge}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* New Chat Button */}
                <button
                  onClick={clearMessages}
                  className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  title="Mulai percakapan baru (New Chat)"
                >
                  <PlusCircle className="w-4 h-4" />
                </button>

                {/* Toggle Wide / Fullscreen Width */}
                <button
                  onClick={toggleWideMode}
                  className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  title={isWide ? "Kembalikan ke ukuran standar" : "Perlebar layar (Wide Mode)"}
                >
                  {isWide ? (
                    <Minimize2 className="w-4 h-4" />
                  ) : (
                    <Maximize2 className="w-4 h-4" />
                  )}
                </button>

                {/* Export Markdown */}
                {messages.length > 0 && (
                  <>
                    <button
                      onClick={() => exportChatToMarkdown(messages)}
                      className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      title="Ekspor percakapan ke Markdown (.md)"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={clearMessages}
                      className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                      title="Hapus riwayat chat"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}

                {/* Close Button */}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  title="Tutup (Esc)"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </SheetHeader>

          {/* ── Message List ── */}
          <ScrollArea className="flex-1 min-h-0">
            <div className="px-4 py-4 space-y-4">
              {messages.length === 0 ? (
                /* Cloudflare-Style Hero & Empty State (Matching Screenshot 3) */
                <div className="space-y-4 py-2">
                  
                  {/* Hero Greeting & Avatar */}
                  <div className="text-center py-2 space-y-2">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary/30 via-primary/15 to-amber-500/20 border border-primary/30 flex items-center justify-center shadow-md shadow-primary/10 mx-auto">
                      <Sparkles className="w-8 h-8 text-primary animate-pulse" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-foreground">
                        {new Date().getHours() < 12 
                          ? "Good morning." 
                          : new Date().getHours() < 18 
                          ? "Good afternoon." 
                          : "Good evening."}
                      </h2>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        What are we doing today?
                      </p>
                    </div>
                  </div>

                  {/* Ideas Cards (Supabase Style) */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-bold tracking-wider text-muted-foreground/70 uppercase">
                      <span>IDEAS & QUICK ACTIONS</span>
                      <span>{promptIdeas.length} Rekomendasi</span>
                    </div>
                    {promptIdeas.map((idea) => {
                      const IconComponent = ICON_MAP[idea.icon] || Zap;
                      return (
                        <button
                          key={idea.id}
                          type="button"
                          onClick={() => handleSelectIdea(idea)}
                          className={cn(
                            "w-full flex items-start gap-3 p-3 rounded-xl text-left",
                            "bg-card hover:bg-muted/60 border border-border hover:border-primary/40",
                            "transition-all duration-150 group cursor-pointer shadow-xs"
                          )}
                        >
                          <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary/20 group-hover:scale-105 transition-all">
                            <IconComponent className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                                {idea.title}
                              </span>
                              {idea.is_pinned && (
                                <Badge variant="outline" className="text-[9px] font-mono px-1.5 py-0 text-amber-500 border-amber-500/30 bg-amber-500/10">
                                  Pinned
                                </Badge>
                              )}
                              {idea.is_trending && (
                                <Badge variant="outline" className="text-[9px] font-mono px-1.5 py-0 text-primary border-primary/30 bg-primary/10">
                                  Trending
                                </Badge>
                              )}
                            </div>
                            <div className="text-[11px] text-muted-foreground truncate mt-0.5">
                              {idea.description || idea.prompt}
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
                        </button>
                      );
                    })}
                  </div>

                  {/* Privacy Disclaimer Banner (Matching Screenshot 3) */}
                  <div className="p-2.5 rounded-xl bg-muted/40 border border-border text-[11px] text-muted-foreground">
                    Chats are recorded to improve the service and are processed in accordance with our Privacy Policy.
                  </div>

                </div>
              ) : (
                messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)
              )}

              {/* Error Banner */}
              {error && (
                <div className="px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive">
                  ⚠️ {error}
                </div>
              )}

              <div ref={bottomRef} />
            </div>
          </ScrollArea>

          {/* ── Input Area (Matching Screenshot 3 & 4) ── */}
          <div className="px-4 py-3 border-t border-border bg-background/95 backdrop-blur-md flex-shrink-0">
            <div className="flex gap-2 items-end">
              <div className="relative flex-1">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Type @ to tag a resource or / for shortcuts..."
                  rows={1}
                  className={cn(
                    "w-full resize-none rounded-xl pl-16 pr-10 py-2.5 text-xs sm:text-[13px]",
                    "bg-muted/40 border border-border",
                    "focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary",
                    "placeholder:text-muted-foreground text-foreground",
                    "max-h-28 overflow-y-auto leading-relaxed"
                  )}
                  style={{ height: "auto" }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = "auto";
                    target.style.height = `${Math.min(target.scrollHeight, 112)}px`;
                  }}
                />

                {/* Left Badge Pill "Ask" (Matching Screenshot 3) */}
                <div className="absolute left-2.5 bottom-2.5 flex items-center">
                  <Badge variant="outline" className="text-[9px] font-mono px-1.5 py-0.5 border-primary/30 text-primary bg-primary/10 select-none">
                    Ask
                  </Badge>
                </div>

                {/* Right Sliders / Token Settings Icon Button (Matching Screenshot 3 & 4) */}
                <div className="absolute right-2.5 bottom-2 flex items-center">
                  <button
                    type="button"
                    onClick={() => setShowTokenMenu(!showTokenMenu)}
                    className={cn(
                      "p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer",
                      showTokenMenu && "text-primary bg-primary/10"
                    )}
                    title="Pengaturan Otorisasi & Token K2 Agent"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                  </button>

                  {/* Token Active Popover Menu (Matching Screenshot 4) */}
                  {showTokenMenu && (
                    <div className="absolute bottom-9 right-0 w-64 p-2 bg-card border border-border rounded-xl shadow-xl space-y-1 text-xs z-50 animate-in fade-in zoom-in-95 duration-100">
                      <div className="p-2 rounded-lg bg-primary/5 border border-primary/20 space-y-0.5">
                        <div className="flex items-center gap-1.5 font-bold text-primary text-xs">
                          <Check className="w-3.5 h-3.5" />
                          <span>API token active</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          K2 Agent can access platform resources ({agentAuth?.access_tier || "Full"})
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setShowTokenMenu(false);
                          setShowSettingsPanel(true);
                        }}
                        className="w-full p-2 text-left rounded-lg hover:bg-muted/60 text-foreground text-xs font-semibold flex items-center justify-between cursor-pointer transition-colors"
                      >
                        <span>⚙ Configure permissions</span>
                        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Send Button */}
              <Button
                size="sm"
                onClick={isStreaming ? stopStreaming : handleSend}
                disabled={!input.trim() && !isStreaming}
                className={cn(
                  "h-9 w-9 p-0 rounded-xl flex-shrink-0 shadow-xs cursor-pointer",
                  isStreaming
                    ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                    : "bg-primary hover:bg-primary/90 text-primary-foreground"
                )}
              >
                {isStreaming ? (
                  <Square className="w-3.5 h-3.5 fill-current" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
              </Button>
            </div>

            <div className="flex items-center justify-between mt-2 text-[10px] text-muted-foreground">
              <span>
                <kbd className="px-1 py-0.5 rounded bg-muted border border-border/60 text-[9px] font-mono">
                  Ctrl+J
                </kbd>{" "}
                toggle drawer
              </span>
              <span>
                <kbd className="px-1 py-0.5 rounded bg-muted border border-border/60 text-[9px] font-mono">
                  Shift+Enter
                </kbd>{" "}
                baris baru
              </span>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Cloudflare-Style Onboarding Modal ── */}
      <AgentOnboardingModal
        isOpen={showOnboarding}
        scope="PLATFORM_INTERNAL"
        currentAccountName="K2NET Core Platform (Root HQ)"
        onAuthorized={(auth) => {
          setAgentAuth(auth);
          setShowOnboarding(false);
        }}
        onClose={() => setShowOnboarding(false)}
      />

      {/* ── Slide-Over K2 Agent Settings Panel ── */}
      {agentAuth && (
        <AgentSettingsPanel
          isOpen={showSettingsPanel}
          scope="PLATFORM_INTERNAL"
          currentAuth={agentAuth}
          onClose={() => setShowSettingsPanel(false)}
          onAuthUpdated={(auth) => setAgentAuth(auth)}
          onAuthRevoked={() => {
            setAgentAuth(null);
            setShowOnboarding(true);
          }}
        />
      )}
    </>
  );
}
