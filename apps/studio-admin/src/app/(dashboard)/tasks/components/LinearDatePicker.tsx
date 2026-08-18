"use client";

import React, { useState, useMemo } from "react";
import {
  Calendar,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from "@k2net/ui";
import {
  Calendar as CalendarIcon,
  Target as TargetIcon,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type DateGranularity = "Day" | "Month" | "Quarter" | "Half-year" | "Year";

interface LinearDatePickerProps {
  type: "start" | "target" | "due";
  value?: string; // YYYY-MM-DD or ISO string
  onChange: (dateStr: string | undefined) => void;
  referenceDate?: string; // e.g. for target picker, referenceDate is startDate
  className?: string;
  buttonClassName?: string;
}

const MONTH_NAMES_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

export function LinearDatePicker({
  type,
  value,
  onChange,
  referenceDate,
  className,
  buttonClassName,
}: LinearDatePickerProps) {
  const [open, setOpen] = useState(false);
  const [granularity, setGranularity] = useState<DateGranularity>("Day");
  const [textInput, setTextInput] = useState("");

  // Parse initial selected date
  const parsedSelectedDate = useMemo(() => {
    if (!value) return null;
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }, [value]);

  // Current viewing year for Month/Quarter/Year tabs
  const [viewYear, setViewYear] = useState(() => {
    if (parsedSelectedDate) return parsedSelectedDate.getFullYear();
    return new Date().getFullYear();
  });

  // When open changes, sync viewYear to selected date or today
  React.useEffect(() => {
    if (open) {
      if (parsedSelectedDate) {
        setViewYear(parsedSelectedDate.getFullYear());
      } else {
        setViewYear(new Date().getFullYear());
      }
      setTextInput("");
    }
  }, [open, parsedSelectedDate]);

  // Date selection handler
  const handleSelectDate = (dateStr: string) => {
    onChange(dateStr);
    setOpen(false);
  };

  // Text input submit handler
  const handleTextInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const val = textInput.trim().toLowerCase();
      if (!val) return;

      const now = new Date();
      if (val === "today") {
        handleSelectDate(now.toISOString().split("T")[0]);
      } else if (val === "tomorrow") {
        now.setDate(now.getDate() + 1);
        handleSelectDate(now.toISOString().split("T")[0]);
      } else if (val === "next week") {
        now.setDate(now.getDate() + 7);
        handleSelectDate(now.toISOString().split("T")[0]);
      } else if (val === "next month") {
        now.setMonth(now.getMonth() + 1);
        handleSelectDate(now.toISOString().split("T")[0]);
      } else if (val.startsWith("q1")) {
        handleSelectDate(`${now.getFullYear()}-03-31`);
      } else if (val.startsWith("q2")) {
        handleSelectDate(`${now.getFullYear()}-06-30`);
      } else if (val.startsWith("q3")) {
        handleSelectDate(`${now.getFullYear()}-09-30`);
      } else if (val.startsWith("q4")) {
        handleSelectDate(`${now.getFullYear()}-12-31`);
      } else {
        const parsed = new Date(val);
        if (!isNaN(parsed.getTime())) {
          handleSelectDate(parsed.toISOString().split("T")[0]);
        }
      }
    }
  };

  // Label display
  const displayLabel = useMemo(() => {
    if (!value) {
      if (type === "start") return "Start";
      if (type === "target") return "Target";
      return "Due date";
    }
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;
    return d.toLocaleDateString("id-ID", { month: "short", day: "numeric", year: "numeric" });
  }, [value, type]);

  const Icon = type === "target" ? TargetIcon : CalendarIcon;

  return (
    <div className={cn("inline-flex items-center", className)}>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer select-none",
              value
                ? type === "target"
                  ? "bg-amber-500/10 border-amber-500/40 text-amber-500 font-semibold"
                  : "bg-primary/10 border-primary/40 text-primary font-semibold"
                : "bg-muted/40 hover:bg-muted/80 text-foreground border-border/50",
              buttonClassName
            )}
          >
            <Icon className="w-3.5 h-3.5 shrink-0 opacity-80" />
            <span>{displayLabel}</span>
            {value && (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(undefined);
                }}
                className="ml-1 p-0.5 rounded hover:bg-muted/60 text-muted-foreground hover:text-foreground"
                title="Clear date"
              >
                <X className="w-3 h-3" />
              </span>
            )}
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="start"
          sideOffset={6}
          className="w-[280px] p-3 bg-popover/95 backdrop-blur-xl border border-border/80 rounded-2xl shadow-2xl z-[1000] text-xs animate-in fade-in-0 zoom-in-95"
        >
          {/* Header Title */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-border/40">
            <span className="font-semibold text-foreground text-xs capitalize">
              {type === "start" ? "Start date" : type === "target" ? "Target date" : "Due date"}
            </span>
            {value && (
              <button
                type="button"
                onClick={() => handleSelectDate("")}
                className="text-[11px] text-muted-foreground hover:text-destructive transition-colors font-medium cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {/* Quick Input Box */}
          <div className="mb-2.5">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={handleTextInputKeyDown}
              placeholder="Try: May 2027, Q4, 05/20/2027"
              className="w-full px-2.5 py-1.5 text-xs bg-muted/30 border border-border/60 rounded-lg text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/60 focus:bg-muted/50 transition-colors"
            />
          </div>

          {/* Granularity Tabs (Linear Standard) */}
          <div className="flex items-center justify-between p-0.5 bg-muted/40 rounded-lg mb-2.5 border border-border/30">
            {(["Day", "Month", "Quarter", "Half-year", "Year"] as DateGranularity[]).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setGranularity(tab)}
                className={cn(
                  "flex-1 py-1 text-[11px] font-medium rounded-md transition-all text-center cursor-pointer",
                  granularity === tab
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* ── View 1: Day Calendar (Using Shared @k2net/ui Calendar Component) ──────── */}
          {granularity === "Day" && (
            <div className="flex justify-center">
              <Calendar
                mode="single"
                selected={parsedSelectedDate || undefined}
                onSelect={(date) => {
                  if (date) {
                    const dStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
                    handleSelectDate(dStr);
                  }
                }}
                className="p-0 border-0 shadow-none bg-transparent"
              />
            </div>
          )}

          {/* ── View 2: Month Picker ────────────────────────────────────────── */}
          {granularity === "Month" && (
            <div>
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="font-semibold text-foreground text-xs">{viewYear}</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setViewYear((y) => y - 1)}
                    className="p-1 rounded-md hover:bg-muted/60 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewYear((y) => y + 1)}
                    className="p-1 rounded-md hover:bg-muted/60 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-1.5 text-center">
                {MONTH_NAMES_SHORT.map((mShort, idx) => {
                  const dStr = `${viewYear}-${String(idx + 1).padStart(2, "0")}-01`;
                  const isCurrentMonthSelected =
                    parsedSelectedDate &&
                    parsedSelectedDate.getFullYear() === viewYear &&
                    parsedSelectedDate.getMonth() === idx;

                  return (
                    <button
                      key={mShort}
                      type="button"
                      onClick={() => handleSelectDate(dStr)}
                      className={cn(
                        "py-2 rounded-lg text-xs font-medium transition-all cursor-pointer",
                        isCurrentMonthSelected
                          ? "bg-primary text-primary-foreground font-bold shadow-xs"
                          : "text-foreground hover:bg-muted/60"
                      )}
                    >
                      {mShort}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── View 3: Quarter Picker ──────────────────────────────────────── */}
          {granularity === "Quarter" && (
            <div>
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="font-semibold text-foreground text-xs">{viewYear} Quarters</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Q1 (Jan - Mar)", endMonth: "03-31" },
                  { label: "Q2 (Apr - Jun)", endMonth: "06-30" },
                  { label: "Q3 (Jul - Sep)", endMonth: "09-30" },
                  { label: "Q4 (Oct - Dec)", endMonth: "12-31" },
                ].map((q, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectDate(`${viewYear}-${q.endMonth}`)}
                    className="p-2 rounded-xl border border-border/50 hover:border-primary/50 bg-card hover:bg-muted/40 text-left transition-all cursor-pointer"
                  >
                    <span className="font-semibold text-foreground block text-xs">Q{idx + 1}</span>
                    <span className="text-[10px] text-muted-foreground">{q.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── View 4: Half-year Picker ─────────────────────────────────────── */}
          {granularity === "Half-year" && (
            <div>
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="font-semibold text-foreground text-xs">{viewYear} Half-years</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "H1 (Jan - Jun)", endMonth: "06-30" },
                  { label: "H2 (Jul - Dec)", endMonth: "12-31" },
                ].map((h, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectDate(`${viewYear}-${h.endMonth}`)}
                    className="p-2 rounded-xl border border-border/50 hover:border-primary/50 bg-card hover:bg-muted/40 text-left transition-all cursor-pointer"
                  >
                    <span className="font-semibold text-foreground block text-xs">H{idx + 1}</span>
                    <span className="text-[10px] text-muted-foreground">{h.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── View 5: Year Picker ─────────────────────────────────────────── */}
          {granularity === "Year" && (
            <div>
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="font-semibold text-foreground text-xs">Select Year</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 text-center">
                {[2025, 2026, 2027, 2028, 2029, 2030].map((yr) => (
                  <button
                    key={yr}
                    type="button"
                    onClick={() => handleSelectDate(`${yr}-12-31`)}
                    className={cn(
                      "py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                      viewYear === yr
                        ? "bg-primary text-primary-foreground font-bold shadow-xs"
                        : "text-foreground hover:bg-muted/60"
                    )}
                  >
                    {yr}
                  </button>
                ))}
              </div>
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
