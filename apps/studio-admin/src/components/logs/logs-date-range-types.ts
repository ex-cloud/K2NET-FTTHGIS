import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import type { useTranslation } from "@k2net/i18n";

export const PRESET_VALUES = [
  { key: "preset_last_15m", value: "15m", fallback: "Last 15 minutes" },
  { key: "preset_last_30m", value: "30m", fallback: "Last 30 minutes" },
  { key: "preset_last_60m", value: "60m", fallback: "Last 1 hour" },
  { key: "preset_last_3h", value: "3h", fallback: "Last 3 hours" },
  { key: "preset_last_24h", value: "24h", fallback: "Last 24 hours" },
  { key: "preset_last_7d", value: "7d", fallback: "Last 7 days" },
  { key: "preset_last_14d", value: "14d", fallback: "Last 14 days" },
  { key: "preset_last_30d", value: "30d", fallback: "Last 30 days (1 mo)" },
  { key: "preset_last_60d", value: "60d", fallback: "Last 60 days (2 mo)" },
  { key: "preset_last_90d", value: "90d", fallback: "Last 90 days (Quarter)" },
];

export const HISTORICAL_SHORTCUTS = [
  { id: "today", key: "today", fallback: "Today" },
  { id: "yesterday", key: "yesterday", fallback: "Yesterday" },
  { id: "this_week", key: "this_week", fallback: "This Week" },
  { id: "last_week", key: "last_week", fallback: "Last Week" },
  { id: "this_month", key: "this_month", fallback: "This Month" },
  { id: "prev_month", key: "prev_month", fallback: "Previous Month" },
] as const;

export type HistoricalShortcutId = (typeof HISTORICAL_SHORTCUTS)[number]["id"];

export function parseValue(value: string): { preset: string | null; range: DateRange | undefined } {
  if (value.startsWith("custom:")) {
    const raw = value.substring(7);
    const parts = raw.includes("_") ? raw.split("_") : raw.split("..");
    if (parts.length === 2) {
      const from = new Date(parts[0]);
      const to = new Date(parts[1]);
      return { preset: null, range: { from, to } };
    }
  }
  const normVal = value === "1h" ? "60m" : value;
  return { preset: normVal, range: undefined };
}

export function getDisplayLabel(value: string, t: ReturnType<typeof useTranslation>["t"]): string {
  if (value.startsWith("custom:")) {
    const raw = value.substring(7);
    const parts = raw.includes("_") ? raw.split("_") : raw.split("..");
    if (parts.length === 2) {
      try {
        const from = new Date(parts[0]);
        const to = new Date(parts[1]);
        const sameYear = from.getFullYear() === to.getFullYear();
        const fromFmt = sameYear ? format(from, "MMM d, HH:mm") : format(from, "yy/MM/dd HH:mm");
        const toFmt = sameYear ? format(to, "MMM d, HH:mm") : format(to, "yy/MM/dd HH:mm");
        return `${fromFmt} → ${toFmt}`;
      } catch {
        return value;
      }
    }
  }
  const normVal = value === "1h" ? "60m" : value;
  const preset = PRESET_VALUES.find((p) => p.value === value || p.value === normVal);
  if (!preset) {
    const match = value.match(/^(\d+)([mhd])$/i);
    if (match) {
      const amount = parseInt(match[1], 10);
      const unit = match[2].toLowerCase();
      const unitName =
        unit === "m"
          ? (amount === 1 ? "minute" : "minutes")
          : unit === "h"
          ? (amount === 1 ? "hour" : "hours")
          : (amount === 1 ? "day" : "days");
      return `Last ${amount} ${unitName}`;
    }
    return value;
  }
  const transKey = `observability.${preset.key}`;
  const translated = t(transKey);
  if (!translated || translated === transKey || translated.startsWith("observability.preset_")) {
    return preset.fallback;
  }
  return translated;
}

export function getPresetRange(preset: string): { from: Date; to: Date } {
  const to = new Date();
  const norm = preset === "1h" ? "60m" : preset;
  const match = norm.match(/^(\d+)([mhd])$/i);
  if (match) {
    const amount = parseInt(match[1], 10);
    const unit = match[2].toLowerCase();
    let multiplier = 60 * 1000;
    if (unit === "h") multiplier = 60 * 60 * 1000;
    if (unit === "d") multiplier = 24 * 60 * 60 * 1000;
    return { from: new Date(to.getTime() - amount * multiplier), to };
  }
  return { from: new Date(to.getTime() - 60 * 60 * 1000), to };
}

export function getHistoricalShortcutRange(shortcut: HistoricalShortcutId): { from: Date; to: Date } {
  const now = new Date();
  switch (shortcut) {
    case "today": {
      const from = new Date(now);
      from.setHours(0, 0, 0, 0);
      return { from, to: now };
    }
    case "yesterday": {
      const from = new Date(now);
      from.setDate(now.getDate() - 1);
      from.setHours(0, 0, 0, 0);
      const to = new Date(from);
      to.setHours(23, 59, 59, 999);
      return { from, to };
    }
    case "this_week": {
      const from = new Date(now);
      const day = from.getDay();
      const diff = from.getDate() - day + (day === 0 ? -6 : 1);
      from.setDate(diff);
      from.setHours(0, 0, 0, 0);
      return { from, to: now };
    }
    case "last_week": {
      const from = new Date(now);
      const day = from.getDay();
      const diff = from.getDate() - day + (day === 0 ? -6 : 1) - 7;
      from.setDate(diff);
      from.setHours(0, 0, 0, 0);
      const to = new Date(from);
      to.setDate(from.getDate() + 6);
      to.setHours(23, 59, 59, 999);
      return { from, to };
    }
    case "this_month": {
      const from = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      return { from, to: now };
    }
    case "prev_month": {
      const from = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
      const to = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      return { from, to };
    }
  }
}

export function parseTimeStr(t: string): { h: number; m: number; s: number } {
  const [h = 0, m = 0, s = 0] = t.split(":").map(Number);
  return { h, m, s };
}

export type ParsedInputResult =
  | { type: "preset"; preset: string }
  | { type: "custom"; range: DateRange; fromTime?: string; toTime?: string }
  | null;

export function parseAnyTimeInput(raw: string): ParsedInputResult {
  if (!raw) return null;
  const trimmed = raw.trim();

  // 1. Exact relative regex: e.g. 45m, 2h, 30d, 15m, 1h, 60m
  const simpleMatch = trimmed.match(/^(\d+)\s*([mhd])$/i);
  if (simpleMatch) {
    const num = simpleMatch[1];
    const unit = simpleMatch[2].toLowerCase();
    const preset = num === "1" && unit === "h" ? "60m" : `${num}${unit}`;
    return { type: "preset", preset };
  }

  // 2. Preset names or phrases: "Last 24 hours", "Last 1 hour", "24 hours", "30 minutes", "15m", etc.
  const phraseMatch = trimmed.match(/(?:last\s+)?(\d+)\s*(minute|min|hour|hr|day)s?/i);
  if (phraseMatch) {
    const num = phraseMatch[1];
    const unitRaw = phraseMatch[2].toLowerCase();
    const unit = unitRaw.startsWith("m") ? "m" : unitRaw.startsWith("h") ? "h" : "d";
    const preset = num === "1" && unit === "h" ? "60m" : `${num}${unit}`;
    return { type: "preset", preset };
  }

  // 3. Shortcuts: today, yesterday, this week, last week, this month, prev month
  const lower = trimmed.toLowerCase();
  if (lower.includes("today")) {
    const range = getHistoricalShortcutRange("today");
    return { type: "custom", range, fromTime: "00:00:00", toTime: "23:59:59" };
  }
  if (lower.includes("yesterday")) {
    const range = getHistoricalShortcutRange("yesterday");
    return { type: "custom", range, fromTime: "00:00:00", toTime: "23:59:59" };
  }
  if (lower.includes("last week")) {
    const range = getHistoricalShortcutRange("last_week");
    return { type: "custom", range, fromTime: "00:00:00", toTime: "23:59:59" };
  }
  if (lower.includes("this week")) {
    const range = getHistoricalShortcutRange("this_week");
    return { type: "custom", range, fromTime: "00:00:00", toTime: "23:59:59" };
  }
  if (lower.includes("this month")) {
    const range = getHistoricalShortcutRange("this_month");
    return { type: "custom", range, fromTime: "00:00:00", toTime: "23:59:59" };
  }
  if (lower.includes("prev month") || lower.includes("previous month")) {
    const range = getHistoricalShortcutRange("prev_month");
    return { type: "custom", range, fromTime: "00:00:00", toTime: "23:59:59" };
  }

  // 4. ISO / custom format: custom:2026-10-02T..._2026-10-03T... or 2026-10-02T... - 2026-10-03T...
  if (trimmed.includes("custom:")) {
    const parsed = parseValue(trimmed);
    if (parsed.range) return { type: "custom", range: parsed.range };
  }

  // 5. Match dates separated by arrow or dash: e.g. "2026-10-02 13:08:00 → 2026-10-03 13:08:00"
  const sepMatch = trimmed.split(/\s*(?:→|->|\bto\b|\s-\s|_)\s*/i);
  if (sepMatch.length === 2) {
    const cleanPart1 = sepMatch[0].replace(/^[^\d\w]*/, "").replace(/^.*?\((.*)$/, "$1");
    const cleanPart2 = sepMatch[1].replace(/[^\d\w]*$/, "").replace(/\).*$/, "");
    const d1 = new Date(cleanPart1);
    const d2 = new Date(cleanPart2);
    if (!isNaN(d1.getTime()) && !isNaN(d2.getTime())) {
      return {
        type: "custom",
        range: { from: d1, to: d2 },
        fromTime: `${String(d1.getHours()).padStart(2, "0")}:${String(d1.getMinutes()).padStart(2, "0")}:${String(d1.getSeconds()).padStart(2, "0")}`,
        toTime: `${String(d2.getHours()).padStart(2, "0")}:${String(d2.getMinutes()).padStart(2, "0")}:${String(d2.getSeconds()).padStart(2, "0")}`,
      };
    }
  }

  return null;
}

