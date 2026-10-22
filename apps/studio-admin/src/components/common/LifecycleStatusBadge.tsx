import * as React from "react";
import { Badge } from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";

export type UniversalLifecycleStatus =
  | "ACTIVE"
  | "GRACE_PERIOD"
  | "RESTRICTED_READ_ONLY"
  | "SUSPENDED"
  | "REVOKED"
  | "EXPIRED"
  | "CANCELLED"
  | "TRIAL"
  | "DRAFT"
  | string;

interface LifecycleStatusBadgeProps {
  status: UniversalLifecycleStatus;
  size?: "sm" | "xs";
  className?: string;
}

export function LifecycleStatusBadge({
  status,
  size = "xs",
  className = "",
}: LifecycleStatusBadgeProps) {
  const { t } = useTranslation();
  const normalized = (status || "").toUpperCase();

  const getStatusConfig = () => {
    switch (normalized) {
      case "ACTIVE":
        return {
          label: t("license.status.active"),
          dotColor: "bg-primary",
          classes: "border-primary/30 bg-primary/10 text-primary",
        };
      case "GRACE_PERIOD":
        return {
          label: t("license.status.grace_period"),
          dotColor: "bg-amber-500 animate-pulse",
          classes: "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400",
        };
      case "RESTRICTED_READ_ONLY":
        return {
          label: t("license.status.restricted_read_only"),
          dotColor: "bg-orange-500",
          classes: "border-orange-500/40 bg-orange-500/10 text-orange-600 dark:text-orange-400",
        };
      case "SUSPENDED":
        return {
          label: t("license.status.suspended"),
          dotColor: "bg-destructive",
          classes: "border-destructive/40 bg-destructive/10 text-destructive",
        };
      case "REVOKED":
        return {
          label: t("license.status.revoked"),
          dotColor: "bg-muted-foreground",
          classes: "border-border text-muted-foreground line-through bg-muted/40",
        };
      case "EXPIRED":
        return {
          label: t("license.status.expired"),
          dotColor: "bg-destructive/80",
          classes: "border-destructive/30 bg-destructive/5 text-destructive/80",
        };
      case "PAID":
        return {
          label: t("billing.filter_paid"),
          dotColor: "bg-primary",
          classes: "border-primary/40 bg-primary/10 text-primary",
        };
      case "PENDING":
        return {
          label: t("billing.filter_pending"),
          dotColor: "bg-blue-500 animate-pulse",
          classes: "border-blue-500/40 bg-blue-500/10 text-blue-600 dark:text-blue-400",
        };
      case "OVERDUE":
        return {
          label: t("billing.filter_overdue"),
          dotColor: "bg-destructive animate-pulse",
          classes: "border-destructive/40 bg-destructive/10 text-destructive",
        };
      case "CANCELLED":
        return {
          label: t("billing.filter_cancelled"),
          dotColor: "bg-muted-foreground",
          classes: "border-border text-muted-foreground bg-muted/20",
        };
      case "TRIAL":
        return {
          label: status,
          dotColor: "bg-blue-500",
          classes: "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400",
        };
      default:
        return {
          label: status,
          dotColor: "bg-muted-foreground",
          classes: "border-border bg-muted/30 text-muted-foreground",
        };
    }
  };

  const config = getStatusConfig();
  const sizeClasses = size === "xs" ? "text-[10px] px-1.5 py-0.5 gap-1" : "text-xs px-2 py-0.5 gap-1.5";

  return (
    <Badge
      variant="outline"
      className={`inline-flex items-center font-mono font-medium rounded-sm border ${config.classes} ${sizeClasses} ${className}`}
    >
      <span className={`size-1.5 rounded-full ${config.dotColor}`} />
      <span>{config.label}</span>
    </Badge>
  );
}
