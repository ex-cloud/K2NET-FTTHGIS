import React, { useState, useCallback } from "react";
import {
  Sparkles,
  User,
  Copy,
  Check,
  BrainCircuit,
  ChevronDown,
  Loader2,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import { cn } from "../../utils";
import { AiMarkdownRenderer } from "./AiMarkdownRenderer";
import type { ChatMessage } from "./types";

export interface AiMessageBubbleProps {
  message: ChatMessage;
  onCopy?: (id: string, text: string) => void;
  onFeedback?: (id: string, type: "like" | "dislike") => void;
  className?: string;
}

interface ReasoningProps {
  message: ChatMessage;
  showThinking: boolean;
  setShowThinking: React.Dispatch<React.SetStateAction<boolean>>;
}

function MessageReasoningAccordion({ message, showThinking, setShowThinking }: ReasoningProps) {
  const hasReasoning =
    message.isThinking ||
    message.thought ||
    message.isStreaming ||
    (message.sources && message.sources.length > 0);

  if (!hasReasoning) return null;

  return (
    <div className="mb-2.5 rounded-md border border-border/80 bg-card text-xs overflow-hidden w-full min-w-0 shadow-xs">
      <button
        type="button"
        onClick={() => setShowThinking((prev) => !prev)}
        className={cn(
          "w-full px-3 py-1.5 flex items-center justify-between text-[11px] font-semibold text-foreground/90 hover:text-foreground bg-muted/40 hover:bg-muted/70 transition-colors cursor-pointer",
          showThinking && "border-b border-border/40"
        )}
      >
        <span className="flex items-center gap-2">
          <BrainCircuit
            className={cn(
              "w-3.5 h-3.5 text-primary",
              message.isStreaming && !message.content && "animate-pulse"
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
            <div className="mt-2 pt-2 border-t border-border/50 text-[11px] font-sans text-muted-foreground whitespace-pre-wrap max-h-48 overflow-y-auto bg-muted/30 p-2.5 rounded-md leading-relaxed">
              {message.thought}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function AiMessageBubble({
  message,
  onCopy,
  onFeedback,
  className,
}: AiMessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const [showThinking, setShowThinking] = useState(false);
  const [feedback, setFeedback] = useState<"like" | "dislike" | null>(null);

  const textContent = message.text || message.content || "";
  const isUser = message.role === "user" || message.sender === "user";

  const handleCopy = useCallback(async () => {
    if (onCopy) {
      onCopy(message.id, textContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      return;
    }

    try {
      await navigator.clipboard.writeText(textContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore clipboard error
    }
  }, [message.id, textContent, onCopy]);

  const handleFeedback = useCallback(
    (type: "like" | "dislike") => {
      const next = feedback === type ? null : type;
      setFeedback(next);
      if (next && onFeedback) {
        onFeedback(message.id, next);
      }
    },
    [feedback, message.id, onFeedback]
  );

  return (
    <div
      className={cn(
        "flex gap-2.5 w-full group min-w-0",
        isUser ? "justify-end" : "justify-start",
        className
      )}
    >
      {!isUser && (
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary mt-0.5 border border-primary/30 shadow-2xs">
          <Sparkles className="h-3.5 w-3.5" />
        </div>
      )}

      <div className={cn("space-y-1 max-w-[88%] sm:max-w-[85%] min-w-0", isUser && "flex flex-col items-end")}>
        {!isUser && (
          <MessageReasoningAccordion
            message={message}
            showThinking={showThinking}
            setShowThinking={setShowThinking}
          />
        )}

        <div
          className={cn(
            "p-3.5 rounded-2xl text-xs leading-relaxed transition-all shadow-xs break-words",
            isUser
              ? "bg-primary text-primary-foreground border border-primary font-medium rounded-tr-xs"
              : "bg-card text-foreground border border-border rounded-tl-xs w-full min-w-0"
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{textContent}</p>
          ) : (
            <>
              {message.isStreaming && !textContent && !message.thought && (
                <div className="flex gap-1.5 items-center h-5">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
              )}
              {textContent && <AiMarkdownRenderer content={textContent} />}
              {message.isStreaming && textContent && (
                <span className="inline-block w-1.5 h-3.5 bg-primary ml-1 animate-pulse align-middle" />
              )}
            </>
          )}
        </div>

        {/* Action Toolbar */}
        <div
          className={cn(
            "flex items-center gap-2 px-1 text-[10px] text-muted-foreground pt-0.5",
            isUser ? "justify-end" : "justify-start"
          )}
        >
          {message.timestamp && <span>{message.timestamp}</span>}

          {!isUser && textContent && !message.isStreaming && (
            <div className="flex items-center gap-1">
              {onFeedback && (
                <>
                  <button
                    type="button"
                    onClick={() => handleFeedback("like")}
                    className={cn(
                      "p-1 rounded-md hover:bg-muted/70 hover:text-foreground transition-all cursor-pointer",
                      feedback === "like" && "text-primary bg-primary/10"
                    )}
                    title="Good response (RLHF)"
                  >
                    <ThumbsUp className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFeedback("dislike")}
                    className={cn(
                      "p-1 rounded-md hover:bg-muted/70 hover:text-foreground transition-all cursor-pointer",
                      feedback === "dislike" && "text-destructive bg-destructive/10"
                    )}
                    title="Bad response (RLHF)"
                  >
                    <ThumbsDown className="w-3 h-3" />
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={handleCopy}
                className="p-1 rounded-md hover:bg-muted/70 hover:text-foreground transition-all cursor-pointer flex items-center gap-0.5"
                title="Salin jawaban"
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3 text-primary" />
                    <span className="text-[10px] text-primary">Disalin</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    <span>Salin</span>
                  </>
                )}
              </button>

              {message.latencyMs && (
                <span className="text-[9px] text-muted-foreground/60 font-mono ml-1">
                  {message.latencyMs}ms
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {isUser && (
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground mt-0.5 font-bold text-[11px] shadow-2xs">
          <User className="h-3.5 w-3.5" />
        </div>
      )}
    </div>
  );
}
