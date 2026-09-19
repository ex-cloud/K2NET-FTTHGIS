import {
  CheckCircle2,
  ArrowUpRight,
  Database,
  Globe,
  ShieldCheck,
  Server,
} from "lucide-react";
import { Link } from "@/lib/navigation-compat";
import { Button } from "@k2net/ui";
import { cn } from "@/lib/utils";
import type { SystemAlertItem } from "../recent-operations-types";

interface SystemAlertsTabProps {
  items: SystemAlertItem[];
  loading: boolean;
}

function getSeverityMeta(severity: string) {
  const s = (severity ?? "").toLowerCase();
  if (s === "critical")
    return {
      emoji: "🔴",
      label: "CRITICAL",
      cardBorder: "border-rose-500/30 bg-rose-500/5 hover:bg-rose-500/10",
      badgeBg: "border-rose-500/40 text-rose-400 hover:bg-rose-500/20",
    };
  if (s === "warning")
    return {
      emoji: "🟡",
      label: "WARNING",
      cardBorder: "border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10",
      badgeBg: "border-amber-500/40 text-amber-400 hover:bg-amber-500/20",
    };
  return {
    emoji: "🔵",
    label: "INFO",
    cardBorder: "border-sky-500/20 bg-sky-500/5 hover:bg-sky-500/8",
    badgeBg: "border-sky-500/30 text-sky-400 hover:bg-sky-500/10",
  };
}

/** Mini health pill for the "All Clear" empty state */
function HealthPill({
  label,
  icon: Icon,
  ok,
}: {
  label: string;
  icon: typeof Server;
  ok: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-mono font-medium",
        ok
          ? "border-primary/20 bg-primary/8 text-primary"
          : "border-rose-500/25 bg-rose-500/8 text-rose-400"
      )}
    >
      <Icon className="size-3" />
      <span>{label}</span>
      <span>{ok ? "✅" : "❌"}</span>
    </div>
  );
}

export function SystemAlertsTab({ items, loading }: SystemAlertsTabProps) {
  if (loading) {
    return (
      <div className="space-y-2.5">
        {[1, 2].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-xl border border-border bg-card/20" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card/40 p-6 text-center space-y-4">
        {/* Status icon */}
        <div className="flex justify-center">
          <div className="p-2.5 rounded-full bg-primary/10 border border-primary/20 text-primary">
            <CheckCircle2 className="size-6" />
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-foreground">
            Semua Layanan Beroperasi Normal
          </h4>
          <p className="text-[11px] text-muted-foreground mt-1 max-w-sm mx-auto">
            Tidak ada insiden aktif atau anomali telemetri yang terdeteksi pada microservices,
            database, maupun gateway API.
          </p>
        </div>

        {/* Mini health indicators */}
        <div className="flex flex-wrap justify-center gap-1.5 pt-1">
          <HealthPill label="API Gateway" icon={Globe} ok />
          <HealthPill label="Core DB" icon={Database} ok />
          <HealthPill label="Keycloak IAM" icon={ShieldCheck} ok />
          <HealthPill label="Map Gateway" icon={Server} ok />
        </div>

        <Button
          variant="ghost"
          size="sm"
          asChild
          className="h-7 px-2.5 text-[11px] gap-1 text-muted-foreground hover:text-primary"
        >
          <Link href="/observability/overview">
            <span>View Full Observability</span>
            <ArrowUpRight className="size-3" />
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {items.map((alert) => {
        const meta = getSeverityMeta(alert.severity);

        return (
          <div
            key={alert.id}
            className={cn(
              "flex flex-col justify-between gap-3 rounded-xl border p-3.5 transition-all duration-200 sm:flex-row sm:items-center",
              meta.cardBorder
            )}
          >
            {/* Left: emoji + content */}
            <div className="flex items-start gap-3 min-w-0">
              <span className="text-base shrink-0 mt-0.5" aria-label={meta.label}>
                {meta.emoji}
              </span>

              <div className="min-w-0 space-y-0.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-xs font-semibold text-foreground">
                    {alert.title}
                  </h4>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    (Triggered {alert.triggerTime || "recently"})
                  </span>
                </div>

                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {alert.message}
                </p>

                {alert.service && (
                  <p className="text-[10px] font-mono text-muted-foreground/60 mt-0.5">
                    Scope:{" "}
                    <span className="font-semibold text-foreground/75">{alert.service}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Right: action button */}
            <div className="flex items-center justify-end shrink-0 pl-7 sm:pl-0">
              <Button
                variant="outline"
                size="sm"
                asChild
                className={cn(
                  "h-8 px-3 text-xs gap-1.5 font-medium cursor-pointer",
                  meta.badgeBg
                )}
              >
                <Link href={alert.actionUrl || "/observability/overview"}>
                  <span>{alert.actionLabel || "Investigate"}</span>
                  <ArrowUpRight className="size-3" />
                </Link>
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
