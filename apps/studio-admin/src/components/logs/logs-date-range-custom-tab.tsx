import * as React from "react";
import { History, ChevronLeft, ChevronRight, Archive } from "lucide-react";
import { format } from "date-fns";
import { Calendar, cn } from "@k2net/ui";
import type { DateRange } from "react-day-picker";
import { useTranslation } from "@k2net/i18n";
import {
  HISTORICAL_SHORTCUTS,
  type HistoricalShortcutId,
  parseTimeStr,
  isColdStorageRange,
} from "./logs-date-range-types";

export interface CustomHistoricalTabContentProps {
  localRange: DateRange | undefined;
  setLocalRange: (r: DateRange | undefined) => void;
  displayMonth: Date;
  setDisplayMonth: (d: Date) => void;
  fromTime: string;
  toTime: string;
  setFromTime: (t: string) => void;
  setToTime: (t: string) => void;
  onShortcutSelect: (id: HistoricalShortcutId) => void;
  today: Date;
}

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

function MonthPickerView({
  displayMonth,
  onSelectMonth,
  onSwitchToYears,
  today,
}: {
  displayMonth: Date;
  onSelectMonth: (d: Date) => void;
  onSwitchToYears: () => void;
  today: Date;
}) {
  const currentYear = displayMonth.getFullYear();
  const selectedMonthIndex = displayMonth.getMonth();
  const maxYear = today.getFullYear();
  const maxMonth = today.getMonth();

  const handlePrevYear = () => {
    if (currentYear > 2020) {
      onSelectMonth(new Date(currentYear - 1, selectedMonthIndex, 1));
    }
  };

  const handleNextYear = () => {
    if (currentYear < maxYear) {
      onSelectMonth(new Date(currentYear + 1, selectedMonthIndex, 1));
    }
  };

  return (
    <div className="flex flex-col p-2 w-full justify-center">
      {/* Header */}
      <div className="flex items-center justify-between h-8 px-1 mb-2">
        <button
          type="button"
          onClick={handlePrevYear}
          disabled={currentYear <= 2020}
          className="flex h-6 w-6 items-center justify-center rounded-md border border-border bg-card hover:bg-muted text-foreground disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-xs"
        >
          <ChevronLeft className="w-3.5 h-3.5 text-foreground" />
        </button>

        <button
          type="button"
          onClick={onSwitchToYears}
          title="Click to choose year"
          className="text-xs font-semibold text-foreground hover:bg-muted px-2.5 py-1 rounded-md transition-colors cursor-pointer"
        >
          {currentYear}
        </button>

        <button
          type="button"
          onClick={handleNextYear}
          disabled={currentYear >= maxYear}
          className="flex h-6 w-6 items-center justify-center rounded-md border border-border bg-card hover:bg-muted text-foreground disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-xs"
        >
          <ChevronRight className="w-3.5 h-3.5 text-foreground" />
        </button>
      </div>

      {/* 12 Months Grid */}
      <div className="grid grid-cols-3 gap-1.5">
        {MONTH_NAMES.map((name, idx) => {
          const isSelected = selectedMonthIndex === idx && currentYear === displayMonth.getFullYear();
          const isDisabled = currentYear === maxYear && idx > maxMonth;

          return (
            <button
              type="button"
              key={name}
              disabled={isDisabled}
              onClick={() => onSelectMonth(new Date(currentYear, idx, 1))}
              className={cn(
                "h-7 text-xs rounded-md transition-colors font-medium flex items-center justify-center cursor-pointer",
                isSelected
                  ? "bg-foreground text-background font-semibold shadow-xs"
                  : isDisabled
                  ? "opacity-30 cursor-not-allowed text-muted-foreground"
                  : "hover:bg-muted text-foreground"
              )}
            >
              {name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function YearPickerView({
  displayMonth,
  onSelectYear,
  today,
}: {
  displayMonth: Date;
  onSelectYear: (year: number) => void;
  today: Date;
}) {
  const currentYear = displayMonth.getFullYear();
  const [decadeStart, setDecadeStart] = React.useState(() => Math.floor(currentYear / 12) * 12);
  const maxYear = today.getFullYear();

  const years = Array.from({ length: 12 }, (_, i) => decadeStart + i);

  return (
    <div className="flex flex-col p-2 w-full justify-center">
      {/* Header */}
      <div className="flex items-center justify-between h-8 px-1 mb-2">
        <button
          type="button"
          onClick={() => setDecadeStart((d) => Math.max(2010, d - 12))}
          disabled={decadeStart <= 2010}
          className="flex h-6 w-6 items-center justify-center rounded-md border border-border bg-card hover:bg-muted text-foreground disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-xs"
        >
          <ChevronLeft className="w-3.5 h-3.5 text-foreground" />
        </button>

        <span className="text-xs font-semibold text-foreground px-2.5 py-1">
          {decadeStart} - {decadeStart + 11}
        </span>

        <button
          type="button"
          onClick={() => setDecadeStart((d) => d + 12)}
          disabled={decadeStart + 11 >= maxYear}
          className="flex h-6 w-6 items-center justify-center rounded-md border border-border bg-card hover:bg-muted text-foreground disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-xs"
        >
          <ChevronRight className="w-3.5 h-3.5 text-foreground" />
        </button>
      </div>

      {/* 12 Years Grid */}
      <div className="grid grid-cols-3 gap-1.5">
        {years.map((y) => {
          const isSelected = y === currentYear;
          const isDisabled = y > maxYear;

          return (
            <button
              type="button"
              key={y}
              disabled={isDisabled}
              onClick={() => onSelectYear(y)}
              className={cn(
                "h-7 text-xs rounded-md transition-colors font-medium flex items-center justify-center cursor-pointer",
                isSelected
                  ? "bg-foreground text-background font-semibold shadow-xs"
                  : isDisabled
                  ? "opacity-30 cursor-not-allowed text-muted-foreground"
                  : "hover:bg-muted text-foreground"
              )}
            >
              {y}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function TimePickerInputs({
  localRange,
  fromTime,
  toTime,
  setFromTime,
  setToTime,
}: {
  localRange?: DateRange;
  fromTime: string;
  toTime: string;
  setFromTime: (t: string) => void;
  setToTime: (t: string) => void;
}) {
  const { h: fh, m: fm, s: fs } = parseTimeStr(fromTime);
  const { h: th, m: tm, s: ts } = parseTimeStr(toTime);

  const fromH = String(fh).padStart(2, "0");
  const fromM = String(fm).padStart(2, "0");
  const fromS = String(fs).padStart(2, "0");
  const toH = String(th).padStart(2, "0");
  const toM = String(tm).padStart(2, "0");
  const toS = String(ts).padStart(2, "0");

  const fromDateLabel = localRange?.from ? format(localRange.from, "MMM d") : "Start";
  const toDateLabel = localRange?.to
    ? format(localRange.to, "MMM d")
    : localRange?.from
    ? format(localRange.from, "MMM d")
    : "End";

  // Calculate duration label
  const durationLabel = React.useMemo(() => {
    if (!localRange?.from) return null;
    const fromD = new Date(localRange.from);
    fromD.setHours(fh, fm, fs, 0);
    const toD = new Date(localRange.to || localRange.from);
    toD.setHours(th, tm, ts, 999);
    const diffMs = toD.getTime() - fromD.getTime();
    if (diffMs <= 0) return null;
    const diffHrs = Math.round(diffMs / (3600 * 1000));
    if (diffHrs >= 24) {
      const days = Math.round(diffHrs / 24);
      return days === 1 ? "24h" : `${days}d`;
    }
    if (diffHrs >= 1) return `${diffHrs}h`;
    const diffMins = Math.round(diffMs / (60 * 1000));
    return `${diffMins}m`;
  }, [localRange, fh, fm, fs, th, tm, ts]);

  return (
    <div className="flex items-center justify-between gap-1.5 p-2 border-groove-b bg-muted/10">
      {/* Start DateTime Group */}
      <div className="flex items-center gap-1 min-w-0">
        <span className="text-[10px] font-semibold text-foreground px-1.5 py-0.5 rounded bg-muted/60 border border-border/60 shrink-0 font-mono">
          {fromDateLabel}
        </span>
        <div className="flex h-7 items-center justify-center gap-0.5 rounded-md border border-border/80 bg-card text-xs px-1 font-mono shadow-xs">
          <input
            type="text"
            pattern="[0-23]*"
            value={fromH}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, "").slice(0, 2);
              setFromTime(`${String(Math.min(23, parseInt(val, 10) || 0)).padStart(2, "0")}:${fromM}:${fromS}`);
            }}
            className="w-4 p-0 text-center text-xs text-foreground bg-transparent border-none outline-none font-semibold"
          />
          <span className="text-muted-foreground/50">:</span>
          <input
            type="text"
            pattern="[0-59]*"
            value={fromM}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, "").slice(0, 2);
              setFromTime(`${fromH}:${String(Math.min(59, parseInt(val, 10) || 0)).padStart(2, "0")}:${fromS}`);
            }}
            className="w-4 p-0 text-center text-xs text-foreground bg-transparent border-none outline-none font-semibold"
          />
          <span className="text-muted-foreground/50">:</span>
          <input
            type="text"
            pattern="[0-59]*"
            value={fromS}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, "").slice(0, 2);
              setFromTime(`${fromH}:${fromM}:${String(Math.min(59, parseInt(val, 10) || 0)).padStart(2, "0")}`);
            }}
            className="w-4 p-0 text-center text-xs text-foreground bg-transparent border-none outline-none font-semibold"
          />
        </div>
      </div>

      <span className="text-muted-foreground/50 text-xs font-mono shrink-0">→</span>

      {/* End DateTime Group */}
      <div className="flex items-center gap-1 min-w-0">
        <span className="text-[10px] font-semibold text-foreground px-1.5 py-0.5 rounded bg-muted/60 border border-border/60 shrink-0 font-mono">
          {toDateLabel}
        </span>
        <div className="flex h-7 items-center justify-center gap-0.5 rounded-md border border-border/80 bg-card text-xs px-1 font-mono shadow-xs">
          <input
            type="text"
            pattern="[0-23]*"
            value={toH}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, "").slice(0, 2);
              setToTime(`${String(Math.min(23, parseInt(val, 10) || 0)).padStart(2, "0")}:${toM}:${toS}`);
            }}
            className="w-4 p-0 text-center text-xs text-foreground bg-transparent border-none outline-none font-semibold"
          />
          <span className="text-muted-foreground/50">:</span>
          <input
            type="text"
            pattern="[0-59]*"
            value={toM}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, "").slice(0, 2);
              setToTime(`${toH}:${String(Math.min(59, parseInt(val, 10) || 0)).padStart(2, "0")}:${toS}`);
            }}
            className="w-4 p-0 text-center text-xs text-foreground bg-transparent border-none outline-none font-semibold"
          />
          <span className="text-muted-foreground/50">:</span>
          <input
            type="text"
            pattern="[0-59]*"
            value={toS}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, "").slice(0, 2);
              setToTime(`${toH}:${toM}:${String(Math.min(59, parseInt(val, 10) || 0)).padStart(2, "0")}`);
            }}
            className="w-4 p-0 text-center text-xs text-foreground bg-transparent border-none outline-none font-semibold"
          />
        </div>
      </div>

      {durationLabel && (
        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-muted/60 text-muted-foreground border border-border/60 shrink-0 font-semibold">
          {durationLabel}
        </span>
      )}
    </div>
  );
}

export function CustomHistoricalTabContent({
  localRange,
  setLocalRange,
  displayMonth,
  setDisplayMonth,
  fromTime,
  toTime,
  setFromTime,
  setToTime,
  onShortcutSelect,
  today,
}: CustomHistoricalTabContentProps) {
  const { t } = useTranslation();
  const [viewMode, setViewMode] = React.useState<"days" | "months" | "years">("days");

  const isCold = React.useMemo(() => {
    if (!localRange?.from) return false;
    const to = localRange.to || localRange.from;
    return isColdStorageRange(`custom:${localRange.from.toISOString()}_${to.toISOString()}`);
  }, [localRange]);

  const handleShortcutClick = (id: HistoricalShortcutId) => {
    setViewMode("days");
    onShortcutSelect(id);
  };

  return (
    <div className="flex min-h-[300px]">
      {/* Historical Shortcuts Sidebar */}
      <div className="w-[140px] shrink-0 border-groove-r p-2 flex flex-col gap-1 bg-muted/10 select-none">
        <span className="text-[10px] font-bold text-muted-foreground px-1 pb-1 flex items-center gap-1.5 uppercase tracking-wider">
          <History className="w-3 h-3 text-muted-foreground" />
          <span>Shortcuts</span>
        </span>
        {HISTORICAL_SHORTCUTS.map((s) => {
          const transKey = `observability.${s.key}`;
          const trans = t(transKey);
          const label = !trans || trans === transKey ? s.fallback : trans;
          return (
            <button
              type="button"
              key={s.id}
              onClick={() => handleShortcutClick(s.id)}
              className="w-full text-left px-2 py-1.5 text-xs rounded-md transition-colors cursor-pointer truncate font-normal text-muted-foreground hover:bg-muted/80 hover:text-foreground"
            >
              <span className="truncate">{label}</span>
            </button>
          );
        })}
      </div>

      {/* Calendar and Time Inputs */}
      <div className="flex-1 flex flex-col min-w-0">
        <TimePickerInputs
          localRange={localRange}
          fromTime={fromTime}
          toTime={toTime}
          setFromTime={setFromTime}
          setToTime={setToTime}
        />

        {isCold && (
          <div className="px-2.5 py-1 bg-primary/10 border-b border-primary/20 flex items-center justify-between text-[10px] text-primary">
            <div className="flex items-center gap-1.5 font-medium">
              <Archive className="w-3 h-3 text-primary shrink-0" />
              <span>Cold Storage Archive (&gt;90d) • S3 WORM Lock</span>
            </div>
            <span className="font-mono text-[9px] text-muted-foreground">MinIO S3</span>
          </div>
        )}

        <div className="flex justify-center p-2 flex-1 items-center w-full">
          {viewMode === "years" ? (
            <YearPickerView
              displayMonth={displayMonth}
              onSelectYear={(y) => {
                setDisplayMonth(new Date(y, displayMonth.getMonth(), 1));
                setViewMode("months");
              }}
              today={today}
            />
          ) : viewMode === "months" ? (
            <MonthPickerView
              displayMonth={displayMonth}
              onSelectMonth={(m) => {
                setDisplayMonth(m);
                setViewMode("days");
              }}
              onSwitchToYears={() => setViewMode("years")}
              today={today}
            />
          ) : (
            <Calendar
              mode="range"
              month={displayMonth}
              onMonthChange={setDisplayMonth}
              startMonth={new Date(2024, 0, 1)}
              endMonth={today}
              selected={localRange}
              onSelect={setLocalRange}
              numberOfMonths={1}
              disabled={{ after: today }}
              className="text-xs relative p-0 w-full flex justify-center"
              components={{
                MonthCaption: () => (
                  <div className="flex items-center justify-center h-8">
                    <button
                      type="button"
                      onClick={() => setViewMode("months")}
                      title="Click to choose month and year"
                      className="text-xs font-semibold text-foreground hover:bg-muted px-2.5 py-1 rounded-md transition-colors cursor-pointer"
                    >
                      {format(displayMonth, "MMMM yyyy")}
                    </button>
                  </div>
                ),
                Chevron: ({ orientation }) =>
                  orientation === "left" ? (
                    <ChevronLeft className="w-3.5 h-3.5 text-foreground" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-foreground" />
                  ),
              }}
              classNames={{
                months: "w-full flex justify-center",
                month: "relative flex flex-col gap-2 w-full max-w-[270px] items-center",
                month_caption: "flex justify-center items-center w-full h-8 relative",
                nav: "absolute top-0 inset-x-0 flex items-center justify-between w-full h-8 z-10 pointer-events-none px-0.5",
                button_previous: "!pointer-events-auto !cursor-pointer flex h-6 w-6 items-center justify-center rounded-md border border-border bg-card hover:bg-muted text-foreground shadow-xs transition-colors z-20",
                button_next: "!pointer-events-auto !cursor-pointer flex h-6 w-6 items-center justify-center rounded-md border border-border bg-card hover:bg-muted text-foreground shadow-xs transition-colors z-20",
                month_grid: "w-full border-collapse mt-2",
                weekdays: "flex w-full justify-between mb-1",
                weekday: "text-muted-foreground/70 rounded w-8 font-medium text-[10px] pb-1 text-center shrink-0",
                week: "flex w-full justify-between mt-1",
                day: "h-7.5 w-8 relative p-0 text-center text-xs focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-muted/50 first:[&:has([aria-selected])]:rounded-l last:[&:has([aria-selected])]:rounded-r shrink-0",
                day_button: "h-7.5 w-8 rounded-md font-normal text-xs transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground/30 !cursor-pointer",
                range_start: "day-range-start [&>button]:rounded-md [&>button]:!bg-foreground [&>button]:!text-background [&>button]:font-bold",
                range_end: "day-range-end [&>button]:rounded-md [&>button]:!bg-foreground [&>button]:!text-background [&>button]:font-bold",
                range_middle: "[&>button]:rounded-none [&>button]:!bg-muted/80 [&>button]:!text-foreground",
                today: "[&>button]:border [&>button]:border-foreground/40 [&>button]:font-bold",
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
