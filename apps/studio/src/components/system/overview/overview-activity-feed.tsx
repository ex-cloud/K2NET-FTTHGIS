import { Badge } from "@k2net/ui";
import { Button } from "@k2net/ui";
import { cn } from "@/lib/utils";
import { Building2, ArrowRight } from "lucide-react";
import { getTenantUrl } from "@/lib/domain";
import type { Organization } from "@/hooks/useOrganizations";

interface OverviewActivityFeedProps {
  loading: boolean;
  recentOrgs: Organization[];
}

export function OverviewActivityFeed({ loading, recentOrgs }: OverviewActivityFeedProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between border-b border-border pb-2">
        <h2 className="flex items-center gap-2 text-lg font-light tracking-tight text-zinc-200">
          <Building2 className="h-4.5 w-4.5 text-zinc-500" /> Recent Organizations
        </h2>
        <Button variant="link" className="gap-1.5 p-0 text-xs text-zinc-400 hover:text-primary">
          View All Organizations <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {loading ? (
          [1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-xl border border-border bg-zinc-950/20" />)
        ) : recentOrgs.length > 0 ? (
          recentOrgs.map((org) => {
            const planName = org.subscriptionPlan?.name || "Free Plan";

            return (
              <div key={org.slug} className="flex flex-col justify-between gap-4 rounded-xl border border-border bg-card/60 p-4 transition-all hover:border-white/10 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-zinc-900 text-zinc-400">
                    <Building2 className="h-4.5 w-4.5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-zinc-200">{org.name}</h3>
                    <p className="mt-0.5 text-[10px] font-mono text-zinc-500">{org.slug}.gis.kdua.net</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 sm:flex-nowrap sm:justify-end">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="border-border bg-zinc-900/40 px-2 py-0.5 text-[9px] uppercase font-mono text-zinc-400">
                      {planName}
                    </Badge>
                    <Badge className={cn(
                      "border border-border px-2 py-0.5 text-[9px] font-bold",
                      org.status === "ACTIVE" ? "bg-primary/10 text-primary" : org.status === "SUSPENDED" ? "bg-amber-500/10 text-amber-500" : "bg-zinc-800 text-zinc-400"
                    )}>
                      {org.status}
                    </Badge>
                  </div>

                  <Button onClick={() => window.location.assign(getTenantUrl(org.slug))} variant="ghost" size="sm" className="group gap-1.5 text-xs text-zinc-400 transition-all hover:bg-emerald-500/5 hover:text-primary">
                    Access Tenant
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </Button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-xl border border-border bg-[#0b0b0b]/40 p-8 text-center text-xs text-zinc-500">
            No organizations have been registered on this platform yet.
          </div>
        )}
      </div>
    </section>
  );
}
