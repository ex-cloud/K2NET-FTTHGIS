"use client";

import { Card, CardContent, CardHeader, CardTitle, Badge, Button, PageLayout, Dialog, DialogContent, DialogHeader, DialogTitle } from "@k2net/ui";
import { DatabaseZap, Clock, AlertCircle, RefreshCw, Copy, Check } from "lucide-react";
import { useDbPerformance, SlowQuery } from "@/hooks/useDbPerformance";
import { useState } from "react";

export default function QueryPerformancePage() {
  const { slowQueries, spatialIndexes, loading, error, refresh } = useDbPerformance();
  const [selectedQuery, setSelectedQuery] = useState<SlowQuery | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  // Compute stats from real queries if available
  const totalCalls = slowQueries.reduce((acc, q) => acc + q.calls, 0);
  const maxMeanTime = slowQueries.length > 0 ? Math.max(...slowQueries.map((q) => q.meanTimeMs)) : 0;
  const avgExecutionTime = slowQueries.length > 0
    ? Math.round(slowQueries.reduce((acc, q) => acc + (q.meanTimeMs * q.calls), 0) / Math.max(1, totalCalls))
    : 0;

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
          <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-primary" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* 3 KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          {
            label: "Total Captured Calls",
            value: loading ? "…" : totalCalls > 0 ? totalCalls.toLocaleString() : "—",
            sub: "Total queries executed in pg_stat_statements",
            icon: DatabaseZap,
          },
          {
            label: "Weighted Avg Duration",
            value: loading ? "…" : avgExecutionTime > 0 ? `${avgExecutionTime}ms` : "—",
            sub: "Across all tracked statement executions",
            icon: Clock,
          },
          {
            label: "Slowest Statement (Avg)",
            value: loading ? "…" : maxMeanTime > 0 ? `${maxMeanTime}ms` : "—",
            sub: "Highest mean execution time query",
            icon: AlertCircle,
          },
        ].map((c) => (
          <Card key={c.label} className="p-5 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{c.label}</span>
              <c.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold text-foreground">{c.value}</p>
            <p className="text-xs text-muted-foreground">{c.sub}</p>
          </Card>
        ))}
      </div>

      {/* Slow Queries Table */}
      <Card>
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="text-sm font-semibold text-foreground">Slow Query Log</CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Top slow queries ordered by mean execution time from PostgreSQL pg_stat_statements.
          </p>
        </CardHeader>
        <CardContent className="p-0">
          {/* Table Header */}
          <div className="grid grid-cols-[1fr_80px_100px_120px] px-5 py-2 border-b border-border bg-muted/30 gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">SQL Query Statement</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-right">Calls</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-right">Mean Time</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-right">Total Time</span>
          </div>
          <div className="divide-y divide-border">
            {slowQueries.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                No slow queries captured or extension not loaded.
              </div>
            ) : (
              slowQueries.map((q, idx) => (
                <div key={idx} className="grid grid-cols-[1fr_80px_100px_120px] px-5 py-3 hover:bg-muted/20 transition-colors items-center gap-2 group/row">
                  <div className="min-w-0 flex items-center gap-2">
                    <button
                      onClick={() => handleCopy(q.query, idx)}
                      className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground shrink-0 transition-colors"
                      title="Copy SQL Query"
                    >
                      {copiedIdx === idx ? (
                        <Check className="h-3 w-3 text-emerald-500" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </button>
                    <p
                      onClick={() => setSelectedQuery(q)}
                      className="text-xs font-mono text-foreground truncate cursor-pointer hover:text-primary hover:underline select-all flex-1"
                      title="Click to view full SQL query"
                    >
                      {q.query}
                    </p>
                  </div>
                  <p className="text-xs font-mono text-muted-foreground text-right select-all">
                    {q.calls.toLocaleString()}
                  </p>
                  <p className={`text-xs font-mono font-bold text-right ${q.meanTimeMs > 500 ? "text-rose-500" : q.meanTimeMs > 200 ? "text-amber-500" : "text-foreground"}`}>
                    {q.meanTimeMs.toFixed(1)}ms
                  </p>
                  <p className="text-xs font-mono text-muted-foreground text-right">
                    {Math.round(q.totalTimeMs / 1000).toLocaleString()}s
                  </p>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Spatial Index Status */}
      <Card>
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="text-sm font-semibold text-foreground">Spatial Table Index Status</CardTitle>
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
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-muted/20 border border-border rounded-lg">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Calls</p>
                  <p className="text-sm font-mono font-bold text-foreground mt-0.5">{selectedQuery.calls.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-muted/20 border border-border rounded-lg">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Mean Execution Time</p>
                  <p className="text-sm font-mono font-bold text-foreground mt-0.5">{selectedQuery.meanTimeMs.toFixed(1)}ms</p>
                </div>
                <div className="p-3 bg-muted/20 border border-border rounded-lg">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Total Time</p>
                  <p className="text-sm font-mono font-bold text-foreground mt-0.5">{(selectedQuery.totalTimeMs / 1000).toFixed(2)}s</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
