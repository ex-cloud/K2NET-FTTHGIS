import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useSession } from "@/lib/auth-compat";
import { getAuditEventsPaginated, type AuditQueryParams } from "@/lib/actions/gateways";
import {
  type AuditStreamEntry,
  mapAuditEventToEntry,
  mapSecurityAlertToEntry,
  mapKeycloakEventToEntry,
  mapNotificationToEntry,
  checkTimeRangeMatch,
  resolveLogTypeFromSource,
  resolveLogGroup,
  isSyntheticOrBenchmarkEntry,
} from "./audit-log-mappers";

export {
  type AuditStreamEntry,
  resolveLogTypeFromSource,
  resolveLogGroup,
};

// ─── Group Definitions ────────────────────────────────────────────────────────

export type LogGroupKey = "CORE" | "OPERATIONS" | "NETWORK" | "MESSAGING";

export const LOG_GROUPS: Record<LogGroupKey, {
  label: string;
  description: string;
  color: string;
  accentBg: string;
  types: string[];
}> = {
  CORE: {
    label: "Core System",
    description: "Kong, Keycloak, Postgres, Redis, Traefik — platform infrastructure",
    color: "text-violet-400",
    accentBg: "bg-violet-500/10",
    types: ["edge", "auth", "postgres", "redis", "traefik"],
  },
  OPERATIONS: {
    label: "Business & Operations",
    description: "AI Copilot, Task/Project Sync, Payment, Notification, Storage, Scheduler, Export",
    color: "text-sky-400",
    accentBg: "bg-sky-500/10",
    types: ["ai", "task", "audit", "notification", "storage", "export", "payment", "scheduler"],
  },
  NETWORK: {
    label: "GIS & Network",
    description: "OLT gateway, Poller SNMP, Map/Geocoding, Martin Vector Tile",
    color: "text-primary/80",
    accentBg: "bg-primary/10",
    types: ["olt", "poller", "map", "martin"],
  },
  MESSAGING: {
    label: "Messaging",
    description: "WhatsApp, SMS, Email notifications",
    color: "text-amber-400",
    accentBg: "bg-amber-500/10",
    types: ["whatsapp"],
  },
};

export function parseTimeRangeToDates(timeRange?: string): { startDate?: string; endDate?: string } {
  if (!timeRange) return {};
  if (timeRange.startsWith("custom:")) {
    const parts = timeRange.substring(7).split("_");
    if (parts.length === 2) {
      try {
        return {
          startDate: new Date(parts[0]).toISOString(),
          endDate: new Date(parts[1]).toISOString(),
        };
      } catch {
        return {};
      }
    }
  }

  let durationMs = 0;
  const match = timeRange.match(/^(\d+)([mhd])$/);
  if (match) {
    const val = parseInt(match[1], 10);
    const unit = match[2];
    if (unit === "m") durationMs = val * 60 * 1000;
    else if (unit === "h") durationMs = val * 60 * 60 * 1000;
    else if (unit === "d") durationMs = val * 24 * 60 * 60 * 1000;
  }
  if (durationMs > 0) {
    return {
      startDate: new Date(Date.now() - durationMs).toISOString(),
      endDate: new Date().toISOString(),
    };
  }
  return {};
}

// ─── Hook Options ─────────────────────────────────────────────────────────────

export interface UseAuditLogStreamOptions {
  /** When true, stops polling for new logs */
  isPaused?: boolean;
  /**
   * K2NET log type filter map.
   * If ALL values are false → no logs shown (empty state).
   * If ANY value is true  → show matching logs.
   */
  selectedTypes?: Record<string, boolean>;
  /** Optional group filter — if set, only show logs matching this group */
  selectedGroups?: Record<LogGroupKey, boolean>;
  /** Optional time range filter (relative e.g. "15m", "1h", "24h" or custom "custom:start_end") */
  timeRange?: string;
  /** Optional severity filter */
  selectedSeverities?: Record<string, boolean>;
  /** Optional tenant slug filter */
  tenantSlug?: string;
  /** Optional project ID filter */
  projectId?: string;
  /** Optional scope filter */
  scope?: string;
  /** Optional search query */
  search?: string;
  /** Impersonation only filter */
  impersonationOnly?: boolean;
  /** Include benchmark / load-test logs */
  includeBenchmark?: boolean;
  /** Page size for initial and cursor queries (default: 100) */
  pageSize?: number;
}

// ─── Pure client-side filters (kept outside the hook for testability) ─────────

interface ClientFilterInput {
  timeRange?: string;
  nowMs: number;
  includeBenchmark: boolean;
}

interface FacetFilterInput extends ClientFilterInput {
  selectedTypes: Record<string, boolean>;
  selectedGroups?: Record<LogGroupKey, boolean>;
  filterCategory: string;
}

/** Time-window + synthetic-data filter (base set used for counters & incident banner). */
function passesBaseFilter(log: AuditStreamEntry, f: ClientFilterInput): boolean {
  if (f.timeRange && !checkTimeRangeMatch(log.timestamp, f.timeRange, f.nowMs)) return false;
  return f.includeBenchmark || !isSyntheticOrBenchmarkEntry(log);
}

function applyFacetFilters(logs: AuditStreamEntry[], f: FacetFilterInput): AuditStreamEntry[] {
  const anyTypeActive = Object.values(f.selectedTypes).some(Boolean);
  const groups = f.selectedGroups;
  const anyGroupActive = groups ? Object.values(groups).some(Boolean) : false;

  return logs.filter((log) => {
    if (anyTypeActive && !f.selectedTypes[log.logType]) return false;
    if (anyGroupActive && groups && !groups[log.logGroup]) return false;
    if (f.filterCategory !== "all" && log.category && log.category !== f.filterCategory) return false;
    return passesBaseFilter(log, f);
  });
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuditLogStream(
  filterCategory: string = "all",
  options?: UseAuditLogStreamOptions
) {
  const { data: session } = useSession();
  const [logs, setLogs] = useState<AuditStreamEntry[]>([]);
  const [status, setStatus] = useState<"connecting" | "live" | "paused">("paused");
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [totalServerCount, setTotalServerCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const isPausedRef = useRef(options?.isPaused ?? true);
  const nowRef = useRef(Date.now());
  const timeRange = options?.timeRange;
  const includeBenchmark = options?.includeBenchmark ?? false;
  const tenantSlug = options?.tenantSlug;
  const projectId = options?.projectId;
  const scope = options?.scope;
  const search = options?.search;
  const pageSize = options?.pageSize ?? 100;

  useEffect(() => {
    nowRef.current = Date.now();
  }, [timeRange]);

  useEffect(() => {
    isPausedRef.current = options?.isPaused ?? true;
    setStatus(options?.isPaused ? "paused" : "live");
  }, [options?.isPaused]);

  const tokenRef = useRef(session?.accessToken);
  useEffect(() => {
    tokenRef.current = session?.accessToken;
  }, [session?.accessToken]);

  // Construct query params from current options
  const buildQueryParams = useCallback((cursor?: string): AuditQueryParams => {
    const { startDate, endDate } = parseTimeRangeToDates(timeRange);
    return {
      category: filterCategory !== "all" ? filterCategory : undefined,
      tenantSlug: tenantSlug && tenantSlug !== "all" ? tenantSlug : undefined,
      projectId: projectId || undefined,
      scope: scope && scope !== "ALL" ? scope : undefined,
      search: search || undefined,
      startDate,
      endDate,
      cursor,
      includeBenchmark,
      pageSize,
    };
  }, [filterCategory, tenantSlug, projectId, scope, search, timeRange, includeBenchmark, pageSize]);

  // Initial / Refresh Fetch
  const fetchInitialLogs = useCallback(async () => {
    const token = tokenRef.current;
    if (!token) return;
    try {
      setIsLoading(true);
      // Re-anchor the relative window ("Last 1 hour") to *now* on every fetch
      nowRef.current = Date.now();
      const headers = { Authorization: `Bearer ${token}` };
      const qParams = buildQueryParams();

      const [auditPaginatedResult, alertsResult, keycloakResult, notifyResult] = await Promise.allSettled([
        getAuditEventsPaginated(qParams),
        fetch("/api/v1/system/security/alerts", { headers, cache: "no-store" }).then(r => r.ok ? r.json() : []),
        fetch("/api/v1/system/keycloak/events", { headers, cache: "no-store" }).then(r => r.ok ? r.json() : []),
        fetch("/api/v1/observability/notification-stats", { headers, cache: "no-store" }).then(r => r.ok ? r.json() : ({} as Record<string, unknown>)),
      ]);

      const combinedLogs: AuditStreamEntry[] = [];

      if (auditPaginatedResult.status === "fulfilled") {
        const paginated = auditPaginatedResult.value;
        if (Array.isArray(paginated.data)) {
          paginated.data.forEach((e: Record<string, unknown>) => {
            combinedLogs.push(mapAuditEventToEntry(e));
          });
        }
        setHasMore(Boolean(paginated.hasMore));
        setNextCursor(paginated.nextCursor || null);
        setTotalServerCount(paginated.totalCount ?? combinedLogs.length);
      }

      // Supplementary streams for recent live view
      if (!timeRange || timeRange.endsWith("m") || timeRange === "1h" || timeRange === "24h") {
        if (alertsResult.status === "fulfilled" && Array.isArray(alertsResult.value)) {
          alertsResult.value.forEach((e: Record<string, unknown>) => {
            combinedLogs.push(mapSecurityAlertToEntry(e));
          });
        }

        if (keycloakResult.status === "fulfilled" && Array.isArray(keycloakResult.value)) {
          keycloakResult.value.forEach((e: Record<string, unknown>) => {
            combinedLogs.push(mapKeycloakEventToEntry(e));
          });
        }

        if (notifyResult.status === "fulfilled" && (notifyResult.value as Record<string, unknown>)?.recent_queue) {
          const recent = (notifyResult.value as { recent_queue?: unknown[] }).recent_queue;
          if (Array.isArray(recent)) {
            recent.forEach((mItem: unknown) => {
              combinedLogs.push(mapNotificationToEntry((mItem as Record<string, unknown>) || {}));
            });
          }
        }
      }

      // Deduplicate by ID and sort descending
      const seenIds = new Set<string>();
      const uniqueLogs: AuditStreamEntry[] = [];
      for (const item of combinedLogs) {
        if (!seenIds.has(item.id)) {
          seenIds.add(item.id);
          uniqueLogs.push(item);
        }
      }
      uniqueLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setLogs(uniqueLogs);
    } catch (err) {
      console.error("[useAuditLogStream] Failed to fetch initial logs:", err);
    } finally {
      setIsLoading(false);
    }
  }, [buildQueryParams, timeRange]);

  // Load More (Cursor Pagination for Infinite Scroll)
  const loadMore = useCallback(async () => {
    if (!hasMore || !nextCursor || isLoadingMore) return;
    try {
      setIsLoadingMore(true);
      const qParams = buildQueryParams(nextCursor);
      const paginated = await getAuditEventsPaginated(qParams);

      if (Array.isArray(paginated.data) && paginated.data.length > 0) {
        const newEntries = paginated.data.map((e: Record<string, unknown>) => mapAuditEventToEntry(e));
        setLogs((prev) => {
          const existingIds = new Set(prev.map((l) => l.id));
          const appended = [...prev];
          for (const entry of newEntries) {
            if (!existingIds.has(entry.id)) {
              existingIds.add(entry.id);
              appended.push(entry);
            }
          }
          appended.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          return appended;
        });
      }

      setHasMore(Boolean(paginated.hasMore));
      setNextCursor(paginated.nextCursor || null);
    } catch (err) {
      console.error("[useAuditLogStream] Failed to load more logs:", err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [hasMore, nextCursor, isLoadingMore, buildQueryParams]);

  // Trigger initial fetch on query/filter parameters change
  useEffect(() => {
    fetchInitialLogs();
  }, [fetchInitialLogs]);

  // Periodic polling for Live Tail (only when not paused)
  useEffect(() => {
    if (isPausedRef.current) return;
    const interval = setInterval(() => {
      if (isPausedRef.current) return;
      fetchInitialLogs();
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchInitialLogs]);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  const selectedTypes = useMemo(() => options?.selectedTypes ?? {}, [options?.selectedTypes]);
  const selectedGroups = options?.selectedGroups;

  const timeFilteredLogs = useMemo(
    () => logs.filter((log) => passesBaseFilter(log, { timeRange, nowMs: nowRef.current, includeBenchmark })),
    [logs, timeRange, includeBenchmark]
  );

  const filteredLogs = useMemo(
    () =>
      applyFacetFilters(logs, {
        timeRange,
        nowMs: nowRef.current,
        includeBenchmark,
        selectedTypes,
        selectedGroups,
        filterCategory,
      }),
    [logs, timeRange, includeBenchmark, selectedTypes, selectedGroups, filterCategory]
  );

  return {
    logs: filteredLogs,
    timeFilteredLogs,
    rawLogs: timeFilteredLogs,
    allLogs: logs,
    totalCount: totalServerCount > 0 ? Math.max(totalServerCount, timeFilteredLogs.length) : timeFilteredLogs.length,
    allTimeTotalCount: totalServerCount > 0 ? Math.max(totalServerCount, logs.length) : logs.length,
    hasAnyTypeSelected: true,
    status,
    isLoading,
    isLoadingMore,
    hasMore,
    nextCursor,
    loadMore,
    refresh: fetchInitialLogs,
    clearLogs,
  };
}
