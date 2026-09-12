import React from "react";
import { Card, CardContent, CardHeader, CardTitle, Badge } from "@k2net/ui";
import type { NotificationLog } from "@/lib/actions/gateways";

interface WhatsappMetaStatusCardProps {
  logs: NotificationLog[];
  loading: boolean;
}

export function WhatsappMetaStatusCard({ logs, loading }: WhatsappMetaStatusCardProps) {
  const sentCount = logs.filter((l) => l.status === "sent").length;

  return (
    <Card glowingEffect className="bg-card border-border shadow-xl">
      <CardHeader>
        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Status API Meta
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-xs">
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <span className="text-muted-foreground">Meta API Status</span>
          <Badge className="bg-primary/10 text-primary border-primary/20 text-[9px]">Normal</Badge>
        </div>
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <span className="text-muted-foreground">Webhook Connection</span>
          <Badge className="bg-primary/10 text-primary border-primary/20 text-[9px]">Receiving Active</Badge>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">WA Terkirim (log)</span>
          <Badge className="bg-muted/10 text-muted-foreground border-border text-[9px]">
            {loading ? "..." : sentCount}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
