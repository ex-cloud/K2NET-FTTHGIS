"use client";

import { useState } from "react";
import { Badge } from "@k2net/ui";
import { Card } from "@k2net/ui";
import { cn } from "@/lib/utils";

interface ThroughputDataPoint {
  hour: string;
  hits: number;
}

interface OverviewThroughputChartProps {
  data: ThroughputDataPoint[];
}

export function OverviewThroughputChart({ data }: OverviewThroughputChartProps) {
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);
  const maxHits = Math.max(...data.map((d) => d.hits), 1);

  return (
    <Card className="border-border bg-card p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold text-foreground">Combined System Throughput</h4>
          <p className="mt-0.5 text-[10px] text-muted-foreground">
            Aggregated API request load and geocoding activity across all microservices over the last 24 hours.
          </p>
        </div>
        {hoveredBarIndex !== null && data[hoveredBarIndex] ? (
          <Badge className="border-primary/20 bg-primary/10 text-[10px] font-mono text-primary font-bold">
            {data[hoveredBarIndex].hour} ➔ {data[hoveredBarIndex].hits} Requests
          </Badge>
        ) : (
          <Badge variant="outline" className="border-border text-[10px] font-mono text-muted-foreground font-bold">
            Peak load: {maxHits} req/min
          </Badge>
        )}
      </div>

      <div className="relative flex h-28 items-end gap-1.5 border-b border-border px-2 pb-2">
        {data.map((d, idx) => (
          <div
            key={idx}
            className="relative flex h-full flex-1 flex-col justify-end"
            onMouseEnter={() => setHoveredBarIndex(idx)}
            onMouseLeave={() => setHoveredBarIndex(null)}
          >
            <div
              style={{ height: `${(d.hits / maxHits) * 100}%` }}
              className={cn(
                "w-full rounded-t transition-all duration-200",
                hoveredBarIndex === idx
                  ? "cursor-pointer bg-primary shadow-[0_0_10px_var(--primary)]"
                  : "cursor-pointer bg-gradient-to-t from-primary/20 to-primary/60"
              )}
            />
          </div>
        ))}
      </div>

      <div className="mt-2.5 flex justify-between px-1 text-[9px] font-mono text-muted-foreground">
        <span>24 Jam Lalu</span>
        <span>12 Jam Lalu</span>
        <span>Sekarang (Real-Time)</span>
      </div>
    </Card>
  );
}
