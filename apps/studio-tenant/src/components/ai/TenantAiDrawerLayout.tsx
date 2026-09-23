import * as React from "react";
import {
  Sparkles,
  Send,
  Square,
  X,
  Maximize2,
  ChevronRight,
  Plus,
  Copy,
  Check,
  Bot,
  User,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  Button,
  Badge,
  ScrollArea,
  PebbleBotSvg,
  cn,
} from "@k2net/ui";
import type { Message, QuickIdea } from "./types";

interface TenantAiDrawerLayoutProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMaximize: () => void;
  greeting: string;
  messages: Message[];
  input: string;
  setInput: (v: string) => void;
  isTyping: boolean;
  copiedId: string | null;
  onCopy: (id: string, text: string) => void;
  onSend: (text?: string) => void;
  onNewChat: () => void;
  quickIdeas: QuickIdea[];
}

export function TenantAiDrawerLayout({
  open,
  onOpenChange,
  onMaximize,
  greeting,
  messages,
  input,
  setInput,
  isTyping,
  copiedId,
  onCopy,
  onSend,
  onNewChat,
  quickIdeas,
}: TenantAiDrawerLayoutProps) {
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  React.useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [open]);

  React.useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = `${Math.max(38, Math.min(inputRef.current.scrollHeight, 120))}px`;
    }
  }, [input]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        style={{ width: "480px", maxWidth: "100vw" }}
        className={cn(
          "fixed inset-y-0 right-0 z-50 p-0 flex flex-col bg-background/98 backdrop-blur-2xl border-l border-border transition-all duration-200 select-text sm:max-w-none shadow-2xl"
        )}
      >
        <div className="flex h-12 items-center justify-between border-b border-border/60 px-4 bg-background/95 backdrop-blur-md shrink-0 select-none">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 border border-primary/30 text-primary">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xs text-foreground">K2NET Ask AI</span>
                <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary text-[9px] font-mono px-1 py-0">
                  RAG LIVE
                </Badge>
              </div>
              <span className="text-[10px] text-muted-foreground font-mono">
                850+ Dokumen FTTH + Spatial PostGIS
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onNewChat}
              className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground gap-1 cursor-pointer"
              title="Mulai Percakapan Baru"
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">New</span>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={onMaximize}
              className="h-7 w-7 rounded-md text-muted-foreground hover:text-foreground cursor-pointer"
              title="Perbesar Penuh"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-7 w-7 rounded-md text-muted-foreground hover:text-foreground cursor-pointer"
              title="Tutup"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1 min-h-0 w-full">
          <div className="px-4 py-4 space-y-4 w-full">
            {messages.length === 0 ? (
              <div className="space-y-6 py-2">
                <div className="text-center py-2 space-y-3">
                  <PebbleBotSvg size="md" className="mx-auto" />
                  <div>
                    <h2 className="text-lg font-bold text-foreground">{greeting}</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">What are we doing today?</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-bold tracking-wider text-muted-foreground/70 uppercase px-0.5">
                    IDEAS &amp; QUICK ACTIONS
                  </p>
                  {quickIdeas.map((idea) => {
                    const Icon = idea.icon;
                    return (
                      <button
                        key={idea.id}
                        type="button"
                        onClick={() => onSend(idea.prompt)}
                        className={cn(
                          "w-full flex items-center gap-3 p-3 rounded-xl text-left",
                          "bg-card hover:bg-muted/60 border border-border hover:border-primary/40",
                          "transition-all duration-150 group cursor-pointer shadow-xs"
                        )}
                      >
                        <div className="w-7 h-7 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary/20 group-hover:scale-105 transition-all">
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                            {idea.title}
                          </p>
                          <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                            {idea.desc}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.sender === "ai" && (
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary mt-0.5">
                      <Bot className="h-3.5 w-3.5" />
                    </div>
                  )}

                  <div className="space-y-1 max-w-[85%]">
                    <div
                      className={`p-3 rounded-xl border text-xs leading-relaxed ${
                        msg.sender === "user"
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-card text-foreground border-border shadow-2xs whitespace-pre-line"
                      }`}
                    >
                      {msg.text}
                    </div>

                    <div
                      className={`flex items-center gap-2 px-1 text-[10px] text-muted-foreground ${
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
                            <Check className="h-2.5 w-2.5 text-primary" />
                          ) : (
                            <Copy className="h-2.5 w-2.5" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {msg.sender === "user" && (
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground mt-0.5 font-bold text-[10px]">
                      <User className="h-3.5 w-3.5" />
                    </div>
                  )}
                </div>
              ))
            )}

            {isTyping && (
              <div className="flex gap-2.5 items-center text-muted-foreground text-xs pl-8">
                <Sparkles className="h-3.5 w-3.5 animate-spin text-primary" />
                <span>AI sedang menganalisis topologi...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="px-3 pt-2 pb-3 border-t border-border/60 bg-background/95 backdrop-blur-md shrink-0">
          <div className="flex items-end gap-2">
            <div className="relative flex-1 flex items-end rounded-2xl border border-border bg-muted/40 focus-within:ring-1 focus-within:ring-primary focus-within:border-primary transition-all">
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
                className={cn(
                  "flex-1 w-full resize-none bg-transparent pl-4 pr-3 py-2 text-[13px]",
                  "focus:outline-none placeholder:text-muted-foreground text-foreground",
                  "min-h-[38px] max-h-32 overflow-y-auto leading-relaxed"
                )}
              />
            </div>

            <button
              type="button"
              onClick={() => (isTyping ? null : onSend())}
              disabled={!input.trim() && !isTyping}
              className={cn(
                "h-9 w-9 rounded-full flex items-center justify-center shrink-0 shadow-md transition-all cursor-pointer",
                "disabled:opacity-40 disabled:cursor-not-allowed",
                isTyping
                  ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                  : "bg-primary hover:bg-primary/90 text-primary-foreground hover:scale-105"
              )}
            >
              {isTyping ? (
                <Square className="w-3.5 h-3.5 fill-current" />
              ) : (
                <Send className="w-3.5 h-3.5 -translate-x-px" />
              )}
            </button>
          </div>

          <p className="text-[10px] text-muted-foreground text-center pt-2">
            Chats are recorded to improve the service in accordance with our Privacy Policy.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
