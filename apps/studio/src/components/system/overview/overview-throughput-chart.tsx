"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
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
    <Card className="border-border bg-[#0b0b0b]/40 p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold text-zinc-200">Combined System Throughput</h4>
          <p className="mt-0.5 text-[10px] text-zinc-500">
            Aggregated API request load and geocoding activity across all microservices over the last 24 hours.
          </p>
        </div>
        {hoveredBarIndex !== null && data[hoveredBarIndex] ? (
          <Badge className="border-primary/20 bg-primary/10 text-[10px] font-mono text-primary">
            {data[hoveredBarIndex].hour} ➔ {data[hoveredBarIndex].hits} Requests
          </Badge>
        ) : (
          <Badge variant="outline" className="border-white/10 text-[10px] font-mono text-zinc-500">
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
                  ? "cursor-pointer bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.3)]"
                  : "cursor-pointer bg-gradient-to-t from-emerald-500/20 to-emerald-500/60"
              )}
            />
          </div>
        ))}
      </div>

      <div className="mt-2.5 flex justify-between px-1 text-[9px] font-mono text-zinc-500">
        <span>24 Jam Lalu</span>
        <span>12 Jam Lalu</span>
        <span>Sekarang (Real-Time)</span>
      </div>
    </Card>
  );
}
