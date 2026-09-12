import React from "react";
import { Card, CardContent, CardHeader, CardTitle, Badge } from "@k2net/ui";
import type { OLTDevice } from "@/lib/actions/gateways";

interface OltStatsCardProps {
  devices: OLTDevice[];
  loading: boolean;
}

export function OltStatsCard({ devices, loading }: OltStatsCardProps) {
  const uniqueVendorsCount = new Set(devices.map((d) => d.vendor)).size;

  return (
    <Card glowingEffect className="bg-card border-border shadow-xl">
      <CardHeader>
        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Statistik Perangkat
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-xs">
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <span className="text-muted-foreground">Total OLT Terdaftar</span>
          <Badge className="bg-muted/10 text-muted-foreground border-border text-[9px]">
            {loading ? "..." : devices.length}
          </Badge>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Vendor Unik</span>
          <Badge className="bg-sky-500/10 text-sky-400 border-sky-500/20 text-[9px]">
            {loading ? "..." : uniqueVendorsCount}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
