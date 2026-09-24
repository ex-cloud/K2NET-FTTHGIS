import React, { useState, useRef, useEffect, useCallback } from "react";
import { GripVertical, Sparkles } from "lucide-react";
import { Sheet, SheetContent } from "../sheet";
import { ScrollArea } from "../scroll-area";
import { cn } from "../../utils";
import { AiAssistantHeader } from "./AiAssistantHeader";
import { AiHistoryPanel } from "./AiHistoryPanel";
import { AiGreeting } from "./AiGreeting";
import { AiQuickActions } from "./AiQuickActions";
import { AiMessageBubble } from "./AiMessageBubble";
import { AiPromptInput } from "./AiPromptInput";
import type { ChatMessage, StoredChatSession, QuickIdea, DrawerView } from "./types";

export interface AiAssistantDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
  showSettingsButton?: boolean;
  showExportButton?: boolean;
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  customView?: DrawerView;
  customViewContent?: React.ReactNode;
  onBack?: () => void;
  onSend: (text?: string) => void;
  onStop?: () => void;
  onNewChat: () => void;
  onSelectSession?: (sessionId: string) => void;
  onDeleteSession?: (sessionId: string) => void;
  onToggleSettings?: () => void;
  onExportMarkdown?: () => void;
  onMaximize?: () => void;
  onCopyMessage?: (id: string, text: string) => void;
  onFeedback?: (id: string, type: "like" | "dislike") => void;
  onSelectIdea?: (idea: QuickIdea) => void;
  className?: string;
}

export function AiAssistantDrawer({
  open,
  onOpenChange,
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
  showSettingsButton = false,
  showExportButton = false,
  defaultWidth = 480,
  minWidth = 380,
  maxWidth = 800,
  customView = "chat",
  customViewContent,
  onBack,
  onSend,
  onStop,
  onNewChat,
  onSelectSession,
  onDeleteSession,
  onToggleSettings,
  onExportMarkdown,
  onMaximize,
  onCopyMessage,
  onFeedback,
  onSelectIdea,
  className,
}: AiAssistantDrawerProps) {
  const [input, setInput] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [drawerWidth, setDrawerWidth] = useState(defaultWidth);
  const [isDragging, setIsDragging] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  // Handle resizing
  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth >= minWidth && newWidth <= maxWidth) {
        setDrawerWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, minWidth, maxWidth]);

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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        style={{ width: `${drawerWidth}px`, maxWidth: "98vw" }}
        className={cn(
          "p-0 flex flex-col bg-background/98 backdrop-blur-2xl border-l border-border transition-[width] duration-75 select-text sm:max-w-none shadow-xl",
          isDragging && "transition-none select-none",
          className
        )}
      >
        {/* Resize Handle */}
        <div
          onMouseDown={startResizing}
          className={cn(
            "absolute -left-1.5 top-0 bottom-0 w-3 cursor-ew-resize group z-50 flex items-center justify-center select-none",
            isDragging && "bg-primary/20"
          )}
        >
          <div className="w-1 h-12 rounded-full bg-border group-hover:bg-primary/70 transition-colors flex items-center justify-center">
            <GripVertical className="w-2.5 h-2.5 text-muted-foreground group-hover:text-primary opacity-60" />
          </div>
        </div>

        {/* Header */}
        <AiAssistantHeader
          view={customView}
          title={title}
          subtitle={subtitle}
          badgeLabel={badgeLabel}
          sessionsCount={sessions.length}
          showHistory={showHistory}
          showSettingsButton={showSettingsButton}
          showExportButton={showExportButton}
          hasMessages={messages.length > 0}
          onBack={onBack}
          onNewChat={() => {
            setShowHistory(false);
            onNewChat();
          }}
          onToggleHistory={() => setShowHistory((p) => !p)}
          onToggleSettings={onToggleSettings}
          onExportMarkdown={onExportMarkdown}
          onMaximize={onMaximize}
          onClose={() => onOpenChange(false)}
        />

        {/* Custom view (like Onboarding/Settings/Permissions) or Chat view */}
        {customView !== "chat" && customViewContent ? (
          <div className="flex-1 min-h-0 overflow-y-auto">
            {customViewContent}
          </div>
        ) : (
          <div className="relative flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* History Slide-Over Panel */}
            <AiHistoryPanel
              open={showHistory}
              onClose={() => setShowHistory(false)}
              sessions={sessions}
              activeSessionId={activeSessionId}
              onSelectSession={(sessionId) => {
                onSelectSession?.(sessionId);
                setShowHistory(false);
              }}
              onDeleteSession={onDeleteSession}
            />

            {/* Chat Messages / Empty State */}
            <ScrollArea className="flex-1 min-h-0 w-full">
              <div className="px-4 py-4 space-y-4 w-full min-w-0 max-w-full">
                {messages.length === 0 ? (
                  <div className="space-y-6 py-2">
                    <AiGreeting greeting={greeting} subtitle={greetingSubtitle} />
                    <AiQuickActions ideas={quickIdeas} onSelect={handleSelectIdea} columns={1} />
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
            <AiPromptInput
              value={input}
              onChange={setInput}
              onSend={() => handleSendPrompt()}
              onStop={onStop}
              isStreaming={isStreaming}
              placeholder={inputPlaceholder}
            />
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
