import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import { LogsDateRangePicker } from "./logs-date-range-picker";
import { getDisplayLabel, parseAnyTimeInput } from "./logs-date-range-types";

export interface LogsTimeRangeInlinePillProps {
  timeRange: string;
  setTimeRange: (val: string) => void;
  showTopTimePicker: boolean;
  setShowTopTimePicker: (open: boolean) => void;
  filterAnchorRef: React.RefObject<HTMLDivElement | null>;
  timeRangePillRef: React.RefObject<HTMLDivElement | null>;
}

export function LogsTimeRangeInlinePill({
  timeRange,
  setTimeRange,
  showTopTimePicker,
  setShowTopTimePicker,
  filterAnchorRef,
  timeRangePillRef,
}: LogsTimeRangeInlinePillProps) {
  const { t } = useTranslation();
  const inlineTimeInputRef = React.useRef<HTMLInputElement>(null);
  const [inlineTimeText, setInlineTimeText] = React.useState("");

  React.useEffect(() => {
    if (showTopTimePicker) {
      setTimeout(() => {
        inlineTimeInputRef.current?.focus();
        inlineTimeInputRef.current?.select();
      }, 50);
    }
  }, [showTopTimePicker]);

  const isTimeRangeActive = timeRange !== "60m" && timeRange !== "1h";
  const isTimePillVisible = isTimeRangeActive || showTopTimePicker;

  const applyParsedTime = (input: string) => {
    const parsed = parseAnyTimeInput(input);
    if (parsed?.type === "preset") {
      setTimeRange(parsed.preset);
    } else if (parsed?.type === "custom" && parsed.range.from) {
      const to = parsed.range.to || parsed.range.from;
      setTimeRange(`custom:${parsed.range.from.toISOString()}_${to.toISOString()}`);
    }
  };

  return (
    <LogsDateRangePicker
      value={timeRange}
      onChange={(val) => {
        setTimeRange(val);
        setInlineTimeText("");
        setShowTopTimePicker(false);
      }}
      open={showTopTimePicker}
      onOpenChange={setShowTopTimePicker}
      anchorRef={timeRangePillRef.current ? timeRangePillRef : filterAnchorRef}
      customTrigger={
        isTimePillVisible
          ? (isOpen, setIsOpen) => (
              <div ref={timeRangePillRef} className="inline-flex shrink-0">
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(!isOpen);
                  }}
                  className={cn(
                    "flex items-center text-[10px] font-mono bg-muted text-foreground border border-border/70 rounded-md gap-1 px-2 py-0.5 shrink-0 whitespace-nowrap cursor-pointer hover:bg-muted/80 transition-colors shadow-xs",
                    isOpen && "border-border ring-1 ring-border/50 bg-muted/90"
                  )}
                >
                  <span className="text-muted-foreground font-semibold">Time range =</span>
                  <input
                    ref={inlineTimeInputRef}
                    type="text"
                    value={inlineTimeText !== "" ? inlineTimeText : getDisplayLabel(timeRange, t)}
                    onChange={(e) => {
                      const val = e.target.value;
                      setInlineTimeText(val);
                      applyParsedTime(val);
                    }}
                    onFocus={(e) => {
                      e.stopPropagation();
                      if (!isOpen) setIsOpen(true);
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isOpen) setIsOpen(true);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        applyParsedTime(inlineTimeText);
                        setIsOpen(false);
                        setInlineTimeText("");
                      } else if (e.key === "Escape") {
                        setIsOpen(false);
                        setInlineTimeText("");
                      }
                    }}
                    className="bg-transparent border-none outline-none text-foreground font-mono text-[10px] font-medium p-0 min-w-[70px] max-w-[170px] truncate"
                    placeholder="e.g. 2h, 45m, 30d"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setTimeRange("60m");
                      setInlineTimeText("");
                      setIsOpen(false);
                    }}
                    className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer ml-0.5"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </div>
              </div>
            )
          : () => null
      }
    />
  );
}
