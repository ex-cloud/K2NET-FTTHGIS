"use client";

import * as React from "react";
import Link from "next/link";
import { Plus, Search, LayoutGrid, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OrganizationWizard } from "@/components/tenant/organization-wizard";
import { useOrganizations } from "@/hooks/useOrganizations";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { getTenantUrl, getCurrentOrgSlug } from "@/lib/domain";

export default function OrgsPage() {
  const { data: session } = useSession();
  const { organizations, loading, error, refresh } = useOrganizations();
  const [wizardOpen, setWizardOpen] = React.useState(false);

  // 1. Detect subdomain context for isolation
  const tenantSlug = getCurrentOrgSlug();

  // 2. Filter organizations if we are in a tenant subdomain
  const filteredOrganizations = tenantSlug 
    ? organizations.filter(org => org.slug === tenantSlug)
    : organizations;

  // Determine if the user is a SuperAdmin (from the system realm)
  const user = session?.user as { roles?: string[] } | undefined;
  const userRoles = user?.roles || [];
  const issuer = (session as { issuer?: string } | null)?.issuer || "";
  
  const isSuperAdmin = 
    issuer.includes("ftth-realm") || 
    issuer.includes("/system") || 
    userRoles.includes("super_admin") || 
    userRoles.includes("ROLE_SUPER_ADMIN");
  
  const hasFreePlan = filteredOrganizations.some(org => org.subscriptionPlan?.name?.toUpperCase() === "FREE");
  const canCreateMore = !tenantSlug && (isSuperAdmin || !hasFreePlan || filteredOrganizations.length === 0);

  // Banner visibility logic
  const showLimitBanner = !tenantSlug && !isSuperAdmin && !canCreateMore && filteredOrganizations.length > 0;

  return (
    <div className="flex-1 flex flex-col pt-16 px-8 bg-background h-full overflow-y-auto">
      <div className="w-full max-w-5xl mx-auto space-y-12">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-normal text-foreground tracking-tight">
              Your Organizations
            </h1>
            <p className="text-xs text-muted-foreground">
              Select or create an organization to manage your network assets.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {showLimitBanner && (
              <span className="text-[10px] bg-amber-500/10 text-amber-500 px-2 py-1 rounded border border-amber-500/20">
                Free Plan Limit: 1 Organization
              </span>
            )}
            <Button 
              onClick={() => setWizardOpen(true)}
              disabled={!canCreateMore && !isSuperAdmin}
              className={cn(
                (canCreateMore || isSuperAdmin)
                  ? "bg-emerald-600 hover:bg-emerald-500" 
                  : "bg-muted text-muted-foreground cursor-not-allowed",
                "text-white gap-2 font-medium h-9 px-4 text-xs transition-colors"
              )}
            >
              <Plus className="h-4 w-4" />
              New organization
            </Button>
          </div>
        </div>

        <OrganizationWizard 
          open={wizardOpen} 
          onOpenChange={setWizardOpen} 
          onSuccess={refresh} 
        />

        <div className="space-y-6">
          <div className="flex items-center gap-4 w-full">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
              <Input
                placeholder="Search for an organization"
                className="bg-muted/30 border-border pl-10 h-9 text-xs text-muted-foreground focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
              />
            </div>
          </div>

          {/* Error banner */}
          {error && (
            <div className="flex items-center gap-3 p-4 rounded-lg border border-amber-500/20 bg-amber-500/5 text-amber-400 text-sm">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>Failed to load organizations. Please try refreshing the page or logging in again.</span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => refresh()}
                className="ml-auto text-amber-400 hover:text-amber-300 text-xs"
              >
                Retry
              </Button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
            {loading ? (
              // Loading Skeletons
              [1, 2, 3, 4].map((i) => (
                <div key={i} className="animate-pulse flex items-center gap-4 p-5 rounded-lg border border-border bg-muted/10 h-24">
                  <div className="h-11 w-11 rounded bg-muted/50" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 w-24 bg-muted/50 rounded" />
                    <div className="h-3 w-16 bg-muted/50 rounded" />
                  </div>
                </div>
              ))
            ) : (
              organizations.map((org) => (
                <Link key={org.slug} href={getTenantUrl(org.slug)}>
                  <div className={`group flex items-center gap-4 p-5 rounded-lg border bg-muted/30 hover:bg-accent transition-all cursor-pointer h-24 ${
                    org.status === 'SUSPENDED' || org.status === 'TRIAL_EXPIRED'
                      ? 'border-amber-500/30 hover:border-amber-500/50'
                      : 'border-border hover:border-border/80'
                  }`}>
                    <div className="flex h-11 w-11 items-center justify-center rounded bg-muted/80 border border-border transition-colors">
                      <div className="h-6 w-6 rounded-sm bg-muted/50 flex items-center justify-center border border-border/30">
                        <LayoutGrid className={`h-3.5 w-3.5 transition-colors ${
                          org.status === 'SUSPENDED' || org.status === 'TRIAL_EXPIRED'
                            ? 'text-amber-500'
                            : 'text-muted-foreground group-hover:text-emerald-500'
                        }`} />
                      </div>
                    </div>
                    <div className="flex flex-col gap-0.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium transition-colors ${
                          org.status === 'SUSPENDED' || org.status === 'TRIAL_EXPIRED'
                            ? 'text-zinc-400'
                            : 'text-foreground group-hover:text-emerald-500'
                        }`}>
                          {org.name}
                        </span>
                        {/* Status badges */}
                        {(org.status === 'SUSPENDED' || org.status === 'TRIAL_EXPIRED') && (
                          <span className="text-[9px] bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded border border-amber-500/20 font-bold uppercase tracking-wider flex items-center gap-1">
                            <AlertTriangle className="h-2.5 w-2.5" />
                            Suspended
                          </span>
                        )}
                        {org.status === 'ACTIVE' && org.subscriptionPlan?.name?.toUpperCase() === "FREE" && (
                          <span className="text-[9px] bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded border border-emerald-500/20 font-bold uppercase tracking-wider">
                            Free
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                        <span>{org.subscriptionPlan?.name || "Standard"} Plan</span>
                        {org.status === 'SUSPENDED' && (
                          <>
                            <span className="h-1 w-1 rounded-full bg-amber-500/50" />
                            <span className="text-amber-500/70">Trial expired</span>
                          </>
                        )}
                        {org.description && org.status !== 'SUSPENDED' && (
                          <>
                            <span className="h-1 w-1 rounded-full bg-border" />
                            <span className="truncate max-w-[150px]">{org.description}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            )}
            
            {organizations.length === 0 && !loading && (
              <div className="col-span-2 py-20 text-center border border-dashed border-border rounded-xl">
                <p className="text-sm text-muted-foreground">No organizations found. Create one to get started!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
