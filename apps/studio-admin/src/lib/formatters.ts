/**
 * Centralized formatting utilities for Currency and Lifecycle Dates
 * Strict Zero Hardcoded strings & international formatting standards.
 */

export function formatIdr(val?: number | null): string {
  if (typeof val !== "number" || isNaN(val) || val <= 0) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  })
    .format(val)
    .replace(/\s+/g, " ");
}

/**
 * Compact IDR formatter avoiding ambiguous notations.
 * Returns standard international short scales (e.g. "Rp 12.5M", "Rp 500K", "Rp 1.5B").
 */
export function formatIdrCompact(val?: number | null): string {
  if (typeof val !== "number" || isNaN(val) || val <= 0) return "Rp 0";
  if (val >= 1_000_000_000) {
    return `Rp ${(val / 1_000_000_000).toLocaleString("en-US", { maximumFractionDigits: 1 })}B`;
  }
  if (val >= 1_000_000) {
    return `Rp ${(val / 1_000_000).toLocaleString("en-US", { maximumFractionDigits: 1 })}M`;
  }
  if (val >= 1_000) {
    return `Rp ${(val / 1_000).toLocaleString("en-US", { maximumFractionDigits: 0 })}K`;
  }
  return formatIdr(val);
}

export interface RemainingDaysResult {
  text: string;
  isExpired: boolean;
  isWarning: boolean;
}

/**
 * Formats remaining days handling negative numbers gracefully.
 * Fully supports i18n translation function `t` if provided, otherwise defaults to standard English.
 */
export function formatRemainingDays(
  days: number | null | undefined,
  t?: (key: string, params?: Record<string, string | number>) => string
): RemainingDaysResult {
  if (days == null || isNaN(days)) {
    return { text: "—", isExpired: false, isWarning: false };
  }

  if (days < 0) {
    const overdue = Math.abs(days);
    return {
      text: t ? t("billing.days_overdue", { count: overdue }) : `${overdue} days overdue`,
      isExpired: true,
      isWarning: false,
    };
  }

  if (days === 0) {
    return {
      text: t ? t("billing.expires_today") : "Expires today",
      isExpired: false,
      isWarning: true,
    };
  }

  return {
    text: t ? t("billing.days_left", { count: days }) : `${days} days left`,
    isExpired: false,
    isWarning: days <= 14,
  };
}
