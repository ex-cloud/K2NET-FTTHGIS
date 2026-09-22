import { useState, useMemo } from "react";
import { Card, Button } from "@k2net/ui";
import { Link } from "@/lib/navigation-compat";
import { Activity, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TrafficDistributionData } from "@/hooks/useSystemOverviewData";

interface TrafficSegment {
  id: string;
  name: string;
  shortName: string;
  percentage: number;
  hits: string;
  colorClass: string;
  strokeColor: string;
  bgDotClass: string;
  badgeClass: string;
  href: string;
}

const CIRCLE_RADIUS = 56;
const CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS;

import { OverviewTrafficDistributionSkeleton } from "./skeletons";

export interface OverviewTrafficDistributionCardProps {
  data?: TrafficDistributionData;
  totalHits?: string;
  loading?: boolean;
  className?: string;
}

export function OverviewTrafficDistributionCard({
  data,
  totalHits = "14.2k",
  loading = false,
  className,
}: OverviewTrafficDistributionCardProps) {
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);

  // Dynamic segments based on real API request logs from backend
  const segments: TrafficSegment[] = useMemo(() => {
    const mapHits = data?.mapHits ?? 0;
    const coreHits = data?.coreHits ?? 0;
    const storageHits = data?.storageHits ?? 0;
    const iamHits = data?.iamHits ?? 0;

    const mapPct = data?.mapPercentage ?? 0;
    const corePct = data?.corePercentage ?? 0;
    const storagePct = data?.storagePercentage ?? 0;
    const iamPct = data?.iamPercentage ?? 0;

    return [
      {
        id: "map",
        name: "Map & Spatial Gateway",
        shortName: "Map Gateway",
        percentage: mapPct,
        hits: mapHits.toLocaleString(),
        colorClass: "text-primary",
        strokeColor: "var(--primary, #10b981)",
        bgDotClass: "bg-primary",
        badgeClass: "bg-primary/10 text-primary border-primary/20",
        href: "/observability/spatial-map",
      },
      {
        id: "core",
        name: "Core Spring Boot API",
        shortName: "Core API",
        percentage: corePct,
        hits: coreHits.toLocaleString(),
        colorClass: "text-sky-400",
        strokeColor: "#38bdf8",
        bgDotClass: "bg-sky-400",
        badgeClass: "bg-sky-500/10 text-sky-400 border-sky-500/20",
        href: "/observability/database",
      },
      {
        id: "storage",
        name: "Storage & Notifications",
        shortName: "Storage & Notif",
        percentage: storagePct,
        hits: storageHits.toLocaleString(),
        colorClass: "text-violet-400",
        strokeColor: "#a78bfa",
        bgDotClass: "bg-violet-400",
        badgeClass: "bg-violet-500/10 text-violet-400 border-violet-500/20",
        href: "/observability/messaging",
      },
      {
        id: "iam",
        name: "Keycloak Identity & IAM",
        shortName: "Keycloak Auth",
        percentage: iamPct,
        hits: iamHits.toLocaleString(),
        colorClass: "text-amber-400",
        strokeColor: "#fbbf24",
        bgDotClass: "bg-amber-400",
        badgeClass: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        href: "/observability/identity",
      },
    ];
  }, [data]);

  // Compute strokeDasharray and strokeDashoffset for each segment
  const arcSegments = useMemo(() => {
    let accumulatedPercent = 0;
    return segments.map((seg) => {
      const arcLength = (Math.max(seg.percentage, seg.percentage > 0 ? 1 : 0) / 100) * CIRCUMFERENCE;
      const offset = (accumulatedPercent / 100) * CIRCUMFERENCE;
      accumulatedPercent += seg.percentage;

      return {
        ...seg,
        strokeDasharray: seg.percentage > 0 ? `${Math.max(arcLength - 3, 0.1)} ${CIRCUMFERENCE}` : `0 ${CIRCUMFERENCE}`,
        strokeDashoffset: -offset,
      };
    });
  }, [segments]);

  const activeSegmentData = useMemo(() => {
    if (!hoveredSegment) return null;
    return segments.find((s) => s.id === hoveredSegment) ?? null;
  }, [hoveredSegment, segments]);

  const displayTotal = useMemo(() => {
    if (loading) return "...";
    if (data) {
      if (data.totalHits >= 1000) {
        return `${(data.totalHits / 1000).toFixed(1)}k`;
      }
      return data.totalHits.toLocaleString();
    }
    return totalHits || "0";
  }, [data, loading, totalHits]);

  if (loading && !data) {
    return <OverviewTrafficDistributionSkeleton className={className} />;
  }

  return (
    <Card
      glowingEffect
      className={cn(
        "border-border bg-card p-5 md:p-6 transition-all flex flex-col justify-between",
        className
      )}
    >
      {/* Top Header Row */}
      <div className="flex items-center justify-between gap-2 border-groove-b pb-3.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary">
            <Activity className="size-3.5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground tracking-tight">
              Gateway Traffic Share
            </h3>
            <p className="text-[11px] text-muted-foreground">
              Realtime request distribution by service
            </p>
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-muted/60 text-muted-foreground border border-border/60">
          <span className="size-1.5 rounded-full bg-primary animate-pulse" />
          24h Window
        </div>
      </div>

      {/* Donut Chart & Center Stats Visual */}
      <div className="flex flex-col items-center justify-center py-3">
        <div className="relative size-40 sm:size-44 flex items-center justify-center">
          <svg
            viewBox="0 0 160 160"
            className="size-full -rotate-90 transform"
          >
            {/* Background Base Ring */}
            <circle
              cx="80"
              cy="80"
              r={CIRCLE_RADIUS}
              fill="transparent"
              stroke="currentColor"
              strokeWidth="14"
              className="text-muted/30"
            />

            {/* Colored Segment Arcs */}
            {arcSegments.map((seg) => {
              const isHovered = hoveredSegment === seg.id;
              const isOtherHovered = hoveredSegment && hoveredSegment !== seg.id;

              return (
                <circle
                  key={seg.id}
                  cx="80"
                  cy="80"
                  r={CIRCLE_RADIUS}
                  fill="transparent"
                  stroke={seg.strokeColor}
                  strokeWidth={isHovered ? 18 : 14}
                  strokeDasharray={seg.strokeDasharray}
                  strokeDashoffset={seg.strokeDashoffset}
                  strokeLinecap="round"
                  className={cn(
                    "cursor-pointer transition-all duration-300",
                    isOtherHovered && "opacity-35",
                    isHovered && "filter drop-shadow-[0_0_8px_rgba(16,185,129,0.35)]"
                  )}
                  onMouseEnter={() => setHoveredSegment(seg.id)}
                  onMouseLeave={() => setHoveredSegment(null)}
                />
              );
            })}
          </svg>

          {/* Center Donut Info */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              {activeSegmentData ? `${activeSegmentData.percentage}%` : displayTotal}
            </span>
            <span className="text-[10px] font-mono font-medium text-muted-foreground uppercase tracking-wider">
              {activeSegmentData ? activeSegmentData.shortName : "Total Requests"}
            </span>
          </div>
        </div>
      </div>

      {/* Legend & Breakdown List */}
      <div className="space-y-1.5 pt-2 border-groove-t">
        {segments.map((seg) => {
          const isHovered = hoveredSegment === seg.id;
          const isOtherHovered = hoveredSegment && hoveredSegment !== seg.id;

          return (
            <Link
              key={seg.id}
              href={seg.href}
              onMouseEnter={() => setHoveredSegment(seg.id)}
              onMouseLeave={() => setHoveredSegment(null)}
              className={cn(
                "flex items-center justify-between p-1.5 rounded-lg text-xs transition-all",
                "hover:bg-muted/50 group cursor-pointer",
                isOtherHovered && "opacity-45",
                isHovered && "bg-muted/60"
              )}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className={cn("size-2 rounded-full shrink-0", seg.bgDotClass)} />
                <span className="truncate font-medium text-foreground/90 group-hover:text-foreground">
                  {seg.name}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[11px] font-mono text-muted-foreground">
                  {seg.hits}
                </span>
                <span
                  className={cn(
                    "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold border",
                    seg.badgeClass
                  )}
                >
                  {seg.percentage}%
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Footer Navigation Link */}
      <div className="pt-2 border-groove-t mt-1 flex items-center justify-between text-[11px]">
        <span className="text-muted-foreground/80">Microservices Telemetry</span>
        <Button
          variant="link"
          size="sm"
          className="h-auto p-0 text-[11px] font-medium text-primary hover:text-primary/80 gap-1"
          asChild
        >
          <Link href="/observability/overview">
            <span>View All Telemetry</span>
            <ArrowUpRight className="size-3" />
          </Link>
        </Button>
      </div>
    </Card>
  );
}
