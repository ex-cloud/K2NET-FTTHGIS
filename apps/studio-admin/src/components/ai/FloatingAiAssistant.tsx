"use client";

/**
 * K2NET Floating AI Assistant
 * - Top Navbar Trigger [ Ask AI ❖ Ctrl+J ] & Keyboard shortcut Cmd+J / Ctrl+J
 * - Slide-over Drawer dengan SSE streaming chat
 * - Agent Reasoning & Thinking Accordion (Linear & Supabase AI style)
 * - Markdown renderer + citation badges + model selector
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAiChatStream, ChatMessage, DocumentSource, exportChatToMarkdown } from "@/hooks/useAiChatStream";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// ─── Supabase-Style Ideas & Quick Action Cards ─────────────────────────────────
const SUPABASE_IDEAS = [
  {
    icon: Zap,
    title: "Diagnosa OLT & Redaman Optik",
    desc: "Troubleshooting OLT ZTE C320/Huawei, status LOS & redaman nominal",
    prompt: "Bagaimana cara troubleshooting OLT ZTE C320 jika port PON statusnya LOS dan berapa standar redaman optik nominalnya?",
  },
  {
    icon: MapPin,
    title: "Analisis Jaringan Spasial GIS & ODP",
    desc: "Standar koordinat PostGIS EPSG:4326, kapasitas splitter 1:8 / 1:16",
    prompt: "Jelaskan arsitektur database spasial PostGIS SRID 4326 dan standar penempatan ODP pada jaringan distribusi FTTH.",
  },
  {
    icon: Activity,
    title: "Health Check 12 Microservices",
    desc: "Verifikasi status poller, kong, postgres, keycloak, minio, audit",
    prompt: "Jelaskan port map dan arsitektur 12 microservices gateway internal K2NET.",
  },
  {
    icon: Database,
    title: "Panduan Backup & Disaster Recovery",
    desc: "SOP 3-Layer backup lokal, MinIO S3, dan Nextcloud offsite cloud",
    prompt: "Jelaskan strategi 3-layer disaster recovery backup database dan file di K2NET.",
  },
  {
    icon: GitPullRequest,
    title: "Buat Linear Project & DevOps Task",
    desc: "Integrasi sistem tugas, alur tiket B2B, dan sinkronisasi Obsidian",
    prompt: "Jelaskan cara membuat tiket atau proyek DevOps baru yang otomatis tersinkronisasi ke Obsidian Vault.",
  },
  {
    icon: ShieldCheck,
    title: "Keamanan Multi-Tenant & RBAC",
    desc: "One Realm per Org Keycloak, Superadmin God Mode, dan X-Tenant-ID",
    prompt: "Jelaskan arsitektur isolasi multi-tenant dan sistem Hybrid RBAC di K2NET FTTH GIS.",
  },
];

const MODELS = [
  { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash", badge: "Google" },
  { value: "gpt-4o-mini", label: "GPT-4o Mini", badge: "OpenAI" },
  { value: "llama3.2", label: "Local Ollama (Llama 3)", badge: "Local" },
  { value: "deepseek-r1:7b", label: "Local DeepSeek-R1", badge: "Local" },
];

// ─── Message Bubble Component ─────────────────────────────────────────────────
function MessageBubble({ message }: { message: ChatMessage }) {
  const [copied, setCopied] = useState(false);
  const [showThinking, setShowThinking] = useState(true);
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
          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-gradient-to-br from-emerald-600 via-primary to-teal-700 text-white shadow-xs"
        )}
      >
        {isUser ? "U" : <Sparkles className="w-4 h-4" />}
      </div>

      {/* Content */}
      <div className={cn("flex-1 min-w-0", isUser && "flex flex-col items-end")}>
        
        {/* ── Collapsible Agent Thinking Process (Linear & Supabase AI style) ── */}
        {!isUser && (message.isThinking || message.thought || (message.isStreaming && !message.content)) && (
          <div className="mb-2.5 rounded-xl border border-border/70 bg-card text-xs overflow-hidden max-w-[95%] shadow-xs">
            <button
              type="button"
              onClick={() => setShowThinking(!showThinking)}
              className="w-full px-3 py-2 flex items-center justify-between text-[11px] font-semibold text-muted-foreground hover:text-foreground bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <BrainCircuit className={cn("w-3.5 h-3.5 text-purple-400", message.isStreaming && "animate-pulse")} />
                <span>
                  {message.isStreaming && !message.content
                    ? message.thinkingStage || "Thinking..."
                    : "Proses Penalaran (Thinking Process)"}
                </span>
                {message.isStreaming && !message.content && (
                  <Loader2 className="w-3 h-3 animate-spin text-primary ml-1" />
                )}
              </span>
              <ChevronDown
                className={cn("w-3.5 h-3.5 transition-transform duration-200 text-muted-foreground", showThinking ? "rotate-180" : "")}
              />
            </button>
            {showThinking && (
              <div className="px-3.5 py-2.5 border-t border-border/40 font-mono text-[11px] text-muted-foreground/90 whitespace-pre-wrap bg-background/50 leading-relaxed max-h-48 overflow-y-auto custom-scrollbar">
                {message.thought || message.thinkingStage || "Mengevaluasi parameter teknis dan merumuskan jawaban..."}
              </div>
            )}
          </div>
        )}

        {/* Message Main Bubble */}
        <div
          className={cn(
            "rounded-2xl px-4 py-3 max-w-[85%] text-sm",
            isUser
              ? "bg-primary text-primary-foreground rounded-tr-sm"
              : "bg-muted/60 text-foreground border border-border/40 rounded-tl-sm"
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
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
                <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-background/80 prose-pre:border prose-pre:border-border">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {message.content}
                  </ReactMarkdown>
                </div>
              )}
              {message.isStreaming && message.content && (
                <span className="inline-block w-0.5 h-4 bg-primary ml-0.5 animate-pulse" />
              )}
            </>
          )}
        </div>

        {/* Cache Hit Badge */}
        {!isUser && message.cacheHit && (
          <div className="text-[10px] text-amber-500 flex items-center gap-1 mb-1.5">
            <Zap className="w-2.5 h-2.5" />
            <span className="font-semibold">Redis Cache</span>
            <span className="text-muted-foreground">• respons instan</span>
          </div>
        )}

        {/* Citation Sources */}
        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2 max-w-[85%]">
            {message.sources.map((src: DocumentSource, i: number) => (
              <Badge
                key={i}
                variant="secondary"
                className="text-[10px] gap-1 cursor-default"
                title={src.content_preview}
              >
                <BookOpen className="w-2.5 h-2.5" />
                {src.title.length > 20 ? src.title.slice(0, 20) + "…" : src.title}
                <span className="text-muted-foreground">
                  {(src.similarity_score * 100).toFixed(0)}%
                </span>
              </Badge>
            ))}
          </div>
        )}

        {/* Metrics + Copy */}
        {!isUser && !message.isStreaming && message.content && (
          <div className="flex items-center gap-2 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            {message.latencyMs && (
              <span className="text-[10px] text-muted-foreground">
                {message.latencyMs}ms
              </span>
            )}
            <button
              onClick={handleCopy}
              className="p-1 rounded hover:bg-muted transition-colors cursor-pointer"
              title="Salin ke clipboard"
            >
              {copied ? (
                <Check className="w-3 h-3 text-emerald-500" />
              ) : (
                <Copy className="w-3 h-3 text-muted-foreground" />
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
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { messages, isStreaming, error, sendMessage, stopStreaming, clearMessages } =
    useAiChatStream({ model: selectedModel });

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

  const handleSend = useCallback(async () => {
    const msg = input.trim();
    if (!msg || isStreaming) return;
    setInput("");
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
      {/* ── Slide-Over Drawer (showCloseButton={false} suppresses Radix default close button to prevent double X) ── */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent
          side="right"
          showCloseButton={false}
          className="w-full sm:max-w-[480px] p-0 flex flex-col bg-background border-l border-border"
        >
          {/* Header */}
          <SheetHeader className="px-4 py-3 border-b border-border bg-background/95 backdrop-blur-md flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-600 via-primary to-teal-700 flex items-center justify-center text-white shadow-xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <SheetTitle className="text-sm font-semibold text-foreground">
                    K2NET Ask AI
                  </SheetTitle>
                  <p className="text-[11px] text-muted-foreground">
                    RAG • Multi-Tenant • FTTH Expert
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Model Selector */}
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger className="h-7 text-xs w-[130px] border-border/60">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MODELS.map((m) => (
                      <SelectItem key={m.value} value={m.value} className="text-xs">
                        <div className="flex items-center gap-2">
                          {m.label}
                          <Badge variant="outline" className="text-[9px] px-1 py-0">
                            {m.badge}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Clear + Export + Single Close */}
                {messages.length > 0 && (
                  <>
                    <button
                      onClick={() => exportChatToMarkdown(messages)}
                      className="p-1.5 rounded-md hover:bg-muted transition-colors cursor-pointer"
                      title="Export percakapan ke Markdown (.md)"
                    >
                      <Download className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                    <button
                      onClick={clearMessages}
                      className="p-1.5 rounded-md hover:bg-muted transition-colors cursor-pointer"
                      title="Hapus percakapan"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                  </>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-md hover:bg-muted transition-colors cursor-pointer text-muted-foreground hover:text-foreground"
                  title="Tutup (Esc)"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </SheetHeader>

          {/* Message List */}
          <ScrollArea className="flex-1 min-h-0">
            <div className="px-4 py-4 space-y-4">
              {messages.length === 0 ? (
                /* Supabase-Style Empty State */
                <div className="space-y-4 py-2">
                  {/* Banner */}
                  <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 text-xs flex items-start gap-2.5 text-primary">
                    <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <div className="flex-1 text-[12px] leading-relaxed text-foreground/90">
                      <span className="font-semibold text-primary">K2NET FTTH Copilot</span> — Terhubung langsung ke 160+ dokumen arsitektur, SOP OLT, dan database spasial pgvector.
                    </div>
                  </div>

                  {/* Heading */}
                  <div className="pt-2">
                    <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                      How can I assist you? <span className="text-primary">❖</span>
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Pilih ide pertanyaan di bawah atau ketik langsung kebutuhan Anda:
                    </p>
                  </div>

                  {/* Ideas Cards (Supabase Style: clicks insert into input textarea) */}
                  <div className="space-y-2">
                    <div className="text-[10px] font-bold tracking-wider text-muted-foreground/70 uppercase">
                      IDEAS & QUICK ACTIONS
                    </div>
                    {SUPABASE_IDEAS.map((idea, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setInput(idea.prompt);
                          setTimeout(() => inputRef.current?.focus(), 50);
                        }}
                        className={cn(
                          "w-full flex items-start gap-3 p-2.5 rounded-xl text-left",
                          "bg-card hover:bg-muted/60 border border-border hover:border-primary/40",
                          "transition-all duration-150 group cursor-pointer shadow-xs"
                        )}
                      >
                        <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary/20 group-hover:scale-105 transition-all">
                          <idea.icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                            {idea.title}
                          </div>
                          <div className="text-[11px] text-muted-foreground truncate mt-0.5">
                            {idea.desc}
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
                      </button>
                    ))}
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

          {/* Input Area */}
          <div className="px-4 py-3 border-t border-border bg-background/95 backdrop-blur-md flex-shrink-0">
            <div className="flex gap-2 items-end">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Tanya tentang OLT, redaman, GIS... (Enter untuk kirim)"
                rows={1}
                className={cn(
                  "flex-1 resize-none rounded-xl px-3.5 py-2.5 text-xs",
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
              <Button
                size="sm"
                onClick={isStreaming ? stopStreaming : handleSend}
                disabled={!input.trim() && !isStreaming}
                className={cn(
                  "h-9 w-9 p-0 rounded-xl flex-shrink-0 shadow-xs cursor-pointer",
                  isStreaming
                    ? "bg-rose-500 hover:bg-rose-600 text-white"
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
                <kbd className="px-1 py-0.5 rounded bg-muted border border-border/60 text-[9px]">Ctrl+J</kbd> untuk toggle
              </span>
              <span>
                <kbd className="px-1 py-0.5 rounded bg-muted border border-border/60 text-[9px]">Shift+Enter</kbd> untuk baris baru
              </span>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
