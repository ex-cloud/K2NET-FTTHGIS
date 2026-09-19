import { Button } from "@k2net/ui";
import { Link, useRouter } from "@/lib/navigation-compat";
import { cn } from "@/lib/utils";
import {
  Building2,
  UserCheck,
  ArrowUpRight,
  ExternalLink,
  PackageCheck,
} from "lucide-react";
import type { OrganizationItem } from "../recent-operations-types";

interface OrganizationsTabProps {
  items: OrganizationItem[];
  loading: boolean;
}

function getPlanBadgeStyle(tier: string): string {
  const t = (tier ?? "").toUpperCase();
  if (t === "ENTERPRISE")
    return "border-amber-500/40 bg-amber-500/10 text-amber-400";
  if (t === "PRO" || t === "PROFESSIONAL")
    return "border-primary/40 bg-primary/10 text-primary";
  if (t === "STARTER")
    return "border-sky-400/40 bg-sky-400/10 text-sky-400";
  if (t === "FREE")
    return "border-muted-foreground/25 bg-muted/20 text-muted-foreground";
  return "border-border bg-card/40 text-muted-foreground";
}

function getStatusDisplay(status: string, isTrial: boolean) {
  if (isTrial || (status ?? "").toUpperCase() === "TRIAL")
    return {
      dot: "bg-amber-400",
      label: "TRIAL",
      color: "text-amber-400",
    };
  const s = (status ?? "").toUpperCase();
  if (s === "ACTIVE")
    return {
      dot: "bg-primary animate-pulse shadow-[0_0_5px_hsl(var(--primary)/0.8)]",
      label: "ACTIVE",
      color: "text-primary",
    };
  if (s === "OVERDUE" || s === "TRIAL_EXPIRED")
    return { dot: "bg-rose-500", label: s, color: "text-rose-400" };
  if (s === "SUSPENDED")
    return { dot: "bg-muted-foreground", label: "SUSPENDED", color: "text-muted-foreground" };
  return { dot: "bg-muted-foreground", label: s || "UNKNOWN", color: "text-muted-foreground" };
}

export function OrganizationsTab({ items, loading }: OrganizationsTabProps) {
  const router = useRouter();

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
      <div className="rounded-xl border border-dashed border-border bg-card/30 p-10 text-center space-y-3">
        <div className="flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted/40 border border-border text-muted-foreground">
            <Building2 className="size-6 opacity-50" />
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">Belum ada organisasi terdaftar</p>
          <p className="text-[11px] text-muted-foreground mt-1">
            Organisasi ISP akan muncul di sini setelah didaftarkan ke platform.
          </p>
        </div>
        <Button variant="outline" size="sm" asChild className="h-7 px-3 text-xs gap-1.5">
          <Link href="/organizations">
            <ExternalLink className="size-3" />
            <span>Tambah Organisasi</span>
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
              <th className="py-2.5 px-3.5">Organisasi</th>
              <th className="py-2.5 px-3.5">Subdomain / Identifier</th>
              <th className="py-2.5 px-3.5">Paket SaaS</th>
              <th className="py-2.5 px-3.5">Status Tenant</th>
              <th className="py-2.5 px-3.5 text-right">Aksi Cepat</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {items.map((org) => {
              const statusDisplay = getStatusDisplay(org.status, org.isTrial);
              const planTierRaw = (org.planTier ?? "").toUpperCase();
              // Normalize: PRO → PROFESSIONAL display
              const planDisplay =
                planTierRaw === "PRO" ? "PROFESSIONAL" : planTierRaw || "PROFESSIONAL";

              return (
                <tr
                  key={org.id || org.slug}
                  className="group hover:bg-card/90 transition-colors duration-150"
                >
                  {/* Organisasi */}
                  <td className="py-2.5 px-3.5">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 border border-primary/20 text-primary shrink-0 group-hover:scale-110 transition-transform duration-150">
                        <Building2 className="size-3.5" />
                      </div>
                      <span className="font-semibold text-foreground truncate block max-w-[160px]">
                        {org.name}
                      </span>
                    </div>
                  </td>

                  {/* Subdomain */}
                  <td className="py-2.5 px-3.5 font-mono text-[11px]">
                    <span className="text-foreground/80">{org.slug}</span>
                    <span className="text-muted-foreground/60">.gis.kdua.net</span>
                  </td>

                  {/* Paket SaaS */}
                  <td className="py-2.5 px-3.5">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[9px] uppercase font-mono font-bold",
                        getPlanBadgeStyle(planDisplay)
                      )}
                    >
                      <PackageCheck className="size-2.5" />
                      {planDisplay}
                    </span>
                  </td>

                  {/* Status Tenant */}
                  <td className="py-2.5 px-3.5">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium">
                      <span className={cn("size-1.5 rounded-full", statusDisplay.dot)} />
                      <span className={statusDisplay.color}>{statusDisplay.label}</span>
                    </span>
                  </td>

                  {/* Aksi Cepat */}
                  <td className="py-2.5 px-3.5 text-right">
                    <div className="inline-flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="h-7 px-2.5 text-[11px] text-primary hover:text-primary/80 hover:bg-primary/10 gap-1"
                      >
                        <Link href={`/organizations/${org.slug}`}>
                          <span>Manage</span>
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          router.push(`/organizations/impersonation?target=${org.slug}`)
                        }
                        className="h-7 px-2 text-[11px] gap-1 border-amber-500/30 text-amber-400 hover:bg-amber-500/10 hover:text-amber-300 cursor-pointer"
                        title={`Impersonate ${org.name}`}
                      >
                        <UserCheck className="size-2.5" />
                        <span>Impersonate</span>
                        <ArrowUpRight className="size-2.5 opacity-70" />
                      </Button>
                    </div>
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
