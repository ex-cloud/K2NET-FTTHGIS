"use client";

import { Card, CardContent, CardHeader, CardTitle, Badge, PageLayout } from "@k2net/ui";
import { Globe, ShieldCheck, TrendingUp, AlertTriangle } from "lucide-react";
import { kongRoutesMock, kongTrafficMock } from "@/lib/mock-data/observability-mock";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

export default function ApiGatewayPage() {
  return (
    <PageLayout variant="dashboard" spaceY="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-5">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2 tracking-tight">
            <Globe className="h-5 w-5 text-primary" />
            API Gateway Monitor
          </h1>
          <p className="text-xs text-muted-foreground">
            Kong & Traefik ingress traffic, route health, error rates, and SSL certificate status.
          </p>
        </div>
        <Badge className="border-amber-500/20 bg-amber-500/10 text-amber-500 text-[10px]">MOCK DATA</Badge>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Ingress (24h)", value: "48,291", sub: "HTTP/HTTPS requests via Kong", icon: TrendingUp },
          { label: "Avg Latency (p95)", value: "24ms", sub: "p99: 87ms · all upstream services", icon: Globe },
          { label: "Global Error Rate", value: "0.12%", sub: "58 errors · 4xx: 41, 5xx: 17", icon: AlertTriangle },
          { label: "SSL Certificate", value: "Valid", sub: "Traefik · Expires: 89 days", icon: ShieldCheck },
        ].map((c) => (
          <Card key={c.label} className="p-5 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{c.label}</span>
              <c.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold text-foreground">{c.value}</p>
            <p className="text-xs text-muted-foreground">{c.sub}</p>
          </Card>
        ))}
      </div>

      {/* Kong Traffic Area Chart */}
      <Card>
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="text-sm font-semibold text-foreground">HTTP Traffic via Kong — Last 10 Hours</CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">Requests routed per upstream service group.</p>
        </CardHeader>
        <CardContent className="pt-4">
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={kongTrafficMock}>
              <defs>
                <linearGradient id="colorApi" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorDb" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="hour" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} width={28} />
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
              <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="api" name="API Gateway" stroke="var(--primary)" fill="url(#colorApi)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="gateways" name="Go Gateways" stroke="#0ea5e9" fill="url(#colorDb)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Kong Route Status Table */}
      <Card>
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="text-sm font-semibold text-foreground">Active Kong Routes</CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">All configured routes with rate-limit and JWT plugin status.</p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-[120px_1fr_80px_80px_60px] px-5 py-2 border-b border-border bg-muted/30">
            {["Route", "Upstream", "Rate Limit", "JWT", "Status"].map((h) => (
              <span key={h} className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{h}</span>
            ))}
          </div>
          <div className="divide-y divide-border">
            {kongRoutesMock.map((r) => (
              <div key={r.route} className="grid grid-cols-[120px_1fr_80px_80px_60px] px-5 py-3 hover:bg-muted/20 transition-colors items-center">
                <p className="text-xs font-mono text-foreground">{r.route}</p>
                <p className="text-xs text-muted-foreground font-mono">{r.upstream}</p>
                <p className="text-xs text-muted-foreground">{r.rateLimit}</p>
                <Badge className="text-[10px] w-fit bg-primary/10 text-primary border-primary/20">Active</Badge>
                <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </PageLayout>
  );
}
