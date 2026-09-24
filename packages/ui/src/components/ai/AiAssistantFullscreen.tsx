import React, { useState, useRef, useEffect } from "react";
import { Sparkles, Download, Minimize2, X, SlidersHorizontal, PanelLeftClose } from "lucide-react";
import { ScrollArea } from "../scroll-area";
import { cn } from "../../utils";
import { ActionTooltip } from "../tooltip";
import { Badge } from "../badge";
import { AiFullscreenSidebar } from "./AiFullscreenSidebar";
import { AiGreeting } from "./AiGreeting";
import { AiQuickActions } from "./AiQuickActions";
import { AiMessageBubble } from "./AiMessageBubble";
import { AiPromptInput } from "./AiPromptInput";
import type { ChatMessage, StoredChatSession, QuickIdea } from "./types";

export interface AiAssistantFullscreenProps {
  open?: boolean;
  title?: string;
  subtitle?: string;
  badgeLabel?: string;
  messages?: ChatMessage[];
  sessions?: StoredChatSession[];
  activeSessionId?: string | null;
  quickIdeas?: QuickIdea[];
  isStreaming?: boolean;
  error?: string | null;
  greeting?: string;
  greetingSubtitle?: string;
  inputPlaceholder?: string;
  selectedModel?: string;
  availableModels?: Array<{ value: string; label: string; badge?: string }>;
  showSettingsButton?: boolean;
  showExportButton?: boolean;
  rightPanelContent?: React.ReactNode;
  rightPanelOpen?: boolean;
  onToggleRightPanel?: () => void;
  onModelChange?: (model: string) => void;
  onSend: (text?: string) => void;
  onStop?: () => void;
  onNewChat: () => void;
  onSelectSession?: (sessionId: string) => void;
  onDeleteSession?: (sessionId: string) => void;
  onToggleSettings?: () => void;
  onExportMarkdown?: () => void;
  onExitFullscreen: () => void;
  onCopyMessage?: (id: string, text: string) => void;
  onFeedback?: (id: string, type: "like" | "dislike") => void;
  onSelectIdea?: (idea: QuickIdea) => void;
  className?: string;
}

export function AiAssistantFullscreen({
  open = true,
  title = "Ask AI",
  subtitle = "RAG Knowledge Base • Spasial PostGIS",
  badgeLabel,
  messages = [],
  sessions = [],
  activeSessionId,
  quickIdeas = [],
  isStreaming = false,
  error = null,
  greeting,
  greetingSubtitle = "What are we doing today?",
  inputPlaceholder = "Type @ to tag a resource or ask any FTTH question...",
  selectedModel,
  availableModels,
  showSettingsButton = false,
  showExportButton = true,
  rightPanelContent,
  rightPanelOpen = false,
  onToggleRightPanel,
  onModelChange,
  onSend,
  onStop,
  onNewChat,
  onSelectSession,
  onDeleteSession,
  onToggleSettings,
  onExportMarkdown,
  onExitFullscreen,
  onCopyMessage,
  onFeedback,
  onSelectIdea,
  className,
}: AiAssistantFullscreenProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarSearch, setSidebarSearch] = useState("");
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  // Handle ESC key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onExitFullscreen();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onExitFullscreen]);

  if (!open) return null;

  const handleSendPrompt = (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || isStreaming) return;
    setInput("");
    onSend(text);
  };

  const handleSelectIdea = (idea: QuickIdea) => {
    if (onSelectIdea) {
      onSelectIdea(idea);
    } else {
      handleSendPrompt(idea.prompt);
    }
  };

  return (
    <div
      className={cn(
        "fixed inset-0 z-[200] p-2.5 sm:p-4 md:p-5 lg:p-6 bg-black/60 dark:bg-black/75 backdrop-blur-md flex items-center justify-center animate-in fade-in duration-200 overflow-hidden select-text",
        className
      )}
    >
      <div className="w-full h-full max-w-[1680px] rounded-2xl md:rounded-3xl border border-border/80 bg-background text-foreground shadow-lg flex overflow-hidden relative">
        {/* Left Sidebar for Session History */}
        <AiFullscreenSidebar
          open={sidebarOpen}
          onToggle={() => setSidebarOpen((p) => !p)}
          sessions={sessions}
          activeSessionId={activeSessionId}
          search={sidebarSearch}
          onSearchChange={setSidebarSearch}
          onNewChat={onNewChat}
          onSelectSession={onSelectSession || (() => {})}
          onDeleteSession={onDeleteSession}
        />

        {/* Center Main Chat Area */}
        <div className="flex-1 flex flex-col min-w-0 h-full bg-background relative">
          {/* Top Fullscreen Header */}
          <div className="h-12 border-b border-border/60 px-4 flex items-center justify-between bg-background/95 backdrop-blur-md shrink-0 select-none">
            <div className="flex items-center gap-2.5 min-w-0">
              {!sidebarOpen && (
                <ActionTooltip label="Buka Sidebar Riwayat" shortcut="Alt+S" side="bottom">
                  <button
                    type="button"
                    onClick={() => setSidebarOpen(true)}
                    className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    <PanelLeftClose className="w-3.5 h-3.5 rotate-180" />
                  </button>
                </ActionTooltip>
              )}
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 border border-primary/30 text-primary shadow-2xs shrink-0">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-bold text-xs text-foreground truncate">{title}</span>
                {badgeLabel && (
                  <Badge
                    variant="outline"
                    className="border-primary/40 bg-primary/10 text-primary text-[9px] font-mono px-1.5 py-0 shrink-0"
                  >
                    {badgeLabel}
                  </Badge>
                )}
                {subtitle && (
                  <span className="hidden md:inline text-[10px] text-muted-foreground font-mono truncate">
                    • {subtitle}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {availableModels && availableModels.length > 0 && onModelChange && (
                <div className="hidden sm:flex items-center gap-1 mr-2 px-2 py-1 rounded-lg bg-muted/40 border border-border text-xs">
                  <span className="text-[10px] text-muted-foreground">Model:</span>
                  <select
                    value={selectedModel}
                    onChange={(e) => onModelChange(e.target.value)}
                    className="bg-transparent text-xs font-medium text-foreground focus:outline-none cursor-pointer"
                  >
                    {availableModels.map((m) => (
                      <option key={m.value} value={m.value} className="bg-popover text-popover-foreground">
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {(showSettingsButton || onToggleRightPanel) && (
                <ActionTooltip label="Pengaturan Agen & Akses" shortcut="Alt+P" side="bottom">
                  <button
                    type="button"
                    onClick={onToggleRightPanel || onToggleSettings}
                    className={cn(
                      "flex items-center gap-1.5 h-7 px-2.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer",
                      rightPanelOpen
                        ? "bg-primary/15 border-primary/40 text-primary"
                        : "bg-card hover:bg-muted border-border/70 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Config</span>
                  </button>
                </ActionTooltip>
              )}

              {showExportButton && messages.length > 0 && onExportMarkdown && (
                <ActionTooltip label="Ekspor Markdown" shortcut="Ctrl+E" side="bottom">
                  <button
                    type="button"
                    onClick={onExportMarkdown}
                    className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </ActionTooltip>
              )}

              <ActionTooltip label="Keluar Layar Penuh" shortcut="Alt+F" side="bottom">
                <button
                  type="button"
                  onClick={onExitFullscreen}
                  className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  <Minimize2 className="w-3.5 h-3.5" />
                </button>
              </ActionTooltip>

              <ActionTooltip label="Tutup" shortcut="Esc" side="bottom">
                <button
                  type="button"
                  onClick={onExitFullscreen}
                  className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </ActionTooltip>
            </div>
          </div>

          {/* Main Content Area */}
          <ScrollArea className="flex-1 min-h-0 w-full">
            <div className="max-w-4xl mx-auto px-4 py-6 space-y-5 w-full">
              {messages.length === 0 ? (
                <div className="space-y-8 py-6">
                  <AiGreeting greeting={greeting} subtitle={greetingSubtitle} size="lg" />
                  <AiQuickActions ideas={quickIdeas} onSelect={handleSelectIdea} columns={2} />
                </div>
              ) : (
                messages.map((msg) => (
                  <AiMessageBubble
                    key={msg.id}
                    message={msg}
                    onCopy={onCopyMessage}
                    onFeedback={onFeedback}
                  />
                ))
              )}

              {isStreaming && !messages.some((m) => m.isStreaming) && (
                <div className="flex gap-2.5 items-center text-muted-foreground text-xs pl-8">
                  <Sparkles className="h-3.5 w-3.5 animate-spin text-primary" />
                  <span>AI sedang berpikir &amp; menganalisis data...</span>
                </div>
              )}

              {error && (
                <div className="px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive">
                  ⚠️ {error}
                </div>
              )}

              <div ref={bottomRef} />
            </div>
          </ScrollArea>

          {/* Bottom Prompt Input */}
          <div className="max-w-4xl mx-auto w-full px-4 pb-4">
            <AiPromptInput
              value={input}
              onChange={setInput}
              onSend={() => handleSendPrompt()}
              onStop={onStop}
              isStreaming={isStreaming}
              placeholder={inputPlaceholder}
              className="rounded-2xl border border-border/80 shadow-lg bg-card/60 backdrop-blur-xl"
            />
          </div>
        </div>

        {/* Optional Right Panel (e.g. Config / Permissions) */}
        {rightPanelOpen && rightPanelContent && (
          <div className="w-88 flex-shrink-0 flex flex-col border-l border-border/60 bg-card/90 backdrop-blur-md animate-in slide-in-from-right-2 duration-200 overflow-hidden z-20">
            {rightPanelContent}
          </div>
        )}
      </div>
    </div>
  );
}
