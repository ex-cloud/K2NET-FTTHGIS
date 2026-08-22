"use client";

import React, { useState, useCallback } from "react";
import { Sparkles, Check, Copy, Loader2, ChevronDown, BookOpen, Zap, BrainCircuit } from "lucide-react";
import { Badge } from "@k2net/ui";
import { cn } from "@/lib/utils";
import { AiMarkdownRenderer } from "@/components/ai/AiMarkdownRenderer";
import type { ChatMessage, DocumentSource } from "@/hooks/useAiChatStream";

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
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
        {/* Reasoning accordion */}
        {!isUser &&
          (message.isThinking || message.thought || message.isStreaming ||
            (message.sources && message.sources.length > 0)) && (
            <div className="mb-3 rounded-xl border border-border/80 bg-card text-xs overflow-hidden max-w-[95%] shadow-xs">
              <button
                type="button"
                onClick={() => setShowThinking(!showThinking)}
                className="w-full px-3.5 py-2 flex items-center justify-between text-[11px] font-semibold text-foreground/90 hover:text-foreground bg-muted/40 hover:bg-muted/70 transition-colors cursor-pointer border-b border-border/40"
              >
                <span className="flex items-center gap-2">
                  <BrainCircuit className={cn("w-3.5 h-3.5 text-primary", message.isStreaming && "animate-pulse")} />
                  <span className="font-semibold text-foreground">
                    {message.isStreaming && !message.content ? "Menganalisis & Menalar..." : "Reasoned & Knowledge Grounding"}
                  </span>
                  {message.isStreaming && !message.content && (
                    <Loader2 className="w-3 h-3 animate-spin text-primary ml-1" />
                  )}
                </span>
                <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-200 text-muted-foreground", showThinking ? "rotate-180" : "")} />
              </button>

              <div className="px-3.5 py-2.5 bg-background/60 space-y-1.5 font-mono text-[11px]">
                <div className="flex items-center gap-2 text-foreground/80">
                  <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span>Ran pgvector semantic embedding (HNSW)</span>
                </div>
                <div className="flex items-center gap-2 text-foreground/80">
                  <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span>Ran BM25 Full-Text search across 160+ K2NET documents</span>
                </div>
                {message.sources && message.sources.length > 0 && (
                  <div className="flex items-center gap-2 text-primary font-medium">
                    <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>Retrieved {message.sources.length} matching knowledge chunks</span>
                  </div>
                )}
                {message.isStreaming && !message.content && (
                  <div className="flex items-center gap-2 text-muted-foreground italic animate-pulse">
                    <Loader2 className="w-3 h-3 animate-spin shrink-0 text-primary" />
                    <span>{message.thinkingStage || "Mengevaluasi parameter teknis..."}</span>
                  </div>
                )}
                {showThinking && message.thought && (
                  <div className="mt-2 pt-2 border-t border-border/50 text-[11px] text-muted-foreground whitespace-pre-wrap max-h-40 overflow-y-auto bg-muted/30 p-2 rounded-md">
                    {message.thought}
                  </div>
                )}
              </div>
            </div>
          )}

        {/* Message bubble */}
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
              {message.content && <AiMarkdownRenderer content={message.content} />}
              {message.isStreaming && message.content && (
                <span className="inline-block w-1.5 h-4 bg-primary ml-1 animate-pulse align-middle" />
              )}
            </>
          )}
        </div>

        {/* Cache hit */}
        {!isUser && message.cacheHit && (
          <div className="text-[10px] text-amber-500 flex items-center gap-1 mt-1.5 mb-1">
            <Zap className="w-2.5 h-2.5" />
            <span className="font-semibold">Redis Semantic Cache</span>
            <span className="text-muted-foreground">• respons instan</span>
          </div>
        )}

        {/* Citation sources */}
        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2.5 max-w-[92%]">
            {message.sources.map((src: DocumentSource, i: number) => (
              <Badge key={i} variant="secondary" className="text-[10px] gap-1 cursor-default py-0.5 px-2 border border-border" title={src.content_preview}>
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

        {/* Latency + copy */}
        {!isUser && !message.isStreaming && message.content && (
          <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {message.latencyMs && (
              <span className="text-[10px] text-muted-foreground font-mono">{message.latencyMs}ms</span>
            )}
            <button
              onClick={handleCopy}
              className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
