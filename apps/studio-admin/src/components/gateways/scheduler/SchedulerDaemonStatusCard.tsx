import React from "react";
import { Card, CardContent, CardHeader, CardTitle, Badge } from "@k2net/ui";
import type { SchedulerJob } from "@/lib/actions/gateways";

interface SchedulerDaemonStatusCardProps {
  jobs: SchedulerJob[];
  loading: boolean;
}

export function SchedulerDaemonStatusCard({ jobs, loading }: SchedulerDaemonStatusCardProps) {
  const activeJobsCount = jobs.filter((j) => j.isActive).length;

  return (
    <Card glowingEffect className="bg-card border-border shadow-xl">
      <CardHeader>
        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Status Task Scheduler
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-xs">
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <span className="text-muted-foreground">Daemon Worker</span>
          <Badge className="bg-primary/10 text-primary border-primary/20 text-[9px]">Running</Badge>
        </div>
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <span className="text-muted-foreground">Total Jobs Terdaftar</span>
          <Badge className="bg-muted/10 text-muted-foreground border-border text-[9px]">
            {loading ? "..." : jobs.length}
          </Badge>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Jobs Aktif</span>
          <Badge className="bg-primary/10 text-primary border-primary/20 text-[9px]">
            {loading ? "..." : activeJobsCount}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
