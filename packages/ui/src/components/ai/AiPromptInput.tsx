import React, { useRef, useEffect } from "react";
import { Send, Square } from "lucide-react";
import { cn } from "../../utils";
import { ActionTooltip } from "../tooltip";

interface AiPromptInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: (text?: string) => void;
  onStop?: () => void;
  isStreaming?: boolean;
  disabled?: boolean;
  placeholder?: string;
  disclaimer?: string;
  className?: string;
}

export function AiPromptInput({
  value,
  onChange,
  onSend,
  onStop,
  isStreaming = false,
  disabled = false,
  placeholder = "Type @ to tag a resource or ask any FTTH question...",
  disclaimer = "Chats are recorded to improve the service in accordance with our Privacy Policy.",
  className,
}: AiPromptInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.max(38, Math.min(textareaRef.current.scrollHeight, 140))}px`;
    }
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isStreaming && value.trim()) {
        onSend();
      }
    }
  };

  const handleButtonClick = () => {
    if (isStreaming) {
      onStop?.();
    } else if (value.trim()) {
      onSend();
    }
  };

  return (
    <div
      className={cn(
        "px-3 pt-2 pb-3 border-t border-border/60 bg-background/95 backdrop-blur-md flex-shrink-0 select-none",
        className
      )}
    >
      <div className="flex items-end gap-2">
        <div className="relative flex-1 flex items-end rounded-2xl border border-border bg-muted/40 focus-within:ring-1 focus-within:ring-primary focus-within:border-primary transition-all">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={placeholder}
            rows={1}
            className={cn(
              "flex-1 w-full resize-none bg-transparent pl-4 pr-3 py-2 text-[13px]",
              "focus:outline-none placeholder:text-muted-foreground text-foreground",
              "min-h-[38px] max-h-36 overflow-y-auto leading-relaxed",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          />
        </div>

        <ActionTooltip
          label={isStreaming ? "Hentikan pembuatan" : "Kirim pesan"}
          shortcut="Enter"
          side="top"
        >
          <button
            type="button"
            onClick={handleButtonClick}
            disabled={(!value.trim() && !isStreaming) || disabled}
            className={cn(
              "h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0 shadow-md transition-all cursor-pointer",
              "disabled:opacity-40 disabled:cursor-not-allowed",
              isStreaming
                ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                : "bg-primary hover:bg-primary/90 text-primary-foreground hover:scale-105"
            )}
          >
            {isStreaming ? (
              <Square className="w-3.5 h-3.5 fill-current" />
            ) : (
              <Send className="w-3.5 h-3.5 -translate-x-px" />
            )}
          </button>
        </ActionTooltip>
      </div>

      {disclaimer && (
        <p className="text-[10px] text-muted-foreground text-center pt-2">
          {disclaimer}
        </p>
      )}
    </div>
  );
}
