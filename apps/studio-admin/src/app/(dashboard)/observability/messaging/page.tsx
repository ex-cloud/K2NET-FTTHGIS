

import React from "react";
import { Link } from "@/lib/navigation-compat";
import { Card, CardContent, CardHeader, CardTitle, Badge, Button, PageLayout, ActionTooltip } from "@k2net/ui";
import {
  MessageSquare, CheckCircle2, Clock, XCircle, RefreshCw,
  AlertCircle, Radio, Mail, MessageCircle, Send,
} from "lucide-react";
import { useMessagingStats } from "@/hooks/useMessagingStats";

const statusConfig: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  sent:       { label: "SENT",       className: "bg-primary/10 text-primary border-primary/20",       icon: <CheckCircle2 className="h-3 w-3" /> },
  pending:    { label: "PENDING",    className: "bg-amber-500/10 text-amber-500 border-amber-500/20", icon: <Clock className="h-3 w-3" /> },
  processing: { label: "PROCESSING", className: "bg-sky-500/10 text-sky-500 border-sky-500/20",       icon: <Clock className="h-3 w-3 animate-spin" /> },
  failed:     { label: "FAILED",     className: "bg-rose-500/10 text-rose-500 border-rose-500/20",    icon: <XCircle className="h-3 w-3" /> },
};

function KpiCard({
  label, value, sub, highlight, linkHref,
}: {
  label: string; value: string; sub: string; highlight?: boolean; linkHref?: string;
}) {
  const innerContent = (
    <>
      <span className="text-xs font-bold uppercase tracking-wider text-foreground/75 dark:text-muted-foreground">
        {label}
      </span>
      <p className={`text-2xl font-bold ${highlight ? "text-rose-500" : "text-foreground"}`}>
        {value}
      </p>
      <p className="text-xs text-foreground/75 dark:text-muted-foreground">{sub}</p>
    </>
  );

  if (linkHref) {
    return (
      <Link href={linkHref} className="block transition-transform hover:scale-[1.01] focus:outline-none">
        <Card glowingEffect className="p-5 flex flex-col gap-2 cursor-pointer hover:border-primary/50 transition-colors">
          {innerContent}
        </Card>
      </Link>
    );
  }

  return (
    <Card glowingEffect className="p-5 flex flex-col gap-2">
      {innerContent}
    </Card>
  );
}

export default function MessagingPage() {
  const { stats, queue, loading, error, refresh } = useMessagingStats();

  const isHealthy = stats.status === "healthy";

  return (
    <PageLayout variant="workspace" spaceY="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-5">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2 tracking-tight">
            <MessageSquare className="h-5 w-5 text-primary" />
            Messaging Gateway
          </h1>
          <p className="text-xs text-foreground/75 dark:text-muted-foreground">
            WhatsApp queue monitoring, Twilio SMS/WhatsApp integration, SMTP status, and message delivery analytics &middot; via notification-gateway.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {error && (
            <div className="flex items-center gap-1 text-[10px] text-amber-500">
              <AlertCircle className="h-3 w-3" />
              {error}
            </div>
          )}
          <Badge className={`text-[10px] ${isHealthy ? "border-primary/20 bg-primary/10 text-primary" : "border-rose-500/20 bg-rose-500/10 text-rose-500"}`}>
            {loading ? "LOADING…" : isHealthy ? "LIVE DATA" : "OFFLINE"}
          </Badge>
          <ActionTooltip label="Segarkan Status Messaging" shortcut="R">
            <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-primary" : ""}`} />
              Refresh
            </Button>
          </ActionTooltip>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          label="Queue Depth (Redis)"
          value={loading ? "…" : String(stats.queueDepth)}
          sub="messages pending in queue"
        />
        <KpiCard
          label="Meta WABA Status"
          value={loading ? "…" : stats.wabaStatus === "CONFIGURED" ? "CONFIGURED" : "NOT CONFIGURED"}
          sub={stats.wabaStatus === "CONFIGURED" ? "Twilio WhatsApp API ready" : "Click to configure credentials ↗"}
          highlight={stats.wabaStatus !== "CONFIGURED"}
          linkHref={stats.wabaStatus !== "CONFIGURED" ? "/gateways/notification" : undefined}
        />
        <KpiCard
          label="Total Failed (24h)"
          value={loading ? "…" : String(stats.totalFailed24h)}
          sub="failed deliveries logged"
          highlight={stats.totalFailed24h > 0}
        />
        <KpiCard
          label="Delivery Rate (24h)"
          value={loading ? "…" : `${stats.deliveryRate24h.toFixed(1)}%`}
          sub={`${stats.totalDelivered24h} / ${stats.totalSent24h} messages sent`}
        />
      </div>

      {/* Notification Channels Status */}
      <Card>
        <CardHeader className="border-b border-border pb-3">
          <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Radio className="h-4 w-4 text-primary" />
            Notification Channels Status
          </CardTitle>
          <p className="text-xs text-foreground/75 dark:text-muted-foreground mt-0.5">
            Active provider status measured from notification-gateway configuration.
          </p>
        </CardHeader>
        <CardContent className="p-0 divide-y divide-border">
          {[
            {
              channel: "WhatsApp (Twilio / Meta)",
              icon: MessageCircle,
              status: stats.wabaStatus === "CONFIGURED" ? "CONFIGURED" : "NOT CONFIGURED",
              configured: stats.wabaStatus === "CONFIGURED",
              detail: "Template messages & outbound alerts",
            },
            {
              channel: "SMS Backup (Twilio)",
              icon: Send,
              status: stats.twilioConfigured ? "CONFIGURED" : "NOT CONFIGURED",
              configured: stats.twilioConfigured,
              detail: "Fallback SMS delivery when WhatsApp is unreachable",
            },
            {
              channel: "Email Gateway (SMTP)",
              icon: Mail,
              status: stats.smtpConfigured ? "CONFIGURED" : "NOT CONFIGURED",
              configured: stats.smtpConfigured,
              detail: "Transactional emails & invoice notifications",
            },
          ].map(c => (
            <div key={c.channel} className="flex justify-between items-center px-5 py-3 hover:bg-muted/20 transition-colors">
              <div className="flex items-center gap-3">
                <c.icon className={`h-4 w-4 ${c.configured ? "text-primary" : "text-muted-foreground"}`} />
                <div>
                  <p className="text-sm font-medium text-foreground">{c.channel}</p>
                  <p className="text-xs text-foreground/75 dark:text-muted-foreground">{c.detail}</p>
                </div>
              </div>
              {c.configured ? (
                <Badge className="text-[10px] font-mono bg-primary/10 text-primary border-primary/20">
                  {c.status}
                </Badge>
              ) : (
                <Link href="/gateways/notification" title="Click to configure in Notification Gateway">
                  <Badge className="text-[10px] font-mono bg-rose-500/10 text-rose-500 border-rose-500/20 cursor-pointer hover:bg-rose-500/20 hover:border-rose-500/30 transition-all">
                    {c.status} (Configure ↗)
                  </Badge>
                </Link>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Message Queue Table */}
      <Card>
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            Message Activity Log — ftth-notification-gateway
          </CardTitle>
          <p className="text-xs text-foreground/75 dark:text-muted-foreground mt-0.5">
            Notifications and alerts processed via Redis &middot; {queue.length} recent items.
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-[1fr_90px_70px_100px_140px] px-5 py-2 border-b border-border bg-muted/30 gap-2">
            {["Message", "Type", "Queue", "Status", "Sent At"].map(h => (
              <span key={h} className="text-[10px] font-bold uppercase tracking-wider text-foreground/75 dark:text-muted-foreground">
                {h}
              </span>
            ))}
          </div>
          <div className="divide-y divide-border">
            {queue.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                {loading ? "Loading message queue…" : "No notification logs available."}
              </div>
            ) : (
              queue.map(m => {
                const st = statusConfig[m.status] ?? statusConfig["pending"];
                return (
                  <div key={m.id} className="grid grid-cols-[1fr_90px_70px_100px_140px] px-5 py-3.5 hover:bg-muted/20 transition-colors items-center gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{m.message}</p>
                      <p className="text-[10px] text-foreground/75 dark:text-muted-foreground mt-0.5">{m.recipient}</p>
                    </div>
                    <Badge className="text-[10px] w-fit bg-muted text-muted-foreground border-border uppercase">{m.type}</Badge>
                    <p className="text-xs font-mono text-foreground/75 dark:text-muted-foreground">{m.queue}</p>
                    <Badge className={`text-[10px] w-fit flex items-center gap-1 ${st.className}`}>
                      {st.icon} {st.label}
                    </Badge>
                    <p className="text-xs font-mono text-foreground/75 dark:text-muted-foreground">{m.sentAt ?? "—"}</p>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

    </PageLayout>
  );
}
