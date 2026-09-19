import { ShieldAlert, ShieldCheck, AlertTriangle, Info, ArrowUpRight } from "lucide-react";
import { Link } from "@/lib/navigation-compat";
import { Button } from "@k2net/ui";
import { cn } from "@/lib/utils";
import type { SecurityAuditItem } from "../recent-operations-types";

interface SecurityAuditTabProps {
  items: SecurityAuditItem[];
  loading: boolean;
}

export function SecurityAuditTab({ items, loading }: SecurityAuditTabProps) {
  if (loading) {
    return (
      <div className="space-y-2.5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-14 animate-pulse rounded-xl border border-border bg-card/20" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card/40 p-8 text-center text-xs text-muted-foreground">
        <ShieldCheck className="mx-auto size-8 text-primary mb-2 opacity-80" />
        Tidak ada event audit keamanan sensitif dalam 24 jam terakhir. Sistem dalam status aman.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((audit) => {
        const isCritical = audit.severity === "CRITICAL";
        const isWarning = audit.severity === "WARNING";

        return (
          <div
            key={audit.id}
            className="flex flex-col justify-between gap-3 rounded-xl border border-border bg-card/60 p-3 transition-all duration-200 hover:bg-card/95 sm:flex-row sm:items-center"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg border shrink-0",
                  isCritical
                    ? "border-rose-500/30 bg-rose-500/10 text-rose-400"
                    : isWarning
                    ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
                    : "border-sky-500/30 bg-sky-500/10 text-sky-400"
                )}
              >
                {isCritical ? (
                  <ShieldAlert className="size-4" />
                ) : isWarning ? (
                  <AlertTriangle className="size-4" />
                ) : (
                  <Info className="size-4" />
                )}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-foreground font-mono truncate">
                    {audit.action}
                  </span>
                  <span
                    className={cn(
                      "inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-mono font-semibold border",
                      isCritical
                        ? "bg-rose-500/15 text-rose-400 border-rose-500/25"
                        : isWarning
                        ? "bg-amber-500/15 text-amber-400 border-amber-500/25"
                        : "bg-sky-500/15 text-sky-400 border-sky-500/25"
                    )}
                  >
                    {audit.severity}
                  </span>
                </div>
                <p className="mt-0.5 text-[10px] text-muted-foreground truncate">
                  <span className="text-foreground/80 font-medium">{audit.actor || "system"}</span>{" "}
                  {audit.targetTenant && <span>• Target: <span className="font-mono text-primary/90">{audit.targetTenant}</span></span>}{" "}
                  {audit.details && <span className="text-muted-foreground/70">• {audit.details}</span>}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 sm:justify-end shrink-0 pl-11 sm:pl-0">
              <div className="text-right">
                <span className="text-[10px] font-mono text-muted-foreground">
                  {audit.timestamp} WIB
                </span>
                {audit.ipAddress && (
                  <p className="text-[9px] font-mono text-muted-foreground/60">{audit.ipAddress}</p>
                )}
              </div>

              <Button
                variant="ghost"
                size="sm"
                asChild
                className="h-7 px-2 text-[10px] text-muted-foreground hover:text-primary gap-1"
              >
                <Link href="/audit">
                  <span>Log Details</span>
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
