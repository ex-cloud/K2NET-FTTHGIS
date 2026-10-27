import type { Organization } from "@/hooks/useOrganizations";
import type { ImpersonationSessionItem, ImpersonationStats } from "@/hooks/useImpersonationCenter";
import type { LicenseOverviewKpi } from "@/hooks/useOrganizationLicenses";
import type { Task } from "@/hooks/useTasksQuery";

export type InboxCategory = "TRIAL" | "APPROVAL" | "LICENSE" | "B2B_TICKET" | "ISSUE";

export type InboxPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type InboxRawItem =
  | { type: "TRIAL"; data: Organization }
  | { type: "APPROVAL_SESSION"; data: ImpersonationSessionItem }
  | { type: "APPROVAL_STATS"; data: ImpersonationStats }
  | { type: "LICENSE"; data: LicenseOverviewKpi }
  | { type: "TASK"; data: Task };

export interface InboxQueueItem {
  id: string;
  category: InboxCategory;
  title: string;
  subtitle: string;
  description: string;
  code: string;
  priority: InboxPriority;
  status: string;
  createdAt: string;
  organizationName?: string;
  requesterName?: string;
  assigneeName?: string;
  dueDate?: string;
  rawItem: InboxRawItem;
}

export type QuickPill = "all" | "action_required" | "high_priority";

export function formatRelativeTime(
  dateStr: string | undefined,
  t: (key: string, options?: Record<string, string | number>) => string
): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 1) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return diffMins <= 1
        ? t("common.inbox_time_just_now")
        : t("common.inbox_time_minutes_ago", { count: diffMins });
    }
    if (diffHours < 24) {
      return t("common.inbox_time_hours_ago", { count: diffHours });
    }
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) {
      return t("common.inbox_time_yesterday");
    }
    if (diffDays < 7) {
      return t("common.inbox_time_days_ago", { count: diffDays });
    }
    return d.toLocaleDateString();
  } catch {
    return "";
  }
}
