import * as React from "react";
import { createPortal } from "react-dom";
import { format } from "date-fns";
import { Calendar as CalendarIcon, ChevronDown, History } from "lucide-react";
import { Calendar, cn } from "@k2net/ui";
import type { DateRange } from "react-day-picker";

const PRESETS = [
  { label: "Last 60 minutes", value: "1h" },
  { label: "Last 24 hours", value: "24h" },
  { label: "Last 7 days", value: "7d" },
  { label: "Last 14 days", value: "14d" },
  { label: "Last 30 days", value: "30d" },
];

interface TelemetryDateRangePickerProps {
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
      return `${format(from, "d MMM")} → ${format(to, "d MMM yyyy")}`;
    }
  }
  const preset = PRESETS.find((p) => p.value === value);
  return preset ? preset.label : value;
}

function getPresetRange(preset: string): { from: Date; to: Date } {
  const to = new Date();
  const match = preset.match(/^(\d+)([mhd])$/i);
  if (match) {
    const amount = parseInt(match[1]);
    const unit = match[2].toLowerCase();
    let multiplier = 60 * 1000;
    if (unit === "h") multiplier = 60 * 60 * 1000;
    if (unit === "d") multiplier = 24 * 60 * 60 * 1000;
    return { from: new Date(to.getTime() - amount * multiplier), to };
  }
  return { from: new Date(to.getTime() - 24 * 60 * 60 * 1000), to };
}

function parseTimeStr(t: string): { h: number; m: number; s: number } {
  const [h = 0, m = 0, s = 0] = t.split(":").map(Number);
  return { h, m, s };
}

export function TelemetryDateRangePicker({ value, onChange }: TelemetryDateRangePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);

  const { preset: activePreset, range: customRange } = parseValue(value);
  const today = React.useMemo(() => new Date(), []);
  const [localRange, setLocalRange] = React.useState<DateRange | undefined>(customRange);
  const [fromTime, setFromTime] = React.useState("00:00:00");
  const [toTime, setToTime] = React.useState("23:59:59");
  const [coords, setCoords] = React.useState({ top: 0, left: 0 });

  React.useEffect(() => {
    if (open) {
      const { preset, range } = parseValue(value);
      const active = preset ? getPresetRange(preset) : range;
      if (active?.from) {
        const h = String(active.from.getHours()).padStart(2, "0");
        const m = String(active.from.getMinutes()).padStart(2, "0");
        const s = String(active.from.getSeconds()).padStart(2, "0");
        setFromTime(`${h}:${m}:${s}`);
      }
      if (active?.to) {
        const h = String(active.to.getHours()).padStart(2, "0");
        const m = String(active.to.getMinutes()).padStart(2, "0");
        const s = String(active.to.getSeconds()).padStart(2, "0");
        setToTime(`${h}:${m}:${s}`);
      }
      setLocalRange(range);
    }
  }, [open, value]);

  React.useEffect(() => { setMounted(true); }, []);

  const updateCoords = React.useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const popupWidth = 460;
      const popupHeight = 350;
      const margin = 8;
      const isOnRightHalf = rect.left + rect.width / 2 > window.innerWidth / 2;
      const rawLeft = isOnRightHalf
        ? rect.right + window.scrollX - popupWidth
        : rect.left + window.scrollX;
      const maxLeft = window.innerWidth - popupWidth - margin;
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUpwards = spaceBelow < popupHeight && rect.top > popupHeight;

      setCoords({
        top: openUpwards ? rect.top + window.scrollY - popupHeight - 4 : rect.bottom + window.scrollY + 4,
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
    const h = String(now.getHours()).padStart(2, "0");
    const m = String(now.getMinutes()).padStart(2, "0");
    const s = String(now.getSeconds()).padStart(2, "0");
    setToTime(`${h}:${m}:${s}`);
  };

  const handleReset = () => {
    onChange("24h");
    setLocalRange(undefined);
    setOpen(false);
  };

  return (
    <div className="relative inline-block">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "h-7 px-2.5 flex items-center justify-between gap-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer shadow-xs",
          "bg-background border-border text-foreground hover:bg-muted",
          open && "border-primary/60 bg-muted"
        )}
      >
        <span className="flex items-center gap-1.5 truncate">
          <CalendarIcon className="w-3.5 h-3.5 text-primary shrink-0" />
          <span className="font-mono text-[11px]">{mounted ? getDisplayLabel(value) : "Loading..."}</span>
        </span>
        <ChevronDown className={cn("w-3 h-3 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      {open && mounted && createPortal(
        <div
          ref={contentRef}
          style={{ position: "absolute", top: `${coords.top}px`, left: `${coords.left}px` }}
          className="z-[9999] w-[460px] rounded-xl border border-border bg-card shadow-2xl overflow-hidden text-foreground font-sans text-xs"
        >
          <div className="flex bg-card">
            {/* Presets Sidebar */}
            <div className="w-[160px] shrink-0 border-r border-border/40 flex flex-col p-2 gap-1 bg-background/50">
              <div className="text-[10px] font-semibold text-muted-foreground px-2 py-1 uppercase tracking-wider">
                Preset Rentang
              </div>
              <div className="flex flex-col gap-0.5">
                {PRESETS.map((p) => {
                  const isActive = activePreset === p.value;
                  return (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => {
                        onChange(p.value);
                        setLocalRange(undefined);
                        setOpen(false);
                      }}
                      className={cn(
                        "px-2.5 py-1.5 flex items-center justify-between text-xs w-full cursor-pointer transition-all rounded-md text-left",
                        isActive
                          ? "bg-primary/10 text-primary font-bold"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <span>{p.label}</span>
                      {isActive && <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
                    </button>
                  );
                })}
              </div>

              <div className="mt-auto pt-2 border-t border-border/40">
                <button
                  type="button"
                  onClick={handleReset}
                  className="w-full flex items-center gap-1.5 px-2.5 py-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  <History className="h-3 w-3" />
                  <span>Reset Default (24h)</span>
                </button>
              </div>
            </div>

            {/* Calendar & Actions Area */}
            <div className="flex-1 flex flex-col p-2 bg-card">
              <div className="flex justify-center py-1">
                <Calendar
                  mode="range"
                  selected={localRange}
                  onSelect={setLocalRange}
                  numberOfMonths={1}
                  disabled={{ after: today }}
                  className="text-xs relative p-0"
                  classNames={{
                    month: "relative flex flex-col gap-2",
                    button_previous: "absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors",
                    button_next: "absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors",
                    day_button: "h-8 w-8 rounded-md font-normal text-xs transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                    weekday: "text-muted-foreground rounded-md w-8 font-normal text-[10px] pb-1 text-center",
                    day: "h-8 w-8 relative p-0 text-center text-xs focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-primary/10 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md",
                    week: "flex w-full mt-1",
                  }}
                />
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/40 px-1">
                <button
                  type="button"
                  onClick={handleToday}
                  className="text-[11px] text-muted-foreground hover:text-foreground cursor-pointer px-2 py-1 rounded hover:bg-muted"
                >
                  Hari Ini
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="h-6 px-2 text-[11px] text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleApply}
                    disabled={!localRange?.from}
                    className={cn(
                      "h-6 px-2.5 text-[11px] font-medium rounded transition-colors cursor-pointer",
                      localRange?.from
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "bg-muted text-muted-foreground/50 cursor-not-allowed"
                    )}
                  >
                    Terapkan
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
