"use client";

import * as React from "react";
import { Activity, Database, Server, Wifi, Cpu } from "lucide-react";
import { getBackendBaseUrl, getMartinBaseUrl, getPollerBaseUrl } from "@/lib/api-config";
import { httpClient } from "@/lib/httpClient";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@k2net/ui";

type ServiceStatus = "checking" | "up" | "down";

interface HealthState {
  backend: ServiceStatus;
  martin: ServiceStatus;
  poller: ServiceStatus;
  lastChecked: Date | null;
}

export function HealthBadge() {
  const [isMounted, setIsMounted] = React.useState(false);
  const [health, setHealth] = React.useState<HealthState>({
    backend: "checking",
    martin: "checking",
    poller: "checking",
    lastChecked: null,
  });

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const checkHealth = React.useCallback(async () => {
    // 1. Check Backend (Spring Boot)
    let backendStatus: ServiceStatus = "down";
    try {
      // Use the actuator health endpoint
      const backendHost = getBackendBaseUrl().replace("/api/v1", "");
      await httpClient(`${backendHost}/actuator/health`, { mode: "cors", cache: "no-cache" });
      backendStatus = "up";
    } catch {
      backendStatus = "down";
    }

    // 2. Check Martin (PostGIS Tile Server)
    let martinStatus: ServiceStatus = "down";
    try {
      await httpClient(`${getMartinBaseUrl()}/catalog`, { mode: "no-cors", cache: "no-cache" });
      martinStatus = "up";
    } catch {
      martinStatus = "down";
    }

    // 3. Check Poller (Go)
    let pollerStatus: ServiceStatus = "down";
    try {
      const res = await fetch(`${getPollerBaseUrl()}/healthz`, { cache: "no-cache" });
      pollerStatus = res.ok ? "up" : "down";
    } catch {
      pollerStatus = "down";
    }

    setHealth({
      backend: backendStatus,
      martin: martinStatus,
      poller: pollerStatus,
      lastChecked: new Date(),
    });
  }, []);

  React.useEffect(() => {
    checkHealth();
    // Poll every 30 seconds
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, [checkHealth]);

  // Determine overall status
  const isOptimal = health.backend === "up" && health.martin === "up" && health.poller === "up";
  const isChecking = health.backend === "checking" || health.martin === "checking" || health.poller === "checking";
  const isDown = health.backend === "down" && health.martin === "down" && health.poller === "down";

  let Icon = Wifi;
  let colorClass = "text-emerald-500";
  let bgClass = "bg-emerald-500/10";
  let pulseClass = "bg-emerald-500";
  let statusText = "System Optimal";

  if (isChecking) {
    Icon = Activity;
    colorClass = "text-muted-foreground";
    bgClass = "bg-muted";
    pulseClass = "bg-muted-foreground animate-pulse";
    statusText = "Checking Infrastructure...";
  } else if (isDown) {
    Icon = Activity;
    colorClass = "text-destructive";
    bgClass = "bg-destructive/10";
    pulseClass = "bg-destructive animate-pulse";
    statusText = "System Disconnected";
  } else if (!isOptimal) {
    // Partial degradation
    Icon = Activity;
    colorClass = "text-amber-500";
    bgClass = "bg-amber-500/10";
    pulseClass = "bg-amber-500 animate-pulse";
    statusText = "Degraded Performance";
  }

  const getStatusIcon = (status: ServiceStatus) => {
    if (status === "checking") return <span className="h-2 w-2 rounded-full bg-muted-foreground animate-pulse" />;
    if (status === "down") return <span className="h-2 w-2 rounded-full bg-destructive" />;
    return <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]" />;
  };

  if (!isMounted) return null; // Avoid hydration mismatch

  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1.5 cursor-help px-2 py-1 rounded-md hover:bg-accent transition-colors">
            <div className={`relative flex items-center justify-center w-5 h-5 rounded-md ${bgClass}`}>
              <Icon className={`w-3 h-3 ${colorClass}`} />
              {isOptimal && (
                <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${pulseClass}`}></span>
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${pulseClass}`}></span>
                </span>
              )}
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" align="end" className="w-56 p-0 border border-border shadow-lg">
          <div className="p-3 border-b border-border bg-muted/30">
            <h4 className="flex items-center gap-2 font-medium text-sm">
              <Activity className="w-4 h-4 text-muted-foreground" />
              Infrastructure Status
            </h4>
            <p className="text-xs text-muted-foreground mt-1">{statusText}</p>
          </div>
          <div className="p-2 space-y-1">
            <div className="flex items-center justify-between px-2 py-1.5 rounded-sm hover:bg-accent/50">
              <div className="flex items-center gap-2">
                <Server className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs font-medium">Core API (Spring)</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-muted-foreground font-mono">
                  {health.backend === "up" ? "OK" : health.backend === "checking" ? "..." : "ERR"}
                </span>
                {getStatusIcon(health.backend)}
              </div>
            </div>
            <div className="flex items-center justify-between px-2 py-1.5 rounded-sm hover:bg-accent/50">
              <div className="flex items-center gap-2">
                <Database className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs font-medium">GIS Tiles (Martin)</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-muted-foreground font-mono">
                  {health.martin === "up" ? "OK" : health.martin === "checking" ? "..." : "ERR"}
                </span>
                {getStatusIcon(health.martin)}
              </div>
            </div>
            <div className="flex items-center justify-between px-2 py-1.5 rounded-sm hover:bg-accent/50">
              <div className="flex items-center gap-2">
                <Cpu className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs font-medium">Network Poller (Go)</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-muted-foreground font-mono">
                  {health.poller === "up" ? "OK" : health.poller === "checking" ? "..." : "ERR"}
                </span>
                {getStatusIcon(health.poller)}
              </div>
            </div>
          </div>
          <div className="p-2 border-t border-border bg-muted/10">
            <p className="text-[10px] text-center text-muted-foreground">
              Last check: {health.lastChecked?.toLocaleTimeString() || "Pending..."}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
