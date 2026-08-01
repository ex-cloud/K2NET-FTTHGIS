"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock, ChevronDown, Copy } from "lucide-react";
import { Calendar, cn } from "@k2net/ui";
import type { DateRange } from "react-day-picker";

// ─── Preset options like Supabase ────────────────────────────────────────────

const PRESETS = [
  { label: "Last 10 minutes",   value: "10m",  duration: { minutes: 10  } },
  { label: "Last 30 minutes",   value: "30m",  duration: { minutes: 30  } },
  { label: "Last 60 minutes",   value: "1h",   duration: { hours: 1     } },
  { label: "Last 3 hours",      value: "3h",   duration: { hours: 3     } },
  { label: "Last 24 hours",     value: "24h",  duration: { hours: 24    } },
  { label: "Last 7 days",       value: "7d",   duration: { days: 7      } },
  { label: "Last 14 days",      value: "14d",  duration: { days: 14     } },
  { label: "Last 28 days",      value: "28d",  duration: { days: 28     } },
];

interface LogsDateRangePickerProps {
  value: string;
  onChange: (value: string) => void;
}

function parseValue(value: string): { preset: string | null; range: DateRange | undefined } {
  if (value.startsWith("custom:")) {
    const parts = value.substring(7).split("_");
    if (parts.length === 2) {
      const from = new Date(parts[0]);
      const to = new Date(parts[1]);
      return { preset: null, range: { from, to } };
    }
  }
  return { preset: value, range: undefined };
}

function getDisplayLabel(value: string): string {
  if (value.startsWith("custom:")) {
    const parts = value.substring(7).split("_");
    if (parts.length === 2) {
      const from = new Date(parts[0]);
      const to = new Date(parts[1]);
      return `${format(from, "MMM d HH:mm")} → ${format(to, "MMM d HH:mm")}`;
    }
  }
  const preset = PRESETS.find((p) => p.value === value);
  return preset ? preset.label : value;
}

export function LogsDateRangePicker({ value, onChange }: LogsDateRangePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);

  const { preset: activePreset, range: customRange } = parseValue(value);
  const today = React.useMemo(() => new Date(), []);

  // Local range state for the calendar
  const [localRange, setLocalRange] = React.useState<DateRange | undefined>(customRange);
  // Time strings for custom range
  const [fromTime, setFromTime] = React.useState("00:00");
  const [toTime, setToTime] = React.useState("23:59");
  // Quick text input (like supabase: "2h, 30m, 7d")
  const [quickInput, setQuickInput] = React.useState("");

  const [coords, setCoords] = React.useState({ top: 0, left: 0 });

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const updateCoords = React.useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const popupWidth = 340;
      const margin = 8;
      // Prefer aligning to left of trigger; clamp so popup never exits viewport right edge
      const rawLeft = rect.left + window.scrollX;
      const maxLeft = window.innerWidth - popupWidth - margin;
      setCoords({
        top: rect.bottom + window.scrollY,
        left: Math.min(rawLeft, maxLeft),
      });
    }
  }, []);

  React.useEffect(() => {
    if (open) {
      updateCoords();
      window.addEventListener("resize", updateCoords);
      window.addEventListener("scroll", updateCoords, true);
    }
    return () => {
      window.removeEventListener("resize", updateCoords);
      window.removeEventListener("scroll", updateCoords, true);
    };
  }, [open, updateCoords]);

  // Close on outside click
  React.useEffect(() => {
    function handleOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (
        triggerRef.current && !triggerRef.current.contains(target) &&
        contentRef.current && !contentRef.current.contains(target)
      ) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  const handlePreset = (presetValue: string) => {
    onChange(presetValue);
    setLocalRange(undefined);
    setOpen(false);
  };

  const handleApply = () => {
    if (localRange?.from && localRange?.to) {
      // Merge date + time
      const from = new Date(localRange.from);
      const [fromH, fromM] = fromTime.split(":").map(Number);
      from.setHours(fromH, fromM, 0, 0);

      const to = new Date(localRange.to);
      const [toH, toM] = toTime.split(":").map(Number);
      to.setHours(toH, toM, 59, 999);

      onChange(`custom:${from.toISOString()}_${to.toISOString()}`);
      setOpen(false);
    }
  };

  const handleToday = () => {
    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    setLocalRange({ from: start, to: now });
  };

  const handleCopyRange = () => {
    if (localRange?.from && localRange?.to) {
      navigator.clipboard.writeText(
        `${format(localRange.from, "yyyy-MM-dd")} to ${format(localRange.to, "yyyy-MM-dd")}`
      );
    }
  };

  return (
    <div className="w-full">
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "w-full flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono transition-colors",
          "bg-background border-border/60 text-foreground hover:bg-muted/40 hover:border-primary/40",
          open && "border-primary/60 bg-muted/40"
        )}
      >
        <span className="flex items-center gap-1.5 truncate">
          <CalendarIcon className="w-3 h-3 text-primary shrink-0" />
          {getDisplayLabel(value)}
        </span>
        <ChevronDown className={cn("w-3 h-3 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      {/* Dropdown Panel - Rendered via Portal to escape parent sidebar overflow clips */}
      {open && mounted && createPortal(
        <div
          ref={contentRef}
          style={{
            position: "absolute",
            top: `${coords.top + 4}px`,
            left: `${coords.left}px`,
          }}
          className="z-[9999] w-[340px] rounded-xl border border-border bg-card shadow-2xl overflow-hidden text-foreground font-sans text-xs"
        >
          {/* Quick input at top (e.g. "2h, 30m") */}
          <div className="px-3 pt-3 pb-2 border-b border-border/50">
            <input
              value={quickInput}
              onChange={(e) => setQuickInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const match = quickInput.match(/^(\d+)\s*([mhd])$/i);
                  if (match) {
                    const val = parseInt(match[1]);
                    const unit = match[2].toLowerCase();
                    const mapped = unit === "m" ? `${val}m` : unit === "h" ? `${val}h` : `${val}d`;
                    onChange(mapped);
                    setOpen(false);
                    setQuickInput("");
                  }
                }
              }}
              placeholder="e.g. 2h, 30m, 7d"
              className="w-full bg-muted/30 border border-border/60 rounded-md px-2.5 py-1.5 text-xs font-mono text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/60"
            />
          </div>

          <div className="flex bg-card">
            {/* LEFT: Presets */}
            <div className="w-[140px] border-r border-border/50 flex flex-col p-1.5 gap-0.5">
              {PRESETS.map((p) => {
                const isActive = activePreset === p.value;
                return (
                  <button
                    key={p.value}
                    onClick={() => handlePreset(p.value)}
                    className={cn(
                      "w-full text-left px-2 py-1.5 rounded-md text-[11px] transition-colors font-medium",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    )}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>

            {/* RIGHT: Calendar */}
            <div className="flex-1 flex flex-col bg-card">
              <Calendar
                mode="range"
                selected={localRange}
                onSelect={setLocalRange}
                numberOfMonths={1}
                disabled={{ after: today }}
                className="text-xs"
              />

              {/* Time inputs */}
              <div className="px-3 pb-2 pt-1 border-t border-border/50 flex items-center gap-2 text-[11px] font-mono">
                <Clock className="w-3 h-3 text-muted-foreground shrink-0" />
                <input
                  type="time"
                  value={fromTime}
                  onChange={(e) => setFromTime(e.target.value)}
                  className="flex-1 bg-muted/30 border border-border/60 rounded px-1.5 py-0.5 text-foreground focus:outline-none focus:border-primary/60 text-[11px] font-mono"
                />
                <span className="text-muted-foreground">→</span>
                <input
                  type="time"
                  value={toTime}
                  onChange={(e) => setToTime(e.target.value)}
                  className="flex-1 bg-muted/30 border border-border/60 rounded px-1.5 py-0.5 text-foreground focus:outline-none focus:border-primary/60 text-[11px] font-mono"
                />
              </div>

              {/* Footer actions */}
              <div className="px-3 pb-3 pt-2 flex items-center justify-between gap-2">
                <button
                  onClick={handleCopyRange}
                  title="Copy date range"
                  className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors font-mono"
                >
                  <Copy className="w-3 h-3" />
                  Copy range
                </button>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleToday}
                    className="px-2.5 py-1 rounded-md border border-border/60 text-[11px] font-mono text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors"
                  >
                    Today
                  </button>
                  <button
                    onClick={handleApply}
                    disabled={!localRange?.from || !localRange?.to}
                    className={cn(
                      "px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold transition-colors",
                      localRange?.from && localRange?.to
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "bg-muted/40 text-muted-foreground/50 cursor-not-allowed"
                    )}
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
