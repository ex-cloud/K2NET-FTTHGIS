"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, Badge, Button, PageLayout } from "@k2net/ui";
import { MessageSquare, CheckCircle2, Clock, XCircle, RefreshCw, AlertCircle } from "lucide-react";
import { useMessagingStats } from "@/hooks/useMessagingStats";

const statusConfig: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  sent:       { label: "SENT",       className: "bg-primary/10 text-primary border-primary/20",          icon: <CheckCircle2 className="h-3 w-3" /> },
  pending:    { label: "PENDING",    className: "bg-amber-500/10 text-amber-500 border-amber-500/20",    icon: <Clock className="h-3 w-3" /> },
  processing: { label: "PROCESSING", className: "bg-sky-500/10 text-sky-500 border-sky-500/20",          icon: <Clock className="h-3 w-3 animate-spin" /> },
  failed:     { label: "FAILED",     className: "bg-rose-500/10 text-rose-500 border-rose-500/20",       icon: <XCircle className="h-3 w-3" /> },
};

export default function MessagingPage() {
  const { stats, queue, loading, error, refresh } = useMessagingStats();

  return (
    <PageLayout variant="dashboard" spaceY="space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-5">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2 tracking-tight">
            <MessageSquare className="h-5 w-5 text-primary" />
            Messaging Gateway
          </h1>
          <p className="text-xs text-muted-foreground">
            WhatsApp queue monitoring, Meta WABA API status, SMS backup, and message delivery analytics · via notification-gateway.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {error && (
            <div className="flex items-center gap-1 text-[10px] text-amber-500">
              <AlertCircle className="h-3 w-3" />
              {error}
            </div>
          )}
          <Badge className="border-primary/20 bg-primary/10 text-primary text-[10px]">
            {loading ? "LOADING…" : stats.status === "fallback" ? "ESTIMATED" : "LIVE DATA"}
          </Badge>
          <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-primary" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          {
            label: "WhatsApp Queue (Redis)",
            value: loading ? "…" : String(stats.queueDepth),
            sub: "messages pending delivery",
          },
          {
            label: "Meta WABA API",
            value: loading ? "…" : stats.wabaStatus,
            sub: "Business API v19.0 · Active",
          },
          {
            label: "SMS Backup Quota",
            value: loading ? "…" : `${stats.smsCreditsRemaining.toLocaleString()} / ${stats.smsCreditsMax.toLocaleString()}`,
            sub: "credits remaining this month",
          },
          {
            label: "Delivery Rate (24h)",
            value: loading ? "…" : `${stats.deliveryRate24h.toFixed(1)}%`,
            sub: `${stats.totalDelivered24h} / ${stats.totalSent24h} messages delivered`,
          },
        ].map((c) => (
          <Card key={c.label} className="p-5 flex flex-col gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{c.label}</span>
            <p className="text-xl font-bold text-foreground">{c.value}</p>
            <p className="text-xs text-muted-foreground">{c.sub}</p>
          </Card>
        ))}
      </div>

      {/* Message Queue Table */}
      <Card>
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            Message Queue — ftth-whatsapp-gateway
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Blast messages, notifications, and SMS backups processed via Redis queue · {queue.length} recent items.
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-[1fr_90px_70px_100px_70px] px-5 py-2 border-b border-border bg-muted/30 gap-2">
            {["Message", "Type", "Queue", "Status", "Sent At"].map(h => (
              <span key={h} className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{h}</span>
            ))}
          </div>
          <div className="divide-y divide-border">
            {queue.map((m) => {
              const st = statusConfig[m.status] ?? statusConfig["pending"];
              return (
                <div key={m.id} className="grid grid-cols-[1fr_90px_70px_100px_70px] px-5 py-3.5 hover:bg-muted/20 transition-colors items-center gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{m.message}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{m.recipient}</p>
                  </div>
                  <Badge className="text-[10px] w-fit bg-muted text-muted-foreground border-border">{m.type}</Badge>
                  <p className="text-xs font-mono text-muted-foreground">{m.queue}</p>
                  <Badge className={`text-[10px] w-fit flex items-center gap-1 ${st.className}`}>
                    {st.icon} {st.label}
                  </Badge>
                  <p className="text-xs font-mono text-muted-foreground">{m.sentAt ?? "—"}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* WABA API Status */}
      <Card>
        <CardHeader className="border-b border-border pb-3">
          <CardTitle className="text-sm font-semibold text-foreground">Meta WABA API Status</CardTitle>
        </CardHeader>
        <CardContent className="p-0 divide-y divide-border">
          {[
            { label: "Business Account ID",   value: "1234567890" },
            { label: "Phone Number Status",   value: `${stats.wabaStatus} · +62xxx` },
            { label: "Quality Rating",        value: "HIGH ⭐⭐⭐" },
            { label: "Daily Message Limit",   value: loading ? "…" : `${stats.totalSent24h.toLocaleString()} / 10,000` },
            { label: "API Version",           value: "v19.0 (Graph API)" },
          ].map(r => (
            <div key={r.label} className="flex justify-between items-center px-5 py-2.5">
              <span className="text-xs text-muted-foreground">{r.label}</span>
              <span className="text-xs font-medium text-foreground">{r.value}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </PageLayout>
  );
}
