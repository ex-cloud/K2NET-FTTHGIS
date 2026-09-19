import { ArrowUpRight, CreditCard, Wallet } from "lucide-react";
import { Link } from "@/lib/navigation-compat";
import { Button } from "@k2net/ui";
import { cn } from "@/lib/utils";
import type { BillingEventItem } from "../recent-operations-types";

interface BillingEventsTabProps {
  items: BillingEventItem[];
  loading: boolean;
}

function getStatusMeta(status: string): { label: string; className: string; dot: string } {
  const s = (status ?? "").toUpperCase();
  if (s === "TRIAL")
    return {
      label: "TRIAL",
      dot: "🟡",
      className: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    };
  if (s === "UPGRADED")
    return {
      label: "UPGRADED",
      dot: "🟢",
      className: "bg-primary/15 text-primary border-primary/30",
    };
  if (s === "PAID")
    return {
      label: "PAID",
      dot: "🟢",
      className: "bg-primary/15 text-primary border-primary/30",
    };
  if (s === "ACTIVE")
    return {
      label: "ACTIVE",
      dot: "🟢",
      className: "bg-primary/15 text-primary border-primary/30",
    };
  if (s === "OVERDUE")
    return {
      label: "OVERDUE",
      dot: "🔴",
      className: "bg-rose-500/15 text-rose-400 border-rose-500/30",
    };
  return {
    label: s || "UNKNOWN",
    dot: "⚪",
    className: "bg-muted text-muted-foreground border-border/60",
  };
}

function getEventIcon(eventType: string): string {
  const t = (eventType ?? "").toUpperCase();
  if (t === "UPGRADE") return "📈";
  if (t === "PLAN_ACTIVE" || t === "PAYMENT") return "💳";
  if (t === "TRIAL_REMINDER") return "⏳";
  if (t === "SIGNUP") return "🆕";
  if (t === "OVERDUE") return "🔔";
  return "📋";
}

export function BillingEventsTab({ items, loading }: BillingEventsTabProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-11 animate-pulse rounded-xl border border-border bg-card/20" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card/30 p-8 text-center space-y-3">
        <div className="flex justify-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted/40 border border-border text-muted-foreground">
            <Wallet className="size-5 opacity-50" />
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">Tidak Ada Event Billing</p>
          <p className="text-[11px] text-muted-foreground mt-1">
            Pembayaran Xendit, upgrade paket, dan pengingat trial akan muncul di sini.
          </p>
        </div>
        <Button variant="ghost" size="sm" asChild className="h-7 px-2.5 text-[11px] gap-1 text-muted-foreground hover:text-primary">
          <Link href="/organizations">
            <CreditCard className="size-3" />
            <span>Kelola Langganan</span>
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
              <th className="py-2.5 px-3.5 whitespace-nowrap">Waktu</th>
              <th className="py-2.5 px-3.5">Tenant ISP</th>
              <th className="py-2.5 px-3.5">Event Billing</th>
              <th className="py-2.5 px-3.5">Nilai / Perubahan</th>
              <th className="py-2.5 px-3.5">Status</th>
              <th className="py-2.5 px-3.5 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {items.map((event) => {
              const statusMeta = getStatusMeta(event.status);
              const eventIcon = getEventIcon(event.eventType);
              const eventLabel = event.eventLabel || event.eventType || "—";
              const valueDisplay = event.valueChange || event.amount || event.planName || "—";

              return (
                <tr
                  key={event.id}
                  className="group hover:bg-card/95 transition-colors duration-150"
                >
                  {/* Waktu */}
                  <td className="py-2.5 px-3.5 font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                    {event.timestamp}
                  </td>

                  {/* Tenant ISP */}
                  <td className="py-2.5 px-3.5">
                    <span className="font-semibold text-foreground block truncate max-w-[140px]">
                      {event.orgName}
                    </span>
                    <span className="block text-[10px] font-mono text-muted-foreground/60 truncate max-w-[140px]">
                      {event.orgSlug}.gis.kdua.net
                    </span>
                  </td>

                  {/* Event Billing */}
                  <td className="py-2.5 px-3.5">
                    <span className="inline-flex items-center gap-1.5 text-foreground">
                      <span className="text-sm shrink-0" aria-hidden>{eventIcon}</span>
                      <span className="font-medium">{eventLabel}</span>
                    </span>
                  </td>

                  {/* Nilai / Perubahan */}
                  <td className="py-2.5 px-3.5">
                    <span
                      className={cn(
                        "font-mono text-[11px] font-medium",
                        event.status === "TRIAL"
                          ? "text-amber-400"
                          : event.status === "OVERDUE"
                          ? "text-rose-400"
                          : "text-foreground/90"
                      )}
                    >
                      {valueDisplay}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="py-2.5 px-3.5 whitespace-nowrap">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[9px] font-mono font-bold",
                        statusMeta.className
                      )}
                    >
                      <span aria-hidden>{statusMeta.dot}</span>
                      <span>{statusMeta.label}</span>
                    </span>
                  </td>

                  {/* Aksi */}
                  <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="h-7 px-2 text-[11px] text-muted-foreground hover:text-primary gap-1 cursor-pointer"
                    >
                      <Link href={`/organizations/${event.orgSlug}`}>
                        <span>Detail</span>
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
