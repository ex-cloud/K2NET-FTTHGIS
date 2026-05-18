"use client";

import * as React from "react";
import { Plus, Check, ChevronsUpDown, Search, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSession } from "next-auth/react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useOrganizations } from "@/hooks/useOrganizations";
import { OrganizationWizard } from "./organization-wizard";
import { getTenantUrl, getBaseUrl } from "@/lib/domain";
import { useUIStore } from "@/store/ui-store";
import { useRouter } from "next/navigation";

export function NavOrgSwitcher() {
  // 1. Basic Hooks & State
  const router = useRouter();
  const { organizations, refresh } = useOrganizations();
  const { data: session } = useSession();
  const user = session?.user;
  const pathname = usePathname();
  const [search, setSearch] = React.useState("");
  const [wizardOpen, setWizardOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const setActiveTenantId = useUIStore((state) => state.setActiveTenantId);

  // 2. Logic Declarations (Must be above useEffect that uses them)
  const segments = pathname?.split("/").filter(Boolean) || [];
  const hostname = typeof window !== "undefined" ? window.location.hostname : "";
  const isLocal = hostname.includes("localhost") || hostname.includes("lvh.me");
  const isSystemSubdomain = hostname.startsWith("system.");
  const tenantSlug = isLocal && !isSystemSubdomain ? hostname.split(".")[0] : null;

  const orgIdFromPath = segments[1];
  const activeSlug = tenantSlug || orgIdFromPath;
  const currentOrg = organizations.find((o) => o.slug === activeSlug);

  const filteredOrgs = organizations.filter((o) =>
    o.name.toLowerCase().includes(search.toLowerCase()),
  );

  const isSuperadmin = user?.roles?.includes("super_admin");
  const displayName = currentOrg?.name || activeSlug || "Select Organization";
  const displaySlug = currentOrg?.slug || activeSlug || "";
  const isImpersonating = isSuperadmin && !!tenantSlug;

  // 3. Effects
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Synchronize Tenant ID to Store for httpClient
  React.useEffect(() => {
    if (mounted) {
      if (currentOrg?.id) {
        setActiveTenantId(currentOrg.id);
      } else if (!tenantSlug) {
        setActiveTenantId(null);
      }
    }
  }, [mounted, currentOrg?.id, tenantSlug, setActiveTenantId]);

  React.useEffect(() => {
    if (mounted && typeof window !== "undefined") {
      console.log("GOD MODE DEBUG:", {
        timestamp: new Date().toISOString(),
        hostname,
        tenantSlug,
        activeSlug,
        isSuperadmin,
        isImpersonating,
        session: session, // Lihat seluruh isi session
        userRoles: user?.roles
      });
    }
  }, [mounted, hostname, tenantSlug, activeSlug, isSuperadmin, isImpersonating, session, user?.roles]);

  // 4. Early Return (Must be AFTER all hooks)
  if (!mounted) {
    return (
      <div className="flex items-center justify-center gap-1.5 px-0.5 h-8 animate-pulse bg-muted/20 rounded-md w-32" />
    );
  }

  return (
    <div className="flex items-center justify-center gap-4">


      <div 
        className="flex items-center justify-center gap-1.5 px-0.5 rounded-md hover:bg-accent border border-transparent hover:border-border text-sm font-medium text-muted-foreground cursor-pointer transition-colors group"
        onClick={() => {
          if (displaySlug) {
            if (displaySlug === activeSlug) {
              router.push("/dashboard");
            } else {
              window.location.assign(getTenantUrl(displaySlug));
            }
          }
        }}
      >
        <Avatar className="size-5 rounded border border-border">
          {currentOrg?.logoUrl && currentOrg.logoUrl.trim() !== "" ? (
            <AvatarImage src={currentOrg.logoUrl} />
          ) : null}
          <AvatarFallback className="bg-emerald-600/20 text-emerald-500 text-[10px] font-bold uppercase rounded leading-none">
            {displayName.substring(0, 1)}
          </AvatarFallback>
        </Avatar>
        <span className="truncate max-w-[120px] group-hover:text-foreground transition-colors font-semibold tracking-tight">
          {displayName}
        </span>
        <span className="text-[9px] bg-zinc-800 border border-zinc-700 px-1 rounded text-zinc-400 font-bold uppercase tracking-tight group-hover:text-zinc-200 transition-colors">
          {currentOrg?.subscriptionPlan?.name || 'FREE'}
        </span>
      </div>
      <DropdownMenu onOpenChange={(open) => !open && setSearch("")}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-4 w-4 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors rounded-md active:bg-accent focus:bg-accent p-0 cursor-pointer"
          >
            <ChevronsUpDown className="h-3 w-3" strokeWidth={1.5} />
            <span className="sr-only">Nav Org Switcher</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-64 rounded-lg bg-popover border-border shadow-xl p-0 overflow-hidden"
          side="bottom"
          align="start"
          sideOffset={20}
        >
          <div className="p-2 border-b border-border/50">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
              <Input
                placeholder="Search for an organization"
                className="bg-muted/50 border-border pl-8 h-8 text-xs text-muted-foreground focus-visible:ring-emerald-500/50 focus-visible:ring-offset-0 focus-visible:border-emerald-500/50 focus-visible:outline-none focus-visible:ring-0"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                autoFocus
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          <div className="p-1">
            <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 px-3 py-2">
              Organizations
            </DropdownMenuLabel>

            {filteredOrgs.length > 0 ? (
              filteredOrgs.map((org) => (
                <DropdownMenuItem
                  key={org.id}
                  className="gap-2 p-2 hover:bg-accent focus:bg-accent cursor-pointer group"
                  onClick={() => {
                    if (org.slug === activeSlug) {
                      router.push("/dashboard");
                    } else {
                      window.location.assign(getTenantUrl(org.slug));
                    }
                  }}
                >
                  <Avatar className="size-7 rounded border border-border bg-muted/50">
                    {org.logoUrl && org.logoUrl.trim() !== "" ? (
                      <AvatarImage src={org.logoUrl} />
                    ) : null}
                    <AvatarFallback className="bg-zinc-900 text-zinc-500 text-xs font-bold uppercase rounded">
                      {org.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col flex-1">
                    <span className="text-xs font-medium">{org.name}</span>
                    <span className="text-[10px] text-zinc-500 uppercase">
                      {org.subscriptionPlan?.name || 'FREE'} Plan
                    </span>
                  </div>
                  {org.slug === activeSlug && (
                    <Check className="size-3.5 text-emerald-500" />
                  )}
                </DropdownMenuItem>
              ))
            ) : (
              <div className="px-3 py-4 text-center">
                <p className="text-xs text-zinc-500">No organizations found</p>
              </div>
            )}
          </div>
          <DropdownMenuSeparator className="bg-border mx-0 mt-0" />
          <div className="p-1">
            <DropdownMenuItem 
              className="gap-2 p-2 hover:bg-accent focus:bg-accent cursor-pointer rounded-md text-muted-foreground hover:text-foreground"
              onClick={() => window.location.assign(getBaseUrl() + "/organizations")}
            >
              <div className="flex size-7 items-center justify-center rounded-md border border-border bg-muted">
                <Search className="size-3.5" strokeWidth={1.5} />
              </div>
              <div className="font-medium text-xs">
                All Organizations
              </div>
            </DropdownMenuItem>

            <DropdownMenuItem 
              onClick={() => setWizardOpen(true)}
              className="gap-2 p-2 hover:bg-accent focus:bg-accent cursor-pointer rounded-md text-muted-foreground hover:text-foreground"
            >
              <div className="flex size-7 items-center justify-center rounded-md border border-border bg-muted">
                <Plus className="size-3.5" strokeWidth={1.5} />
              </div>
              <div className="font-medium text-xs">
                New Organization
              </div>
            </DropdownMenuItem>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <OrganizationWizard 
        open={wizardOpen} 
        onOpenChange={setWizardOpen} 
        onSuccess={refresh} 
      />
    </div>
  );
}
