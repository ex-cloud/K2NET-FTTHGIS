import { useMemo } from "react";
import { useRouter } from "@/lib/navigation-compat";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  Database,
  Globe,
  ShieldCheck,
  Server,
  RotateCcw,
  Loader2,
  FolderKanban,
} from "lucide-react";
import type { SystemAlertItem } from "../recent-operations-types";
import { useOverviewTableControls, type FilterPillOption } from "../use-overview-table-controls";
import { OverviewTabToolbar } from "../OverviewTabToolbar";
import { OverviewSortableHeader } from "../OverviewSortableHeader";
import { SystemAlertContextMenu } from "../OverviewContextMenu";

interface SystemAlertsTabProps {
  items: SystemAlertItem[];
  loading: boolean;
}

function getSeverityMeta(severity: string) {
  const s = (severity ?? "").toLowerCase();
  if (s === "critical")
    return {
      emoji: "🔴",
      label: "CRITICAL",
      badge: "border-rose-500/40 bg-rose-500/15 text-rose-400",
      dot: "bg-rose-500",
    };
  if (s === "warning")
    return {
      emoji: "🟡",
      label: "WARNING",
      badge: "border-amber-500/40 bg-amber-500/15 text-amber-400",
      dot: "bg-amber-400",
    };
  return {
    emoji: "🔵",
    label: "INFO",
    badge: "border-sky-500/30 bg-sky-500/15 text-sky-400",
    dot: "bg-sky-400",
  };
}

/** Mini health pill for the "All Clear" empty state */
function HealthPill({
  label,
  icon: Icon,
  ok,
}: {
  label: string;
  icon: typeof Server;
  ok: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-mono font-medium",
        ok
          ? "border-primary/20 bg-primary/8 text-primary"
          : "border-rose-500/25 bg-rose-500/8 text-rose-400"
      )}
    >
      <Icon className="size-3" />
      <span>{label}</span>
      <span>{ok ? "✅" : "❌"}</span>
    </div>
  );
}

export function SystemAlertsTab({ items, loading }: SystemAlertsTabProps) {
  const router = useRouter();

  // Dynamic filter pills
  const filterOptions = useMemo<FilterPillOption[]>(() => {
    const criticalCount = items.filter((a) => (a.severity ?? "").toLowerCase() === "critical").length;
    const warningCount = items.filter((a) => (a.severity ?? "").toLowerCase() === "warning").length;
    const infoCount = items.filter((a) => (a.severity ?? "").toLowerCase() === "info").length;

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
  } = useOverviewTableControls<SystemAlertItem>({
    items,
    defaultSortField: "severity",
    defaultSortDir: "desc",
    initialLimit: 10,
    batchSize: 10,
    filterPredicate: (item, filter) => {
      const s = (item.severity ?? "").toUpperCase();
      if (filter === "CRITICAL") return s === "CRITICAL";
      if (filter === "WARNING") return s === "WARNING" || s === "WARN";
      if (filter === "INFO") return s === "INFO";
      return true;
    },
    searchPredicate: (item, q) => {
      return (
        (item.title ?? "").toLowerCase().includes(q) ||
        (item.service ?? "").toLowerCase().includes(q) ||
        (item.message ?? "").toLowerCase().includes(q) ||
        (item.severity ?? "").toLowerCase().includes(q) ||
        (item.triggerTime ?? "").toLowerCase().includes(q)
      );
    },
    sortComparator: (a, b, field, dir) => {
      let valA: string | number = "";
      let valB: string | number = "";

      if (field === "severity") {
        const getWeight = (s?: string) => {
          const u = (s ?? "").toUpperCase();
          if (u === "CRITICAL") return 3;
          if (u === "WARNING" || u === "WARN") return 2;
          return 1;
        };
        const weightA = getWeight(a.severity);
        const weightB = getWeight(b.severity);
        return dir === "asc" ? weightA - weightB : weightB - weightA;
      } else if (field === "service") {
        valA = a.service ?? "";
        valB = b.service ?? "";
      } else if (field === "title") {
        valA = a.title ?? "";
        valB = b.title ?? "";
      } else if (field === "triggerTime") {
        valA = a.triggerTime ?? "";
        valB = b.triggerTime ?? "";
      }

      if (valA < valB) return dir === "asc" ? -1 : 1;
      if (valA > valB) return dir === "asc" ? 1 : -1;
      return 0;
    },
  });

  if (loading && items.length === 0) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 animate-pulse rounded-xl border border-border bg-card/20" />
        ))}
      </div>
    );
  }

  // Global All-Clear empty state if 0 alerts ever received
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card/40 p-8 text-center space-y-4">
        <div className="flex justify-center">
          <div className="p-3 rounded-full bg-primary/10 border border-primary/20 text-primary">
            <CheckCircle2 className="size-6" />
          </div>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-foreground">
            Semua Layanan Beroperasi Normal
          </h4>
          <p className="text-[11px] text-muted-foreground mt-1 max-w-sm mx-auto">
            Tidak ada insiden aktif atau anomali telemetri yang terdeteksi pada microservices,
            database, maupun gateway API.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          <HealthPill label="Kong API Gateway" icon={Globe} ok={true} />
          <HealthPill label="PostgreSQL & Martin" icon={Database} ok={true} />
          <HealthPill label="Keycloak IAM" icon={ShieldCheck} ok={true} />
          <HealthPill label="Go Microservices" icon={Server} ok={true} />
        </div>
      </div>
    );
  }

  const handleRowClick = (alert: SystemAlertItem) => {
    if (alert.actionUrl) {
      router.push(alert.actionUrl);
    } else {
      router.push("/observability/overview");
    }
  };

  return (
    <div className="space-y-3">
      {/* ── Search & Filter Toolbar ── */}
      <OverviewTabToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Cari service, judul alert, pesan error..."
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
                <th className="py-2.5 px-3.5 w-28 text-center">
                  <OverviewSortableHeader
                    title="Severity"
                    field="severity"
                    currentSortField={sortField}
                    currentSortDir={sortDir}
                    onSort={handleSort}
                    align="center"
                  />
                </th>
                <th className="py-2.5 px-3.5 min-w-[180px]">
                  <OverviewSortableHeader
                    title="Target Service / Layer"
                    field="service"
                    currentSortField={sortField}
                    currentSortDir={sortDir}
                    onSort={handleSort}
                  />
                </th>
                <th className="py-2.5 px-3.5 min-w-[240px]">
                  <OverviewSortableHeader
                    title="Deskripsi Masalah / Alert"
                    field="title"
                    currentSortField={sortField}
                    currentSortDir={sortDir}
                    onSort={handleSort}
                  />
                </th>
                <th className="py-2.5 px-3.5 w-32 whitespace-nowrap">
                  <OverviewSortableHeader
                    title="Status Waktu"
                    field="triggerTime"
                    currentSortField={sortField}
                    currentSortDir={sortDir}
                    onSort={handleSort}
                  />
                </th>
              </tr>
            </thead>

            {/* Rows with Right-Click Context Menu & Left-Click Navigation */}
            <tbody className="divide-y divide-border/30">
              {visibleItems.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <FolderKanban className="size-8 text-muted-foreground/40" />
                      <p className="text-sm font-semibold text-foreground">
                        {activeFilter !== "ALL"
                          ? `Tidak ada alert dengan status ${activeFilter}`
                          : "Tidak ada alert yang cocok"}
                      </p>
                      <p className="text-xs text-muted-foreground max-w-sm">
                        {searchQuery
                          ? `Tidak ada alert yang cocok dengan kata kunci "${searchQuery}".`
                          : "Semua komponen sistem beroperasi dalam batas toleransi normal."}
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
                visibleItems.map((alert) => {
                  const meta = getSeverityMeta(alert.severity);

                  return (
                    <SystemAlertContextMenu key={alert.id} item={alert}>
                      <tr
                        onClick={() => handleRowClick(alert)}
                        className="hover:bg-card/90 transition-colors group cursor-pointer divide-x divide-border/20 select-none"
                      >
                        {/* Severity Badge */}
                        <td className="py-3 px-3.5 whitespace-nowrap text-center">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold border",
                              meta.badge
                            )}
                          >
                            <span>{meta.emoji}</span>
                            <span>{meta.label}</span>
                          </span>
                        </td>

                        {/* Target Service */}
                        <td className="py-3 px-3.5">
                          <span className="font-semibold text-foreground block truncate max-w-[200px] group-hover:text-primary transition-colors">
                            {alert.service}
                          </span>
                        </td>

                        {/* Deskripsi Masalah */}
                        <td className="py-3 px-3.5">
                          <span className="font-medium text-foreground block truncate max-w-[300px]">
                            {alert.title}
                          </span>
                          <span className="text-[10px] text-muted-foreground block truncate max-w-[320px] mt-0.5" title={alert.message}>
                            {alert.message}
                          </span>
                        </td>

                        {/* Status Waktu */}
                        <td className="py-3 px-3.5 whitespace-nowrap">
                          <span className="font-mono text-[11px] text-muted-foreground font-medium">
                            {alert.triggerTime || "Active"}
                          </span>
                        </td>
                      </tr>
                    </SystemAlertContextMenu>
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
                <span>Memuat alert berikutnya ({visibleItems.length} / {totalFilteredCount})...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
