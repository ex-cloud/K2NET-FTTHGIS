"use client";

import { Card, CardContent, CardHeader, CardTitle, Badge, Button, PageLayout } from "@k2net/ui";
import { DatabaseZap, Clock, AlertCircle } from "lucide-react";
import { slowQueriesMock, spatialIndexStatusMock } from "@/lib/mock-data/observability-mock";

export default function QueryPerformancePage() {
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
            PostGIS spatial query diagnostics, slow query log, and index health monitoring.
          </p>
        </div>
        <Badge className="border-amber-500/20 bg-amber-500/10 text-amber-500 text-[10px]">MOCK DATA</Badge>
      </div>

      {/* 3 KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: "Total Spatial Queries (24h)", value: "14,283", sub: "SELECT, UPDATE, ST_Distance operations", icon: DatabaseZap },
          { label: "Avg Execution Time", value: "42ms", sub: "Across all PostGIS queries", icon: Clock },
          { label: "Slowest Query", value: "1,204ms", sub: "ST_Distance on ftth_gis.odp", icon: AlertCircle },
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
          <CardTitle className="text-sm font-semibold text-foreground">Slow Query Log (&gt;500ms)</CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">PostGIS queries exceeding the 500ms threshold in the last 24 hours.</p>
        </CardHeader>
        <CardContent className="p-0">
          {/* Table Header */}
          <div className="grid grid-cols-[1fr_80px_120px_100px] px-5 py-2 border-b border-border bg-muted/30">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Query</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-right">Duration</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-center">Timestamp</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-right">Action</span>
          </div>
          <div className="divide-y divide-border">
            {slowQueriesMock.map((q) => (
              <div key={q.id} className="grid grid-cols-[1fr_80px_120px_100px] px-5 py-3 hover:bg-muted/20 transition-colors items-center gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-mono text-foreground truncate">{q.query}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{q.table}</p>
                </div>
                <p className={`text-xs font-mono font-bold text-right ${q.duration > 1000 ? "text-rose-500" : q.duration > 700 ? "text-amber-500" : "text-foreground"}`}>
                  {q.duration}ms
                </p>
                <p className="text-[10px] text-muted-foreground text-center font-mono">{q.timestamp}</p>
                <div className="flex justify-end">
                  <Button variant="outline" size="sm" className="h-6 text-[10px] px-2">Explain Plan</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Spatial Index Status */}
      <Card>
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="text-sm font-semibold text-foreground">Spatial Table Index Status</CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">GIST and B-Tree index validity on core PostGIS tables.</p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-[1fr_140px_80px_60px] px-5 py-2 border-b border-border bg-muted/30">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Table</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Index Type</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-center">Status</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-right">Size</span>
          </div>
          <div className="divide-y divide-border">
            {spatialIndexStatusMock.map((idx) => (
              <div key={idx.table} className="grid grid-cols-[1fr_140px_80px_60px] px-5 py-3 hover:bg-muted/20 transition-colors items-center">
                <p className="text-xs font-mono text-foreground">{idx.table}</p>
                <p className="text-xs text-muted-foreground">{idx.indexType}</p>
                <div className="flex justify-center">
                  <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20">{idx.status}</Badge>
                </div>
                <p className="text-xs text-muted-foreground text-right">{idx.size}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </PageLayout>
  );
}
