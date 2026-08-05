"use client";

import { Card, CardContent, CardHeader, CardTitle, Badge, Button, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@k2net/ui";
import { DatabaseZap, AlertCircle, RefreshCw, Copy, Check, Search, HelpCircle, FileText, X } from "lucide-react";
import { useDbPerformance, SlowQuery } from "@/hooks/useDbPerformance";
import { QueryPerformanceTable } from "@/components/observability/query-performance-table";
import { useState, useEffect, useRef } from "react";

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

    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
        fetchMore();
      }
    }, { threshold: 0.1 });

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
    const rows = slowQueries.map(q => [
      `"${q.query.replace(/"/g, '""')}"`,
      q.calls,
      q.totalTimeMs,
      q.meanTimeMs,
      q.minTimeMs,
      q.maxTimeMs,
      q.rows,
      q.cacheHitRate,
      q.role
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");

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

            {/* Shimmer loading line: walking from left to right like a shooting star along the bottom border */}
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
        /* Spatial Index Registry Content Tab */
        <div className="flex-1 min-h-0 flex flex-col px-4 md:px-6 pb-6">
          <div className="flex-1 min-h-0 border border-border bg-card/10 rounded-xl overflow-hidden overflow-y-auto overflow-x-auto custom-scrollbar-thin">
            <div className="min-w-[800px] w-full p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-transparent text-[11px] font-medium text-muted-foreground/85">
                      <th className="py-2.5 px-4">Table</th>
                      <th className="py-2.5 px-4">Index Definition</th>
                      <th className="py-2.5 px-4 text-center">Status</th>
                      <th className="py-2.5 px-4 text-right">Size</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {spatialIndexes.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-muted-foreground">
                          No spatial indexes registered.
                        </td>
                      </tr>
                    ) : (
                      spatialIndexes.map((idx, indexIdx) => (
                        <tr key={indexIdx} className="hover:bg-muted/10 transition-colors">
                          <td className="py-3 px-4 font-mono text-foreground">{idx.tableName}</td>
                          <td className="py-3 px-4 font-mono text-muted-foreground select-all break-all" title={idx.indexDef}>
                            {idx.indexDef}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20">{idx.status}</Badge>
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-muted-foreground">{idx.size}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sticky Dismissible Info Footer Banner (Supabase style) */}
      {showFooterBanner && (
        <div className="sticky bottom-0 w-full bg-card border-t border-border p-5 z-40 shadow-xl backdrop-blur-sm transition-all duration-300">
          <button 
            onClick={() => setShowFooterBanner(false)}
            className="absolute top-3 right-3 text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted transition-all"
            title="Close info panel"
          >
            <X className="h-4 w-4" />
          </button>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pr-6 text-xs text-muted-foreground px-4 md:px-6">
            <div>
              <h4 className="font-semibold text-foreground mb-1">Reset report</h4>
              <p className="mb-3 leading-relaxed">Consider resetting the analysis statistics after optimizing any indexes or queries to clear the historical baselines.</p>
              <Button variant="outline" size="sm" onClick={() => setResetConfirmOpen(true)} className="h-8 font-semibold">
                Reset report
              </Button>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-1">How is this report generated?</h4>
              <p className="leading-relaxed">This report aggregates query statistics collected by the PostgreSQL <code>pg_stat_statements</code> extension. Metrics are updated continuously during query executions.</p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-1">Inspect your database for potential issues</h4>
              <p className="leading-relaxed">Verify that spatial indexes are active for your geocoding tables. Lack of GIST indexes on spatial columns causes heavy sequential scans.</p>
            </div>
          </div>
        </div>
      )}

      {/* Query Detail Dialog */}
      <Dialog open={!!selectedQuery} onOpenChange={(open) => !open && setSelectedQuery(null)}>
        <DialogContent className="bg-card border-border sm:max-w-[700px] p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold text-foreground flex items-center justify-between">
              <span>Full SQL Statement Details</span>
              {selectedQuery && (
                <button
                  onClick={() => handleCopy(selectedQuery.query, -1)}
                  className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 text-[10px]"
                >
                  {copiedIdx === -1 ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-500" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span>Copy SQL</span>
                    </>
                  )}
                </button>
              )}
            </DialogTitle>
          </DialogHeader>
          {selectedQuery && (
            <div className="mt-4 space-y-4">
              <div className="p-4 rounded-lg bg-muted/40 border border-border overflow-x-auto max-h-[300px]">
                <pre className="text-xs font-mono text-foreground whitespace-pre-wrap break-all select-all">
                  {selectedQuery.query}
                </pre>
              </div>
              <div className="grid grid-cols-4 gap-3 text-center">
                <div className="p-2.5 bg-muted/20 border border-border rounded-lg">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Calls</p>
                  <p className="text-sm font-mono font-bold text-foreground mt-0.5">{selectedQuery.calls.toLocaleString()}</p>
                </div>
                <div className="p-2.5 bg-muted/20 border border-border rounded-lg">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Total Time</p>
                  <p className="text-sm font-mono font-bold text-foreground mt-0.5">{(selectedQuery.totalTimeMs / 1000).toFixed(2)}s</p>
                </div>
                <div className="p-2.5 bg-muted/20 border border-border rounded-lg">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Mean Execution</p>
                  <p className="text-sm font-mono font-bold text-foreground mt-0.5">{selectedQuery.meanTimeMs.toFixed(1)}ms</p>
                </div>
                <div className="p-2.5 bg-muted/20 border border-border rounded-lg">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Cache Hit Rate</p>
                  <p className="text-sm font-mono font-bold text-foreground mt-0.5">{selectedQuery.cacheHitRate.toFixed(3)}%</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-2.5 bg-muted/20 border border-border rounded-lg">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Min Time</p>
                  <p className="text-sm font-mono font-bold text-foreground mt-0.5">{selectedQuery.minTimeMs.toFixed(1)}ms</p>
                </div>
                <div className="p-2.5 bg-muted/20 border border-border rounded-lg">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Max Time</p>
                  <p className="text-sm font-mono font-bold text-foreground mt-0.5">{selectedQuery.maxTimeMs.toFixed(1)}ms</p>
                </div>
                <div className="p-2.5 bg-muted/20 border border-border rounded-lg">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Rows Processed</p>
                  <p className="text-sm font-mono font-bold text-foreground mt-0.5">{selectedQuery.rows.toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reset Confirmation Dialog */}
      <Dialog open={resetConfirmOpen} onOpenChange={setResetConfirmOpen}>
        <DialogContent className="bg-card border-border sm:max-w-[450px] p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-foreground flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-rose-500" />
              Reset Statistics Report?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-2 leading-relaxed">
              This action will reset all metrics gathered by the <code>pg_stat_statements</code> extension in the database. Historical data will be cleared, and new performance baselines will be started.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setResetConfirmOpen(false)} className="h-8">
              Cancel
            </Button>
            <Button className="bg-rose-600 hover:bg-rose-500 text-white h-8" size="sm" onClick={handleResetReport}>
              Reset stats
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
