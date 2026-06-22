"use client";

import React, { useEffect, useState } from "react";
import { Zap, ZapOff, Loader2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getPollerBaseUrl } from "@/lib/api-config";

interface PollerStatus {
  status: string;
  deviceCount: number;
  time: string;
  pollInterval: string;
}

export function PollerHealthBadge() {
  const [health, setHealth] = useState<PollerStatus | null>(null);
  const [status, setStatus] = useState<"loading" | "online" | "offline">("loading");

  const checkHealth = async () => {
    try {
      const res = await fetch(`${getPollerBaseUrl()}/healthz`);
      if (res.ok) {
        const data = await res.json();
        setHealth(data);
        setStatus("online");
      } else {
        setStatus("offline");
      }
    } catch {
      setStatus("offline");
      setHealth(null);
    }
  };

  useEffect(() => {
    // Calling an async function inside useEffect is standard, 
    // but we can ensure it doesn't trigger sync setState issues by letting the interval handle the first tick or using a wrapper.
    const runCheck = async () => {
      await checkHealth();
    };
    
    runCheck();
    const interval = setInterval(checkHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-500 cursor-help ${
            status === "online" 
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500 shadow-[0_0_15px_-5px_rgba(16,185,129,0.3)]" 
              : status === "offline"
              ? "bg-rose-500/10 border-rose-500/20 text-rose-500 shadow-[0_0_15px_-5px_rgba(244,63,94,0.3)]"
              : "bg-zinc-500/10 border-zinc-500/20 text-zinc-500"
          }`}>
            {status === "loading" && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {status === "online" && (
              <>
                <div className="relative flex">
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  <span className="absolute inset-0 w-3.5 h-3.5 bg-emerald-500 blur-sm animate-pulse" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Poller Live</span>
              </>
            )}
            {status === "offline" && (
              <>
                <ZapOff className="w-3.5 h-3.5" />
                <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Poller Down</span>
              </>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent className="bg-zinc-950 border-white/10 text-white p-3 rounded-xl shadow-2xl backdrop-blur-xl">
          <div className="space-y-1.5">
            <div className="flex justify-between gap-8">
              <span className="text-[10px] font-bold text-zinc-500 uppercase">Service Status</span>
              <span className={`text-[10px] font-black uppercase ${status === "online" ? "text-emerald-500" : "text-rose-500"}`}>
                {status === "online" ? "Operational" : "Disconnected"}
              </span>
            </div>
            {health && (
              <>
                <div className="flex justify-between gap-8">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase">Active Devices</span>
                  <span className="text-[10px] font-black text-white">{health.deviceCount} Units</span>
                </div>
                <div className="flex justify-between gap-8">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase">Poll Cycle</span>
                  <span className="text-[10px] font-black text-white">{health.pollInterval}</span>
                </div>
              </>
            )}
            <div className="pt-1.5 mt-1.5 border-t border-white/5 text-[9px] text-zinc-600 font-medium italic">
              Endpoint: localhost:9091/healthz
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
