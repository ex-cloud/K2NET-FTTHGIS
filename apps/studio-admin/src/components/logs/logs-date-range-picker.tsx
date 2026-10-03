import * as React from "react";
import { createPortal } from "react-dom";
import { format } from "date-fns";
import {
  ChevronDown,
  Clock,
  CalendarRange,
  Lock,
  Copy,
  Check,
  RotateCcw,
  Calendar as CalendarIcon,
} from "lucide-react";
import { cn, ActionTooltip } from "@k2net/ui";
import type { DateRange } from "react-day-picker";
import { useTranslation } from "@k2net/i18n";
import { toast } from "sonner";
import {
  parseValue,
  getDisplayLabel,
  getPresetRange,
  getHistoricalShortcutRange,
  parseTimeStr,
  parseAnyTimeInput,
  type HistoricalShortcutId,
} from "./logs-date-range-types";
import { PresetsTabContent } from "./logs-date-range-presets-tab";
import { CustomHistoricalTabContent } from "./logs-date-range-custom-tab";

export { PRESET_VALUES, HISTORICAL_SHORTCUTS } from "./logs-date-range-types";

export interface LogsDateRangePickerProps {
  value: string;
  onChange: (value: string) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  anchorRef?: React.RefObject<HTMLElement | null>;
  customTrigger?: (open: boolean, setOpen: (open: boolean) => void) => React.ReactNode;
}

function TabButtons({
  activeTab,
  setActiveTab,
  onReset,
}: {
  activeTab: "presets" | "custom";
  setActiveTab: (t: "presets" | "custom") => void;
  onReset: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-between border-b border-border/50 bg-muted/20 p-1.5 gap-1.5">
      <div className="flex items-center gap-1 flex-1">
        <button
          type="button"
          onClick={() => setActiveTab("presets")}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 py-1 px-2 rounded-md text-xs font-medium transition-all cursor-pointer",
            activeTab === "presets"
              ? "bg-card text-foreground shadow-xs border border-border font-semibold"
              : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          )}
        >
          <Clock className="w-3 h-3 text-primary" />
          <span>{t("observability.quick_presets") || "Quick Presets"}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("custom")}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 py-1 px-2 rounded-md text-xs font-medium transition-all cursor-pointer",
            activeTab === "custom"
              ? "bg-card text-foreground shadow-xs border border-border font-semibold"
              : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          )}
        >
          <CalendarRange className="w-3 h-3 text-primary" />
          <span>{t("observability.historical") || "Historical"}</span>
        </button>
      </div>

      <ActionTooltip
        label={t("observability.reset_to_default") || "Reset time range to default (60m)"}
        side="top"
        align="end"
      >
        <button
          type="button"
          onClick={onReset}
          aria-label="Reset time range to default (60m)"
          className="flex items-center justify-center h-6.5 w-6.5 rounded-md bg-transparent hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors cursor-pointer shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5 text-primary" />
        </button>
      </ActionTooltip>
    </div>
  );
}

function FooterActions({
  previewText,
  isLiveRolling,
  copied,
  onCopy,
  onToday,
  onCancel,
  onApply,
  canApply,
}: {
  previewText: string;
  isLiveRolling: boolean;
  copied: boolean;
  onCopy: () => void;
  onToday: () => void;
  onCancel: () => void;
  onApply: () => void;
  canApply: boolean;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-between gap-2 px-3 py-2 border-t border-border/50 bg-muted/20">
      <div className="flex items-center gap-1 min-w-0">
        {isLiveRolling ? (
          <Clock className="w-2.5 h-2.5 text-primary shrink-0" />
        ) : (
          <Lock className="w-2.5 h-2.5 text-primary shrink-0" />
        )}
        <span className="text-[9px] font-mono text-muted-foreground truncate" title={previewText}>
          {previewText}
        </span>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={onCopy}
          className="inline-flex items-center gap-1 justify-center text-center font-normal rounded-md transition-colors hover:bg-muted text-xs h-6.5 px-2 text-muted-foreground hover:text-foreground cursor-pointer"
          title="Copy range string to clipboard"
        >
          {copied ? <Check className="w-3 h-3 text-primary" /> : <Copy className="w-3 h-3" />}
          <span>{copied ? "Copied" : (t("observability.copy") || "Copy")}</span>
        </button>

        <button
          type="button"
          onClick={onToday}
          className="inline-flex items-center justify-center text-center font-normal rounded-md transition-colors border border-border/70 bg-card hover:bg-muted text-xs h-6.5 px-2 text-muted-foreground hover:text-foreground cursor-pointer shadow-xs"
        >
          {t("observability.today") || "Today"}
        </button>

        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center justify-center text-center font-normal rounded-md transition-colors border border-border/70 bg-card hover:bg-muted text-xs h-6.5 px-2.5 text-muted-foreground hover:text-foreground cursor-pointer shadow-xs"
        >
          {t("observability.cancel") || "Cancel"}
        </button>

        <button
          type="button"
          onClick={onApply}
          disabled={!canApply}
          className={cn(
            "inline-flex items-center justify-center text-center font-medium rounded-md transition-colors text-xs h-6.5 px-3 cursor-pointer",
            canApply
              ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs"
              : "bg-muted text-muted-foreground/50 cursor-not-allowed border border-border/40"
          )}
        >
          {t("observability.apply_range") || "Apply"}
        </button>
      </div>
    </div>
  );
}

export function LogsDateRangePicker({
  value,
  onChange,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  anchorRef,
  customTrigger,
}: LogsDateRangePickerProps) {
  const { t } = useTranslation();
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;
  const setOpen = React.useCallback(
    (newVal: boolean | ((prev: boolean) => boolean)) => {
      if (isControlled) {
        const next = typeof newVal === "function" ? newVal(controlledOpen) : newVal;
        controlledOnOpenChange?.(next);
      } else {
        setUncontrolledOpen(newVal);
      }
    },
    [isControlled, controlledOpen, controlledOnOpenChange]
  );

  const [mounted, setMounted] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);

  const initialParsed = React.useMemo(() => parseValue(value), [value]);
  const today = React.useMemo(() => new Date(), []);

  const [activeTab, setActiveTab] = React.useState<"presets" | "custom">(
    value.startsWith("custom:") ? "custom" : "presets"
  );
  const [stagedPreset, setStagedPreset] = React.useState<string | null>(initialParsed.preset);
  const [localRange, setLocalRange] = React.useState<DateRange | undefined>(initialParsed.range);
  const [displayMonth, setDisplayMonth] = React.useState<Date>(() => {
    if (initialParsed.range?.from) return initialParsed.range.from;
    return today;
  });
  const [fromTime, setFromTime] = React.useState("00:00:00");
  const [toTime, setToTime] = React.useState("23:59:59");
  const [customRelativeInput, setCustomRelativeInput] = React.useState("");
  const [coords, setCoords] = React.useState({ top: 0, left: 0 });

  // Sync staging state whenever modal opens or value changes
  React.useEffect(() => {
    if (open) {
      const parsed = parseValue(value);
      if (value.startsWith("custom:")) {
        setActiveTab("custom");
        setStagedPreset(null);
        setLocalRange(parsed.range);
        if (parsed.range?.from) {
          setDisplayMonth(parsed.range.from);
          const fh = String(parsed.range.from.getHours()).padStart(2, "0");
          const fm = String(parsed.range.from.getMinutes()).padStart(2, "0");
          const fs = String(parsed.range.from.getSeconds()).padStart(2, "0");
          setFromTime(`${fh}:${fm}:${fs}`);
        }
        if (parsed.range?.to) {
          const th = String(parsed.range.to.getHours()).padStart(2, "0");
          const tm = String(parsed.range.to.getMinutes()).padStart(2, "0");
          const ts = String(parsed.range.to.getSeconds()).padStart(2, "0");
          setToTime(`${th}:${tm}:${ts}`);
        }
      } else {
        const currentPreset = parsed.preset || "60m";
        setActiveTab("presets");
        setStagedPreset(currentPreset);
        const presetRange = getPresetRange(currentPreset);
        setLocalRange(presetRange);
        setDisplayMonth(presetRange.from);
        const fh = String(presetRange.from.getHours()).padStart(2, "0");
        const fm = String(presetRange.from.getMinutes()).padStart(2, "0");
        const fs = String(presetRange.from.getSeconds()).padStart(2, "0");
        setFromTime(`${fh}:${fm}:${fs}`);
        const th = String(presetRange.to.getHours()).padStart(2, "0");
        const tm = String(presetRange.to.getMinutes()).padStart(2, "0");
        const ts = String(presetRange.to.getSeconds()).padStart(2, "0");
        setToTime(`${th}:${tm}:${ts}`);
      }
    }
  }, [open, value]);

  const handleTabChange = (t: "presets" | "custom") => {
    setActiveTab(t);
    if (t === "custom") {
      const parsed = parseAnyTimeInput(customRelativeInput);
      const targetPreset = parsed?.type === "preset" ? parsed.preset : stagedPreset || "60m";
      const presetRange = getPresetRange(targetPreset);
      setLocalRange(presetRange);
      setDisplayMonth(presetRange.from);
      const fh = String(presetRange.from.getHours()).padStart(2, "0");
      const fm = String(presetRange.from.getMinutes()).padStart(2, "0");
      const fs = String(presetRange.from.getSeconds()).padStart(2, "0");
      setFromTime(`${fh}:${fm}:${fs}`);
      const th = String(presetRange.to.getHours()).padStart(2, "0");
      const tm = String(presetRange.to.getMinutes()).padStart(2, "0");
      const ts = String(presetRange.to.getSeconds()).padStart(2, "0");
      setToTime(`${th}:${tm}:${ts}`);
    }
  };

  const handleStagedPresetChange = (p: string) => {
    setStagedPreset(p);
    const presetRange = getPresetRange(p);
    setLocalRange(presetRange);
    setDisplayMonth(presetRange.from);
    const fh = String(presetRange.from.getHours()).padStart(2, "0");
    const fm = String(presetRange.from.getMinutes()).padStart(2, "0");
    const fs = String(presetRange.from.getSeconds()).padStart(2, "0");
    setFromTime(`${fh}:${fm}:${fs}`);
    const th = String(presetRange.to.getHours()).padStart(2, "0");
    const tm = String(presetRange.to.getMinutes()).padStart(2, "0");
    const ts = String(presetRange.to.getSeconds()).padStart(2, "0");
    setToTime(`${th}:${tm}:${ts}`);
  };

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const updateCoords = React.useCallback(() => {
    const el = anchorRef?.current || triggerRef.current;
    if (el) {
      const rect = el.getBoundingClientRect();
      const popupWidth = 440;
      const popupHeight = 380;
      const margin = 8;
      const rawLeft = rect.left + window.scrollX;
      const maxLeft = window.innerWidth - popupWidth - margin;
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUpwards = spaceBelow < popupHeight && rect.top > popupHeight;

      setCoords({
        top: openUpwards ? rect.top + window.scrollY - popupHeight - 4 : rect.bottom + window.scrollY + 4,
        left: Math.max(margin, Math.min(rawLeft, maxLeft)),
      });
    }
  }, [anchorRef]);

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
      const anchorEl = anchorRef?.current || triggerRef.current;
      if (
        anchorEl &&
        !anchorEl.contains(target) &&
        contentRef.current &&
        !contentRef.current.contains(target)
      ) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open, anchorRef, setOpen]);

  const handleGlobalReset = () => {
    setActiveTab("presets");
    setStagedPreset("60m");
    setCustomRelativeInput("");
    const presetRange = getPresetRange("60m");
    setLocalRange(presetRange);
    setDisplayMonth(presetRange.from);
    const fh = String(presetRange.from.getHours()).padStart(2, "0");
    const fm = String(presetRange.from.getMinutes()).padStart(2, "0");
    const fs = String(presetRange.from.getSeconds()).padStart(2, "0");
    setFromTime(`${fh}:${fm}:${fs}`);
    const th = String(presetRange.to.getHours()).padStart(2, "0");
    const tm = String(presetRange.to.getMinutes()).padStart(2, "0");
    const ts = String(presetRange.to.getSeconds()).padStart(2, "0");
    setToTime(`${th}:${tm}:${ts}`);
    onChange("60m");
    setOpen(false);
    toast.success("Time range filter reset to default (Last 1 hour)");
  };

  const handleRelativeSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const parsed = parseAnyTimeInput(customRelativeInput);
      if (parsed) {
        if (parsed.type === "preset") {
          setStagedPreset(parsed.preset);
          onChange(parsed.preset);
          setOpen(false);
        } else if (parsed.type === "custom" && parsed.range.from) {
          const from = parsed.range.from;
          const to = parsed.range.to || parsed.range.from;
          onChange(`custom:${from.toISOString()}_${to.toISOString()}`);
          setOpen(false);
        }
      }
    }
  };

  const handleShortcutSelect = (id: HistoricalShortcutId) => {
    const range = getHistoricalShortcutRange(id);
    setLocalRange(range);
    setDisplayMonth(range.from);
    const fh = String(range.from.getHours()).padStart(2, "0");
    const fm = String(range.from.getMinutes()).padStart(2, "0");
    const fs = String(range.from.getSeconds()).padStart(2, "0");
    const th = String(range.to.getHours()).padStart(2, "0");
    const tm = String(range.to.getMinutes()).padStart(2, "0");
    const ts = String(range.to.getSeconds()).padStart(2, "0");
    setFromTime(`${fh}:${fm}:${fs}`);
    setToTime(`${th}:${tm}:${ts}`);
  };

  const handleApply = () => {
    if (activeTab === "presets") {
      const parsed = parseAnyTimeInput(customRelativeInput);
      const targetPreset = parsed?.type === "preset" ? parsed.preset : stagedPreset;
      if (targetPreset) {
        onChange(targetPreset);
        setOpen(false);
      } else if (parsed?.type === "custom" && parsed.range.from) {
        const from = parsed.range.from;
        const to = parsed.range.to || parsed.range.from;
        onChange(`custom:${from.toISOString()}_${to.toISOString()}`);
        setOpen(false);
      }
    } else if (activeTab === "custom" && localRange?.from) {
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

  // Build dynamic preview string
  const previewText = React.useMemo(() => {
    if (activeTab === "presets") {
      const parsed = parseAnyTimeInput(customRelativeInput);
      const targetPreset = parsed?.type === "preset" ? parsed.preset : stagedPreset;
      if (targetPreset) {
        const { from, to } = getPresetRange(targetPreset);
        const label = getDisplayLabel(targetPreset, t);
        return `⚡ ${label} (${format(from, "MMM d, HH:mm")} → ${format(to, "HH:mm")})`;
      }
    }
    if (localRange?.from) {
      const from = new Date(localRange.from);
      const { h: fh, m: fm, s: fs } = parseTimeStr(fromTime);
      from.setHours(fh, fm, fs);
      const to = new Date(localRange.to || localRange.from);
      const { h: th, m: tm, s: ts } = parseTimeStr(toTime);
      to.setHours(th, tm, ts);
      return `🔒 ${format(from, "MMM d, HH:mm:ss")} → ${format(to, "MMM d, HH:mm:ss")}`;
    }
    return "Select date range";
  }, [activeTab, stagedPreset, customRelativeInput, localRange, fromTime, toTime, t]);

  const handleCopy = () => {
    // Strip leading decorative icons (⚡, 🔒) so copied text is clean & shareable
    const cleanText = previewText.replace(/^[⚡🔒]\s*/u, "");
    navigator.clipboard.writeText(cleanText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const parsedRelative = parseAnyTimeInput(customRelativeInput);
  const canApply = activeTab === "presets"
    ? Boolean(stagedPreset || (parsedRelative && (parsedRelative.type === "preset" || parsedRelative.range.from)))
    : Boolean(localRange?.from);

  return (
    <div className={customTrigger ? "inline-flex" : "w-full"}>
      {customTrigger ? (
        customTrigger(open, setOpen)
      ) : (
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
            {value.startsWith("custom:") ? (
              <CalendarIcon className="w-3.5 h-3.5 text-primary shrink-0" />
            ) : (
              <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
            )}
            {mounted ? getDisplayLabel(value, t) : (t("observability.loading") || "Loading...")}
          </span>
          <ChevronDown
            className={cn("w-3 h-3 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")}
          />
        </button>
      )}

      {open &&
        mounted &&
        createPortal(
          <div
            ref={contentRef}
            style={{ position: "absolute", top: `${coords.top}px`, left: `${coords.left}px` }}
            className="z-[9999] w-[440px] rounded-xl border border-border bg-card shadow-2xl overflow-hidden text-foreground font-sans text-xs flex flex-col"
          >
            {/* Dedicated Tabs Header with Global Icon-Only Reset Button */}
            <TabButtons
              activeTab={activeTab}
              setActiveTab={handleTabChange}
              onReset={handleGlobalReset}
            />

            {/* Tab 1 Content: Quick Presets */}
            {activeTab === "presets" && (
              <PresetsTabContent
                stagedPreset={stagedPreset}
                setStagedPreset={handleStagedPresetChange}
                customRelativeInput={customRelativeInput}
                setCustomRelativeInput={setCustomRelativeInput}
                onRelativeSubmit={handleRelativeSubmit}
              />
            )}

            {/* Tab 2 Content: Historical */}
            {activeTab === "custom" && (
              <CustomHistoricalTabContent
                localRange={localRange}
                setLocalRange={setLocalRange}
                displayMonth={displayMonth}
                setDisplayMonth={setDisplayMonth}
                fromTime={fromTime}
                toTime={toTime}
                setFromTime={setFromTime}
                setToTime={setToTime}
                onShortcutSelect={handleShortcutSelect}
                today={today}
              />
            )}

            {/* Unified Footer Preview and Action Buttons */}
            <FooterActions
              previewText={previewText}
              isLiveRolling={activeTab === "presets"}
              copied={copied}
              onCopy={handleCopy}
              onToday={() => handleShortcutSelect("today")}
              onCancel={() => setOpen(false)}
              onApply={handleApply}
              canApply={canApply}
            />
          </div>,
          document.body
        )}
    </div>
  );
}
