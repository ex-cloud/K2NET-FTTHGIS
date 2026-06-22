"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { 
  Activity, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  Rocket, 
  CheckCircle2,
  Construction,
  PowerOff
} from "lucide-react";

interface NetworkStatusBadgeProps {
  status: string; // Lifecycle: PLAN, DEPLOYING, ACTIVE, MAINTENANCE, RETIRED
  healthStatus?: string; // Health: UP, DEGRADED, DOWN, BROKEN
  className?: string;
  showIcon?: boolean;
}

export function NetworkStatusBadge({ 
  status, 
  healthStatus, 
  className,
  showIcon = true 
}: NetworkStatusBadgeProps) {
  
  // Lifecycle Config
  const getLifecycleConfig = (s: string) => {
    switch (s?.toUpperCase()) {
      case 'PLAN':
        return { label: 'PLAN', color: 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20', icon: Clock };
      case 'DEPLOYING':
        return { label: 'DEPLOYING', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20', icon: Rocket };
      case 'ACTIVE':
        return { label: 'ACTIVE', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', icon: CheckCircle2 };
      case 'MAINTENANCE':
        return { label: 'MAINTENANCE', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20', icon: Construction };
      case 'RETIRED':
        return { label: 'RETIRED', color: 'bg-zinc-900 text-zinc-400 border-white/5', icon: PowerOff };
      default:
        return { label: s || 'UNKNOWN', color: 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20', icon: Activity };
    }
  };

  // Health Config
  const getHealthConfig = (h: string) => {
    switch (h?.toUpperCase()) {
      case 'UP':
        return { label: 'HEALTHY', color: 'bg-emerald-500 text-white border-emerald-400/30', icon: Activity };
      case 'DEGRADED':
        return { label: 'DEGRADED', color: 'bg-orange-500 text-white border-orange-400/30', icon: AlertTriangle };
      case 'DOWN':
        return { label: 'OFFLINE', color: 'bg-red-500 text-white border-red-400/30', icon: XCircle };
      case 'BROKEN':
        return { label: 'BROKEN', color: 'bg-red-900 text-white border-red-700/30', icon: AlertTriangle };
      default:
        return null;
    }
  };

  const lifecycle = getLifecycleConfig(status);
  const health = healthStatus ? getHealthConfig(healthStatus) : null;

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      {/* Lifecycle Badge */}
      <Badge 
        variant="outline" 
        className={cn(
          "h-5 px-2 text-[9px] font-black tracking-widest uppercase transition-all duration-300",
          lifecycle.color
        )}
      >
        {showIcon && <lifecycle.icon className="w-2.5 h-2.5 mr-1" />}
        {lifecycle.label}
      </Badge>

      {/* Health Indicator (Compact) */}
      {health && (
        <div className="group relative flex items-center">
          <div className={cn(
            "w-2.5 h-2.5 rounded-full border border-white/10 shadow-sm transition-all duration-300 animate-pulse",
            health.color.split(' ')[0] // Just take the bg color
          )} />
          <span className="absolute left-4 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-900 text-white text-[8px] font-bold px-1.5 py-0.5 rounded border border-white/10 pointer-events-none whitespace-nowrap z-50 uppercase tracking-widest">
            {health.label}
          </span>
        </div>
      )}
    </div>
  );
}
