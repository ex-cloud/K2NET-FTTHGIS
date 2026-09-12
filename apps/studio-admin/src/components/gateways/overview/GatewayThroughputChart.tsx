import React from "react";
import { Card } from "@k2net/ui";

const THROUGHPUT_HOURLY_DATA = [
  30, 45, 35, 60, 80, 50, 40, 70, 95, 110,
  85, 65, 45, 55, 75, 100, 120, 105, 90, 80,
  95, 110, 130, 125,
];

export function GatewayThroughputChart() {
  return (
    <Card className="bg-card border-border backdrop-blur-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h4 className="text-sm font-semibold text-foreground">Throughput & Gateway Load</h4>
          <p className="text-[10px] text-foreground/75 dark:text-muted-foreground">
            Visualisasi beban request gabungan ke seluruh port gateway (5001 - 5004)
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-primary/80" />
            <span className="text-foreground/75 dark:text-muted-foreground">Successful Hits</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-amber-500/40" />
            <span className="text-foreground/75 dark:text-muted-foreground">Cached / Delayed</span>
          </div>
        </div>
      </div>

      {/* Synthetic CSS/SVG Graph */}
      <div className="h-28 w-full flex items-end gap-1.5 px-2 relative border-b border-border pb-2">
        {THROUGHPUT_HOURLY_DATA.map((val, idx) => (
          <div key={idx} className="flex-1 flex flex-col justify-end h-full group/bar relative">
            <div
              style={{ height: `${(val / 140) * 100}%` }}
              className="w-full bg-gradient-to-t from-primary/30 to-primary/70 hover:to-primary rounded-t transition-all duration-300"
            />
            {/* Tooltip on Hover */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-background border border-border/10 rounded px-1.5 py-0.5 text-[9px] text-foreground opacity-0 pointer-events-none group-hover/bar:opacity-100 transition-opacity whitespace-nowrap z-20 font-mono">
              Hour {idx}: {val} reqs
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-between text-[9px] text-muted-foreground font-mono mt-2 px-1">
        <span>24 Jam Lalu</span>
        <span>12 Jam Lalu</span>
        <span>Sekarang (Real-Time)</span>
      </div>
    </Card>
  );
}
