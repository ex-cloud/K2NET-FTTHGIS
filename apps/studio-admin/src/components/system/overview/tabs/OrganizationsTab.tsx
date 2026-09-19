import { Badge, Button } from "@k2net/ui";
import { Link, useRouter } from "@/lib/navigation-compat";
import { cn } from "@/lib/utils";
import { Building2, UserCheck, ArrowUpRight } from "lucide-react";
import type { OrganizationItem } from "../recent-operations-types";
import { normalizePlanTier } from "@/components/organizations/types";

interface OrganizationsTabProps {
  items: OrganizationItem[];
  loading: boolean;
}

export function OrganizationsTab({ items, loading }: OrganizationsTabProps) {
  const router = useRouter();

  if (loading) {
    return (
      <div className="space-y-2.5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-xl border border-border bg-card/20" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card/40 p-8 text-center text-xs text-muted-foreground">
        Belum ada organisasi yang terdaftar di platform.
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {items.map((org) => {
        const planTier = normalizePlanTier(org.planTier);

        return (
          <div
            key={org.id || org.slug}
            className="group flex flex-col justify-between gap-3 rounded-xl border border-border bg-card/60 p-3.5 transition-all duration-200 hover:bg-card/95 hover:border-primary/50 sm:flex-row sm:items-center"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors group-hover:border-primary/40 group-hover:bg-primary/10 shrink-0">
                <Building2 className="h-4.5 w-4.5 text-primary transition-transform duration-200 group-hover:scale-105" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-semibold text-foreground transition-colors group-hover:text-primary truncate">
                    {org.name}
                  </h4>
                  {org.isTrial && (
                    <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      TRIAL
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-[10px] font-mono text-muted-foreground truncate">
                  {org.slug}.gis.kdua.net
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2.5 sm:justify-end shrink-0">
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="border-border bg-card/40 px-2 py-0.5 text-[9px] uppercase font-mono text-muted-foreground"
                >
                  {planTier}
                </Badge>
                <Badge
                  className={cn(
                    "border border-border px-2 py-0.5 text-[9px] font-medium",
                    org.status === "ACTIVE"
                      ? "bg-primary/10 text-primary"
                      : org.status === "SUSPENDED"
                      ? "bg-amber-500/10 text-amber-500"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {org.status}
                </Badge>
              </div>

              <div className="flex items-center gap-1.5 pl-2 border-l border-border/50">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/organizations/impersonation?target=${org.slug}`)}
                  className="h-7 px-2 text-[10px] text-muted-foreground hover:text-foreground gap-1 cursor-pointer"
                  title={`Impersonate tenant ${org.name}`}
                >
                  <UserCheck className="size-3 text-amber-400" />
                  <span className="hidden sm:inline">Impersonate</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="h-7 px-2 text-[10px] text-primary hover:text-primary/80 gap-1 cursor-pointer"
                >
                  <Link href={`/organizations/${org.slug}`}>
                    <span>Manage</span>
                    <ArrowUpRight className="size-3" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
