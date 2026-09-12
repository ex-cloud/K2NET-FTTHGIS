import * as React from "react";
import { createPortal } from "react-dom";
import { format } from "date-fns";
import { Calendar as CalendarIcon, ChevronDown, History } from "lucide-react";
import { Calendar, cn } from "@k2net/ui";
import type { DateRange } from "react-day-picker";

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
  return { from: new Date(to.getTime() - 60 * 60 * 1000), to };
}

function parseTimeStr(t: string): { h: number; m: number; s: number } {
  const [h = 0, m = 0, s = 0] = t.split(":").map(Number);
  return { h, m, s };
}

function PresetsSidebar({
  activePreset,
  customRelativeInput,
  setCustomRelativeInput,
  onCustomSubmit,
  onPresetSelect,
}: {
  activePreset: string | null;
  customRelativeInput: string;
  setCustomRelativeInput: (v: string) => void;
  onCustomSubmit: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onPresetSelect: (val: string) => void;
}) {
  return (
    <div className="w-[200px] shrink-0 border-r border-border/40 flex flex-col p-2 gap-px">
      <input
        type="text"
        placeholder="e.g. 2h, 30m, 7d"
        value={customRelativeInput}
        onChange={(e) => setCustomRelativeInput(e.target.value)}
        onKeyDown={onCustomSubmit}
        className="flex w-full border border-border bg-foreground/[.026] placeholder:text-muted-foreground/40 px-3 py-2 mb-2 text-xs h-7 rounded-sm focus:outline-none focus:border-border/80 transition-colors font-sans"
      />
      <div className="flex flex-col gap-px">
        {PRESETS.map((p) => {
          const isActive = activePreset === p.value;
          return (
            <label
              key={p.value}
              onClick={() => onPresetSelect(p.value)}
              className={cn(
                "px-4 py-1.5 flex items-center justify-between text-xs w-full cursor-pointer transition-all rounded-sm",
                isActive
                  ? "bg-muted text-foreground font-semibold"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              )}
            >
              <span className="flex items-center gap-2">
                {isActive && <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
                {p.label}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

function TimePickerInputs({
  fromTime,
  toTime,
  setFromTime,
  setToTime,
  onResetTime,
}: {
  fromTime: string;
  toTime: string;
  setFromTime: (t: string) => void;
  setToTime: (t: string) => void;
  onResetTime: () => void;
}) {
  const { h: fh, m: fm, s: fs } = parseTimeStr(fromTime);
  const { h: th, m: tm, s: ts } = parseTimeStr(toTime);

  const fromH = String(fh).padStart(2, "0");
  const fromM = String(fm).padStart(2, "0");
  const fromS = String(fs).padStart(2, "0");
  const toH = String(th).padStart(2, "0");
  const toM = String(tm).padStart(2, "0");
  const toS = String(ts).padStart(2, "0");

  return (
    <div className="w-full flex px-[14px] py-2 gap-2 items-center justify-between">
      <div className="flex-1 flex gap-2 font-mono">
        <div className="flex-1 flex h-7 items-center justify-center gap-0.5 rounded-sm border border-border bg-muted/20 text-xs px-2 hover:border-border/80 transition-colors">
          <input
            type="text"
            pattern="[0-23]*"
            placeholder="00"
            value={fromH}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, "").slice(0, 2);
              setFromTime(`${String(Math.min(23, parseInt(val) || 0)).padStart(2, "0")}:${fromM}:${fromS}`);
            }}
            className="w-4 p-0 text-center text-xs text-foreground bg-transparent border-none outline-none focus:ring-0"
          />
          <span className="text-muted-foreground/40">:</span>
          <input
            type="text"
            pattern="[0-59]*"
            placeholder="00"
            value={fromM}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, "").slice(0, 2);
              setFromTime(`${fromH}:${String(Math.min(59, parseInt(val) || 0)).padStart(2, "0")}:${fromS}`);
            }}
            className="w-4 p-0 text-center text-xs text-foreground bg-transparent border-none outline-none focus:ring-0"
          />
          <span className="text-muted-foreground/40">:</span>
          <input
            type="text"
            pattern="[0-59]*"
            placeholder="00"
            value={fromS}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, "").slice(0, 2);
              setFromTime(`${fromH}:${fromM}:${String(Math.min(59, parseInt(val) || 0)).padStart(2, "0")}`);
            }}
            className="w-4 p-0 text-center text-xs text-foreground bg-transparent border-none outline-none focus:ring-0"
          />
        </div>

        <div className="flex-1 flex h-7 items-center justify-center gap-0.5 rounded-sm border border-border bg-muted/20 text-xs px-2 hover:border-border/80 transition-colors">
          <input
            type="text"
            pattern="[0-23]*"
            placeholder="00"
            value={toH}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, "").slice(0, 2);
              setToTime(`${String(Math.min(23, parseInt(val) || 0)).padStart(2, "0")}:${toM}:${toS}`);
            }}
            className="w-4 p-0 text-center text-xs text-foreground bg-transparent border-none outline-none focus:ring-0"
          />
          <span className="text-muted-foreground/40">:</span>
          <input
            type="text"
            pattern="[0-59]*"
            placeholder="00"
            value={toM}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, "").slice(0, 2);
              setToTime(`${toH}:${String(Math.min(59, parseInt(val) || 0)).padStart(2, "0")}:${toS}`);
            }}
            className="w-4 p-0 text-center text-xs text-foreground bg-transparent border-none outline-none focus:ring-0"
          />
          <span className="text-muted-foreground/40">:</span>
          <input
            type="text"
            pattern="[0-59]*"
            placeholder="00"
            value={toS}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, "").slice(0, 2);
              setToTime(`${toH}:${toM}:${String(Math.min(59, parseInt(val) || 0)).padStart(2, "0")}`);
            }}
            className="w-4 p-0 text-center text-xs text-foreground bg-transparent border-none outline-none focus:ring-0"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={onResetTime}
        title="Reset times"
        className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-transparent text-muted-foreground/60 hover:bg-muted hover:text-foreground transition-colors shrink-0"
      >
        <History className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

function CalendarFooterActions({
  hasRange,
  onCopy,
  onToday,
  onApply,
}: {
  hasRange: boolean;
  onCopy: () => void;
  onToday: () => void;
  onApply: () => void;
}) {
  return (
    <div className="flex items-center justify-end gap-2 px-[14px] py-2 border-t border-border/40">
      <button
        type="button"
        onClick={onCopy}
        className="relative inline-flex items-center justify-center cursor-pointer text-center font-normal rounded-md transition-colors hover:bg-muted text-xs h-[26px] px-2.5 text-muted-foreground hover:text-foreground"
      >
        <span className="truncate">Copy range</span>
      </button>
      <button
        type="button"
        onClick={onToday}
        className="relative inline-flex items-center justify-center cursor-pointer text-center font-normal rounded-md transition-colors border border-border bg-muted/40 hover:bg-muted text-xs h-[26px] px-2.5 text-foreground"
      >
        <span className="truncate">Today</span>
      </button>
      <button
        type="button"
        onClick={onApply}
        disabled={!hasRange}
        className={cn(
          "relative inline-flex items-center justify-center cursor-pointer text-center font-medium rounded-md transition-colors text-xs h-[26px] px-2.5",
          hasRange
            ? "bg-primary text-primary-foreground hover:bg-primary/90"
            : "bg-muted/40 text-muted-foreground/50 cursor-not-allowed border border-border/40"
        )}
      >
        <span className="truncate">Apply</span>
      </button>
    </div>
  );
}

export function LogsDateRangePicker({ value, onChange }: LogsDateRangePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);

  const { preset: activePreset, range: customRange } = parseValue(value);
  const today = React.useMemo(() => new Date(), []);
  const [localRange, setLocalRange] = React.useState<DateRange | undefined>(customRange);
  const [fromTime, setFromTime] = React.useState("00:00:00");
  const [toTime, setToTime] = React.useState("23:59:59");
  const [customRelativeInput, setCustomRelativeInput] = React.useState("");
  const [coords, setCoords] = React.useState({ top: 0, left: 0 });

  const handleCustomRelativeSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const val = customRelativeInput.trim();
      const match = val.match(/^(\d+)([mhd])$/i);
      if (match) {
        const amount = parseInt(match[1]);
        const unit = match[2].toLowerCase();
        let mult = 60 * 1000;
        if (unit === "h") mult = 60 * 60 * 1000;
        if (unit === "d") mult = 24 * 60 * 60 * 1000;

        const to = new Date();
        const from = new Date(to.getTime() - amount * mult);
        onChange(`custom:${from.toISOString()}_${to.toISOString()}`);
        setOpen(false);
      }
    }
  };

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
      const popupWidth = 480;
      const popupHeight = 360;
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

  const handleCopyRange = () => {
    if (localRange?.from) {
      const from = new Date(localRange.from);
      const { h: fh, m: fm, s: fs } = parseTimeStr(fromTime);
      from.setHours(fh, fm, fs);
      const to = new Date(localRange.to || localRange.from);
      const { h: th, m: tm, s: ts } = parseTimeStr(toTime);
      to.setHours(th, tm, ts);
      navigator.clipboard.writeText(`${format(from, "yyyy-MM-dd HH:mm:ss")} → ${format(to, "yyyy-MM-dd HH:mm:ss")}`);
    }
  };

  return (
    <div className="w-full">
      <button
        ref={triggerRef}
        type="button"
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

      {open && mounted && createPortal(
        <div
          ref={contentRef}
          style={{ position: "absolute", top: `${coords.top}px`, left: `${coords.left}px` }}
          className="z-[9999] w-[480px] rounded-xl border border-border bg-card shadow-2xl overflow-hidden text-foreground font-sans text-xs"
        >
          <div className="flex bg-card">
            <PresetsSidebar
              activePreset={activePreset}
              customRelativeInput={customRelativeInput}
              setCustomRelativeInput={setCustomRelativeInput}
              onCustomSubmit={handleCustomRelativeSubmit}
              onPresetSelect={(val) => { onChange(val); setLocalRange(undefined); setOpen(false); }}
            />

            <div className="flex-1 flex flex-col">
              <TimePickerInputs
                fromTime={fromTime}
                toTime={toTime}
                setFromTime={setFromTime}
                setToTime={setToTime}
                onResetTime={() => { onChange("1h"); setCustomRelativeInput(""); }}
              />

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

              <CalendarFooterActions
                hasRange={Boolean(localRange?.from)}
                onCopy={handleCopyRange}
                onToday={handleToday}
                onApply={handleApply}
              />
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
