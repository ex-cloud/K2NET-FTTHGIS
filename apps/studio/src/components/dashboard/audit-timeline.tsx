"use client";

import * as React from "react";
import { format } from "date-fns";
import { 
  PlusCircle, 
  Edit3, 
  History, 
  User, 
  Clock, 
  AlertCircle,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { type AssetHistory } from "@/lib/api/network";



interface AuditTimelineProps {
  history: AssetHistory[];
  isLoading: boolean;
}

export function AuditTimeline({ history, isLoading }: AuditTimelineProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-4 animate-pulse">
            <div className="w-10 h-10 rounded-full bg-zinc-800" />
            <div className="flex-1 space-y-2 py-1">
              <div className="h-4 bg-zinc-800 rounded w-1/4" />
              <div className="h-3 bg-zinc-800 rounded w-3/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!history || history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center opacity-50">
        <div className="w-16 h-16 rounded-3xl bg-zinc-900 border border-border flex items-center justify-center mb-4">
          <History className="w-8 h-8 text-zinc-500" />
        </div>
        <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest">No history recorded yet</p>
        <p className="text-[10px] text-zinc-600 mt-1 uppercase tracking-tight italic">Initial migration records may be missing</p>
      </div>
    );
  }

  const getRevisionIcon = (type: string) => {
    const t = (type || "").toUpperCase();
    if (t.includes("ADD") || t.includes("CREATE"))
      return <PlusCircle className="w-4 h-4 text-primary" />;
    if (t.includes("MOD") || t.includes("UPDATE"))
      return <Edit3 className="w-4 h-4 text-amber-500" />;
    return <AlertCircle className="w-4 h-4 text-red-500" />;
  };

  const getStatusBadgeColor = (status: string) => {
    const s = (status || "").toUpperCase();
    if (["ACTIVE", "UP", "OPTIMAL"].includes(s)) return "bg-primary/10 text-primary border-primary/20";
    if (["BROKEN", "DOWN", "CRITICAL", "FIBERCUT"].includes(s)) return "bg-red-500/10 text-red-500 border-red-500/20";
    if (["MAINTENANCE", "PLANNING"].includes(s)) return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    return "bg-zinc-500/10 text-zinc-500 border-zinc-500/20";
  };

  return (
    <div className="relative px-2">
      {/* Vertical Line */}
      <div className="absolute left-7 top-0 bottom-0 w-px bg-linear-to-b from-white/10 via-white/5 to-transparent shadow-[0_0_8px_rgba(255,255,255,0.05)]" />

      <div className="space-y-10 py-6">
        {history.map((item, index) => (
          <div key={`${item.id}-${index}`} className="relative flex gap-6 group">
            {/* Timeline Marker */}
            <div className="relative z-10 flex-none flex items-center justify-center">
              <div className={cn(
                "w-10 h-10 rounded-2xl border flex items-center justify-center transition-all bg-zinc-950 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(0,0,0,0.5)]",
                (item.action || "").includes("ADD") ? "border-primary/20 shadow-emerald-500/5" : 
                (item.action || "").includes("MOD") ? "border-amber-500/20 shadow-amber-500/5" : "border-red-500/20 shadow-red-500/5"
              )}>
                {getRevisionIcon(item.action)}
              </div>
            </div>

            {/* Content Card */}
            <div className="flex-1 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-white">
                    {item.action || "Revision Action"}
                  </span>
                  <Badge variant="outline" className={cn("text-[9px] font-black px-2 py-0 h-4 border shadow-sm", getStatusBadgeColor(item.action))}>
                    {item.action}
                  </Badge>
                </div>
                <span className="text-[10px] font-mono text-zinc-600 font-bold">
                  #{item.id.substring(0, 8)}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-900/40 border border-border backdrop-blur-sm group-hover:border-white/10 transition-all shadow-inner">
                {item.notes || item.reason ? (
                  <p className="text-xs text-zinc-300 font-medium leading-relaxed italic pr-4">
                    &quot;{item.notes || item.reason}&quot;
                  </p>
                ) : (
                  <p className="text-[10px] text-zinc-600 italic font-medium">No specific notes provided for this revision</p>
                )}

                <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-lg bg-zinc-800 flex items-center justify-center">
                      <User className="w-3 h-3 text-zinc-500" />
                    </div>
                    <span className="text-[9px] font-black text-zinc-400 uppercase tracking-wider">
                      {item.causer || "System Admin"}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1.5 text-zinc-500">
                    <Clock className="w-3 h-3" />
                    <span className="text-[9px] font-bold">
                      {item.createdAt ? format(new Date(item.createdAt), "MMM d, HH:mm") : "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {/* Origin Marker */}
        <div className="relative flex gap-6 mt-4">
           <div className="relative z-10 flex-none flex items-center justify-center">
              <div className="w-10 h-10 rounded-full border border-border bg-zinc-950 flex items-center justify-center opacity-30">
                <ChevronRight className="w-4 h-4 text-zinc-600 rotate-90" />
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-800">Origin Point</span>
            </div>
        </div>
      </div>
    </div>
  );
}
