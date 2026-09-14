import { Badge } from "@k2net/ui";
import { Link } from "@/lib/navigation-compat";
import { cn } from "@/lib/utils";
import { Building2, ArrowRight } from "lucide-react";
import type { Organization } from "@/hooks/useOrganizations";
import { normalizePlanTier } from "@/components/organizations/types";

interface OverviewActivityFeedProps {
  loading: boolean;
  recentOrgs: Organization[];
}

export function OverviewActivityFeed({ loading, recentOrgs }: OverviewActivityFeedProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between border-b border-border pb-2">
        <h2 className="flex items-center gap-2 text-lg font-bold tracking-tight text-foreground">
          <Building2 className="h-4.5 w-4.5 text-muted-foreground" /> Recent Organizations
        </h2>
        <Link
          href="/organizations"
          className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-primary group"
        >
          <span>View All Organizations</span>
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {loading ? (
          [1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-xl border border-border bg-card/20" />)
        ) : recentOrgs.length > 0 ? (
          recentOrgs.map((org) => {
            const planTier = normalizePlanTier(org.subscriptionPlan?.name);

            return (
              <div key={org.slug} className="flex flex-col justify-between gap-4 rounded-xl border border-border bg-card/60 p-4 transition-all hover:border-border/10 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground">
                    <Building2 className="h-4.5 w-4.5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-foreground">{org.name}</h3>
                    <p className="mt-0.5 text-[10px] font-mono text-muted-foreground">{org.slug}.gis.kdua.net</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 sm:flex-nowrap sm:justify-end">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="border-border bg-card/40 px-2 py-0.5 text-[9px] uppercase font-mono text-muted-foreground">
                      {planTier}
                    </Badge>
                    <Badge className={cn(
                      "border border-border px-2 py-0.5 text-[9px] font-bold",
                      org.status === "ACTIVE" ? "bg-primary/10 text-primary" : org.status === "SUSPENDED" ? "bg-amber-500/10 text-amber-500" : "bg-muted text-muted-foreground"
                    )}>
                      {org.status}
                    </Badge>
                  </div>

                  <Link
                    href={`/organizations/${org.slug}`}
                    className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium text-muted-foreground transition-all hover:bg-primary/10 hover:text-primary group border border-border/60 hover:border-primary/30"
                  >
                    <span>Detail Organisasi</span>
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-xl border border-border bg-card p-8 text-center text-xs text-muted-foreground">
            No organizations have been registered on this platform yet.
          </div>
        )}
      </div>
    </section>
  );
}
