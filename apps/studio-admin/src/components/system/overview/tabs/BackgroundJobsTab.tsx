import { useMemo } from "react";
import { useRouter } from "@/lib/navigation-compat";
import { cn } from "@/lib/utils";
import {
  Clock,
  Database,
  RefreshCw,
  Shield,
  RotateCcw,
  Loader2,
  FolderKanban,
} from "lucide-react";
import type { BackgroundJobItem } from "../recent-operations-types";
import { useOverviewTableControls, type FilterPillOption } from "../use-overview-table-controls";
import { OverviewTabToolbar } from "../OverviewTabToolbar";
import { OverviewSortableHeader } from "../OverviewSortableHeader";
import { BackgroundJobContextMenu } from "../OverviewContextMenu";

interface BackgroundJobsTabProps {
  items: BackgroundJobItem[];
  loading: boolean;
}

function getJobIcon(jobType: string) {
  const t = (jobType ?? "").toLowerCase();
  if (t.includes("martin") || t.includes("tile") || t.includes("mvt"))
    return { emoji: "🔄", Icon: RefreshCw };
  if (t.includes("postgis") || t.includes("spatial") || t.includes("topology"))
    return { emoji: "🗄️", Icon: Database };
  if (t.includes("geojson") || t.includes("odp") || t.includes("import"))
    return { emoji: "📦", Icon: Database };
  if (t.includes("keycloak") || t.includes("iam") || t.includes("realm"))
    return { emoji: "🔐", Icon: Shield };
  if (t.includes("backup") || t.includes("snapshot") || t.includes("db"))
    return { emoji: "💾", Icon: Database };
  return { emoji: "⚙️", Icon: Clock };
}

function getJobStatusBadge(status: string) {
  const s = (status ?? "").toUpperCase();
  if (s === "RUNNING" || s === "IN_PROGRESS") {
    return {
      label: "RUNNING",
      className: "border-amber-500/40 bg-amber-500/10 text-amber-400 animate-pulse",
      dot: "bg-amber-400",
    };
  }
  if (s === "COMPLETED" || s === "SUCCESS") {
    return {
      label: "COMPLETED",
      className: "border-primary/40 bg-primary/10 text-primary",
      dot: "bg-primary",
    };
  }
  if (s === "FAILED" || s === "ERROR") {
    return {
      label: "FAILED",
      className: "border-rose-500/40 bg-rose-500/10 text-rose-400",
      dot: "bg-rose-500",
    };
  }
  return {
    label: s || "IDLE",
    className: "border-border bg-muted/20 text-muted-foreground",
    dot: "bg-muted-foreground",
  };
}

export function BackgroundJobsTab({ items, loading }: BackgroundJobsTabProps) {
  const router = useRouter();

  // Dynamic filter pills
  const filterOptions = useMemo<FilterPillOption[]>(() => {
    const runningCount = items.filter((j) => (j.status ?? "").toUpperCase() === "RUNNING").length;
    const completedCount = items.filter((j) => (j.status ?? "").toUpperCase() === "COMPLETED" || (j.status ?? "").toUpperCase() === "SUCCESS").length;
    const failedCount = items.filter((j) => (j.status ?? "").toUpperCase() === "FAILED" || (j.status ?? "").toUpperCase() === "ERROR").length;

    return [
      { id: "ALL", label: "Semua", count: items.length },
      { id: "RUNNING", label: "Running", count: runningCount, badgeVariant: "warning", dotColor: "bg-amber-400" },
      { id: "COMPLETED", label: "Completed", count: completedCount, badgeVariant: "success", dotColor: "bg-primary" },
      { id: "FAILED", label: "Failed", count: failedCount, badgeVariant: "critical", dotColor: "bg-rose-500" },
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
  } = useOverviewTableControls<BackgroundJobItem>({
    items,
    defaultSortField: "jobType",
    defaultSortDir: "asc",
    initialLimit: 10,
    batchSize: 10,
    filterPredicate: (item, filter) => {
      const s = (item.status ?? "").toUpperCase();
      if (filter === "RUNNING") return s === "RUNNING" || s === "IN_PROGRESS";
      if (filter === "COMPLETED") return s === "COMPLETED" || s === "SUCCESS";
      if (filter === "FAILED") return s === "FAILED" || s === "ERROR";
      return true;
    },
    searchPredicate: (item, q) => {
      return (
        (item.jobType ?? "").toLowerCase().includes(q) ||
        (item.targetOrg ?? "").toLowerCase().includes(q) ||
        (item.status ?? "").toLowerCase().includes(q) ||
        (item.id ?? "").toLowerCase().includes(q) ||
        (item.duration ?? "").toLowerCase().includes(q)
      );
    },
    sortComparator: (a, b, field, dir) => {
      let valA: string | number = "";
      let valB: string | number = "";

      if (field === "jobType") {
        valA = a.jobType ?? "";
        valB = b.jobType ?? "";
      } else if (field === "targetOrg") {
        valA = a.targetOrg ?? "";
        valB = b.targetOrg ?? "";
      } else if (field === "status") {
        valA = a.status ?? "";
        valB = b.status ?? "";
      } else if (field === "startedAt") {
        valA = a.startedAt ?? "";
        valB = b.startedAt ?? "";
      }

      if (valA < valB) return dir === "asc" ? -1 : 1;
      if (valA > valB) return dir === "asc" ? 1 : -1;
      return 0;
    },
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

  const handleRowClick = () => {
    router.push("/observability/scheduler");
  };

  return (
    <div className="space-y-3">
      {/* ── Search & Filter Toolbar ── */}
      <OverviewTabToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Cari tipe job, target worker, ID job..."
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
                <th className="py-2.5 px-3.5 min-w-[220px]">
                  <OverviewSortableHeader
                    title="Tipe Background Job"
                    field="jobType"
                    currentSortField={sortField}
                    currentSortDir={sortDir}
                    onSort={handleSort}
                  />
                </th>
                <th className="py-2.5 px-3.5 min-w-[170px]">
                  <OverviewSortableHeader
                    title="Target Engine / Platform"
                    field="targetOrg"
                    currentSortField={sortField}
                    currentSortDir={sortDir}
                    onSort={handleSort}
                  />
                </th>
                <th className="py-2.5 px-3.5 w-36">
                  <OverviewSortableHeader
                    title="Jadwal / Mulai"
                    field="startedAt"
                    currentSortField={sortField}
                    currentSortDir={sortDir}
                    onSort={handleSort}
                  />
                </th>
                <th className="py-2.5 px-3.5 w-28 text-center">
                  <OverviewSortableHeader
                    title="Status"
                    field="status"
                    currentSortField={sortField}
                    currentSortDir={sortDir}
                    onSort={handleSort}
                    align="center"
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
                          ? `Tidak ada job dengan status ${activeFilter}`
                          : "Tidak ada background job aktif"}
                      </p>
                      <p className="text-xs text-muted-foreground max-w-sm">
                        {searchQuery
                          ? `Tidak ada job yang cocok dengan "${searchQuery}".`
                          : "Semua scheduler GIS provisioning & maintenance idle."}
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
                visibleItems.map((job) => {
                  const { emoji } = getJobIcon(job.jobType);
                  const statusInfo = getJobStatusBadge(job.status);

                  return (
                    <BackgroundJobContextMenu key={job.id} item={job}>
                      <tr
                        onClick={handleRowClick}
                        className="hover:bg-card/90 transition-colors group cursor-pointer divide-x divide-border/20 select-none"
                      >
                        {/* Tipe Job */}
                        <td className="py-3 px-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted/40 border border-border text-foreground text-xs">
                              {emoji}
                            </div>
                            <div className="min-w-0">
                              <span className="font-semibold text-foreground block truncate max-w-[260px] group-hover:text-primary transition-colors">
                                {job.jobType}
                              </span>
                              <span className="text-[10px] font-mono text-muted-foreground/70 block truncate max-w-[200px]">
                                ID: {job.id} {job.duration ? `• ${job.duration}` : ""}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Target Engine */}
                        <td className="py-3 px-3.5">
                          <span className="text-foreground/90 font-medium text-[11px] truncate block max-w-[200px]">
                            {job.targetOrg || "Platform Core"}
                          </span>
                        </td>

                        {/* Jadwal / Mulai */}
                        <td className="py-3 px-3.5 whitespace-nowrap">
                          <span className="font-mono text-[11px] text-muted-foreground">
                            {job.startedAt || "-"}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-3.5 whitespace-nowrap text-center">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold border",
                              statusInfo.className
                            )}
                          >
                            <span className={cn("size-1.5 rounded-full shrink-0", statusInfo.dot)} />
                            <span>{statusInfo.label}</span>
                          </span>
                        </td>
                      </tr>
                    </BackgroundJobContextMenu>
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
                <span>Memuat job berikutnya ({visibleItems.length} / {totalFilteredCount})...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
