import React from "react";
import { Card, CardContent, CardHeader, CardTitle, Badge } from "@k2net/ui";
import type { NotificationLog } from "@/lib/actions/gateways";

interface NotificationStatsCardProps {
  logs: NotificationLog[];
  loading: boolean;
}

export function NotificationStatsCard({ logs, loading }: NotificationStatsCardProps) {
  const sentCount = logs.filter((l) => l.status === "sent").length;
  const failedCount = logs.filter((l) => l.status === "failed").length;

  return (
    <Card glowingEffect className="bg-card border-border shadow-xl">
      <CardHeader>
        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Statistik Pengiriman
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-xs">
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <span className="text-muted-foreground">Total Dikirim</span>
          <Badge className="bg-primary/10 text-primary border-primary/20 text-[9px]">
            {loading ? "..." : sentCount}
          </Badge>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Total Gagal</span>
          <Badge
            className={`text-[9px] ${
              !loading && failedCount > 0
                ? "bg-rose-500/10 text-rose-500 border-rose-500/20"
                : "bg-muted/10 text-muted-foreground border-border"
            }`}
          >
            {loading ? "..." : failedCount}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
