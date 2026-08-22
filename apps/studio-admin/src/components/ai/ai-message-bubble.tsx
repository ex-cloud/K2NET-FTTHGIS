"use client";

import React, { useState, useCallback } from "react";
import { Sparkles, Check, Copy, Loader2, ChevronDown, BrainCircuit, ThumbsUp, ThumbsDown } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { AiMarkdownRenderer } from "@/components/ai/AiMarkdownRenderer";
import type { ChatMessage } from "@/hooks/useAiChatStream";
import { sendAiFeedback } from "@/lib/actions/gateways";

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const [showThinking, setShowThinking] = useState(false);
  const [feedback, setFeedback] = useState<"like" | "dislike" | null>(null);
  const isUser = message.role === "user";

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    toast.success("Teks berhasil disalin ke clipboard");
    setTimeout(() => setCopied(false), 2000);
  }, [message.content]);

  const handleFeedback = useCallback(async (type: "like" | "dislike") => {
    const next = feedback === type ? null : type;
    setFeedback(next);
    if (next) {
      if (next === "like") toast.success("Terima kasih atas tanggapan positif Anda!");
      else toast.success("Tanggapan dicatat untuk peningkatan kualitas model.");
      try {
        await sendAiFeedback({
          messageId: message.id,
          responseText: message.content,
          feedbackType: next,
        });
      } catch (e) {
        console.warn("Feedback recording failed:", e);
      }
    }
  }, [feedback, message.id, message.content]);

  return (
    <div className={cn("flex gap-3 group w-full min-w-0", isUser && "flex-row-reverse")}>
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
            <div className="mb-3 rounded-xl border border-border/80 bg-card text-xs overflow-hidden w-full min-w-0 shadow-xs">
              <button
                type="button"
                onClick={() => setShowThinking(!showThinking)}
                className={cn(
                  "w-full px-3.5 py-2 flex items-center justify-between text-[11px] font-semibold text-foreground/90 hover:text-foreground bg-muted/40 hover:bg-muted/70 transition-colors cursor-pointer",
                  showThinking && "border-b border-border/40"
                )}
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

              {showThinking && (
                <div className="px-3.5 py-2.5 bg-background/60 space-y-1.5 font-mono text-[11px] animate-in fade-in duration-150">
                  <div className="flex items-center gap-2 text-foreground/85">
                    <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>Searched FTTH technical knowledge base &amp; standards</span>
                  </div>
                  <div className="flex items-center gap-2 text-foreground/85">
                    <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>Cross-referenced GPON, OLT telemetries &amp; PostGIS GIS data</span>
                  </div>
                  <div className="flex items-center gap-2 text-foreground/85">
                    <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>Verified Zero-Trust security policies &amp; access scopes</span>
                  </div>

                  {message.isStreaming && !message.content && (
                    <div className="flex items-center gap-2 text-muted-foreground italic animate-pulse pt-0.5">
                      <Loader2 className="w-3 h-3 animate-spin shrink-0 text-primary" />
                      <span>{message.thinkingStage || "Mengevaluasi parameter teknis..."}</span>
                    </div>
                  )}

                  {message.thought && (
                    <div className="mt-2 pt-2 border-t border-border/50 text-[11px] font-sans text-muted-foreground whitespace-pre-wrap max-h-48 overflow-y-auto bg-muted/30 p-2.5 rounded-lg leading-relaxed">
                      {message.thought}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        {/* Message bubble */}
        <div
          className={cn(
            "rounded-2xl px-4 py-3 text-sm shadow-xs break-words",
            isUser
              ? "bg-primary text-primary-foreground rounded-tr-sm font-medium max-w-[85%]"
              : "bg-card text-foreground border border-border rounded-tl-sm w-full min-w-0"
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

        {/* Cloudflare-style action toolbar (Thumbs Up, Thumbs Down, Copy) */}
        {!isUser && !message.isStreaming && message.content && (
          <div className="flex items-center gap-1 mt-1.5 text-muted-foreground">
            <button
              type="button"
              onClick={() => handleFeedback("like")}
              className={cn(
                "p-1.5 rounded-lg hover:bg-muted/70 hover:text-foreground transition-all cursor-pointer",
                feedback === "like" && "text-primary bg-primary/10"
              )}
              title="Good response (RLHF)"
            >
              <ThumbsUp className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleFeedback("dislike")}
              className={cn(
                "p-1.5 rounded-lg hover:bg-muted/70 hover:text-foreground transition-all cursor-pointer",
                feedback === "dislike" && "text-destructive bg-destructive/10"
              )}
              title="Bad response (RLHF)"
            >
              <ThumbsDown className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleCopy}
              className="p-1.5 rounded-lg hover:bg-muted/70 hover:text-foreground transition-all cursor-pointer"
              title="Copy message"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            {message.latencyMs && (
              <span className="text-[10px] text-muted-foreground/60 font-mono ml-2">
                {message.latencyMs}ms
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
