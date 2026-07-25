"use client";

import { Card, CardContent, CardHeader, CardTitle, Badge, PageLayout } from "@k2net/ui";
import { KeyRound, Users, ShieldAlert, CheckCircle2, XCircle, Info } from "lucide-react";
import { authEventsMock } from "@/lib/mock-data/observability-mock";

const eventIcon = (type: string) => {
  if (type === "success") return <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />;
  if (type === "error") return <XCircle className="h-3.5 w-3.5 text-rose-500 shrink-0" />;
  if (type === "warning") return <ShieldAlert className="h-3.5 w-3.5 text-amber-500 shrink-0" />;
  return <Info className="h-3.5 w-3.5 text-muted-foreground shrink-0" />;
};

export default function IdentityPage() {
  return (
    <PageLayout variant="dashboard" spaceY="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-5">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2 tracking-tight">
            <KeyRound className="h-5 w-5 text-primary" />
            Identity & Auth
          </h1>
          <p className="text-xs text-muted-foreground">
            Keycloak session monitoring, authentication events, and IAM service health.
          </p>
        </div>
        <Badge className="border-amber-500/20 bg-amber-500/10 text-amber-500 text-[10px]">MOCK DATA</Badge>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Active Sessions", value: "24", sub: "Current Keycloak active sessions", icon: Users },
          { label: "Total Realm Users", value: "312", sub: "Users in realm: ftth-gis", icon: Users },
          { label: "Failed Logins (24h)", value: "7", sub: "5 brute-force blocks detected", icon: ShieldAlert },
          { label: "MFA Adoption", value: "68%", sub: "213 / 312 users with TOTP enabled", icon: KeyRound },
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

      {/* IAM Service Health */}
      <Card>
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="text-sm font-semibold text-foreground">IAM Service Connections</CardTitle>
        </CardHeader>
        <CardContent className="p-0 divide-y divide-border">
          {[
            { service: "Spring Boot → Keycloak", status: "CONNECTED", latency: "4ms", detail: "JWT validation · OpenID Connect" },
            { service: "Kong → Keycloak", status: "CONNECTED", latency: "2ms", detail: "JWT plugin · Token introspection" },
            { service: "Keycloak → PostgreSQL (keycloak_db)", status: "CONNECTED", latency: "1ms", detail: "Session & user persistence" },
          ].map((s) => (
            <div key={s.service} className="flex items-center justify-between px-5 py-3 hover:bg-muted/20 transition-colors">
              <div className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-primary animate-pulse shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">{s.service}</p>
                  <p className="text-xs text-muted-foreground">{s.detail}</p>
                </div>
              </div>
              <div className="text-right">
                <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20">{s.status}</Badge>
                <p className="text-xs text-muted-foreground mt-0.5">Latency: {s.latency}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Auth Audit Log Table */}
      <Card>
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="text-sm font-semibold text-foreground">Authentication Event Log</CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">Recent Keycloak events from the last 24 hours.</p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-[16px_1fr_140px_100px_120px] px-5 py-2 border-b border-border bg-muted/30 gap-3">
            {["", "Event", "User", "IP Address", "Timestamp"].map((h, i) => (
              <span key={i} className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{h}</span>
            ))}
          </div>
          <div className="divide-y divide-border">
            {authEventsMock.map((e) => (
              <div key={e.id} className="grid grid-cols-[16px_1fr_140px_100px_120px] px-5 py-3 hover:bg-muted/20 transition-colors items-center gap-3">
                {eventIcon(e.type)}
                <p className="text-sm font-medium text-foreground">{e.event}</p>
                <p className="text-xs text-muted-foreground truncate">{e.user}</p>
                <p className="text-xs font-mono text-muted-foreground">{e.ip}</p>
                <p className="text-[10px] font-mono text-muted-foreground">{e.timestamp}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </PageLayout>
  );
}
