import React from "react";
import { Badge } from "@k2net/ui";
import { ArrowRight, ExternalLink } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
} from "recharts";
import type { ServiceHealthRow } from "@/hooks/useServiceHealthSparkline";
import type { ThroughputPoint } from "@/lib/actions/health";

export function MiniBarChart({ data, unit }: { data: number[]; unit: string }) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-0.5 h-8">
      {data.map((v, i) => (
        <div
          key={i}
          title={`${v} ${unit}`}
          className="w-1.5 bg-primary rounded-sm opacity-70 hover:opacity-100 hover:scale-y-110 transition-all cursor-help"
          style={{ height: `${Math.max(10, (v / max) * 100)}%` }}
        />
      ))}
    </div>
  );
}

export function ServiceListView({
  rows,
  sparklineLoading,
  onServiceClick,
}: {
  rows: ServiceHealthRow[];
  sparklineLoading: boolean;
  onServiceClick: (svc: ServiceHealthRow) => void;
}) {
  return (
    <div className="divide-y divide-border">
      {rows.map((svc) => (
        <div
          key={svc.key}
          onClick={() => onServiceClick(svc)}
          className="flex items-center justify-between px-5 py-3 hover:bg-muted/30 transition-colors group/row cursor-pointer"
        >
          <div className="flex items-center gap-3 min-w-0">
            <span
              className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                svc.status === "up"
                  ? "bg-primary shadow-[0_0_8px_rgba(var(--primary-rgb,16,185,129),0.5)]"
                  : svc.status === "down"
                  ? "bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.5)]"
                  : "bg-muted-foreground"
              }`}
            />
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold text-foreground group-hover/row:text-primary transition-colors truncate">
                {svc.name}
              </span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                {svc.category}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-6 shrink-0">
            <MiniBarChart data={svc.bars} unit={svc.unit} />
            <span className="text-xs text-muted-foreground w-24 text-right tabular-nums font-mono">
              {sparklineLoading ? "…" : `${svc.rps} ${svc.unit}`}
            </span>
            <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover/row:opacity-100 group-hover/row:translate-x-1 transition-all" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ServiceTableView({
  rows,
  onServiceClick,
}: {
  rows: ServiceHealthRow[];
  onServiceClick: (svc: ServiceHealthRow) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-border text-xs font-bold text-muted-foreground uppercase tracking-wider bg-muted/20">
            <th className="px-5 py-3 w-28">Status</th>
            <th className="px-5 py-3">Service Name</th>
            <th className="px-5 py-3">Category</th>
            <th className="px-5 py-3 text-center w-36">Throughput Trend</th>
            <th className="px-5 py-3 text-right w-32">RPS Value</th>
            <th className="px-5 py-3 w-16" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((svc) => (
            <tr
              key={svc.key}
              onClick={() => onServiceClick(svc)}
              className="hover:bg-muted/30 transition-colors cursor-pointer group/row"
            >
              <td className="px-5 py-3.5">
                <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      svc.status === "up" ? "bg-primary animate-pulse" : svc.status === "down" ? "bg-rose-500" : "bg-muted-foreground"
                    }`}
                  />
                  {svc.status}
                </span>
              </td>
              <td className="px-5 py-3.5 font-semibold text-foreground group-hover/row:text-primary transition-colors text-sm">
                {svc.name}
              </td>
              <td className="px-5 py-3.5 text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                {svc.category}
              </td>
              <td className="px-5 py-3.5 align-middle">
                <div className="flex justify-center">
                  <MiniBarChart data={svc.bars} unit={svc.unit} />
                </div>
              </td>
              <td className="px-5 py-3.5 text-right font-mono text-xs text-foreground font-medium">
                {svc.rps} <span className="text-[10px] text-muted-foreground font-normal">{svc.unit}</span>
              </td>
              <td className="px-5 py-3.5 text-right">
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-30 group-hover/row:opacity-100 transition-opacity" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ServiceCardView({
  rows,
  onServiceClick,
}: {
  rows: ServiceHealthRow[];
  onServiceClick: (svc: ServiceHealthRow) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 p-5">
      {rows.map((svc) => (
        <div
          key={svc.key}
          onClick={() => onServiceClick(svc)}
          className="flex flex-col justify-between p-4 rounded-xl border border-border bg-card/40 hover:bg-card/80 hover:border-primary/30 hover:shadow-[0_4px_20px_rgba(0,0,0,0.2)] transition-all cursor-pointer group/row"
        >
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex flex-col min-w-0">
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                {svc.category}
              </span>
              <span className="text-sm font-bold text-foreground group-hover/row:text-primary transition-colors truncate mt-0.5">
                {svc.name}
              </span>
            </div>
            <Badge
              className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 border ${
                svc.status === "up"
                  ? "bg-primary/10 border-primary/20 text-primary"
                  : svc.status === "down"
                  ? "bg-rose-500/10 border-rose-500/20 text-rose-500 animate-pulse"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {svc.status}
            </Badge>
          </div>

          <div className="flex items-end justify-between gap-4 mt-auto">
            <div className="flex flex-col">
              <span className="text-2xl font-black text-foreground tracking-tight tabular-nums">
                {svc.rps}
              </span>
              <span className="text-[10px] text-muted-foreground uppercase font-medium">
                {svc.unit}
              </span>
            </div>
            <div className="flex items-end gap-3">
              <MiniBarChart data={svc.bars} unit={svc.unit} />
              <ArrowRight className="h-4 w-4 text-muted-foreground opacity-30 group-hover/row:opacity-100 group-hover/row:translate-x-0.5 transition-all mb-1" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function OverviewThroughputChart({
  throughput,
}: {
  throughput: ThroughputPoint[];
}) {
  return (
    <ResponsiveContainer width="100%" height={160}>
      <AreaChart data={throughput}>
        <defs>
          <linearGradient id="throughputGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.4} />
            <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.2} vertical={false} />
        <XAxis
          dataKey="time"
          tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
          axisLine={false}
          tickLine={false}
          dy={8}
        />
        <YAxis
          tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
          axisLine={false}
          tickLine={false}
          width={35}
        />
        <Tooltip
          contentStyle={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            fontSize: 12,
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
          }}
          labelStyle={{ color: "var(--foreground)", fontWeight: "bold" }}
          itemStyle={{ color: "var(--primary)" }}
        />
        <Area
          type="monotone"
          dataKey="requests"
          name="Requests/min"
          stroke="var(--primary)"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#throughputGrad)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
