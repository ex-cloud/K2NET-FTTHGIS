import { useMemo } from "react";
import { useRouter } from "@/lib/navigation-compat";
import { cn } from "@/lib/utils";
import {
  RotateCcw,
  Loader2,
  FolderKanban,
} from "lucide-react";
import type { BillingEventItem } from "../recent-operations-types";
import { useOverviewTableControls, type FilterPillOption } from "../use-overview-table-controls";
import { OverviewTabToolbar } from "../OverviewTabToolbar";
import { OverviewSortableHeader } from "../OverviewSortableHeader";
import { BillingEventContextMenu } from "../OverviewContextMenu";

interface BillingEventsTabProps {
  items: BillingEventItem[];
  loading: boolean;
}

function getStatusMeta(status: string): { label: string; className: string; dot: string } {
  const s = (status ?? "").toUpperCase();
  if (s === "TRIAL")
    return {
      label: "TRIAL",
      dot: "bg-amber-400",
      className: "border-amber-500/30 bg-amber-500/10 text-amber-400",
    };
  if (s === "PAID" || s === "ACTIVE")
    return {
      label: "ACTIVE",
      dot: "bg-primary animate-pulse",
      className: "border-primary/30 bg-primary/10 text-primary",
    };
  if (s === "OVERDUE")
    return {
      label: "OVERDUE",
      dot: "bg-rose-500",
      className: "border-rose-500/30 bg-rose-500/10 text-rose-400",
    };
  return {
    label: s || "UNKNOWN",
    dot: "bg-muted-foreground",
    className: "border-border/60 bg-muted/20 text-muted-foreground",
  };
}

function getPlanBadge(plan: string) {
  const p = (plan ?? "").toUpperCase();
  if (p === "ENTERPRISE")
    return "border-purple-500/30 bg-purple-500/15 text-purple-400";
  if (p === "PRO" || p === "PROFESSIONAL")
    return "border-primary/30 bg-primary/15 text-primary";
  if (p === "STARTER")
    return "border-sky-500/30 bg-sky-500/15 text-sky-400";
  return "border-border bg-muted text-muted-foreground";
}

export function BillingEventsTab({ items, loading }: BillingEventsTabProps) {
  const router = useRouter();

  // Dynamic filter pills
  const filterOptions = useMemo<FilterPillOption[]>(() => {
    const activeCount = items.filter((b) => (b.status ?? "").toUpperCase() === "ACTIVE" || (b.status ?? "").toUpperCase() === "PAID").length;
    const trialCount = items.filter((b) => (b.status ?? "").toUpperCase() === "TRIAL").length;
    const overdueCount = items.filter((b) => (b.status ?? "").toUpperCase() === "OVERDUE").length;

    return [
      { id: "ALL", label: "Semua", count: items.length },
      { id: "ACTIVE", label: "Active", count: activeCount, badgeVariant: "success", dotColor: "bg-primary" },
      { id: "TRIAL", label: "Trial", count: trialCount, badgeVariant: "warning", dotColor: "bg-amber-400" },
      { id: "OVERDUE", label: "Overdue", count: overdueCount, badgeVariant: "critical", dotColor: "bg-rose-500" },
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
  } = useOverviewTableControls<BillingEventItem>({
    items,
    defaultSortField: "orgName",
    defaultSortDir: "asc",
    initialLimit: 10,
    batchSize: 10,
    filterPredicate: (item, filter) => {
      const s = (item.status ?? "").toUpperCase();
      if (filter === "ACTIVE") return s === "ACTIVE" || s === "PAID";
      if (filter === "TRIAL") return s === "TRIAL";
      if (filter === "OVERDUE") return s === "OVERDUE";
      return true;
    },
    searchPredicate: (item, q) => {
      return (
        (item.orgName ?? "").toLowerCase().includes(q) ||
        (item.orgSlug ?? "").toLowerCase().includes(q) ||
        (item.planName ?? "").toLowerCase().includes(q) ||
        (item.amount ?? "").toLowerCase().includes(q) ||
        (item.status ?? "").toLowerCase().includes(q) ||
        (item.eventLabel ?? "").toLowerCase().includes(q) ||
        (item.timestamp ?? "").toLowerCase().includes(q)
      );
    },
    sortComparator: (a, b, field, dir) => {
      let valA: string | number = "";
      let valB: string | number = "";

      if (field === "orgName") {
        valA = a.orgName ?? "";
        valB = b.orgName ?? "";
      } else if (field === "planName") {
        valA = a.planName ?? "";
        valB = b.planName ?? "";
      } else if (field === "status") {
        valA = a.status ?? "";
        valB = b.status ?? "";
      } else if (field === "timestamp") {
        valA = a.timestamp ?? "";
        valB = b.timestamp ?? "";
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
    router.push("/organizations");
  };

  return (
    <div className="space-y-3">
      {/* ── Search & Filter Toolbar ── */}
      <OverviewTabToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Cari tenant, plan tier, status tagihan..."
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
                <th className="py-2.5 px-3.5 min-w-[190px]">
                  <OverviewSortableHeader
                    title="Organisasi / Tenant"
                    field="orgName"
                    currentSortField={sortField}
                    currentSortDir={sortDir}
                    onSort={handleSort}
                  />
                </th>
                <th className="py-2.5 px-3.5 min-w-[140px]">
                  <OverviewSortableHeader
                    title="Plan Langganan"
                    field="planName"
                    currentSortField={sortField}
                    currentSortDir={sortDir}
                    onSort={handleSort}
                  />
                </th>
                <th className="py-2.5 px-3.5 min-w-[160px]">
                  <OverviewSortableHeader
                    title="Estimasi Nilai / Siklus"
                    field="amount"
                    currentSortField={sortField}
                    currentSortDir={sortDir}
                    onSort={handleSort}
                  />
                </th>
                <th className="py-2.5 px-3.5 w-36">
                  <OverviewSortableHeader
                    title="Jadwal / Jatuh Tempo"
                    field="timestamp"
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
                  <td colSpan={5} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <FolderKanban className="size-8 text-muted-foreground/40" />
                      <p className="text-sm font-semibold text-foreground">
                        {activeFilter !== "ALL"
                          ? `Tidak ada data billing dengan status ${activeFilter}`
                          : "Tidak ada event billing"}
                      </p>
                      <p className="text-xs text-muted-foreground max-w-sm">
                        {searchQuery
                          ? `Tidak ada event yang cocok dengan "${searchQuery}".`
                          : "Semua tagihan langganan SaaS dalam status teratur."}
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
                visibleItems.map((evt) => {
                  const statusMeta = getStatusMeta(evt.status);

                  return (
                    <BillingEventContextMenu key={evt.id} item={evt}>
                      <tr
                        onClick={handleRowClick}
                        className="hover:bg-card/90 transition-colors group cursor-pointer divide-x divide-border/20 select-none"
                      >
                        {/* Organisasi */}
                        <td className="py-3 px-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted/40 border border-border font-bold text-foreground text-xs uppercase">
                              {evt.orgName?.charAt(0) || "O"}
                            </div>
                            <div className="min-w-0">
                              <span className="font-semibold text-foreground block truncate max-w-[200px] group-hover:text-primary transition-colors">
                                {evt.orgName}
                              </span>
                              <span className="text-[10px] font-mono text-muted-foreground/70 block truncate max-w-[180px]">
                                {evt.eventLabel || evt.orgSlug}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Plan */}
                        <td className="py-3 px-3.5">
                          <span
                            className={cn(
                              "inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold border uppercase tracking-wider",
                              getPlanBadge(evt.planName)
                            )}
                          >
                            {evt.planName || "PRO"}
                          </span>
                        </td>

                        {/* Nilai / Siklus */}
                        <td className="py-3 px-3.5">
                          <span className="font-mono text-foreground font-semibold text-[11px] block">
                            {evt.amount}
                          </span>
                        </td>

                        {/* Jadwal */}
                        <td className="py-3 px-3.5 whitespace-nowrap">
                          <span className="font-mono text-[11px] text-muted-foreground font-medium">
                            {evt.timestamp || "-"}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-3.5 whitespace-nowrap text-center">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold border",
                              statusMeta.className
                            )}
                          >
                            <span className={cn("size-1.5 rounded-full shrink-0", statusMeta.dot)} />
                            <span>{statusMeta.label}</span>
                          </span>
                        </td>
                      </tr>
                    </BillingEventContextMenu>
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
                <span>Memuat entri berikutnya ({visibleItems.length} / {totalFilteredCount})...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
