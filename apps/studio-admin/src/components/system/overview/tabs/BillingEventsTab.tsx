import { ArrowUpRight, CreditCard, Wallet, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { Link } from "@/lib/navigation-compat";
import { Button } from "@k2net/ui";
import { cn } from "@/lib/utils";
import type { BillingEventItem } from "../recent-operations-types";

interface BillingEventsTabProps {
  items: BillingEventItem[];
  loading: boolean;
}

function getStatusMeta(status: string): { label: string; className: string; Icon: React.ReactNode } {
  const s = (status ?? "").toUpperCase();
  if (s === "TRIAL")
    return {
      label: "TRIAL",
      Icon: <Clock className="size-2.5 text-amber-400" />,
      className: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    };
  if (s === "PAID" || s === "ACTIVE")
    return {
      label: "ACTIVE",
      Icon: <CheckCircle2 className="size-2.5 text-primary" />,
      className: "bg-primary/15 text-primary border-primary/30",
    };
  if (s === "OVERDUE")
    return {
      label: "OVERDUE",
      Icon: <AlertCircle className="size-2.5 text-rose-400" />,
      className: "bg-rose-500/15 text-rose-400 border-rose-500/30",
    };
  return {
    label: s || "UNKNOWN",
    Icon: <Clock className="size-2.5 text-muted-foreground" />,
    className: "bg-muted text-muted-foreground border-border/60",
  };
}

function getPlanBadge(plan: string) {
  const p = (plan ?? "").toUpperCase();
  if (p === "ENTERPRISE")
    return "bg-purple-500/15 text-purple-400 border-purple-500/30";
  if (p === "PRO" || p === "PROFESSIONAL")
    return "bg-primary/15 text-primary border-primary/30";
  if (p === "STARTER")
    return "bg-sky-500/15 text-sky-400 border-sky-500/30";
  return "bg-muted text-muted-foreground border-border";
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
            Data langganan aktif, jatuh tempo invoice, dan status paket SaaS akan muncul di sini.
          </p>
        </div>
        <Button variant="ghost" size="sm" asChild className="h-7 px-2.5 text-[11px] gap-1 text-muted-foreground hover:text-primary">
          <Link href="/organizations">
            <CreditCard className="size-3" />
            <span>Kelola Organisasi & Langganan</span>
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
              <th className="py-2.5 px-3.5">Tenant ISP</th>
              <th className="py-2.5 px-3.5">Paket SaaS</th>
              <th className="py-2.5 px-3.5">Status Langganan</th>
              <th className="py-2.5 px-3.5">Nilai / Biaya</th>
              <th className="py-2.5 px-3.5 whitespace-nowrap">Jatuh Tempo / Siklus</th>
              <th className="py-2.5 px-3.5 text-right whitespace-nowrap">Aksi Cepat</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {items.map((event) => {
              const statusMeta = getStatusMeta(event.status);
              const planBadge = getPlanBadge(event.planName);
              const eventLabel = event.eventLabel || "Langganan Aktif";

              return (
                <tr
                  key={event.id}
                  className="group hover:bg-card/95 transition-colors duration-150"
                >
                  {/* Tenant ISP */}
                  <td className="py-2.5 px-3.5">
                    <span className="font-semibold text-foreground block truncate max-w-[150px]">
                      {event.orgName}
                    </span>
                    <span className="block text-[10px] font-mono text-muted-foreground/70 truncate max-w-[150px]">
                      {event.orgSlug}.gis.kdua.net
                    </span>
                  </td>

                  {/* Paket SaaS */}
                  <td className="py-2.5 px-3.5 whitespace-nowrap">
                    <span
                      className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded border text-[9px] font-mono font-bold tracking-wider uppercase",
                        planBadge
                      )}
                    >
                      {event.planName || "PRO"}
                    </span>
                  </td>

                  {/* Status Langganan */}
                  <td className="py-2.5 px-3.5">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[9px] font-mono font-bold",
                          statusMeta.className
                        )}
                      >
                        {statusMeta.Icon}
                        <span>{statusMeta.label}</span>
                      </span>
                      <span className="text-[11px] text-foreground/80 font-medium truncate max-w-[150px]">
                        {eventLabel}
                      </span>
                    </div>
                  </td>

                  {/* Nilai / Biaya */}
                  <td className="py-2.5 px-3.5 whitespace-nowrap">
                    <span
                      className={cn(
                        "font-mono text-[11px] font-semibold",
                        event.status === "TRIAL"
                          ? "text-amber-400"
                          : event.status === "OVERDUE"
                          ? "text-rose-400"
                          : "text-foreground"
                      )}
                    >
                      {event.amount || event.valueChange || "—"}
                    </span>
                  </td>

                  {/* Jatuh Tempo / Siklus */}
                  <td className="py-2.5 px-3.5 font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                    {event.timestamp || "Aktif"}
                  </td>

                  {/* Aksi Cepat */}
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
