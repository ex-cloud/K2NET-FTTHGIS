"use client";

import { Card, CardContent, CardHeader, CardTitle, Badge, Button, PageLayout, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@k2net/ui";
import { DatabaseZap, AlertCircle, RefreshCw, Copy, Check, Search, Download, HelpCircle, FileText } from "lucide-react";
import { useDbPerformance, SlowQuery } from "@/hooks/useDbPerformance";
import { QueryPerformanceTable } from "@/components/observability/query-performance-table";
import { useState, useEffect } from "react";

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

  const [selectedQuery, setSelectedQuery] = useState<SlowQuery | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

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

  // Infinite scroll window event listener
  useEffect(() => {
    const handleScroll = () => {
      if (typeof window === "undefined") return;
      const threshold = 150; // pixels from bottom
      const totalHeight = document.documentElement.scrollHeight;
      const scrollPosition = window.innerHeight + window.scrollY;

      if (totalHeight - scrollPosition < threshold) {
        fetchMore();
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [fetchMore]);

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
    <PageLayout variant="dashboard" spaceY="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-5">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2 tracking-tight">
            <DatabaseZap className="h-5 w-5 text-primary" />
            Query Performance
          </h1>
          <p className="text-xs text-muted-foreground">
            PostGIS spatial query diagnostics, pg_stat_statements slow query log, and index health monitoring.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {error && (
            <div className="flex items-center gap-1 text-[10px] text-amber-500">
              <AlertCircle className="h-3 w-3" />
              {error}
            </div>
          )}
          <Badge className="border-primary/20 bg-primary/10 text-primary text-[10px]">LIVE DATA</Badge>
          <Button variant="outline" size="sm" onClick={() => setResetConfirmOpen(true)}>
            Reset report
          </Button>
        </div>
      </div>

      {/* Supabase style inline KPI Stats bar */}
      <div className="flex items-center gap-6 px-6 py-4 bg-card border border-border rounded-xl text-xs text-muted-foreground shadow-sm">
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-base text-foreground font-mono">{stats.slowQueriesCount}</span>
          <span className="uppercase tracking-wider font-semibold text-[10px]">Slow Queries</span>
          <span title="Number of statements taking longer than 50ms on average." className="cursor-help shrink-0">
            <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/60" />
          </span>
        </div>
        <div className="text-border">/</div>
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-base text-foreground font-mono">{stats.cacheHitRate.toFixed(2)}%</span>
          <span className="uppercase tracking-wider font-semibold text-[10px]">Cache Hit Rate</span>
          <span title="Percentage of blocks read from memory buffer cache vs disk." className="cursor-help shrink-0">
            <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/60" />
          </span>
        </div>
        <div className="text-border">/</div>
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-base text-foreground font-mono">{stats.avgRowsPerCall.toFixed(1)}</span>
          <span className="uppercase tracking-wider font-semibold text-[10px]">Avg. Rows Per Call</span>
          <span title="Average number of rows returned or affected per statement call." className="cursor-help shrink-0">
            <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/60" />
          </span>
        </div>
      </div>

      {/* Filter and Sort Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-[320px]">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Filter by query"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
          {/* Sort By Selector */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 text-xs border border-border bg-card text-foreground rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="total_time">Sort by: Total Time</option>
            <option value="calls">Sort by: Calls</option>
            <option value="mean_time">Sort by: Mean Time</option>
            <option value="max_time">Sort by: Max Time</option>
            <option value="min_time">Sort by: Min Time</option>
            <option value="rows">Sort by: Rows Processed</option>
            <option value="cache_hit_rate">Sort by: Cache Hit Rate</option>
          </select>

          {/* Roles Selector */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-border bg-card text-foreground rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">All Roles</option>
            <option value="postgres">postgres</option>
            <option value="authenticator">authenticator</option>
            <option value="keycloak">keycloak</option>
          </select>

          <Button variant="outline" size="sm" onClick={exportToCsv} title="Export to CSV">
            <Download className="h-3.5 w-3.5 mr-1" />
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-primary" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Query Performance Scrollable Table using TanStack Table */}
      <Card className="overflow-hidden">
        <QueryPerformanceTable
          data={slowQueries}
          onSelectQuery={setSelectedQuery}
          onCopy={handleCopy}
          copiedIdx={copiedIdx}
        />
        
        {/* Infinite Scroll loading indicators */}
        {loadingMore && (
          <div className="py-4 border-t border-border flex justify-center items-center gap-2 bg-muted/10">
            <RefreshCw className="h-4 w-4 animate-spin text-primary" />
            <span className="text-xs text-muted-foreground">Loading more queries...</span>
          </div>
        )}
        {!hasMore && slowQueries.length > 0 && (
          <div className="py-4 border-t border-border text-center text-xs text-muted-foreground bg-muted/10">
            All captured queries loaded.
          </div>
        )}
      </Card>

      {/* Spatial Index Status Section */}
      <Card>
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            <FileText className="h-4 w-4 text-primary" />
            Spatial Table Index Status
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Active GIST/GIN spatial index registry from PostgreSQL pg_indexes.
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-[120px_1fr_120px_80px] px-5 py-2 border-b border-border bg-muted/30 gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Table</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Index Definition</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-center">Status</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-right">Size</span>
          </div>
          <div className="divide-y divide-border">
            {spatialIndexes.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                No spatial indexes registered.
              </div>
            ) : (
              spatialIndexes.map((idx, indexIdx) => (
                <div key={indexIdx} className="grid grid-cols-[120px_1fr_120px_80px] px-5 py-3 hover:bg-muted/20 transition-colors items-center gap-2">
                  <p className="text-xs font-mono text-foreground">{idx.tableName}</p>
                  <p className="text-xs text-muted-foreground font-mono truncate select-all" title={idx.indexDef}>
                    {idx.indexDef}
                  </p>
                  <div className="flex justify-center">
                    <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20">{idx.status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground text-right font-mono">{idx.size}</p>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Footer Info Section (Supabase style) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-border text-xs text-muted-foreground">
        <div>
          <h4 className="font-semibold text-foreground mb-1">Reset report</h4>
          <p className="mb-3 leading-relaxed">Consider resetting the analysis statistics after optimizing any indexes or queries to clear the historical baselines.</p>
          <Button variant="outline" size="sm" onClick={() => setResetConfirmOpen(true)}>
            Reset report
          </Button>
        </div>
        <div>
          <h4 className="font-semibold text-foreground mb-1">How is this report generated?</h4>
          <p className="leading-relaxed">This report aggregates query statistics collected by the PostgreSQL <code>pg_stat_statements</code> extension. Metrics are updated continuously during query executions.</p>
        </div>
        <div>
          <h4 className="font-semibold text-foreground mb-1">Inspect your database for issues</h4>
          <p className="leading-relaxed">Verify that spatial indexes are active for your geocoding tables. Lack of GIST indexes on spatial columns causes heavy sequential scans.</p>
        </div>
      </div>

      {/* Detail Dialog */}
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
                  <p className="text-sm font-mono font-bold text-foreground mt-0.5">{selectedQuery.cacheHitRate.toFixed(1)}%</p>
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
            <Button variant="outline" size="sm" onClick={() => setResetConfirmOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-rose-600 hover:bg-rose-500 text-white" size="sm" onClick={handleResetReport}>
              Reset stats
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
