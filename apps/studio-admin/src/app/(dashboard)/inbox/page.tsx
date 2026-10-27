import * as React from "react";
import { Inbox, RefreshCw } from "lucide-react";
import { Button, Badge, PageLayout, PageHero } from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import { usePathname, useRouter, useSearchParams } from "@/lib/navigation-compat";
import { useOrganizations } from "@/hooks/useOrganizations";
import { useLicenseOverview } from "@/hooks/useOrganizationLicenses";
import { useImpersonationCenter } from "@/hooks/useImpersonationCenter";
import { useTasksQuery, type TaskComment } from "@/hooks/useTasksQuery";
import { useSession } from "@/lib/auth-compat";
import { httpClient } from "@/lib/httpClient";
import { getBackendBaseUrl } from "@/lib/api-config";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { type QuickPill } from "@/components/inbox/inbox-types";
import { InboxQueueStream } from "@/components/inbox/InboxQueueStream";
import { InboxDetailPane } from "@/components/inbox/InboxDetailPane";
import { useInboxQueueBuilder } from "@/components/inbox/use-inbox-queue-builder";
import { useInboxKeyboardShortcuts } from "@/components/inbox/use-inbox-keyboard-shortcuts";

export default function InboxApprovalsPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  // Active filter from secondary sidebar or route
  const currentFilter = searchParams.get("filter") || (pathname.includes("my-work") ? "assigned" : "all");

  // Deep-linked selected item ID from URL query param
  const urlItemId = searchParams.get("item");

  // Local state for queue stream
  const [searchQuery, setSearchQuery] = React.useState("");
  const [quickPill, setQuickPill] = React.useState<QuickPill>("all");
  const [selectedItemId, setSelectedItemId] = React.useState<string | null>(urlItemId);
  const [mobileShowDetail, setMobileShowDetail] = React.useState<boolean>(Boolean(urlItemId));
  const [justUpdated, setJustUpdated] = React.useState(false);

  // Ref for search input keyboard focus
  const searchInputRef = React.useRef<HTMLInputElement | null>(null);

  // Data fetching from real backend services
  const { organizations, loading: loadingOrgs, refresh: refreshOrgs } = useOrganizations();
  const { data: licenseOverview, isLoading: loadingLicenses } = useLicenseOverview();
  const {
    stats: impersonationStats,
    activeSessions,
    loading: loadingImpersonation,
    refresh: refreshImpersonation,
  } = useImpersonationCenter();
  const { tasks, loading: loadingTasks, refresh: refreshTasks } = useTasksQuery();
  const isLoading = loadingOrgs || loadingLicenses || loadingImpersonation || loadingTasks;

  const handleRefreshAll = React.useCallback(
    (isSilent = false) => {
      refreshOrgs?.();
      refreshImpersonation?.();
      refreshTasks?.();
      queryClient.invalidateQueries();

      if (!isSilent) {
        toast.info(t("common.inbox_toast_refreshed"));
      }

      setJustUpdated(true);
      setTimeout(() => {
        setJustUpdated(false);
      }, 3000);
    },
    [refreshOrgs, refreshImpersonation, refreshTasks, queryClient, t]
  );

  // ── 5. Lightweight Polling (30s) ───────────────────────────────────────────
  React.useEffect(() => {
    const timer = setInterval(() => {
      handleRefreshAll(true);
    }, 30000);
    return () => clearInterval(timer);
  }, [handleRefreshAll]);

  // Current logged in user identifiers
  const userIdentifiers = React.useMemo(() => {
    return [
      session?.user?.id,
      session?.user?.email,
      session?.user?.username,
      session?.user?.name,
    ]
      .filter((u): u is string => typeof u === "string" && u.length > 0)
      .map((u) => u.toLowerCase());
  }, [session?.user]);

  // ── Queue Items Builder Hook ───────────────────────────────────────────────
  const { categoryFilteredItems } = useInboxQueueBuilder({
    organizations,
    activeSessions,
    impersonationStats,
    licenseOverview,
    tasks,
    currentFilter,
    userIdentifiers,
    t,
  });

  // ── Apply Search & Quick Pill Filters ──────────────────────────────────────
  const visibleItems = React.useMemo(() => {
    let result = categoryFilteredItems;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.subtitle.toLowerCase().includes(q) ||
          i.code.toLowerCase().includes(q) ||
          i.description.toLowerCase().includes(q)
      );
    }

    if (quickPill === "action_required") {
      result = result.filter(
        (i) => i.status !== "IN_PROGRESS" && i.status !== "RESOLVED" && i.status !== "CLOSED"
      );
    } else if (quickPill === "high_priority") {
      result = result.filter((i) => i.priority === "URGENT" || i.priority === "HIGH");
    }

    return result;
  }, [categoryFilteredItems, searchQuery, quickPill]);

  // ── 2. Deep-Linking URL State Synchronizer ─────────────────────────────────
  const handleSelectItem = React.useCallback(
    (id: string) => {
      setSelectedItemId(id);
      setMobileShowDetail(true);

      const params = new URLSearchParams(searchParams.toString());
      params.set("item", id);
      router.replace(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  const handleBackToQueue = React.useCallback(() => {
    setMobileShowDetail(false);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("item");
    router.replace(`${pathname}?${params.toString()}`);
  }, [router, pathname, searchParams]);

  // Synchronize URL query item change (e.g. browser Back/Forward navigation)
  React.useEffect(() => {
    if (urlItemId && urlItemId !== selectedItemId) {
      setSelectedItemId(urlItemId);
      setMobileShowDetail(true);
    }
  }, [urlItemId, selectedItemId]);

  // Auto-select item when data is loaded or current selection is invalid
  React.useEffect(() => {
    if (isLoading) return;

    if (visibleItems.length === 0) {
      setSelectedItemId(null);
      return;
    }

    // Keep active urlItemId if present in visibleItems
    if (urlItemId && visibleItems.some((i) => i.id === urlItemId)) {
      if (selectedItemId !== urlItemId) {
        setSelectedItemId(urlItemId);
      }
      return;
    }

    // Keep current selected item if still valid
    if (selectedItemId && visibleItems.some((i) => i.id === selectedItemId)) {
      return;
    }

    // Otherwise fallback to first item
    const firstId = visibleItems[0]?.id || null;
    setSelectedItemId(firstId);
    if (firstId) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("item", firstId);
      router.replace(`${pathname}?${params.toString()}`);
    }
  }, [isLoading, visibleItems, selectedItemId, urlItemId, router, pathname, searchParams]);

  const selectedItem = React.useMemo(() => {
    return visibleItems.find((i) => i.id === selectedItemId) || null;
  }, [visibleItems, selectedItemId]);

  // ── In-place Task Status & Priority Updates ────────────────────────────────
  const handleUpdateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      const baseUrl = getBackendBaseUrl();
      const res = await httpClient(`${baseUrl}/tasks/${taskId}`, {
        method: "PUT",
        token: session?.accessToken ?? "",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      toast.success(t("common.inbox_status_updated"));
      refreshTasks?.();
      queryClient.invalidateQueries();
    } catch {
      toast.error(t("common.inbox_toast_status_failed"));
    }
  };

  const handleUpdateTaskPriority = async (taskId: string, newPriority: string) => {
    try {
      const baseUrl = getBackendBaseUrl();
      const res = await httpClient(`${baseUrl}/tasks/${taskId}`, {
        method: "PUT",
        token: session?.accessToken ?? "",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priority: newPriority }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      toast.success(t("common.inbox_priority_updated"));
      refreshTasks?.();
      queryClient.invalidateQueries();
    } catch {
      toast.error(t("common.inbox_toast_priority_failed"));
    }
  };

  // ── 4. Action: Resolve & Advance to Next with Undo ──────────────────────────
  const handleResolveAndNext = React.useCallback(
    async (taskId: string) => {
      const currentIndex = visibleItems.findIndex((i) => i.id === taskId);
      const nextItem = visibleItems[currentIndex + 1] || visibleItems[currentIndex - 1] || null;

      try {
        const baseUrl = getBackendBaseUrl();
        const res = await httpClient(`${baseUrl}/tasks/${taskId}`, {
          method: "PUT",
          token: session?.accessToken ?? "",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "RESOLVED" }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        if (nextItem) {
          handleSelectItem(nextItem.id);
        }

        refreshTasks?.();
        queryClient.invalidateQueries();

        toast.success(t("common.inbox_toast_item_resolved"), {
          duration: 5000,
          action: {
            label: t("common.inbox_undo"),
            onClick: async () => {
              try {
                await httpClient(`${baseUrl}/tasks/${taskId}`, {
                  method: "PUT",
                  token: session?.accessToken ?? "",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ status: "TODO" }),
                });
                toast.info(t("common.inbox_toast_item_reverted"));
                refreshTasks?.();
                queryClient.invalidateQueries();
              } catch {
                // silent
              }
            },
          },
        });
      } catch {
        toast.error(t("common.inbox_toast_status_failed"));
      }
    },
    [visibleItems, session?.accessToken, handleSelectItem, refreshTasks, queryClient, t]
  );

  // ── 1. Keyboard Navigation Power-User Hook ─────────────────────────────────
  useInboxKeyboardShortcuts({
    visibleItems,
    selectedItemId,
    selectedItem,
    onSelectItem: handleSelectItem,
    onResolveAndNext: handleResolveAndNext,
    searchInputRef,
  });

  const handleCommentAdded = (comment: TaskComment) => {
    if (selectedItem && selectedItem.rawItem.type === "TASK") {
      const existing = selectedItem.rawItem.data.comments || [];
      selectedItem.rawItem.data.comments = [...existing, comment];
    }
    refreshTasks?.();
    queryClient.invalidateQueries();
  };

  const activeSectionTitle = React.useMemo(() => {
    switch (currentFilter) {
      case "approvals": return t("nav.inbox_filter_approvals");
      case "trials": return t("nav.inbox_filter_trials");
      case "licensing": return t("nav.inbox_filter_licensing");
      case "assigned": return t("nav.inbox_filter_assigned");
      case "created": return t("nav.inbox_filter_created");
      case "resolved": return t("nav.inbox_filter_resolved");
      default: return t("nav.inbox_filter_all");
    }
  }, [currentFilter, t]);

  const urgentCount = React.useMemo(() => {
    return visibleItems.filter((i) => i.priority === "URGENT").length;
  }, [visibleItems]);

  return (
    <PageLayout variant="workspace" spaceY="space-y-4">
      {/* ── Lapisan 2 Hero Canvas ────────────────────────────────────────── */}
      <PageHero
        eyebrow={t("nav.inbox_approvals")}
        title={t("common.inbox_title")}
        icon={Inbox}
        subtitle={t("common.inbox_subtitle")}
        meta={
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono text-xs">
              {visibleItems.length} {t("common.inbox_actionable_items")}
            </Badge>
            {urgentCount > 0 && (
              <Badge variant="destructive" className="font-mono text-xs">
                {urgentCount} {t("common.inbox_urgent_flag")}
              </Badge>
            )}
            {justUpdated && (
              <Badge variant="secondary" className="font-mono text-xs flex items-center gap-1.5 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                {t("common.inbox_just_updated")}
              </Badge>
            )}
          </div>
        }
        actions={
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleRefreshAll(false)}
            disabled={isLoading}
            className="h-7 px-2.5 text-xs font-medium cursor-pointer"
            title={t("common.inbox_refresh_queue")}
          >
            <RefreshCw className={cn("size-3.5 mr-1.5", isLoading && "animate-spin")} />
            {t("common.refresh")}
          </Button>
        }
      />

      {/* ── 3-Pane Split View Workspace Container ────────────────────────── */}
      <div className="border border-border/60 rounded-xl overflow-hidden bg-card/30 flex flex-col lg:flex-row h-[calc(100vh-14rem)] min-h-[600px] shadow-sm">
        {/* PANEL 2: Master Queue Stream (Hidden on mobile when detail is open) */}
        <InboxQueueStream
          items={visibleItems}
          selectedItemId={selectedItemId}
          onSelectItem={handleSelectItem}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchRef={searchInputRef}
          quickPill={quickPill}
          onQuickPillChange={setQuickPill}
          activeSectionTitle={activeSectionTitle}
          isLoading={isLoading}
          justUpdated={justUpdated}
          isMobileDetailOpen={mobileShowDetail}
          onRefresh={() => handleRefreshAll(false)}
        />

        {/* PANEL 3: Detail Inspector & Execution Pane (Full width on mobile) */}
        <div className={cn("flex-1 h-full", !mobileShowDetail && "hidden lg:flex")}>
          <InboxDetailPane
            selectedItem={selectedItem}
            onUpdateTaskStatus={handleUpdateTaskStatus}
            onUpdateTaskPriority={handleUpdateTaskPriority}
            onResolveAndNext={handleResolveAndNext}
            onCommentAdded={handleCommentAdded}
            onBackToQueue={handleBackToQueue}
          />
        </div>
      </div>
    </PageLayout>
  );
}
