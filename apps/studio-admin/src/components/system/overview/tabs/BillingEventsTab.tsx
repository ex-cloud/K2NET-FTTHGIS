import { CreditCard, TrendingUp, Sparkles, Clock, ArrowUpRight } from "lucide-react";
import { Link } from "@/lib/navigation-compat";
import { Button } from "@k2net/ui";
import { cn } from "@/lib/utils";
import type { BillingEventItem } from "../recent-operations-types";

interface BillingEventsTabProps {
  items: BillingEventItem[];
  loading: boolean;
}

export function BillingEventsTab({ items, loading }: BillingEventsTabProps) {
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
        Tidak ada catatan billing atau event langganan baru.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((event) => {
        const isPaid = event.status === "PAID" || event.status === "ACTIVE";
        const isTrial = event.status === "TRIAL";

        return (
          <div
            key={event.id}
            className="flex flex-col justify-between gap-3 rounded-xl border border-border bg-card/60 p-3 transition-all duration-200 hover:bg-card/95 sm:flex-row sm:items-center"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg border shrink-0",
                  isPaid
                    ? "border-primary/30 bg-primary/10 text-primary"
                    : isTrial
                    ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
                    : "border-sky-500/30 bg-sky-500/10 text-sky-400"
                )}
              >
                {event.eventType === "UPGRADE" ? (
                  <TrendingUp className="size-4" />
                ) : isTrial ? (
                  <Sparkles className="size-4" />
                ) : (
                  <CreditCard className="size-4" />
                )}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-semibold text-foreground truncate">
                    {event.orgName}
                  </h4>
                  <span
                    className={cn(
                      "inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-mono font-semibold border",
                      isPaid
                        ? "bg-primary/15 text-primary border-primary/25"
                        : isTrial
                        ? "bg-amber-500/15 text-amber-400 border-amber-500/25"
                        : "bg-muted text-muted-foreground border-border/60"
                    )}
                  >
                    {event.status}
                  </span>
                </div>
                <p className="mt-0.5 text-[10px] text-muted-foreground truncate">
                  <span className="font-mono text-foreground/80">{event.planName}</span>{" "}
                  <span>• {event.amount}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 sm:justify-end shrink-0 pl-11 sm:pl-0">
              <div className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground">
                <Clock className="size-3 text-muted-foreground/60" />
                <span>{event.timestamp}</span>
              </div>

              <Button
                variant="ghost"
                size="sm"
                asChild
                className="h-7 px-2 text-[10px] text-muted-foreground hover:text-primary gap-1"
              >
                <Link href={`/organizations/${event.orgSlug}`}>
                  <span>Subscription</span>
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
