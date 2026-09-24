import * as React from "react";
import { Link } from "@tanstack/react-router";
import { Button, Card, cn } from "@k2net/ui";
import { type Project } from "../../hooks/useProjects";

interface ProjectUsageWidgetProps {
  projects: Project[];
}

function CircularMeter({ percent }: { percent: number }) {
  const radius = 6;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, percent)) / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center shrink-0 w-4 h-4">
      <svg className="w-4 h-4 -rotate-90" viewBox="0 0 16 16">
        {/* Background track circle */}
        <circle
          cx="8"
          cy="8"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="text-muted-foreground/30 dark:text-muted/60"
        />
        {/* Active progress arc */}
        <circle
          cx="8"
          cy="8"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={cn(
            "transition-all duration-500",
            percent > 85 ? "text-amber-500" : percent > 0 ? "text-primary" : "text-transparent"
          )}
        />
      </svg>
    </div>
  );
}

export function ProjectUsageWidget({ projects }: ProjectUsageWidgetProps) {
  const totalSubscribers = projects.reduce((acc, p) => acc + (p.totalSubscribers || 0), 0);
  const totalCableKm = projects.reduce((acc, p) => acc + (p.cableLengthKm || 0), 0);
  const totalOdc = projects.reduce((acc, p) => acc + (p.odcCount || 0), 0);
  const totalOdp = projects.reduce((acc, p) => acc + (p.odpCount || 0), 0);

  const subscriberQuota = 10000;
  const projectQuota = 10;
  const cableQuotaKm = 100;
  const subscriberPercent = Math.min(100, Math.round((totalSubscribers / subscriberQuota) * 100));
  const projectPercent = Math.min(100, Math.round((projects.length / projectQuota) * 100));
  const cablePercent = Math.min(100, Math.round((totalCableKm / cableQuotaKm) * 100));
  const odcOdpPercent = Math.min(100, Math.round(((totalOdc + totalOdp) / 550) * 100));

  const usageItems = [
    {
      label: "Proyek FTTH Aktif",
      value: `${projects.length} / ${projectQuota}`,
      percent: projectPercent,
    },
    {
      label: "Total Pelanggan",
      value: `${totalSubscribers.toLocaleString()} / ${subscriberQuota.toLocaleString()}`,
      percent: subscriberPercent,
    },
    {
      label: "Bentang Kabel Fiber",
      value: `${totalCableKm.toFixed(1)} / ${cableQuotaKm} Km`,
      percent: cablePercent,
    },
    {
      label: "Perangkat ODC & ODP",
      value: `${totalOdc} ODC / ${totalOdp} ODP`,
      percent: odcOdpPercent,
    },
    {
      label: "Database size",
      value: "26 / 500 MB",
      percent: 5.2,
    },
    {
      label: "File storage",
      value: "0.00 / 1 GB",
      percent: 0,
    },
  ];

  return (
    <Card
      glowingEffect
      className="p-4 sm:p-5 border-border/60 bg-card hover:bg-card hover:from-transparent hover:via-transparent hover:to-transparent rounded-xl shadow-xs space-y-4 transition-all duration-200"
    >
      {/* Header with border-groove-b */}
      <div className="flex items-start justify-between gap-3 pb-3.5 border-groove-b">
        <div>
          <h3 className="text-sm font-bold text-foreground">Pro plan usage</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Current billing cycle</p>
        </div>
        <Button
          asChild
          variant="outline"
          size="sm"
          className="h-7 px-3 text-xs font-medium rounded-lg border-border/80 hover:bg-muted/50"
        >
          <Link to="/billing">
            Upgrade to Pro
          </Link>
        </Button>
      </div>

      {/* Usage list with border-groove-t dividers */}
      <div className="pt-0.5">
        {usageItems.map((item, idx) => (
          <div
            key={idx}
            className={cn(
              "flex items-center justify-between py-2.5 text-xs",
              idx > 0 && "border-groove-t"
            )}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <CircularMeter percent={item.percent} />
              <span className="font-medium text-foreground/90 truncate">
                {item.label}
              </span>
            </div>
            <span className="font-mono font-bold text-foreground shrink-0 ml-3">
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
