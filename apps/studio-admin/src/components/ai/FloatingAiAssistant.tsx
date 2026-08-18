"use client";

/**
 * K2NET Floating AI Assistant
 * - Floating Action Button (kanan bawah) dengan ambient glow & shortcut Cmd+J / Ctrl+J
 * - Slide-over Drawer dengan SSE streaming chat
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
  ChevronDown,
  BookOpen,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAiChatStream, ChatMessage, DocumentSource } from "@/hooks/useAiChatStream";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// ─── Quick Action Chips ────────────────────────────────────────────────────────
const QUICK_ACTIONS = [
  { icon: Zap, label: "Status OLT ZTE C320 LOS", message: "Bagaimana cara troubleshooting OLT ZTE C320 jika port PON statusnya LOS?" },
  { icon: BookOpen, label: "Panduan konfigurasi GPON", message: "Jelaskan langkah-langkah konfigurasi GPON untuk ONU baru di ZTE C320." },
  { icon: Sparkles, label: "Hitung redaman optik", message: "Bagaimana cara menghitung link budget redaman optik untuk distribusi 1:64?" },
];

const MODELS = [
  { value: "gpt-4o-mini", label: "GPT-4o Mini", badge: "Fast" },
  { value: "gpt-4o", label: "GPT-4o", badge: "Smart" },
  { value: "gemini-1.5-flash", label: "Gemini Flash", badge: "Fast" },
  { value: "gemini-1.5-pro", label: "Gemini Pro", badge: "Deep" },
];

// ─── Message Bubble Component ─────────────────────────────────────────────────
function MessageBubble({ message }: { message: ChatMessage }) {
  const [copied, setCopied] = useState(false);
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
            : "bg-gradient-to-br from-violet-500 to-purple-600 text-white"
        )}
      >
        {isUser ? "U" : <Sparkles className="w-4 h-4" />}
      </div>

      {/* Content */}
      <div className={cn("flex-1 min-w-0", isUser && "flex flex-col items-end")}>
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
              {message.isStreaming && !message.content && (
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
              className="p-1 rounded hover:bg-muted transition-colors"
              title="Salin ke clipboard"
            >
              {copied ? (
                <Check className="w-3 h-3 text-green-500" />
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
  const [selectedModel, setSelectedModel] = useState("gpt-4o-mini");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { messages, isStreaming, error, sendMessage, stopStreaming, clearMessages } =
    useAiChatStream({ model: selectedModel });

  // ── Keyboard shortcut: Cmd+J / Ctrl+J ─────────────────────────────────────
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
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
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
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  return (
    <>
      {/* ── Floating Trigger Button ─────────────────────────────────────── */}
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 z-50",
          "w-14 h-14 rounded-full",
          "bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600",
          "text-white shadow-2xl",
          "flex items-center justify-center",
          "transition-all duration-300",
          "hover:scale-110 hover:shadow-violet-500/40",
          "focus:outline-none focus:ring-4 focus:ring-violet-500/30",
          // Ambient pulse glow
          "before:absolute before:inset-0 before:rounded-full",
          "before:bg-gradient-to-br before:from-violet-600 before:to-indigo-600",
          "before:animate-ping before:opacity-20",
          isOpen && "scale-0 opacity-0 pointer-events-none"
        )}
        title="K2NET AI Assistant (Ctrl+J)"
        aria-label="Buka AI Assistant"
      >
        <Sparkles className="w-6 h-6 relative z-10" />
      </button>

      {/* ── Slide-Over Drawer ────────────────────────────────────────────── */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-[480px] p-0 flex flex-col bg-background border-l border-border"
        >
          {/* Header */}
          <SheetHeader className="px-4 py-3 border-b border-border bg-background/95 backdrop-blur-md flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
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

                {/* Clear + Close */}
                {messages.length > 0 && (
                  <button
                    onClick={clearMessages}
                    className="p-1.5 rounded-md hover:bg-muted transition-colors"
                    title="Hapus percakapan"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-md hover:bg-muted transition-colors"
                >
                  <X className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </div>
            </div>
          </SheetHeader>

          {/* Message List */}
          <ScrollArea className="flex-1 min-h-0">
            <div className="px-4 py-4 space-y-4">
              {messages.length === 0 ? (
                /* Empty State */
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-600/20 flex items-center justify-center mb-4">
                    <Sparkles className="w-8 h-8 text-violet-500" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">
                    Hai! Saya K2NET AI
                  </h3>
                  <p className="text-xs text-muted-foreground max-w-[240px] mb-6">
                    Tanyakan apapun tentang OLT, ONT, kabel fiber, GIS, atau
                    operasional jaringan FTTH.
                  </p>
                  {/* Quick Action Chips */}
                  <div className="flex flex-col gap-2 w-full max-w-[300px]">
                    {QUICK_ACTIONS.map((action, i) => (
                      <button
                        key={i}
                        onClick={() => sendMessage(action.message)}
                        className={cn(
                          "flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left",
                          "bg-muted/40 hover:bg-muted border border-border/40 hover:border-border",
                          "transition-all duration-150 group"
                        )}
                      >
                        <action.icon className="w-3.5 h-3.5 text-violet-500 flex-shrink-0" />
                        <span className="text-xs text-foreground/80 group-hover:text-foreground">
                          {action.label}
                        </span>
                        <ChevronDown className="w-3 h-3 text-muted-foreground ml-auto -rotate-90" />
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
                disabled={isStreaming}
                className={cn(
                  "flex-1 resize-none rounded-xl px-3 py-2.5 text-sm",
                  "bg-muted/40 border border-border/60",
                  "text-foreground placeholder:text-muted-foreground",
                  "focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/40",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "min-h-[40px] max-h-[120px] overflow-y-auto transition-all"
                )}
                style={{ height: "auto" }}
                onInput={(e) => {
                  const el = e.currentTarget;
                  el.style.height = "auto";
                  el.style.height = Math.min(el.scrollHeight, 120) + "px";
                }}
              />
              {isStreaming ? (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={stopStreaming}
                  className="h-10 w-10 p-0 rounded-xl flex-shrink-0"
                  title="Hentikan streaming"
                >
                  <Square className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className="h-10 w-10 p-0 rounded-xl flex-shrink-0 bg-gradient-to-br from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 border-0"
                  title="Kirim (Enter)"
                >
                  <Send className="w-4 h-4" />
                </Button>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1.5 text-center">
              <kbd className="px-1 py-0.5 rounded border border-border/50 text-[9px] bg-muted">
                Ctrl+J
              </kbd>{" "}
              untuk toggle •{" "}
              <kbd className="px-1 py-0.5 rounded border border-border/50 text-[9px] bg-muted">
                Shift+Enter
              </kbd>{" "}
              untuk baris baru
            </p>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
