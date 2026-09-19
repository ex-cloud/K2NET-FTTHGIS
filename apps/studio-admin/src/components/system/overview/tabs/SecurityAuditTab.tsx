import { ShieldCheck, ArrowUpRight, Info } from "lucide-react";
import { Link } from "@/lib/navigation-compat";
import { Button } from "@k2net/ui";
import { cn } from "@/lib/utils";
import type { SecurityAuditItem } from "../recent-operations-types";

interface SecurityAuditTabProps {
  items: SecurityAuditItem[];
  loading: boolean;
}

function getSeverityMeta(severity: string) {
  const s = (severity ?? "").toUpperCase();
  if (s === "CRITICAL")
    return {
      emoji: "🔴",
      label: "CRITICAL",
      badge: "bg-rose-500/15 text-rose-400 border-rose-500/30",
      row: "hover:bg-rose-500/5",
      dot: "bg-rose-500",
    };
  if (s === "WARNING" || s === "WARN")
    return {
      emoji: "🟡",
      label: "WARNING",
      badge: "bg-amber-500/15 text-amber-400 border-amber-500/30",
      row: "hover:bg-amber-500/5",
      dot: "bg-amber-400",
    };
  return {
    emoji: "🔵",
    label: "INFO",
    badge: "bg-sky-500/15 text-sky-400 border-sky-500/30",
    row: "hover:bg-card/90",
    dot: "bg-sky-400",
  };
}

/** Format actor: strip Keycloak internal prefixes, show human-readable form */
function formatActor(actor: string): { main: string; sub?: string } {
  if (!actor) return { main: "system-cron" };
  if (actor.includes("@"))
    return { main: actor };
  if (actor.startsWith("token-"))
    return { main: "API Token", sub: actor.replace("token-", "") };
  if (actor.startsWith("session-"))
    return { main: "Web Session", sub: actor.replace("session-", "") };
  return { main: actor };
}

export function SecurityAuditTab({ items, loading }: SecurityAuditTabProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 animate-pulse rounded-xl border border-border bg-card/20" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card/40 p-8 text-center space-y-3">
        <div className="flex justify-center">
          <div className="p-2.5 rounded-full bg-primary/10 border border-primary/20 text-primary">
            <ShieldCheck className="size-6" />
          </div>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-foreground">Tidak Ada Event Berisiko Tinggi</h4>
          <p className="text-[11px] text-muted-foreground mt-1 max-w-xs mx-auto">
            Tidak ada aktivitas keamanan sensitif (impersonasi, privilege change, realm sync)
            yang terdeteksi dalam 24 jam terakhir.
          </p>
        </div>
        <Button variant="ghost" size="sm" asChild className="h-7 px-2.5 text-[11px] gap-1 text-muted-foreground hover:text-primary">
          <Link href="/audit">
            <Info className="size-3" />
            <span>Lihat Semua Audit Logs</span>
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card/60">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-border/80 bg-muted/40 text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
              <th className="py-2.5 px-3.5 whitespace-nowrap">Waktu (WIB)</th>
              <th className="py-2.5 px-3.5">Aktor / Email</th>
              <th className="py-2.5 px-3.5">Target Tenant</th>
              <th className="py-2.5 px-3.5">Aksi Keamanan</th>
              <th className="py-2.5 px-3.5 whitespace-nowrap">Tingkat Risiko</th>
              <th className="py-2.5 px-3.5 text-right whitespace-nowrap">Log Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {items.map((audit) => {
              const meta = getSeverityMeta(audit.severity);
              const actor = formatActor(audit.actor);

              return (
                <tr
                  key={audit.id}
                  className={cn("group transition-colors duration-150", meta.row)}
                >
                  {/* Waktu (WIB) */}
                  <td className="py-2.5 px-3.5 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span className={cn("size-1.5 rounded-full shrink-0", meta.dot)} />
                      <span className="font-mono text-[11px] text-muted-foreground">
                        {/* Strip trailing "WIB" if already appended by backend */}
                        {(audit.timestamp ?? "").replace(/ WIB$/, "")}
                      </span>
                      <span className="text-[9px] text-muted-foreground/50 font-mono">WIB</span>
                    </div>
                  </td>

                  {/* Aktor / Email */}
                  <td className="py-2.5 px-3.5">
                    <span className="font-medium text-foreground block truncate max-w-[130px]">
                      {actor.main}
                    </span>
                    {actor.sub && (
                      <span className="text-[10px] font-mono text-muted-foreground/60 block truncate max-w-[130px]">
                        {actor.sub}
                      </span>
                    )}
                    {audit.ipAddress && (
                      <span className="text-[9px] font-mono text-muted-foreground/50 block">
                        {audit.ipAddress}
                      </span>
                    )}
                  </td>

                  {/* Target Tenant */}
                  <td className="py-2.5 px-3.5">
                    <span className="text-foreground/85 font-mono text-[11px] truncate block max-w-[120px]">
                      {audit.targetTenant || "Platform Wide"}
                    </span>
                  </td>

                  {/* Aksi Keamanan */}
                  <td className="py-2.5 px-3.5">
                    <span className="font-mono text-[11px] font-semibold text-foreground truncate block max-w-[190px]"
                      title={audit.action}>
                      {audit.action}
                    </span>
                    {audit.details && (
                      <span className="text-[10px] text-muted-foreground/70 truncate block max-w-[190px]"
                        title={audit.details}>
                        {audit.details}
                      </span>
                    )}
                  </td>

                  {/* Tingkat Risiko */}
                  <td className="py-2.5 px-3.5 whitespace-nowrap">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[9px] font-mono font-bold",
                        meta.badge
                      )}
                    >
                      <span>{meta.emoji}</span>
                      <span>{meta.label}</span>
                    </span>
                  </td>

                  {/* Log Details */}
                  <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="h-7 px-2 text-[11px] text-muted-foreground hover:text-primary gap-1"
                    >
                      <Link href="/audit">
                        <span>View Logs</span>
                        <ArrowUpRight className="size-3" />
                      </Link>
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
