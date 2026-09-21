import { useState, useMemo } from "react";
import { 
  RotateCcw,
  Loader2,
  FolderKanban
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SecurityAuditItem } from "../recent-operations-types";
import { SecurityAuditLogDetailModal } from "../SecurityAuditLogDetailModal";
import { formatActionDisplay } from "../SecurityAuditModalUtils";
import { useOverviewTableControls, type FilterPillOption } from "../use-overview-table-controls";
import { OverviewTabToolbar } from "../OverviewTabToolbar";
import { OverviewSortableHeader } from "../OverviewSortableHeader";
import { SecurityAuditContextMenu } from "../OverviewContextMenu";

interface SecurityAuditTabProps {
  items: SecurityAuditItem[];
  loading: boolean;
}

function getSeverityWeight(severity?: string): number {
  const u = (severity ?? "").toUpperCase();
  if (u === "CRITICAL") return 3;
  if (u === "WARNING" || u === "WARN") return 2;
  return 1;
}

function compareAuditItems(a: SecurityAuditItem, b: SecurityAuditItem, field: string, dir: "asc" | "desc"): number {
  if (field === "severity") {
    const diff = getSeverityWeight(a.severity) - getSeverityWeight(b.severity);
    return dir === "asc" ? diff : -diff;
  }
  const map: Record<string, string> = {
    timestamp: a.rawTimestamp || a.timestamp || "",
    actor: a.actor || a.rawActor || "",
    targetTenant: a.targetTenant || a.tenantSlug || "",
    action: a.action || a.rawAction || "",
  };
  const mapB: Record<string, string> = {
    timestamp: b.rawTimestamp || b.timestamp || "",
    actor: b.actor || b.rawActor || "",
    targetTenant: b.targetTenant || b.tenantSlug || "",
    action: b.action || b.rawAction || "",
  };
  const valA = map[field] ?? "";
  const valB = mapB[field] ?? "";
  if (valA < valB) return dir === "asc" ? -1 : 1;
  if (valA > valB) return dir === "asc" ? 1 : -1;
  return 0;
}

function getSeverityMeta(severity: string) {
  const s = (severity ?? "").toUpperCase();
  if (s === "CRITICAL")
    return {
      emoji: "🔴",
      label: "CRITICAL",
      badge: "bg-rose-500/15 text-rose-400 border-rose-500/30",
      row: "hover:bg-rose-500/5",
      dot: "bg-rose-500",
    };
  if (s === "WARNING" || s === "WARN")
    return {
      emoji: "🟡",
      label: "WARNING",
      badge: "bg-amber-500/15 text-amber-400 border-amber-500/30",
      row: "hover:bg-amber-500/5",
      dot: "bg-amber-400",
    };
  return {
    emoji: "🔵",
    label: "INFO",
    badge: "bg-sky-500/15 text-sky-400 border-sky-500/30",
    row: "hover:bg-card/90",
    dot: "bg-sky-400",
  };
}

/** Format actor: split human name and email cleanly */
function formatActor(actor: string): { main: string; sub?: string } {
  if (!actor) return { main: "System Ingress" };
  
  const match = actor.match(/^([^(]+)\(([^)]+)\)$/);
  if (match) {
    return { main: match[1].trim(), sub: match[2].trim() };
  }
  if (actor.includes("@")) {
    const parts = actor.split("@");
    return { main: parts[0], sub: `@${parts[1]}` };
  }
  if (actor.startsWith("token-") || actor.startsWith("API Token")) {
    return { main: "API Token", sub: actor.replace(/^token-|^API Token\s*/, "") };
  }
  if (actor.startsWith("session-")) {
    return { main: "Web Session", sub: actor.replace("session-", "") };
  }
  return { main: actor };
}

export function SecurityAuditTab({ items, loading }: SecurityAuditTabProps) {
  const [selectedLog, setSelectedLog] = useState<SecurityAuditItem | null>(null);

  // Dynamic filter pill options with real counts
  const filterOptions = useMemo<FilterPillOption[]>(() => {
    const criticalCount = items.filter((a) => (a.severity ?? "").toUpperCase() === "CRITICAL").length;
    const warningCount = items.filter((a) => {
      const s = (a.severity ?? "").toUpperCase();
      return s === "WARNING" || s === "WARN";
    }).length;
    const infoCount = items.filter((a) => {
      const s = (a.severity ?? "").toUpperCase();
      return s !== "CRITICAL" && s !== "WARNING" && s !== "WARN";
    }).length;

    return [
      { id: "ALL", label: "Semua", count: items.length },
      { id: "CRITICAL", label: "Critical", count: criticalCount, badgeVariant: "critical", dotColor: "bg-rose-500" },
      { id: "WARNING", label: "Warning", count: warningCount, badgeVariant: "warning", dotColor: "bg-amber-400" },
      { id: "INFO", label: "Info", count: infoCount, badgeVariant: "info", dotColor: "bg-sky-400" },
    ];
  }, [items]);

  const {
    searchQuery,
    setSearchQuery,
    activeFilter,
    setActiveFilter,
    sortField,
    sortDir,
    handleSort,
    visibleItems,
    totalFilteredCount,
    totalCount,
    hasMore,
    sentinelRef,
    resetFilters,
  } = useOverviewTableControls<SecurityAuditItem>({
    items,
    defaultSortField: "timestamp",
    defaultSortDir: "desc",
    initialLimit: 10,
    batchSize: 10,
    filterPredicate: (item, filter) => {
      const sev = (item.severity ?? "").toUpperCase();
      if (filter === "CRITICAL") return sev === "CRITICAL";
      if (filter === "WARNING") return sev === "WARNING" || sev === "WARN";
      if (filter === "INFO") return sev === "INFO" || (sev !== "CRITICAL" && sev !== "WARNING" && sev !== "WARN");
      return true;
    },
    searchPredicate: (item, q) => {
      return (
        (item.actor ?? "").toLowerCase().includes(q) ||
        (item.rawActor ?? "").toLowerCase().includes(q) ||
        (item.targetTenant ?? "").toLowerCase().includes(q) ||
        (item.tenantSlug ?? "").toLowerCase().includes(q) ||
        (item.action ?? "").toLowerCase().includes(q) ||
        (item.rawAction ?? "").toLowerCase().includes(q) ||
        (item.details ?? "").toLowerCase().includes(q) ||
        (item.ipAddress ?? "").toLowerCase().includes(q) ||
        (item.eventMessage ?? "").toLowerCase().includes(q) ||
        (item.requestPath ?? "").toLowerCase().includes(q)
      );
    },
    sortComparator: compareAuditItems,
  });

  if (loading && items.length === 0) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-12 animate-pulse rounded-xl border border-border bg-card/20" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* ── Search & Filter Toolbar ── */}
      <OverviewTabToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Cari aktor, tenant, aksi keamanan, IP..."
        filterOptions={filterOptions}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        totalFilteredCount={totalFilteredCount}
        totalCount={totalCount}
        onResetFilters={resetFilters}
      />

      {/* ── Table with Infinite Scroll Container ── */}
      <div className="rounded-xl border border-border bg-card/10 overflow-hidden flex flex-col">
        <div className="max-h-[460px] overflow-auto custom-scrollbar-thin">
          <table className="w-full text-left text-xs border-collapse">
            {/* Sticky Header */}
            <thead className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border shadow-xs">
              <tr className="divide-x divide-border/30">
                <th className="py-2.5 px-3.5 w-32">
                  <OverviewSortableHeader
                    title="Waktu (WIB)"
                    field="timestamp"
                    currentSortField={sortField}
                    currentSortDir={sortDir}
                    onSort={handleSort}
                  />
                </th>
                <th className="py-2.5 px-3.5 min-w-[170px]">
                  <OverviewSortableHeader
                    title="Aktor / Akun"
                    field="actor"
                    currentSortField={sortField}
                    currentSortDir={sortDir}
                    onSort={handleSort}
                  />
                </th>
                <th className="py-2.5 px-3.5 min-w-[140px]">
                  <OverviewSortableHeader
                    title="Target Tenant"
                    field="targetTenant"
                    currentSortField={sortField}
                    currentSortDir={sortDir}
                    onSort={handleSort}
                  />
                </th>
                <th className="py-2.5 px-3.5 min-w-[220px]">
                  <OverviewSortableHeader
                    title="Aksi Keamanan"
                    field="action"
                    currentSortField={sortField}
                    currentSortDir={sortDir}
                    onSort={handleSort}
                  />
                </th>
                <th className="py-2.5 px-3.5 w-28 text-center">
                  <OverviewSortableHeader
                    title="Tingkat Risiko"
                    field="severity"
                    currentSortField={sortField}
                    currentSortDir={sortDir}
                    onSort={handleSort}
                    align="center"
                  />
                </th>
              </tr>
            </thead>

            {/* Rows with Context Menu & Modal Open */}
            <tbody className="divide-y divide-border/30">
              {visibleItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <FolderKanban className="size-8 text-muted-foreground/40" />
                      <p className="text-sm font-semibold text-foreground">
                        {activeFilter !== "ALL"
                          ? `Tidak ada event dengan status ${activeFilter}`
                          : "Tidak ada data audit log ditemukan"}
                      </p>
                      <p className="text-xs text-muted-foreground max-w-sm">
                        {searchQuery
                          ? `Tidak ada log yang cocok dengan kata kunci "${searchQuery}".`
                          : "Semua operasi keamanan sistem berjalan normal."}
                      </p>
                      {(searchQuery || activeFilter !== "ALL") && (
                        <button
                          type="button"
                          onClick={resetFilters}
                          className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-all cursor-pointer"
                        >
                          <RotateCcw className="size-3" />
                          <span>Reset Filter</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                visibleItems.map((audit) => {
                  const meta = getSeverityMeta(audit.severity);
                  const actor = formatActor(audit.actor);
                  const actionDisplay = formatActionDisplay(audit.action);

                  return (
                    <SecurityAuditContextMenu
                      key={audit.id}
                      item={audit}
                      onOpenDetail={setSelectedLog}
                    >
                      <tr
                        onClick={() => setSelectedLog(audit)}
                        className={cn(
                          "transition-colors group cursor-pointer divide-x divide-border/20 select-none",
                          meta.row
                        )}
                      >
                        {/* Waktu (WIB) */}
                        <td className="py-2.5 px-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className={cn("size-1.5 rounded-full shrink-0", meta.dot)} />
                            <span className="font-mono text-[11px] text-muted-foreground font-medium">
                              {(audit.timestamp ?? "").replace(/ WIB$/, "")}
                            </span>
                            <span className="text-[9px] text-muted-foreground/50 font-mono">WIB</span>
                          </div>
                        </td>

                        {/* Aktor / Akun */}
                        <td className="py-2.5 px-3.5">
                          <span className="font-semibold text-foreground block truncate max-w-[170px]">
                            {actor.main}
                          </span>
                          {actor.sub && (
                            <span className="text-[10px] font-mono text-muted-foreground/70 block truncate max-w-[170px]">
                              {actor.sub}
                            </span>
                          )}
                          {audit.ipAddress && (
                            <span className="text-[9px] font-mono text-muted-foreground/50 block">
                              IP: {audit.ipAddress}
                            </span>
                          )}
                        </td>

                        {/* Target Tenant */}
                        <td className="py-2.5 px-3.5">
                          <span className="text-foreground/90 font-medium text-[11px] truncate block max-w-[150px]">
                            {audit.targetTenant || "Platform Wide"}
                          </span>
                        </td>

                        {/* Aksi Keamanan */}
                        <td className="py-2.5 px-3.5">
                          <div className="flex items-center gap-1.5">
                            {actionDisplay.icon}
                            <span
                              className="font-medium text-[11px] text-foreground truncate block max-w-[240px]"
                              title={audit.action}
                            >
                              {actionDisplay.label}
                            </span>
                          </div>
                          {audit.details && (
                            <span
                              className="text-[10px] text-muted-foreground/80 truncate block max-w-[260px] mt-0.5"
                              title={audit.details}
                            >
                              {audit.details}
                            </span>
                          )}
                        </td>

                        {/* Tingkat Risiko */}
                        <td className="py-2.5 px-3.5 whitespace-nowrap text-center">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold border",
                              meta.badge
                            )}
                          >
                            <span className="text-[9px]">{meta.emoji}</span>
                            <span>{meta.label}</span>
                          </span>
                        </td>
                      </tr>
                    </SecurityAuditContextMenu>
                  );
                })
              )}
            </tbody>
          </table>

          {/* Infinite Scroll Sentinel */}
          <div ref={sentinelRef} className="py-2 flex items-center justify-center">
            {hasMore && (
              <div className="flex items-center gap-2 py-2 text-xs text-muted-foreground font-mono">
                <Loader2 className="size-3.5 animate-spin text-primary" />
                <span>Memuat log berikutnya ({visibleItems.length} / {totalFilteredCount})...</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Modal Dialog Detail Log ── */}
      <SecurityAuditLogDetailModal
        isOpen={Boolean(selectedLog)}
        onClose={() => setSelectedLog(null)}
        audit={selectedLog}
      />
    </div>
  );
}
