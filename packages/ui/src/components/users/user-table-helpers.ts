import {
  type UnifiedTranslateFn,
  trKey,
} from "./user-management-types";

export function resolveStatusConfig(
  statusUpper: string,
  rawStatus: string,
  t?: UnifiedTranslateFn
): { className: string; label: string } {
  if (statusUpper === "ACTIVE") {
    return {
      className: "border-primary/30 bg-primary/10 text-primary",
      label: trKey(t, "users.status_active", "Active"),
    };
  }
  if (statusUpper === "SUSPENDED") {
    return {
      className: "border-destructive/30 bg-destructive/10 text-destructive",
      label: trKey(t, "users.status_suspended", "Suspended"),
    };
  }
  if (
    statusUpper === "INVITED" ||
    statusUpper === "PENDING" ||
    statusUpper === "PENDING_ACTIVATION"
  ) {
    return {
      className: "border-border bg-muted/60 text-muted-foreground",
      label: trKey(t, "users.status_invited", "Pending"),
    };
  }
  return {
    className: "border-border bg-muted/40 text-muted-foreground",
    label: rawStatus || "Pending",
  };
}

export function formatDateTimeSafe(
  value: string | null | undefined,
  formatDate?: (d: Date) => string
): string | null {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  if (formatDate) {
    return formatDate(parsed);
  }
  return parsed.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
