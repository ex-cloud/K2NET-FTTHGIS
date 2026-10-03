import * as React from "react";
import { History, RotateCcw } from "lucide-react";
import { Calendar } from "@k2net/ui";
import type { DateRange } from "react-day-picker";
import { useTranslation } from "@k2net/i18n";
import {
  HISTORICAL_SHORTCUTS,
  type HistoricalShortcutId,
  parseTimeStr,
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

export function TimePickerInputs({
  fromTime,
  toTime,
  setFromTime,
  setToTime,
  onSetFullDay,
  onSetWorkHours,
  onResetTime,
}: {
  fromTime: string;
  toTime: string;
  setFromTime: (t: string) => void;
  setToTime: (t: string) => void;
  onSetFullDay: () => void;
  onSetWorkHours: () => void;
  onResetTime: () => void;
}) {
  const { t } = useTranslation();
  const { h: fh, m: fm, s: fs } = parseTimeStr(fromTime);
  const { h: th, m: tm, s: ts } = parseTimeStr(toTime);

  const fromH = String(fh).padStart(2, "0");
  const fromM = String(fm).padStart(2, "0");
  const fromS = String(fs).padStart(2, "0");
  const toH = String(th).padStart(2, "0");
  const toM = String(tm).padStart(2, "0");
  const toS = String(ts).padStart(2, "0");

  return (
    <div className="flex flex-col gap-2 p-2.5 border-b border-border/40 bg-muted/10 rounded-t-lg">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-muted-foreground font-sans font-medium">Start:</span>
          <div className="flex h-7 items-center justify-center gap-0.5 rounded-md border border-border bg-background text-xs px-1.5 font-mono">
            <input
              type="text"
              pattern="[0-23]*"
              value={fromH}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "").slice(0, 2);
                setFromTime(`${String(Math.min(23, parseInt(val, 10) || 0)).padStart(2, "0")}:${fromM}:${fromS}`);
              }}
              className="w-4 p-0 text-center text-xs text-foreground bg-transparent border-none outline-none"
            />
            <span className="text-muted-foreground/40">:</span>
            <input
              type="text"
              pattern="[0-59]*"
              value={fromM}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "").slice(0, 2);
                setFromTime(`${fromH}:${String(Math.min(59, parseInt(val, 10) || 0)).padStart(2, "0")}:${fromS}`);
              }}
              className="w-4 p-0 text-center text-xs text-foreground bg-transparent border-none outline-none"
            />
            <span className="text-muted-foreground/40">:</span>
            <input
              type="text"
              pattern="[0-59]*"
              value={fromS}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "").slice(0, 2);
                setFromTime(`${fromH}:${fromM}:${String(Math.min(59, parseInt(val, 10) || 0)).padStart(2, "0")}`);
              }}
              className="w-4 p-0 text-center text-xs text-foreground bg-transparent border-none outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-muted-foreground font-sans font-medium">End:</span>
          <div className="flex h-7 items-center justify-center gap-0.5 rounded-md border border-border bg-background text-xs px-1.5 font-mono">
            <input
              type="text"
              pattern="[0-23]*"
              value={toH}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "").slice(0, 2);
                setToTime(`${String(Math.min(23, parseInt(val, 10) || 0)).padStart(2, "0")}:${toM}:${toS}`);
              }}
              className="w-4 p-0 text-center text-xs text-foreground bg-transparent border-none outline-none"
            />
            <span className="text-muted-foreground/40">:</span>
            <input
              type="text"
              pattern="[0-59]*"
              value={toM}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "").slice(0, 2);
                setToTime(`${toH}:${String(Math.min(59, parseInt(val, 10) || 0)).padStart(2, "0")}:${toS}`);
              }}
              className="w-4 p-0 text-center text-xs text-foreground bg-transparent border-none outline-none"
            />
            <span className="text-muted-foreground/40">:</span>
            <input
              type="text"
              pattern="[0-59]*"
              value={toS}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "").slice(0, 2);
                setToTime(`${toH}:${toM}:${String(Math.min(59, parseInt(val, 10) || 0)).padStart(2, "0")}`);
              }}
              className="w-4 p-0 text-center text-xs text-foreground bg-transparent border-none outline-none"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-1 text-[10px]">
        <button
          type="button"
          onClick={onSetFullDay}
          className="px-2 py-0.5 rounded border border-border/70 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          {t("observability.full_day") || "Full Day (24h)"}
        </button>
        <button
          type="button"
          onClick={onSetWorkHours}
          className="px-2 py-0.5 rounded border border-border/70 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          {t("observability.working_hours") || "Work Hours (08-17)"}
        </button>
        <button
          type="button"
          onClick={onResetTime}
          title={t("observability.reset_times") || "Reset times"}
          className="p-1 rounded border border-border/70 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3 h-3" />
        </button>
      </div>
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

  return (
    <div className="flex min-h-[310px]">
      {/* Historical Shortcuts Sidebar */}
      <div className="w-[145px] shrink-0 border-r border-border/40 p-2.5 flex flex-col gap-1 bg-muted/10">
        <span className="text-[11px] font-medium text-muted-foreground px-1 pb-1 flex items-center gap-1.5">
          <History className="w-3 h-3 text-primary" />
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
              onClick={() => onShortcutSelect(s.id)}
              className="w-full text-left px-2 py-1.5 text-xs rounded-md text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors cursor-pointer"
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Calendar and Time Inputs */}
      <div className="flex-1 flex flex-col min-w-0">
        <TimePickerInputs
          fromTime={fromTime}
          toTime={toTime}
          setFromTime={setFromTime}
          setToTime={setToTime}
          onSetFullDay={() => {
            setFromTime("00:00:00");
            setToTime("23:59:59");
          }}
          onSetWorkHours={() => {
            setFromTime("08:00:00");
            setToTime("17:00:00");
          }}
          onResetTime={() => {
            setFromTime("00:00:00");
            const now = new Date();
            const h = String(now.getHours()).padStart(2, "0");
            const m = String(now.getMinutes()).padStart(2, "0");
            const s = String(now.getSeconds()).padStart(2, "0");
            setToTime(`${h}:${m}:${s}`);
          }}
        />

        <div className="flex justify-center p-2">
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
            className="text-xs relative p-0"
            classNames={{
              month: "relative flex flex-col gap-2",
              nav: "absolute top-1 inset-x-0 flex items-center justify-between w-full z-10 pointer-events-none px-1",
              button_previous: "!pointer-events-auto !cursor-pointer absolute left-2 top-2 flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors z-20",
              button_next: "!pointer-events-auto !cursor-pointer absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors z-20",
              day_button: "h-8 w-8 rounded-md font-normal text-xs transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary !cursor-pointer",
              weekday: "text-muted-foreground rounded-md w-8 font-normal text-[11px] pb-1 text-center",
              day: "h-8 w-8 relative p-0 text-center text-xs focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-primary/10 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md",
              week: "flex w-full mt-1.5",
            }}
          />
        </div>
      </div>
    </div>
  );
}
