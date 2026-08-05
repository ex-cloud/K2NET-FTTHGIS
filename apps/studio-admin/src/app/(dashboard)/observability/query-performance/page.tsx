"use client";

import { useState, useEffect, useRef } from "react";
import { AlertCircle, RefreshCw, HelpCircle, FileText } from "lucide-react";
import { useDbPerformance, SlowQuery } from "@/hooks/useDbPerformance";
import { QueryPerformanceTable } from "@/components/observability/query-performance-table";
import { SpatialIndexTable } from "@/components/observability/spatial-index-table";
import { QueryDetailModal } from "@/components/observability/query-detail-modal";
import { ResetConfirmModal } from "@/components/observability/reset-confirm-modal";
import { QueryPerformanceBanner } from "@/components/observability/query-performance-banner";
import { QueryPerformanceToolbar } from "@/components/observability/query-performance-toolbar";

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
    minTotalTime,
    setMinTotalTime,
    selectedRoles,
    setSelectedRoles,
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
            {/* Filter and Sort Toolbar matching Supabase left/right architecture */}
            <QueryPerformanceToolbar
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              sortBy={sortBy}
              setSortBy={setSortBy}
              roleFilter={roleFilter}
              setRoleFilter={setRoleFilter}
              minTotalTime={minTotalTime}
              setMinTotalTime={setMinTotalTime}
              selectedRoles={selectedRoles}
              setSelectedRoles={setSelectedRoles}
              loading={loading}
              loadingMore={loadingMore}
              isScrolled={isScrolled}
              refresh={refresh}
              onOpenResetModal={() => setResetConfirmOpen(true)}
              slowQueries={slowQueries}
            />

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
