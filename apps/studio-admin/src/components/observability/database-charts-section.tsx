import React from "react";
import {
  AreaChart, Area, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from "recharts";
import { Card } from "@k2net/ui";
import type { ChartPoint } from "@/hooks/useDbObservability";

export function CustomTooltip({
  active, payload, label, unit = ""
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
  unit?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg text-xs">
      <p className="text-foreground/75 dark:text-muted-foreground mb-1.5 font-mono">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full shrink-0" style={{ background: p.color }} />
          <span className="text-foreground/75 dark:text-muted-foreground">{p.name}:</span>
          <span className="font-semibold text-foreground">{p.value}{unit}</span>
        </div>
      ))}
    </div>
  );
}

export function ChartCard({
  title, children, source
}: {
  title: string;
  children: React.ReactNode;
  source?: string;
}) {
  return (
    <Card className="p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {source && (
          <span className="text-[10px] font-mono text-foreground/75 dark:text-muted-foreground/70 bg-muted px-1.5 py-0.5 rounded">
            {source}
          </span>
        )}
      </div>
      {children}
    </Card>
  );
}

export function DatabaseChartsSection({
  charts,
}: {
  charts: {
    memory: ChartPoint[];
    cpu: ChartPoint[];
    network: ChartPoint[];
    iops: ChartPoint[];
    connections: ChartPoint[];
    diskThroughput: ChartPoint[];
  };
}) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {/* 1. Memory Usage */}
      <ChartCard title="Memory Usage" source="Prometheus · node_memory">
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={charts.memory} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="memUsed" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.4} />
                <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="memCache" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.35} />
                <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.5} />
            <XAxis dataKey="time" tick={{ fontSize: 9, fill: "var(--muted-foreground)" }} tickLine={false} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 9, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} unit=" MB" width={52} />
            <Tooltip content={<CustomTooltip unit=" MB" />} />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            <Area type="monotone" dataKey="used" name="Used" stackId="1" stroke="var(--chart-1)" fill="url(#memUsed)" strokeWidth={1.5} dot={false} />
            <Area type="monotone" dataKey="cacheBuffers" name="Cache+Buf" stackId="1" stroke="var(--chart-2)" fill="url(#memCache)" strokeWidth={1.5} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* 2. CPU Usage */}
      <ChartCard title="CPU Usage" source="Prometheus · node_cpu">
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={charts.cpu} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="cpuGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--chart-3)" stopOpacity={0.45} />
                <stop offset="95%" stopColor="var(--chart-3)" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.5} />
            <XAxis dataKey="time" tick={{ fontSize: 9, fill: "var(--muted-foreground)" }} tickLine={false} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 9, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} unit="%" domain={[0, 100]} width={36} />
            <Tooltip content={<CustomTooltip unit="%" />} />
            <Area type="monotone" dataKey="cpu" name="CPU" stroke="var(--chart-3)" fill="url(#cpuGrad)" strokeWidth={1.5} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* 3. Network Throughput */}
      <ChartCard title="Network Throughput" source="Prometheus · node_network">
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={charts.network} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="netIn" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.4} />
                <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="netOut" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--chart-5)" stopOpacity={0.4} />
                <stop offset="95%" stopColor="var(--chart-5)" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.5} />
            <XAxis dataKey="time" tick={{ fontSize: 9, fill: "var(--muted-foreground)" }} tickLine={false} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 9, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} unit=" KB/s" width={52} />
            <Tooltip content={<CustomTooltip unit=" KB/s" />} />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            <Area type="monotone" dataKey="in" name="Inbound" stroke="var(--chart-2)" fill="url(#netIn)" strokeWidth={1.5} dot={false} />
            <Area type="monotone" dataKey="out" name="Outbound" stroke="var(--chart-5)" fill="url(#netOut)" strokeWidth={1.5} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* 4. Disk IOPS */}
      <ChartCard title="Disk IOPS" source="Prometheus · node_disk">
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={charts.iops} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.5} />
            <XAxis dataKey="time" tick={{ fontSize: 9, fill: "var(--muted-foreground)" }} tickLine={false} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 9, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} unit=" ops/s" width={52} />
            <Tooltip content={<CustomTooltip unit=" ops/s" />} />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            <Line type="monotone" dataKey="read" name="Read" stroke="var(--chart-4)" strokeWidth={1.5} dot={false} />
            <Line type="monotone" dataKey="write" name="Write" stroke="var(--chart-1)" strokeWidth={1.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* 5. DB Connection Pool (HikariCP) */}
      <ChartCard title="DB Connection Pool" source="Prometheus · hikaricp">
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={charts.connections} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="connActive" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.4} />
                <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="connIdle" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.35} />
                <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.5} />
            <XAxis dataKey="time" tick={{ fontSize: 9, fill: "var(--muted-foreground)" }} tickLine={false} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 9, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} width={32} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            <Area type="monotone" dataKey="active" name="Active" stackId="1" stroke="var(--chart-1)" fill="url(#connActive)" strokeWidth={1.5} dot={false} />
            <Area type="monotone" dataKey="idle" name="Idle" stackId="1" stroke="var(--chart-2)" fill="url(#connIdle)" strokeWidth={1.5} dot={false} />
            <Area type="monotone" dataKey="pending" name="Pending" stackId="1" stroke="var(--chart-3)" fill="transparent" strokeWidth={1.5} strokeDasharray="4 2" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* 6. Disk Throughput */}
      <ChartCard title="Disk Throughput" source="Prometheus · node_disk">
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={charts.diskThroughput} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.5} />
            <XAxis dataKey="time" tick={{ fontSize: 9, fill: "var(--muted-foreground)" }} tickLine={false} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 9, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} unit=" KB/s" width={52} />
            <Tooltip content={<CustomTooltip unit=" KB/s" />} />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            <Line type="monotone" dataKey="read" name="Read" stroke="var(--chart-4)" strokeWidth={1.5} dot={false} />
            <Line type="monotone" dataKey="write" name="Write" stroke="var(--chart-5)" strokeWidth={1.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
