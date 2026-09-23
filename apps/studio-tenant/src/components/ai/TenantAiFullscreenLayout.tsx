import * as React from "react";
import {
  Send,
  Square,
  X,
  Minimize2,
  PanelLeftClose,
  SlidersHorizontal,
  Bot,
  User,
  Sparkles,
  Check,
  Copy,
  ShieldCheck,
} from "lucide-react";
import { Button, ActionTooltip, cn } from "@k2net/ui";
import { TenantAiSidebar } from "./TenantAiSidebar";
import { TenantAiGreeting } from "./TenantAiGreeting";
import type { Message, ChatSession, QuickIdea } from "./types";

interface TenantAiFullscreenLayoutProps {
  greeting: string;
  messages: Message[];
  input: string;
  setInput: (v: string) => void;
  isTyping: boolean;
  copiedId: string | null;
  onCopy: (id: string, text: string) => void;
  onSend: (text?: string) => void;
  onExitFullscreen: () => void;
  onClose: () => void;
  quickIdeas: QuickIdea[];
  sessions: ChatSession[];
  activeSessionId: string | null;
  onNewChat: () => void;
  onLoadSession: (id: string) => void;
  onDeleteSession: (e: React.MouseEvent, id: string) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
  sidebarSearch: string;
  setSidebarSearch: (v: string) => void;
  filteredSessions: ChatSession[];
  selectedModel: string;
  setSelectedModel: (m: string) => void;
  showConfig: boolean;
  setShowConfig: React.Dispatch<React.SetStateAction<boolean>>;
}

export function TenantAiFullscreenLayout({
  greeting,
  messages,
  input,
  setInput,
  isTyping,
  copiedId,
  onCopy,
  onSend,
  onExitFullscreen,
  onClose,
  quickIdeas,
  activeSessionId,
  onNewChat,
  onLoadSession,
  onDeleteSession,
  sidebarOpen,
  setSidebarOpen,
  sidebarSearch,
  setSidebarSearch,
  filteredSessions,
  selectedModel,
  setSelectedModel,
  showConfig,
  setShowConfig,
}: TenantAiFullscreenLayoutProps) {
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  React.useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 150);
  }, []);

  React.useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = `${Math.max(44, Math.min(inputRef.current.scrollHeight, 160))}px`;
    }
  }, [input]);

  return (
    <div className="fixed inset-0 z-[200] p-2.5 sm:p-4 md:p-5 lg:p-6 bg-black/60 dark:bg-black/75 backdrop-blur-md flex items-center justify-center animate-in fade-in duration-200 overflow-hidden">
      <div className="w-full h-full max-w-[1680px] rounded-2xl md:rounded-3xl border border-border/80 bg-background text-foreground shadow-2xl flex overflow-hidden relative">
        <TenantAiSidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          sidebarSearch={sidebarSearch}
          setSidebarSearch={setSidebarSearch}
          filteredSessions={filteredSessions}
          activeSessionId={activeSessionId}
          onNewChat={onNewChat}
          onLoadSession={onLoadSession}
          onDeleteSession={onDeleteSession}
        />

        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-background">
          <header className="flex items-center justify-between px-6 py-2.5 border-b border-border/60 bg-background/95 backdrop-blur-md flex-shrink-0 select-none">
            <div className="flex items-center gap-3">
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
            </div>

            <div className="flex items-center gap-1.5">
              <ActionTooltip label="Konfigurasi AI Assistant" side="bottom">
                <button
                  type="button"
                  onClick={() => setShowConfig((prev) => !prev)}
                  className={cn(
                    "flex items-center gap-1.5 h-7 px-2.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer",
                    showConfig
                      ? "bg-primary/15 border-primary/40 text-primary"
                      : "bg-card hover:bg-muted border-border/70 text-muted-foreground hover:text-foreground"
                  )}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Config</span>
                </button>
              </ActionTooltip>

              <ActionTooltip label="Kembali ke Mode Floating Drawer" shortcut="Alt+F" side="bottom">
                <button
                  type="button"
                  onClick={onExitFullscreen}
                  className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  <Minimize2 className="w-3.5 h-3.5" />
                </button>
              </ActionTooltip>

              <ActionTooltip label="Tutup Mode Layar Penuh" shortcut="Esc" side="bottom">
                <button
                  type="button"
                  onClick={onClose}
                  className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </ActionTooltip>
            </div>
          </header>

          {showConfig && (
            <div className="px-6 py-3 border-b border-border bg-muted/20 flex items-center justify-between text-xs animate-in slide-in-from-top-2 duration-150">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground font-medium">Model:</span>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="bg-background border border-border rounded px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                  >
                    <option value="gemini-2.5-flash">Gemini 2.5 Flash (Fast RAG)</option>
                    <option value="gemini-2.5-pro">Gemini 2.5 Pro (Deep Telecom)</option>
                    <option value="claude-3-7-sonnet">Claude 3.7 Sonnet (Advanced)</option>
                  </select>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground font-mono text-[11px]">
                  <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                  <span>Scope: Tenant Operational (RAG Active)</span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowConfig(false)}
                className="h-6 px-2 text-[11px]"
              >
                Tutup
              </Button>
            </div>
          )}

          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            <div className="w-full max-w-3xl mx-auto px-6 py-8 space-y-6">
              {messages.length === 0 ? (
                <TenantAiGreeting
                  greeting={greeting}
                  quickIdeas={quickIdeas}
                  onSelectIdea={onSend}
                />
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {msg.sender === "ai" && (
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary mt-0.5">
                        <Bot className="h-4 w-4" />
                      </div>
                    )}

                    <div className="space-y-1.5 max-w-[80%]">
                      <div
                        className={`p-4 rounded-2xl border text-[13px] leading-relaxed ${
                          msg.sender === "user"
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-card text-foreground border-border shadow-xs whitespace-pre-line"
                        }`}
                      >
                        {msg.text}
                      </div>

                      <div
                        className={`flex items-center gap-2 px-1 text-[11px] text-muted-foreground ${
                          msg.sender === "user" ? "justify-end" : "justify-start"
                        }`}
                      >
                        <span>{msg.timestamp}</span>
                        {msg.sender === "ai" && (
                          <button
                            onClick={() => onCopy(msg.id, msg.text)}
                            className="hover:text-foreground cursor-pointer flex items-center gap-0.5"
                            title="Salin jawaban"
                          >
                            {copiedId === msg.id ? (
                              <Check className="h-3 w-3 text-primary" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {msg.sender === "user" && (
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground mt-0.5 font-bold text-xs">
                        <User className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                ))
              )}

              {isTyping && (
                <div className="flex gap-3 items-center text-muted-foreground text-xs pl-10">
                  <Sparkles className="h-4 w-4 animate-spin text-primary" />
                  <span>AI sedang menganalisis topologi jaringan...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          <div className="flex-shrink-0 border-t border-border/60 bg-background/95 backdrop-blur-md px-6 py-4">
            <div className="w-full max-w-3xl mx-auto space-y-2">
              <div className="flex items-end gap-3">
                <div className="relative flex-1 flex items-end rounded-2xl border border-border bg-muted/40 focus-within:ring-1 focus-within:ring-primary focus-within:border-primary transition-all shadow-xs">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        onSend();
                      }
                    }}
                    placeholder="Type @ to tag a resource or ask any FTTH question..."
                    rows={1}
                    className="flex-1 w-full resize-none bg-transparent px-4 py-2.5 text-sm focus:outline-none placeholder:text-muted-foreground text-foreground min-h-[44px] max-h-48 overflow-y-auto leading-relaxed"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => (isTyping ? null : onSend())}
                  disabled={!input.trim() && !isTyping}
                  className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-xs transition-all cursor-pointer",
                    "disabled:opacity-40 disabled:cursor-not-allowed",
                    isTyping
                      ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                      : "bg-primary hover:bg-primary/90 text-primary-foreground hover:scale-105"
                  )}
                  title={isTyping ? "Stop" : "Send"}
                >
                  {isTyping ? (
                    <Square className="w-3.5 h-3.5 fill-current" />
                  ) : (
                    <Send className="w-3.5 h-3.5 -translate-x-px" />
                  )}
                </button>
              </div>

              <p className="text-[11px] text-muted-foreground text-center pt-1">
                Chats are recorded to improve the service in accordance with our Privacy Policy.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
