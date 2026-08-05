"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@k2net/ui";
import { AlertCircle, RefreshCw, Search, HelpCircle, FileText } from "lucide-react";
import { useDbPerformance, SlowQuery } from "@/hooks/useDbPerformance";
import { QueryPerformanceTable } from "@/components/observability/query-performance-table";
import { SpatialIndexTable } from "@/components/observability/spatial-index-table";
import { QueryDetailModal } from "@/components/observability/query-detail-modal";
import { ResetConfirmModal } from "@/components/observability/reset-confirm-modal";
import { QueryPerformanceBanner } from "@/components/observability/query-performance-banner";

export default function QueryPerformancePage() {
  const {
    slowQueries,
    spatialIndexes,
    stats,
    loading,
    loadingMore,
    hasMore,
    error,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    roleFilter,
    setRoleFilter,
    fetchMore,
    refresh,
    resetPerformanceStats,
  } = useDbPerformance();

  const [activeTab, setActiveTab] = useState<"queries" | "indexes">("queries");
  const [selectedQuery, setSelectedQuery] = useState<SlowQuery | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [showFooterBanner, setShowFooterBanner] = useState(true);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setIsScrolled(e.currentTarget.scrollTop > 5);
  };

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const handleResetReport = async () => {
    const success = await resetPerformanceStats();
    if (success) {
      setResetConfirmOpen(false);
    }
  };

  // Intersection Observer for Infinite Scroll Paging
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          fetchMore();
        }
      },
      { threshold: 0.1 }
    );

    if (sentinelRef.current) {
      observerRef.current.observe(sentinelRef.current);
    }

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [fetchMore, hasMore, loadingMore, loading, activeTab]);

  // Export data as CSV
  const exportToCsv = () => {
    const headers = ["Query", "Calls", "Total Time (ms)", "Mean Time (ms)", "Min Time (ms)", "Max Time (ms)", "Rows Processed", "Cache Hit Rate (%)", "Role"];
    const rows = slowQueries.map((q) => [
      `"${q.query.replace(/"/g, '""')}"`,
      q.calls,
      q.totalTimeMs,
      q.meanTimeMs,
      q.minTimeMs,
      q.maxTimeMs,
      q.rows,
      q.cacheHitRate,
      q.role,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `database_query_performance_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="relative flex flex-col w-full h-full bg-background pt-6 pb-0 gap-6 select-none overflow-hidden">
      {/* Top Header Section */}
      <div className="flex items-center justify-between px-4 md:px-6">
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2 tracking-tight">
          Query Performance
        </h1>

        {/* Right side navigation buttons / database selectors */}
        <div className="flex items-center gap-2">
          {error && (
            <div className="flex items-center gap-1 text-[10px] text-amber-500 mr-2">
              <AlertCircle className="h-3 w-3" />
              {error}
            </div>
          )}
          <a
            href="https://supabase.com/docs/guides/platform/performance"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-border bg-card hover:bg-muted/30 text-xs font-semibold text-muted-foreground hover:text-foreground rounded-lg transition-colors h-8"
          >
            <FileText className="h-3.5 w-3.5" />
            Docs
          </a>
          <select
            disabled
            className="px-3 py-1.5 text-xs border border-border bg-card text-muted-foreground rounded-lg cursor-not-allowed opacity-80 h-8 font-semibold"
          >
            <option>Source</option>
          </select>
          <select
            disabled
            className="px-3 py-1.5 text-xs border border-border bg-card text-muted-foreground rounded-lg cursor-not-allowed opacity-80 h-8 font-semibold"
          >
            <option>Primary Database</option>
          </select>
        </div>
      </div>

      {/* Supabase style inline KPI Stats bar */}
      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground/90 font-medium px-4 md:px-6">
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-foreground font-mono">{stats.slowQueriesCount}</span>
          <span>Slow Queries</span>
          <span title="Number of statements taking longer than 50ms on average." className="cursor-help text-muted-foreground/60 hover:text-foreground">
            <HelpCircle className="h-3.5 w-3.5" />
          </span>
        </div>
        <span className="text-muted-foreground/30 px-1">/</span>
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-foreground font-mono">{stats.cacheHitRate.toFixed(2)}%</span>
          <span>Cache Hit Rate</span>
          <span title="Percentage of blocks read from memory buffer cache vs disk." className="cursor-help text-muted-foreground/60 hover:text-foreground">
            <HelpCircle className="h-3.5 w-3.5" />
          </span>
        </div>
        <span className="text-muted-foreground/30 px-1">/</span>
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-foreground font-mono">{stats.avgRowsPerCall.toFixed(1)}</span>
          <span>Avg. Rows Per Call</span>
          <span title="Average number of rows returned or affected per statement call." className="cursor-help text-muted-foreground/60 hover:text-foreground">
            <HelpCircle className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>

      {/* Tabs Menu Navigation */}
      <div className="flex border-b border-border/80 gap-6 text-xs font-semibold px-4 md:px-6">
        <button
          onClick={() => setActiveTab("queries")}
          className={`pb-2 px-1 border-b-2 transition-all ${
            activeTab === "queries"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Slow Queries Log
        </button>
        <button
          onClick={() => setActiveTab("indexes")}
          className={`pb-2 px-1 border-b-2 transition-all ${
            activeTab === "indexes"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Spatial Index Registries
        </button>
      </div>

      {activeTab === "queries" ? (
        <div className="flex-1 min-h-0 flex flex-col px-4 md:px-6 pb-6">
          <div className="flex-1 min-h-0 border border-border bg-card/10 rounded-xl overflow-hidden flex flex-col">
            {/* Static Filter and Sort Toolbar */}
            <div className="relative z-30 bg-background/50 backdrop-blur-sm py-3 select-none shrink-0 border-b border-border overflow-hidden">
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-between px-5">
                <div className="relative w-full sm:w-[320px]">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Filter by query"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all h-8"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                  {/* Calls Sort Selector */}
                  <select
                    value={sortBy === "calls" ? "calls" : "none"}
                    onChange={(e) => {
                      if (e.target.value === "calls") {
                        setSortBy("calls");
                      }
                    }}
                    className="px-3 py-1.5 text-xs border border-border bg-card text-foreground rounded-lg focus:outline-none focus:ring-1 focus:ring-primary font-semibold h-8"
                  >
                    <option value="none">Calls</option>
                    <option value="calls">Calls: High to Low</option>
                  </select>

                  {/* Total Time Sort Selector */}
                  <select
                    value={sortBy === "total_time" ? "total_time" : "none"}
                    onChange={(e) => {
                      if (e.target.value === "total_time") {
                        setSortBy("total_time");
                      }
                    }}
                    className="px-3 py-1.5 text-xs border border-border bg-card text-foreground rounded-lg focus:outline-none focus:ring-1 focus:ring-primary font-semibold h-8"
                  >
                    <option value="none">Total Time</option>
                    <option value="total_time">Time: High to Low</option>
                  </select>

                  {/* Roles Selector */}
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="px-3 py-1.5 text-xs border border-border bg-card text-foreground rounded-lg focus:outline-none focus:ring-1 focus:ring-primary font-semibold h-8"
                  >
                    <option value="">Roles</option>
                    <option value="postgres">postgres</option>
                    <option value="authenticator">authenticator</option>
                    <option value="keycloak">keycloak</option>
                  </select>

                  {/* Source Selector */}
                  <select
                    disabled
                    className="px-3 py-1.5 text-xs border border-border bg-card text-muted-foreground rounded-lg font-semibold h-8 cursor-not-allowed opacity-80"
                  >
                    <option value="">Source</option>
                  </select>

                  <Button variant="outline" size="sm" onClick={refresh} disabled={loading} className="h-8 w-8 p-0 shrink-0">
                    <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-primary" : ""}`} />
                  </Button>
                  <Button variant="outline" size="sm" onClick={exportToCsv} className="h-8 font-semibold">
                    Export
                  </Button>
                </div>
              </div>

              {/* Static scroll border: full width, very thin */}
              <div className={`absolute bottom-0 left-0 right-0 h-[1px] bg-border/40 transition-opacity duration-300 ${
                isScrolled && !loading && !loadingMore ? "opacity-100" : "opacity-0"
              }`} />

              {/* Shimmer loading line */}
              <div className="absolute bottom-0 left-0 right-0 h-[1px] overflow-hidden">
                <div className={`h-full w-1/5 bg-gradient-to-r from-transparent via-primary to-transparent transition-opacity duration-300 will-change-transform ${
                  loading || loadingMore ? "animate-shimmer-line opacity-100" : "opacity-0"
                }`} />
              </div>
            </div>

            {/* Scrollable Table Container */}
            <div 
              onScroll={handleScroll}
              className="flex-1 min-h-0 overflow-auto custom-scrollbar-thin"
            >
              <QueryPerformanceTable
                data={slowQueries}
                loading={loading}
                onSelectQuery={setSelectedQuery}
                onCopy={handleCopy}
                copiedIdx={copiedIdx}
              />

              {/* Scroll Sentinel for Infinite Scrolling */}
              <div ref={sentinelRef} className="h-10 w-full flex justify-center items-center py-4">
                {loadingMore && (
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-xs text-muted-foreground">Loading more queries...</span>
                  </div>
                )}
                {!hasMore && slowQueries.length > 0 && (
                  <span className="text-xs text-muted-foreground">All captured queries loaded.</span>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <SpatialIndexTable spatialIndexes={spatialIndexes} />
      )}

      <QueryPerformanceBanner
        show={showFooterBanner}
        onClose={() => setShowFooterBanner(false)}
        onOpenResetModal={() => setResetConfirmOpen(true)}
      />

      <QueryDetailModal
        selectedQuery={selectedQuery}
        onClose={() => setSelectedQuery(null)}
        onCopy={handleCopy}
        copiedIdx={copiedIdx}
      />

      <ResetConfirmModal
        open={resetConfirmOpen}
        onOpenChange={setResetConfirmOpen}
        onConfirm={handleResetReport}
      />
    </div>
  );
}
