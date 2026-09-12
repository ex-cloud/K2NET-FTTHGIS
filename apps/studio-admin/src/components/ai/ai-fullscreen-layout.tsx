import React, { useState, useMemo, useEffect, useRef } from "react";
import { MessageBubble } from "@/components/ai/ai-message-bubble";
import {
  exportChatToMarkdown,
  type ChatMessage,
  type StoredChatSession,
} from "@/hooks/useAiChatStream";
import type {
  SuggestedPromptItem,
  AgentAuthorizationData,
} from "@/lib/actions/gateways";
import { FullscreenSidebar } from "./assistant/FullscreenSidebar";
import { FullscreenRightPanel } from "./assistant/FullscreenRightPanel";
import { FullscreenHeader } from "./assistant/FullscreenHeader";
import { FullscreenChatInput } from "./assistant/FullscreenChatInput";
import { FullscreenGreeting } from "./assistant/FullscreenGreeting";
import { useFullscreenPermissions } from "./assistant/useFullscreenPermissions";

interface AiFullscreenLayoutProps {
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
  onExitFullscreen: () => void;
  sessions?: StoredChatSession[];
  activeSessionId?: string;
  onNewChat?: () => void;
  onLoadSession?: (sessionId: string) => void;
  onDeleteSession?: (sessionId: string) => void;
}

export function AiFullscreenLayout({
  messages,
  pinnedIdeas,
  input,
  onInputChange,
  onSend,
  onStop,
  onClear,
  onSelectIdea,
  isStreaming,
  error,
  agentAuth,
  selectedModel,
  availableModels,
  onExitFullscreen,
  sessions = [],
  activeSessionId,
  onNewChat,
  onLoadSession,
  onDeleteSession,
}: AiFullscreenLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [rightPanelView, setRightPanelView] = useState<"summary" | "permissions">("summary");
  const [sidebarSearch, setSidebarSearch] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const {
    permCatalog,
    permLoading,
    permSaving,
    permRevoking,
    permTier,
    setPermTier,
    permSelected,
    setPermSelected,
    permSearch,
    setPermSearch,
    permExpandedDomains,
    setPermExpandedDomains,
    handleSavePermissions,
    handleRevokePermissions,
  } = useFullscreenPermissions(rightPanelOpen, rightPanelView, setRightPanelView, agentAuth);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 150);
  }, []);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = `${Math.max(44, Math.min(inputRef.current.scrollHeight, 200))}px`;
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
    if (e.key === "Escape") onExitFullscreen();
  };

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning.";
    if (h < 18) return "Good afternoon.";
    return "Good evening.";
  })();

  const activeModelLabel =
    availableModels.find((m) => m.value === selectedModel)?.label || "Gemini 2.5 Flash";

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

  return (
    <div className="fixed inset-0 z-[200] p-2.5 sm:p-4 md:p-5 lg:p-6 bg-black/60 dark:bg-black/75 backdrop-blur-md flex items-center justify-center animate-in fade-in duration-200 overflow-hidden">
      <div className="w-full h-full max-w-[1680px] rounded-2xl md:rounded-3xl border border-border/80 bg-background text-foreground shadow-2xl flex overflow-hidden relative">
        <FullscreenSidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          sidebarSearch={sidebarSearch}
          setSidebarSearch={setSidebarSearch}
          filteredSessions={filteredSessions}
          categorizedSessions={categorizedSessions}
          activeSessionId={activeSessionId}
          onNewChat={onNewChat || onClear}
          onLoadSession={onLoadSession}
          onDeleteSession={onDeleteSession}
        />

        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-background">
          <FullscreenHeader
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            rightPanelOpen={rightPanelOpen}
            setRightPanelOpen={setRightPanelOpen}
            setRightPanelView={setRightPanelView}
            messages={messages}
            exportChatToMarkdown={exportChatToMarkdown}
            onExitFullscreen={onExitFullscreen}
          />

          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            <div className="w-full max-w-3xl mx-auto px-6 py-8 space-y-6">
              {messages.length === 0 ? (
                <FullscreenGreeting
                  greeting={greeting}
                  pinnedIdeas={pinnedIdeas}
                  onSelectIdea={onSelectIdea}
                />
              ) : (
                <>
                  {messages.map((msg) => (
                    <MessageBubble key={msg.id} message={msg} />
                  ))}
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

          <FullscreenChatInput
            input={input}
            inputRef={inputRef}
            onInputChange={onInputChange}
            onKeyDown={handleKeyDown}
            onSend={onSend}
            onStop={onStop}
            isStreaming={isStreaming}
          />
        </div>

        <FullscreenRightPanel
          rightPanelOpen={rightPanelOpen}
          setRightPanelOpen={setRightPanelOpen}
          rightPanelView={rightPanelView}
          setRightPanelView={setRightPanelView}
          agentAuth={agentAuth}
          activeModelLabel={activeModelLabel}
          permCatalog={permCatalog}
          permLoading={permLoading}
          permSaving={permSaving}
          permRevoking={permRevoking}
          permTier={permTier}
          setPermTier={setPermTier}
          permSelected={permSelected}
          setPermSelected={setPermSelected}
          permSearch={permSearch}
          setPermSearch={setPermSearch}
          permExpandedDomains={permExpandedDomains}
          setPermExpandedDomains={setPermExpandedDomains}
          onSavePermissions={handleSavePermissions}
          onRevokePermissions={handleRevokePermissions}
        />
      </div>
    </div>
  );
}
