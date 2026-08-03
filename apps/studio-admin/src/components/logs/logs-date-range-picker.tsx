"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { format } from "date-fns";
import { Calendar as CalendarIcon, ChevronDown, Copy, History } from "lucide-react";
import { Calendar, cn } from "@k2net/ui";
import type { DateRange } from "react-day-picker";

// ─── Preset options like Supabase ────────────────────────────────────────────

const PRESETS = [
  { label: "Last 10 minutes", value: "10m" },
  { label: "Last 30 minutes", value: "30m" },
  { label: "Last 60 minutes", value: "1h" },
  { label: "Last 3 hours", value: "3h" },
  { label: "Last 24 hours", value: "24h" },
  { label: "Last 7 days", value: "7d" },
  { label: "Last 14 days", value: "14d" },
  { label: "Last 28 days", value: "28d" },
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
      return `${format(from, "MMM d, HH:mm")} → ${format(to, "MMM d, HH:mm")}`;
    }
  }
  const preset = PRESETS.find((p) => p.value === value);
  return preset ? preset.label : value;
}

/** Parse "HH:MM:SS" or "HH:MM" string → { h, m, s } */
function parseTimeStr(t: string): { h: number; m: number; s: number } {
  const [h = 0, m = 0, s = 0] = t.split(":").map(Number);
  return { h, m, s };
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
  // Time strings for custom range — HH:MM:SS
  const [fromTime, setFromTime] = React.useState("00:00:00");
  const [toTime, setToTime] = React.useState("23:59:59");

  const [customRelativeInput, setCustomRelativeInput] = React.useState("");

  const handleCustomRelativeSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const val = customRelativeInput.trim();
      const match = val.match(/^(\d+)([mhd])$/i);
      if (match) {
        const amount = parseInt(match[1]);
        const unit = match[2].toLowerCase();
        let multiplier = 60 * 1000; // minutes
        if (unit === "h") multiplier = 60 * 60 * 1000; // hours
        if (unit === "d") multiplier = 24 * 60 * 60 * 1000; // days

        const to = new Date();
        const from = new Date(to.getTime() - amount * multiplier);
        onChange(`custom:${from.toISOString()}_${to.toISOString()}`);
        setOpen(false);
      }
    }
  };

  const handleResetTime = () => {
    const { range } = parseValue(value);
    if (range?.from) {
      const hh = String(range.from.getHours()).padStart(2, "0");
      const mm = String(range.from.getMinutes()).padStart(2, "0");
      const ss = String(range.from.getSeconds()).padStart(2, "0");
      setFromTime(`${hh}:${mm}:${ss}`);
    } else {
      setFromTime("00:00:00");
    }
    if (range?.to) {
      const hh = String(range.to.getHours()).padStart(2, "0");
      const mm = String(range.to.getMinutes()).padStart(2, "0");
      const ss = String(range.to.getSeconds()).padStart(2, "0");
      setToTime(`${hh}:${mm}:${ss}`);
    } else {
      setToTime("23:59:59");
    }
  };

  React.useEffect(() => {
    if (open) {
      const { range } = parseValue(value);
      if (range?.from) {
        const hh = String(range.from.getHours()).padStart(2, "0");
        const mm = String(range.from.getMinutes()).padStart(2, "0");
        const ss = String(range.from.getSeconds()).padStart(2, "0");
        setFromTime(`${hh}:${mm}:${ss}`);
      } else {
        setFromTime("00:00:00");
      }
      if (range?.to) {
        const hh = String(range.to.getHours()).padStart(2, "0");
        const mm = String(range.to.getMinutes()).padStart(2, "0");
        const ss = String(range.to.getSeconds()).padStart(2, "0");
        setToTime(`${hh}:${mm}:${ss}`);
      } else {
        setToTime("23:59:59");
      }
      setLocalRange(range);
    }
  }, [open, value]);

  const [coords, setCoords] = React.useState({ top: 0, left: 0 });

  React.useEffect(() => { setMounted(true); }, []);

  const updateCoords = React.useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const popupWidth = 480;
      const popupHeight = 360;
      const margin = 8;
      const rawLeft = rect.left + window.scrollX;
      const maxLeft = window.innerWidth - popupWidth - margin;

      const spaceBelow = window.innerHeight - rect.bottom;
      const openUpwards = spaceBelow < popupHeight && rect.top > popupHeight;

      setCoords({
        top: openUpwards
          ? rect.top + window.scrollY - popupHeight - 4
          : rect.bottom + window.scrollY + 4,
        left: Math.max(margin, Math.min(rawLeft, maxLeft)),
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
      ) setOpen(false);
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
    if (localRange?.from) {
      const from = new Date(localRange.from);
      const { h: fh, m: fm, s: fs } = parseTimeStr(fromTime);
      from.setHours(fh, fm, fs, 0);

      const to = new Date(localRange.to || localRange.from);
      const { h: th, m: tm, s: ts } = parseTimeStr(toTime);
      to.setHours(th, tm, ts, 999);

      onChange(`custom:${from.toISOString()}_${to.toISOString()}`);
      setOpen(false);
    }
  };

  const handleToday = () => {
    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    setLocalRange({ from: start, to: now });
    setFromTime("00:00:00");
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    const ss = String(now.getSeconds()).padStart(2, "0");
    setToTime(`${hh}:${mm}:${ss}`);
  };

  const handleCopyRange = () => {
    if (localRange?.from) {
      const from = new Date(localRange.from);
      const { h: fh, m: fm, s: fs } = parseTimeStr(fromTime);
      from.setHours(fh, fm, fs);
      const to = new Date(localRange.to || localRange.from);
      const { h: th, m: tm, s: ts } = parseTimeStr(toTime);
      to.setHours(th, tm, ts);
      navigator.clipboard.writeText(
        `${format(from, "yyyy-MM-dd HH:mm:ss")} → ${format(to, "yyyy-MM-dd HH:mm:ss")}`
      );
    }
  };

  const { h: fromHNum, m: fromMNum, s: fromSNum } = parseTimeStr(fromTime);
  const { h: toHNum, m: toMNum, s: toSNum } = parseTimeStr(toTime);

  const fromHStr = String(fromHNum).padStart(2, "0");
  const fromMStr = String(fromMNum).padStart(2, "0");
  const fromSStr = String(fromSNum).padStart(2, "0");

  const toHStr = String(toHNum).padStart(2, "0");
  const toMStr = String(toMNum).padStart(2, "0");
  const toSStr = String(toSNum).padStart(2, "0");

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
          {mounted ? getDisplayLabel(value) : "Loading..."}
        </span>
        <ChevronDown className={cn("w-3 h-3 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      {/* Dropdown Panel */}
      {open && mounted && createPortal(
        <div
          ref={contentRef}
          style={{ position: "absolute", top: `${coords.top}px`, left: `${coords.left}px` }}
          className="z-[9999] w-[480px] rounded-xl border border-border bg-card shadow-2xl overflow-hidden text-foreground font-sans text-xs"
        >
          <div className="flex bg-card">
            {/* LEFT: Presets list */}
            <div className="w-[200px] shrink-0 border-r border-border/40 flex flex-col p-2 gap-px">
              <input
                type="text"
                placeholder="e.g. 2h, 30m, 7d"
                value={customRelativeInput}
                onChange={(e) => setCustomRelativeInput(e.target.value)}
                onKeyDown={handleCustomRelativeSubmit}
                className="flex w-full border border-border bg-foreground/[.026] placeholder:text-muted-foreground/40 px-3 py-2 mb-2 text-xs h-7 rounded-sm focus:outline-none focus:border-border/80 transition-colors font-sans"
              />
              <div className="flex flex-col gap-px">
                {PRESETS.map((p) => {
                  const isActive = activePreset === p.value;
                  return (
                    <label
                      key={p.value}
                      onClick={() => handlePreset(p.value)}
                      className={cn(
                        "px-4 py-1.5 flex items-center justify-between text-xs w-full cursor-pointer transition-all rounded-sm",
                        isActive
                          ? "bg-muted text-foreground font-semibold"
                          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                      )}
                    >
                      <span className="flex items-center gap-2">
                        {isActive && (
                          <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                        )}
                        {p.label}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* RIGHT: Time + Calendar */}
            <div className="flex-1 flex flex-col">
              {/* ── Time pickers at TOP (like Supabase) ── */}
              <div className="w-full flex px-[14px] py-2 gap-2 items-center justify-between">
                <div className="flex-1 flex gap-2 font-mono">
                  {/* Start Time Widget */}
                  <div className="flex-1 flex h-7 items-center justify-center gap-0.5 rounded-sm border border-border bg-muted/20 text-xs px-2 hover:border-border/80 transition-colors">
                    <input
                      type="text"
                      pattern="[0-23]*"
                      placeholder="00"
                      aria-label="Hours"
                      value={fromHStr}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "").slice(0, 2);
                        const h = Math.min(23, parseInt(val) || 0);
                        setFromTime(`${String(h).padStart(2, "0")}:${fromMStr}:${fromSStr}`);
                      }}
                      className="w-4 p-0 text-center text-xs text-foreground bg-transparent border-none outline-none focus:ring-0 focus:outline-none"
                    />
                    <span className="text-muted-foreground/40">:</span>
                    <input
                      type="text"
                      pattern="[0-59]*"
                      placeholder="00"
                      aria-label="Minutes"
                      value={fromMStr}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "").slice(0, 2);
                        const m = Math.min(59, parseInt(val) || 0);
                        setFromTime(`${fromHStr}:${String(m).padStart(2, "0")}:${fromSStr}`);
                      }}
                      className="w-4 p-0 text-center text-xs text-foreground bg-transparent border-none outline-none focus:ring-0 focus:outline-none"
                    />
                    <span className="text-muted-foreground/40">:</span>
                    <input
                      type="text"
                      pattern="[0-59]*"
                      placeholder="00"
                      aria-label="Seconds"
                      value={fromSStr}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "").slice(0, 2);
                        const s = Math.min(59, parseInt(val) || 0);
                        setFromTime(`${fromHStr}:${fromMStr}:${String(s).padStart(2, "0")}`);
                      }}
                      className="w-4 p-0 text-center text-xs text-foreground bg-transparent border-none outline-none focus:ring-0 focus:outline-none"
                    />
                  </div>

                  {/* End Time Widget */}
                  <div className="flex-1 flex h-7 items-center justify-center gap-0.5 rounded-sm border border-border bg-muted/20 text-xs px-2 hover:border-border/80 transition-colors">
                    <input
                      type="text"
                      pattern="[0-23]*"
                      placeholder="00"
                      aria-label="Hours"
                      value={toHStr}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "").slice(0, 2);
                        const h = Math.min(23, parseInt(val) || 0);
                        setToTime(`${String(h).padStart(2, "0")}:${toMStr}:${toSStr}`);
                      }}
                      className="w-4 p-0 text-center text-xs text-foreground bg-transparent border-none outline-none focus:ring-0 focus:outline-none"
                    />
                    <span className="text-muted-foreground/40">:</span>
                    <input
                      type="text"
                      pattern="[0-59]*"
                      placeholder="00"
                      aria-label="Minutes"
                      value={toMStr}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "").slice(0, 2);
                        const m = Math.min(59, parseInt(val) || 0);
                        setToTime(`${toHStr}:${String(m).padStart(2, "0")}:${toSStr}`);
                      }}
                      className="w-4 p-0 text-center text-xs text-foreground bg-transparent border-none outline-none focus:ring-0 focus:outline-none"
                    />
                    <span className="text-muted-foreground/40">:</span>
                    <input
                      type="text"
                      pattern="[0-59]*"
                      placeholder="00"
                      aria-label="Seconds"
                      value={toSStr}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "").slice(0, 2);
                        const s = Math.min(59, parseInt(val) || 0);
                        setToTime(`${toHStr}:${toMStr}:${String(s).padStart(2, "0")}`);
                      }}
                      className="w-4 p-0 text-center text-xs text-foreground bg-transparent border-none outline-none focus:ring-0 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="shrink-0">
                  <button
                    type="button"
                    onClick={handleResetTime}
                    title="Reset times"
                    className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-transparent text-muted-foreground/60 hover:bg-muted hover:text-foreground transition-colors shrink-0"
                  >
                    <History className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* ── Calendar ── */}
              <div className="border-t border-border/40 flex justify-center py-1 px-[2px]">
                <Calendar
                  mode="range"
                  selected={localRange}
                  onSelect={setLocalRange}
                  numberOfMonths={1}
                  disabled={{ after: today }}
                  className="text-xs relative p-0"
                  classNames={{
                    month: "relative flex flex-col gap-2.5",
                    button_previous: "absolute left-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors",
                    button_next: "absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors",
                    day_button: "h-9 w-9 rounded-md font-normal text-xs transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                    weekday: "text-muted-foreground rounded-md w-9 font-normal text-[11px] pb-1 text-center",
                    day: "h-9 w-9 relative p-0 text-center text-xs focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-primary/10 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md",
                    week: "flex w-full mt-2",
                  }}
                />
              </div>

              {/* ── Footer actions ── */}
              <div className="flex items-center justify-end gap-2 px-[14px] py-2 border-t border-border/40">
                <button
                  type="button"
                  onClick={handleCopyRange}
                  className="relative inline-flex items-center justify-center cursor-pointer text-center font-normal rounded-md transition-colors hover:bg-muted text-xs h-[26px] px-2.5 text-muted-foreground hover:text-foreground"
                >
                  <span className="truncate">Copy range</span>
                </button>
                <button
                  type="button"
                  onClick={handleToday}
                  className="relative inline-flex items-center justify-center cursor-pointer text-center font-normal rounded-md transition-colors border border-border bg-muted/40 hover:bg-muted text-xs h-[26px] px-2.5 text-foreground"
                >
                  <span className="truncate">Today</span>
                </button>
                <button
                  type="button"
                  onClick={handleApply}
                  disabled={!localRange?.from}
                  className={cn(
                    "relative inline-flex items-center justify-center cursor-pointer text-center font-medium rounded-md transition-colors text-xs h-[26px] px-2.5",
                    localRange?.from
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "bg-muted/40 text-muted-foreground/50 cursor-not-allowed border border-border/40"
                  )}
                >
                  <span className="truncate">Apply</span>
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
