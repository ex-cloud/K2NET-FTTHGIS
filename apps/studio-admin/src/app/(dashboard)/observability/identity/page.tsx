

import { Card, CardContent, CardHeader, CardTitle, Badge, Button, PageLayout, ActionTooltip } from "@k2net/ui";
import {
  KeyRound, Users, ShieldAlert, CheckCircle2, XCircle,
  Info, RefreshCw, AlertCircle, Unplug,
} from "lucide-react";
import { useKeycloakObservability, ServiceConnection } from "@/hooks/useKeycloakObservability";

// ─── Event severity icon ────────────────────────────────────────────────────────
function EventIcon({ severity }: { severity: "success" | "error" | "warning" | "info" }) {
  if (severity === "success") return <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />;
  if (severity === "error")   return <XCircle       className="h-3.5 w-3.5 text-rose-500 shrink-0" />;
  if (severity === "warning") return <ShieldAlert   className="h-3.5 w-3.5 text-amber-500 shrink-0" />;
  return <Info className="h-3.5 w-3.5 text-muted-foreground shrink-0" />;
}

// ─── IAM Connection row ─────────────────────────────────────────────────────────
function ConnectionRow({ conn }: { conn: ServiceConnection }) {
  const connected = conn.status === "CONNECTED";
  return (
    <div className="flex items-center justify-between px-5 py-3 hover:bg-muted/20 transition-colors">
      <div className="flex items-center gap-3">
        <span
          className={`h-2 w-2 rounded-full shrink-0 ${connected ? "bg-primary animate-pulse shadow-[0_0_6px_var(--primary)]" : "bg-rose-500"}`}
        />
        <div>
          <p className="text-sm font-medium text-foreground">{conn.service}</p>
          <p className="text-xs text-foreground/75 dark:text-muted-foreground">{conn.detail}</p>
        </div>
      </div>
      <div className="text-right shrink-0 ml-4">
        <Badge
          className={`text-[10px] font-mono ${
            connected
              ? "bg-primary/10 text-primary border-primary/20"
              : "bg-rose-500/10 text-rose-500 border-rose-500/20"
          }`}
        >
          {conn.status}
        </Badge>
        <p className="text-xs text-foreground/75 dark:text-muted-foreground mt-0.5">
          Latency: {conn.latency}
        </p>
      </div>
    </div>
  );
}

// ─── KPI Card ────────────────────────────────────────────────────────────────────
function KpiCard({
  label, value, sub, icon: Icon, highlight,
}: {
  label: string; value: string; sub: string;
  icon: React.ElementType; highlight?: boolean;
}) {
  return (
    <Card glowingEffect className="p-5 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-foreground/75 dark:text-muted-foreground">
          {label}
        </span>
        <Icon className={`h-4 w-4 ${highlight ? "text-rose-500" : "text-muted-foreground"}`} />
      </div>
      <p className={`text-2xl font-bold ${highlight ? "text-rose-500" : "text-foreground"}`}>
        {value}
      </p>
      <p className="text-xs text-foreground/75 dark:text-muted-foreground">{sub}</p>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────────
export default function IdentityPage() {
  const { events, stats, loading, error, refresh, formatEventType, formatEventTime } =
    useKeycloakObservability();

  const keycloakHealthy = stats.status === "healthy";
  const hasConnections   = stats.connections.length > 0;
  const allConnected     = hasConnections && stats.connections.every(c => c.status === "CONNECTED");

  return (
    <PageLayout variant="workspace" spaceY="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-5">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2 tracking-tight">
            <KeyRound className="h-5 w-5 text-primary" />
            Identity &amp; Auth
          </h1>
          <p className="text-xs text-foreground/75 dark:text-muted-foreground">
            Keycloak session monitoring, authentication events, and IAM service health &middot; real-time via Admin API.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {error && (
            <div className="flex items-center gap-1 text-[10px] text-amber-500">
              <AlertCircle className="h-3 w-3" />
              {error}
            </div>
          )}
          <Badge className={`text-[10px] ${keycloakHealthy ? "border-primary/20 bg-primary/10 text-primary" : "border-amber-500/20 bg-amber-500/10 text-amber-500"}`}>
            {loading ? "LOADING…" : keycloakHealthy ? "LIVE DATA" : "DEGRADED"}
          </Badge>
          <ActionTooltip label="Segarkan Data Keycloak IAM" shortcut="R">
            <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-primary" : ""}`} />
              Refresh
            </Button>
          </ActionTooltip>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={Users}
          label="Active Sessions"
          value={loading ? "…" : String(stats.activeSessions)}
          sub={`Current Keycloak sessions · realm: ${stats.realm}`}
        />
        <KpiCard
          icon={Users}
          label="Total Realm Users"
          value={loading ? "…" : String(stats.totalUsers)}
          sub={`Registered users in ${stats.realm}`}
        />
        <KpiCard
          icon={ShieldAlert}
          label="Failed Logins (24h)"
          value={loading ? "…" : String(stats.failedLogins24h)}
          sub="LOGIN_ERROR events from Keycloak"
          highlight={stats.failedLogins24h > 0}
        />
        <KpiCard
          icon={KeyRound}
          label="Keycloak Status"
          value={loading ? "…" : keycloakHealthy ? "Healthy" : stats.status === "degraded" ? "Degraded" : "Unknown"}
          sub={keycloakHealthy ? "Connected via Admin Client Credentials" : "Admin API unreachable"}
          highlight={!keycloakHealthy && !loading}
        />
      </div>

      {/* IAM Service Connections — dynamic from backend */}
      <Card>
        <CardHeader className="border-b border-border pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-foreground">IAM Service Connections</CardTitle>
            {!loading && (
              <Badge
                className={`text-[10px] font-mono ${
                  allConnected
                    ? "border-primary/20 bg-primary/10 text-primary"
                    : "border-amber-500/20 bg-amber-500/10 text-amber-500"
                }`}
              >
                {allConnected ? "All Connected" : "Partial / Degraded"}
              </Badge>
            )}
          </div>
          <p className="text-xs text-foreground/75 dark:text-muted-foreground mt-0.5">
            Real-time connection health measured from Spring Boot backend.
          </p>
        </CardHeader>
        <CardContent className="p-0 divide-y divide-border">
          {loading && (
            <div className="px-5 py-3 space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center justify-between animate-pulse">
                  <div className="flex items-center gap-3">
                    <span className="h-2 w-2 rounded-full bg-muted" />
                    <div>
                      <div className="h-3.5 bg-muted rounded w-48 mb-1.5" />
                      <div className="h-2.5 bg-muted rounded w-32" />
                    </div>
                  </div>
                  <div className="h-5 bg-muted rounded w-20" />
                </div>
              ))}
            </div>
          )}
          {!loading && stats.connections.length === 0 && (
            <div className="p-8 flex flex-col items-center gap-2 text-center">
              <Unplug className="h-6 w-6 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                IAM connection data unavailable. Keycloak Admin API unreachable.
              </p>
            </div>
          )}
          {!loading &&
            stats.connections.map(conn => (
              <ConnectionRow key={conn.service} conn={conn} />
            ))}
        </CardContent>
      </Card>

      {/* Authentication Event Log — real Keycloak events */}
      <Card>
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="text-sm font-semibold text-foreground">Authentication Event Log</CardTitle>
          <p className="text-xs text-foreground/75 dark:text-muted-foreground mt-0.5">
            Recent auth events from Keycloak Admin API &middot; {events.length} events loaded.
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-[16px_1fr_140px_100px_150px] px-5 py-2 border-b border-border bg-muted/30 gap-3">
            {["", "Event", "User / Client", "IP Address", "Timestamp"].map((h, i) => (
              <span key={i} className="text-[10px] font-bold uppercase tracking-wider text-foreground/75 dark:text-muted-foreground">
                {h}
              </span>
            ))}
          </div>
          <div className="divide-y divide-border">
            {events.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                {loading ? "Loading events…" : "No events loaded. Check Keycloak Admin API connectivity."}
              </div>
            ) : (
              events.map((e, idx) => {
                const { label, severity } = formatEventType(e.type);
                return (
                  <div
                    key={idx}
                    className="grid grid-cols-[16px_1fr_140px_100px_150px] px-5 py-3 hover:bg-muted/20 transition-colors items-center gap-3"
                  >
                    <EventIcon severity={severity} />
                    <p className="text-sm font-medium text-foreground">{label}</p>
                    <p className="text-xs text-foreground/75 dark:text-muted-foreground truncate">
                      {e.userId ?? e.clientId ?? "—"}
                    </p>
                    <p className="text-xs font-mono text-foreground/75 dark:text-muted-foreground">
                      {e.details?.ipAddress ?? "—"}
                    </p>
                    <p className="text-[10px] font-mono text-foreground/75 dark:text-muted-foreground">
                      {formatEventTime(e.time)}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

    </PageLayout>
  );
}
