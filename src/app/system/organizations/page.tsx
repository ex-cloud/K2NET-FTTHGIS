"use client";

import { useOrganizations, type Organization } from "@/hooks/useOrganizations";
import { 
  Building2, 
  Search, 
  MoreHorizontal, 
  LayoutGrid,
  List as ListIcon,
  Table as TableIcon,
  Globe,
  MapPin,
  Plus,
  ArrowRight
} from "lucide-react";
import { getTenantUrl } from "@/lib/domain";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState, useMemo, useEffect } from "react";
import { cn } from "@/lib/utils";
import { OrganizationWizard } from "@/components/tenant/organization-wizard";

type ViewMode = "grid" | "list" | "table";

export default function AdminOrganizationsPage() {
  const { organizations, loading: isLoading, refresh } = useOrganizations();
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [wizardOpen, setWizardOpen] = useState(false);

  const [displaySuffix, setDisplaySuffix] = useState(".ftthgis.com");
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (typeof window !== "undefined") {
      const hostname = window.location.hostname;
      if (hostname.startsWith("system-")) {
        setDisplaySuffix("-" + hostname.substring(7));
      } else if (hostname.startsWith("system.")) {
        setDisplaySuffix("." + hostname.substring(7));
      } else {
        const parts = hostname.split(".");
        if (parts.length >= 2) {
          setDisplaySuffix("." + parts.slice(-2).join("."));
        }
      }
    }
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Real-time filtering logic
  const filteredOrgs = useMemo(() => {
    if (!organizations) return [];
    if (!searchQuery.trim()) return organizations;
    
    const query = searchQuery.toLowerCase().trim();
    return organizations.filter((org: Organization) => 
      org.name.toLowerCase().includes(query) || 
      org.slug.toLowerCase().includes(query) ||
      org.website?.toLowerCase().includes(query)
    );
  }, [organizations, searchQuery]);

  return (
    <div className="flex-1 flex flex-col pt-16 px-8 bg-background h-full overflow-y-auto">
      <div className="w-full max-w-5xl mx-auto space-y-12 pb-20">
      {/* Header section */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-normal text-foreground tracking-tight">
            Organizations
          </h1>
          <p className="text-xs text-muted-foreground">
            Global oversight of all tenant environments and subscriptions.
          </p>
        </div>
        <Button 
          onClick={() => setWizardOpen(true)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 h-9 px-4 text-xs font-medium transition-all shadow-sm"
        >
          <Plus className="h-4 w-4" /> New organization
        </Button>
      </div>

      {/* Filters & View Switcher */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
            <Input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for an organization" 
              className="bg-muted/30 border-border pl-10 h-9 text-xs text-muted-foreground focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
            />
          </div>
        </div>

        <div className="flex items-center p-1 bg-muted/20 rounded-lg border border-border">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setViewMode("grid")}
            className={cn("h-7 w-7 rounded-md transition-all", viewMode === "grid" ? "bg-background text-emerald-500 shadow-sm" : "text-muted-foreground hover:text-foreground")}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setViewMode("list")}
            className={cn("h-7 w-7 rounded-md transition-all", viewMode === "list" ? "bg-background text-emerald-500 shadow-sm" : "text-muted-foreground hover:text-foreground")}
          >
            <ListIcon className="h-3.5 w-3.5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setViewMode("table")}
            className={cn("h-7 w-7 rounded-md transition-all", viewMode === "table" ? "bg-background text-emerald-500 shadow-sm" : "text-muted-foreground hover:text-foreground")}
          >
            <TableIcon className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Wizard Component */}
      <OrganizationWizard 
        open={wizardOpen} 
        onOpenChange={setWizardOpen} 
        onSuccess={refresh} 
      />

      {/* Content Area */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse flex items-center gap-4 p-5 rounded-lg border border-border bg-muted/10 h-24">
              <div className="h-11 w-11 rounded bg-muted/50" />
              <div className="space-y-2 flex-1">
                <div className="h-4 w-24 bg-muted/50 rounded" />
                <div className="h-3 w-16 bg-muted/50 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredOrgs.length === 0 ? (
        <div className="p-20 text-center text-muted-foreground bg-muted/5 border border-dashed border-border rounded-xl">
          {searchQuery ? "No organizations match your search." : "No organizations found."}
        </div>
      ) : (
        <>
          {/* GRID VIEW */}
          {viewMode === "grid" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredOrgs.map((org: Organization) => (
                  <div key={org.id} className="group relative" onClick={() => window.location.assign(getTenantUrl(org.slug))}>
                  <div className={`flex items-center gap-4 p-5 rounded-lg border bg-muted/30 hover:bg-accent transition-all cursor-pointer h-24 ${
                    org.status === 'SUSPENDED' || org.status === 'TRIAL_EXPIRED'
                      ? 'border-amber-500/30'
                      : 'border-border'
                  }`}>
                    <div className="flex h-11 w-11 items-center justify-center rounded bg-muted/80 border border-border transition-colors">
                      <div className="h-6 w-6 rounded-sm bg-muted/50 flex items-center justify-center border border-border/30">
                        <Building2 className={cn("h-3.5 w-3.5 transition-colors", 
                          org.status === 'SUSPENDED' ? "text-amber-500" : "text-muted-foreground group-hover:text-emerald-500"
                        )} />
                      </div>
                    </div>

                    <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={cn("font-medium transition-colors", 
                           org.status === 'SUSPENDED' ? "text-muted-foreground" : "text-foreground group-hover:text-emerald-500"
                        )}>
                          {org.name}
                        </span>
                        {(org.status === 'SUSPENDED' || org.status === 'TRIAL_EXPIRED') && (
                          <span className="text-[9px] bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded border border-amber-500/20 uppercase font-bold tracking-wider">
                            Suspended
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <span className="font-mono">{org.slug}{displaySuffix}</span>
                        <span className="text-border">•</span>
                        <span className="capitalize">{org.subscriptionPlan?.name || "Free"} Plan</span>
                      </div>
                    </div>

                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                       <ArrowRight className="h-4 w-4 text-emerald-500" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* LIST VIEW */}
          {viewMode === "list" && (
            <div className="flex flex-col gap-2">
              {filteredOrgs.map((org: Organization) => (
                <div key={org.id} className="flex items-center justify-between p-3 bg-muted/20 border border-border rounded-lg hover:bg-accent/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded bg-muted border border-border flex items-center justify-center text-muted-foreground">
                      <Building2 className="size-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-medium text-foreground">{org.name}</h3>
                      <p className="text-[10px] text-muted-foreground font-mono">{org.slug}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className={cn("px-2 py-0.5 rounded text-[9px] font-bold uppercase", org.status === 'ACTIVE' ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500")}>
                      {org.status || 'ACTIVE'}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="text-xs">
                        <DropdownMenuItem onClick={() => window.location.assign(getTenantUrl(org.slug))}>Access Tenant</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">Suspend</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TABLE VIEW */}
          {viewMode === "table" && (
            <div className="rounded-lg border border-border bg-card overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="px-4 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Organization</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Details</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50 text-xs">
                  {filteredOrgs.map((org: Organization) => (
                    <tr key={org.id} className="hover:bg-muted/30 transition-colors group">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="size-7 rounded bg-muted border border-border flex items-center justify-center text-muted-foreground">
                            <Building2 className="size-3.5" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{org.name}</p>
                            <p className="text-[10px] text-muted-foreground">{org.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className={cn("size-1.5 rounded-full", org.status === 'ACTIVE' ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-amber-500")} />
                          <span className="text-muted-foreground capitalize">{org.status?.toLowerCase() || 'active'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-0.5 text-[10px] text-muted-foreground">
                          <div className="flex items-center gap-1"><Globe className="size-3" /> {org.website || "-"}</div>
                          <div className="flex items-center gap-1"><MapPin className="size-3" /> {org.address || "-"}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                         <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => window.location.assign(getTenantUrl(org.slug))}>
                            <ArrowRight className="size-4" />
                         </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
      </div>
    </div>
  );
}
