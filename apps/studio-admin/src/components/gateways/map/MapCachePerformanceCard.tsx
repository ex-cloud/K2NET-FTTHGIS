import React from "react";
import { DollarSign } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Progress } from "@k2net/ui";

export function MapCachePerformanceCard() {
  return (
    <Card glowingEffect className="bg-card border-border shadow-xl">
      <CardHeader>
        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Redis Cache Performance
        </CardTitle>
        <CardDescription className="text-[10px] text-muted-foreground">
          Rasio cache hit dari request Geocoding yang tersimpan di database lokal Redis.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Cache Hit Ratio</span>
            <span className="font-semibold text-primary">94.2%</span>
          </div>
          <Progress value={94.2} className="h-2 bg-muted border border-border" />
        </div>

        <div className="grid grid-cols-2 gap-4 text-xs pt-2">
          <div>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-bold">Cache Hits</p>
            <p className="text-sm font-semibold font-mono text-foreground mt-0.5">14,204</p>
          </div>
          <div>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-bold">Cache Misses</p>
            <p className="text-sm font-semibold font-mono text-muted-foreground mt-0.5">876</p>
          </div>
        </div>

        {/* Savings Calculator Card */}
        <div className="bg-primary/5 border border-primary/10 rounded-lg p-3 flex items-start gap-2.5">
          <div className="p-1 rounded bg-primary/10 text-primary mt-0.5">
            <DollarSign className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground font-semibold">Estimasi Penghematan Biaya</p>
            <p className="text-xs font-bold text-primary font-mono mt-0.5">$710.20 USD</p>
            <p className="text-[8px] text-muted-foreground mt-0.5">
              *Berdasarkan standar harga Google Maps Geocoding API ($5/1000 hits)
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
