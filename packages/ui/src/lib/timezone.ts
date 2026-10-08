export interface TimezoneOption {
  value: string;
  label: string;
  offset: string;
  region: string;
}

export const COMMON_TIMEZONES: TimezoneOption[] = [
  { value: "UTC", label: "Coordinated Universal Time", offset: "(UTC+00:00)", region: "Global" },
  { value: "Asia/Jakarta", label: "Western Indonesia Time (WIB)", offset: "(UTC+07:00)", region: "Indonesia" },
  { value: "Asia/Makassar", label: "Central Indonesia Time (WITA)", offset: "(UTC+08:00)", region: "Indonesia" },
  { value: "Asia/Jayapura", label: "Eastern Indonesia Time (WIT)", offset: "(UTC+09:00)", region: "Indonesia" },
  { value: "Asia/Singapore", label: "Singapore Standard Time", offset: "(UTC+08:00)", region: "Asia" },
  { value: "Asia/Kuala_Lumpur", label: "Malaysia Time", offset: "(UTC+08:00)", region: "Asia" },
  { value: "Asia/Bangkok", label: "Indochina Time (Bangkok)", offset: "(UTC+07:00)", region: "Asia" },
  { value: "Asia/Tokyo", label: "Japan Standard Time (JST)", offset: "(UTC+09:00)", region: "Asia" },
  { value: "Asia/Hong_Kong", label: "Hong Kong Time (HKT)", offset: "(UTC+08:00)", region: "Asia" },
  { value: "Asia/Dubai", label: "Gulf Standard Time (GST)", offset: "(UTC+04:00)", region: "Middle East" },
  { value: "Europe/London", label: "Greenwich Mean Time (London)", offset: "(UTC+00:00)", region: "Europe" },
  { value: "Europe/Paris", label: "Central European Time (Paris)", offset: "(UTC+01:00)", region: "Europe" },
  { value: "Europe/Frankfurt", label: "Central European Time (Frankfurt)", offset: "(UTC+01:00)", region: "Europe" },
  { value: "America/New_York", label: "Eastern Time (US & Canada)", offset: "(UTC-05:00)", region: "Americas" },
  { value: "America/Chicago", label: "Central Time (US & Canada)", offset: "(UTC-06:00)", region: "Americas" },
  { value: "America/Denver", label: "Mountain Time (US & Canada)", offset: "(UTC-07:00)", region: "Americas" },
  { value: "America/Los_Angeles", label: "Pacific Time (US & Canada)", offset: "(UTC-08:00)", region: "Americas" },
  { value: "Australia/Sydney", label: "Australian Eastern Time (Sydney)", offset: "(UTC+10:00)", region: "Australia" },
];

export function getBrowserTimezone(): string {
  if (typeof Intl !== "undefined" && typeof Intl.DateTimeFormat === "function") {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Jakarta";
    } catch {
      return "Asia/Jakarta";
    }
  }
  return "Asia/Jakarta";
}

export function formatTimezoneDisplay(tz: string, detectedTz?: string): string {
  if (tz === "auto" || !tz) {
    const active = detectedTz || getBrowserTimezone();
    return `Auto (${active})`;
  }
  const match = COMMON_TIMEZONES.find((item) => item.value === tz);
  if (match) {
    return match.label;
  }
  return tz;
}

export function formatDateTimeInTimezone(
  dateInput: Date | string | number,
  timezone: string = "auto",
  locale: string = "id-ID"
): string {
  try {
    const d = typeof dateInput === "object" ? dateInput : new Date(dateInput);
    if (isNaN(d.getTime())) return "—";

    const effectiveTz = timezone === "auto" || !timezone ? getBrowserTimezone() : timezone;

    return new Intl.DateTimeFormat(locale, {
      timeZone: effectiveTz,
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(d);
  } catch {
    return String(dateInput);
  }
}
