import React from "react";

interface DashboardStats {
  totalNodes: number;
  activeNodes: number;
  activeAlerts: number;
  totalNetworkLengthKm: number;
}

interface GlobalStatusSummaryProps {
  stats: DashboardStats | null;
}

export function GlobalStatusSummary({ stats }: GlobalStatusSummaryProps) {
  return (
    <div className="bg-white/60 dark:bg-zinc-900/20 border border-zinc-200/60 dark:border-zinc-800/50 rounded-xl p-6 backdrop-blur-xl shadow-sm dark:shadow-none relative overflow-hidden">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-xl font-black text-zinc-900 dark:text-white">
            Global Network Status
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium tracking-tight mt-1">
            Real-time infrastructure overview
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold text-primary dark:text-primary uppercase">
              {stats?.activeNodes ?? 0} Active
            </span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-rose-500/10 border border-rose-500/20 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-[10px] font-bold text-rose-600 dark:text-rose-500 uppercase">
              {stats?.activeAlerts ?? 0} Alerts
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-zinc-50 dark:bg-zinc-900/40 rounded-lg border border-zinc-200/60 dark:border-zinc-800/50">
          <div className="text-2xl font-black text-zinc-900 dark:text-white">
            {stats?.totalNodes.toLocaleString() ?? "0"}
          </div>
          <div className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mt-1">
            Total Nodes
          </div>
        </div>
        <div className="p-4 bg-zinc-50 dark:bg-zinc-900/40 rounded-lg border border-zinc-200/60 dark:border-zinc-800/50">
          <div className="text-2xl font-black text-primary dark:text-primary">
            {stats?.activeNodes.toLocaleString() ?? "0"}
          </div>
          <div className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mt-1">
            Active Nodes
          </div>
        </div>
        <div className="p-4 bg-zinc-50 dark:bg-zinc-900/40 rounded-lg border border-zinc-200/60 dark:border-zinc-800/50">
          <div className="text-2xl font-black text-rose-600 dark:text-rose-500">
            {stats?.activeAlerts.toLocaleString() ?? "0"}
          </div>
          <div className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mt-1">
            Critical Alerts
          </div>
        </div>
        <div className="p-4 bg-zinc-50 dark:bg-zinc-900/40 rounded-lg border border-zinc-200/60 dark:border-zinc-800/50">
          <div className="text-2xl font-black text-sky-600 dark:text-sky-500">
            {stats?.totalNetworkLengthKm.toFixed(1) ?? "0.0"}
            <span className="text-sm ml-1">km</span>
          </div>
          <div className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mt-1">
            Network Length
          </div>
        </div>
      </div>
    </div>
  );
}
