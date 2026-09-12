import React from "react";
import { Cpu, Activity, Database, HardDrive } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@k2net/ui";

interface GatewayOverviewKpiCardsProps {
  activeServicesCount: number;
  totalServices: number;
  allActive: boolean;
}

export function GatewayOverviewKpiCards({
  activeServicesCount,
  totalServices,
  allActive,
}: GatewayOverviewKpiCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {/* Card 1: Global Health */}
      <Card glowingEffect>
        <CardHeader className="pb-2">
          <CardDescription className="flex items-center justify-between text-[10px] uppercase font-bold tracking-widest text-foreground/75 dark:text-muted-foreground">
            <span>Service Health</span>
            <Cpu className="w-3.5 h-3.5 text-primary group-hover:text-primary/80 transition-colors" />
          </CardDescription>
          <CardTitle className="text-2xl font-bold text-foreground mt-1 flex items-baseline gap-2">
            {activeServicesCount} <span className="text-xs text-muted-foreground">/ {totalServices} Online</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                allActive ? "bg-primary shadow-[0_0_8px_var(--primary)]" : "bg-amber-500 animate-pulse"
              }`}
            />
            <span className="text-[10px] text-muted-foreground font-medium">
              {allActive ? "Semua Gateway Berjalan" : "Ada layanan terhenti"}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Card 2: Avg Latency */}
      <Card glowingEffect>
        <CardHeader className="pb-2">
          <CardDescription className="flex items-center justify-between text-[10px] uppercase font-bold tracking-widest text-foreground/75 dark:text-muted-foreground">
            <span>Avg Latency</span>
            <Activity className="w-3.5 h-3.5 text-sky-400 group-hover:text-sky-300 transition-colors" />
          </CardDescription>
          <CardTitle className="text-2xl font-bold text-foreground mt-1 flex items-baseline gap-2">
            42 <span className="text-xs text-muted-foreground">ms</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="flex items-center gap-1.5 text-[10px] text-primary">
            <Activity className="w-3 h-3 text-primary" />
            <span>Performa sangat stabil (Optimal)</span>
          </div>
        </CardContent>
      </Card>

      {/* Card 3: Cache Hit Ratio */}
      <Card glowingEffect>
        <CardHeader className="pb-2">
          <CardDescription className="flex items-center justify-between text-[10px] uppercase font-bold tracking-widest text-foreground/75 dark:text-muted-foreground">
            <span>Cache Efficiency</span>
            <Database className="w-3.5 h-3.5 text-teal-400 group-hover:text-teal-300 transition-colors" />
          </CardDescription>
          <CardTitle className="text-2xl font-bold text-foreground mt-1 flex items-baseline gap-2">
            94.2 <span className="text-xs text-muted-foreground">%</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <Database className="w-3 h-3 text-muted-foreground" />
            <span>Geocoding Cache Redis Aktif</span>
          </div>
        </CardContent>
      </Card>

      {/* Card 4: Compression Rate */}
      <Card glowingEffect>
        <CardHeader className="pb-2">
          <CardDescription className="flex items-center justify-between text-[10px] uppercase font-bold tracking-widest text-foreground/75 dark:text-muted-foreground">
            <span>Storage Optimization</span>
            <HardDrive className="w-3.5 h-3.5 text-teal-400 group-hover:text-teal-300 transition-colors" />
          </CardDescription>
          <CardTitle className="text-2xl font-bold text-foreground mt-1 flex items-baseline gap-2">
            68.5 <span className="text-xs text-muted-foreground">% Saved</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="flex items-center gap-1.5 text-[10px] text-primary">
            <HardDrive className="w-3 h-3 text-primary" />
            <span>Kompresi otomatis WebP</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
