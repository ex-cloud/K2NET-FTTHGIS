import React from "react";
import { Send, Square } from "lucide-react";
import { cn } from "@/lib/utils";

interface FullscreenChatInputProps {
  input: string;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
  onInputChange: (v: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onSend: () => void;
  onStop: () => void;
  isStreaming: boolean;
}

export function FullscreenChatInput({
  input,
  inputRef,
  onInputChange,
  onKeyDown,
  onSend,
  onStop,
  isStreaming,
}: FullscreenChatInputProps) {
  return (
    <div className="flex-shrink-0 border-t border-border/60 bg-background/95 backdrop-blur-md px-6 py-4">
      <div className="w-full max-w-3xl mx-auto space-y-2">
        <div className="flex items-end gap-3">
          <div className="relative flex-1 flex items-end rounded-2xl border border-border bg-muted/40 focus-within:ring-1 focus-within:ring-primary focus-within:border-primary transition-all shadow-xs">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => onInputChange(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Type @ to tag a resource or ask any FTTH question..."
              rows={1}
              className="flex-1 w-full resize-none bg-transparent px-4 py-2.5 text-sm focus:outline-none placeholder:text-muted-foreground text-foreground min-h-[44px] max-h-48 overflow-y-auto leading-relaxed"
            />
          </div>

          <button
            type="button"
            onClick={isStreaming ? onStop : onSend}
            disabled={!input.trim() && !isStreaming}
            className={cn(
              "h-11 w-11 rounded-full flex items-center justify-center flex-shrink-0 shadow-md transition-all cursor-pointer",
              "disabled:opacity-40 disabled:cursor-not-allowed",
              isStreaming
                ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                : "bg-primary hover:bg-primary/90 text-primary-foreground hover:scale-105"
            )}
            title={isStreaming ? "Stop" : "Send"}
          >
            {isStreaming ? (
              <Square className="w-4 h-4 fill-current" />
            ) : (
              <Send className="w-4 h-4 -translate-x-px" />
            )}
          </button>
        </div>

        <p className="text-[11px] text-muted-foreground text-center pt-1">
          Chats are recorded to improve the service in accordance with our Privacy Policy.
        </p>
      </div>
    </div>
  );
}
