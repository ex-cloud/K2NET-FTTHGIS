import * as React from "react";
import type { Organization } from "@/hooks/useOrganizations";
import type { ImpersonationSessionItem, ImpersonationStats } from "@/hooks/useImpersonationCenter";
import type { LicenseOverviewKpi } from "@/hooks/useOrganizationLicenses";
import type { Task } from "@/hooks/useTasksQuery";
import type {
  InboxCategory,
  InboxPriority,
  InboxQueueItem,
} from "./inbox-types";

interface UseInboxQueueBuilderParams {
  organizations: Organization[] | undefined;
  activeSessions: ImpersonationSessionItem[] | undefined;
  impersonationStats: ImpersonationStats | undefined;
  licenseOverview: LicenseOverviewKpi | undefined;
  tasks: Task[] | undefined;
  currentFilter: string;
  userIdentifiers: string[];
  t: (key: string, options?: Record<string, string | number>) => string;
}

export function useInboxQueueBuilder({
  organizations,
  activeSessions,
  impersonationStats,
  licenseOverview,
  tasks,
  currentFilter,
  userIdentifiers,
  t,
}: UseInboxQueueBuilderParams) {
  const allQueueItems = React.useMemo<InboxQueueItem[]>(() => {
    const items: InboxQueueItem[] = [];

    // 1. Trial Organizations
    if (organizations && Array.isArray(organizations)) {
      organizations
        .filter((o) => o.status === "TRIAL" || o.status === "PROVISIONING")
        .forEach((org) => {
          const orgId = org.id || org.slug || "org";
          items.push({
            id: `trial-${orgId}`,
            category: "TRIAL",
            title: org.name,
            subtitle: org.status === "TRIAL" ? t("common.inbox_card2_desc") : (org.name || "Trial Organization"),
            description: org.description || "",
            code: org.name || "TRIAL",
            priority: "HIGH",
            status: org.status || "TRIAL",
            createdAt: org.createdAt || new Date().toISOString(),
            organizationName: org.name,
            requesterName: org.adminEmail || undefined,
            rawItem: { type: "TRIAL", data: org },
          });
        });
    }

    // 2. Impersonation Elevation Sessions
    if (activeSessions && activeSessions.length > 0) {
      activeSessions.forEach((s) => {
        items.push({
          id: `impersonation-${s.id}`,
          category: "APPROVAL",
          title: `${s.actorName} ➔ ${s.targetOrgName}`,
          subtitle: s.reason,
          description: s.reason,
          code: s.ticketReference || `ELEV-${s.id.slice(0, 6).toUpperCase()}`,
          priority: "URGENT",
          status: s.status,
          createdAt: s.startedAt || new Date().toISOString(),
          organizationName: s.targetOrgName,
          requesterName: s.actorEmail,
          rawItem: { type: "APPROVAL_SESSION", data: s },
        });
      });
    } else if (impersonationStats && impersonationStats.activeCount > 0) {
      items.push({
        id: "approval-impersonation-stats",
        category: "APPROVAL",
        title: t("common.inbox_card1_title"),
        subtitle: `${impersonationStats.activeCount} active sessions`,
        description: t("common.inbox_feed1_desc"),
        code: "AUTH-STEPUP-MFA",
        priority: "URGENT",
        status: "ACTIVE_MFA",
        createdAt: new Date().toISOString(),
        rawItem: { type: "APPROVAL_STATS", data: impersonationStats },
      });
    }

    // 3. License Flags
    if (licenseOverview && ((licenseOverview.gracePeriodLicenses || 0) > 0 || (licenseOverview.suspendedLicenses || 0) > 0)) {
      const graceCount = licenseOverview.gracePeriodLicenses || 0;
      const suspendedCount = licenseOverview.suspendedLicenses || 0;
      items.push({
        id: "license-alerts",
        category: "LICENSE",
        title: t("common.inbox_feed3_title"),
        subtitle: t("common.inbox_card3_desc", { expiring: graceCount, suspended: suspendedCount }),
        description: t("common.inbox_feed3_desc"),
        code: "LIC-GRACE-ALERT",
        priority: "URGENT",
        status: "GRACE_PERIOD",
        createdAt: new Date().toISOString(),
        rawItem: { type: "LICENSE", data: licenseOverview },
      });
    }

    // 4. Tasks (Engineering Issues, Plans, Projects, Docs, Ideas & B2B Tickets)
    if (tasks && Array.isArray(tasks)) {
      tasks.forEach((task) => {
        const isB2B = task.scope === "TENANT_TO_PLATFORM";
        let cat: InboxCategory = "ISSUE";
        let code = task.obsidianRef || "";

        if (isB2B) {
          cat = "B2B_TICKET";
          if (!code) code = `TKT-${task.id.slice(0, 6).toUpperCase()}`;
        } else if (task.obsidianRef) {
          if (task.obsidianRef.startsWith("PLN-")) {
            cat = "PLAN";
          } else if (task.obsidianRef.startsWith("PRJ-")) {
            cat = "PROJECT";
          } else if (task.obsidianRef.startsWith("IDEA-")) {
            cat = "IDEA";
          } else if (task.obsidianRef.startsWith("DOC-")) {
            cat = "DOC";
          } else if (task.obsidianRef.startsWith("TKT-")) {
            cat = "B2B_TICKET";
          } else {
            cat = "ISSUE";
          }
        } else if (task.type === "PROJECT") {
          cat = "PROJECT";
          code = `PRJ-${task.id.slice(0, 6).toUpperCase()}`;
        } else {
          cat = "ISSUE";
          code = `ISS-${task.id.slice(0, 6).toUpperCase()}`;
        }

        const validPriorities: InboxPriority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];
        const priority: InboxPriority = validPriorities.includes(task.priority as InboxPriority)
          ? (task.priority as InboxPriority)
          : "MEDIUM";

        const org = task.organizationId
          ? organizations?.find((o) => o.id === task.organizationId || o.slug === task.organizationId)
          : undefined;
        const orgName = org ? org.name : (isB2B ? t("common.inbox_b2b_tenant") : undefined);

        items.push({
          id: task.id,
          category: cat,
          title: task.title,
          subtitle: task.obsidianRef || (isB2B ? t("common.inbox_category_b2b") : t("common.inbox_category_issue")),
          description: task.description || "",
          code,
          priority,
          status: task.status,
          createdAt: task.createdAt,
          dueDate: task.dueDate,
          organizationName: orgName,
          requesterName: task.reporterId || task.createdBy,
          assigneeName: task.assigneeId,
          rawItem: { type: "TASK", data: task },
        });
      });
    }

    return items;
  }, [organizations, activeSessions, impersonationStats, licenseOverview, tasks, t]);

  const categoryFilteredItems = React.useMemo(() => {
    switch (currentFilter) {
      case "approvals":
        return allQueueItems.filter((i) => i.category === "APPROVAL");
      case "trials":
        return allQueueItems.filter((i) => i.category === "TRIAL");
      case "licensing":
        return allQueueItems.filter((i) => i.category === "LICENSE");
      case "assigned":
        return allQueueItems.filter((i) => {
          if (i.status === "RESOLVED" || i.status === "CLOSED") return false;
          const assignee = (i.assigneeName || "").toLowerCase();
          return assignee.length > 0 && userIdentifiers.includes(assignee);
        });
      case "created":
        return allQueueItems.filter((i) => {
          if (i.status === "RESOLVED" || i.status === "CLOSED") return false;
          const requester = (i.requesterName || "").toLowerCase();
          return requester.length > 0 && userIdentifiers.includes(requester);
        });
      case "resolved":
        return allQueueItems.filter((i) => i.status === "RESOLVED" || i.status === "CLOSED");
      case "all":
      default:
        return allQueueItems.filter((i) => i.status !== "RESOLVED" && i.status !== "CLOSED");
    }
  }, [allQueueItems, currentFilter, userIdentifiers]);

  const tabCounts = React.useMemo(() => {
    const notResolved = allQueueItems.filter((i) => i.status !== "RESOLVED" && i.status !== "CLOSED");
    return {
      all: notResolved.length,
      approvals: allQueueItems.filter((i) => i.category === "APPROVAL" && i.status !== "RESOLVED" && i.status !== "CLOSED").length,
      trials: allQueueItems.filter((i) => i.category === "TRIAL" && i.status !== "RESOLVED" && i.status !== "CLOSED").length,
      licensing: allQueueItems.filter((i) => i.category === "LICENSE" && i.status !== "RESOLVED" && i.status !== "CLOSED").length,
      assigned: notResolved.filter((i) => {
        const assignee = (i.assigneeName || "").toLowerCase();
        return assignee.length > 0 && userIdentifiers.includes(assignee);
      }).length,
      created: notResolved.filter((i) => {
        const requester = (i.requesterName || "").toLowerCase();
        return requester.length > 0 && userIdentifiers.includes(requester);
      }).length,
      resolved: allQueueItems.filter((i) => i.status === "RESOLVED" || i.status === "CLOSED").length,
    };
  }, [allQueueItems, userIdentifiers]);

  return {
    allQueueItems,
    categoryFilteredItems,
    tabCounts,
  };
}
