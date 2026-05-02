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
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { useOrganizations } from "@/hooks/useOrganizations";
import { OrganizationWizard } from "./tenant/organization-wizard";

export function NavOrgSwitcher() {
  const { organizations, refresh } = useOrganizations();
  const pathname = usePathname();
  const [search, setSearch] = React.useState("");
  const [wizardOpen, setWizardOpen] = React.useState(false);

  // Filter out empty strings to handle leading/trailing slashes correctly
  const segments = pathname?.split("/").filter(Boolean) || [];

  // segments[0] = "org", segments[1] = [orgId]
  const orgId = segments[1];

  const currentOrg = organizations.find((o) => o.slug === orgId);

  const filteredOrgs = organizations.filter((o) =>
    o.name.toLowerCase().includes(search.toLowerCase()),
  );

  // Display name: use found org, or show the slug as fallback while loading
  const displayName = currentOrg?.name || orgId || "Select Organization";
  const displaySlug = currentOrg?.slug || orgId || "";

  return (
    <div className="flex items-center justify-center">
      <div className="flex items-center justify-center gap-1.5 px-0.5 rounded-md hover:bg-accent border border-transparent hover:border-border text-sm font-medium text-muted-foreground cursor-pointer transition-colors group">
        <Link
          href={displaySlug ? `/org/${displaySlug}` : "/org"}
          className="flex items-center gap-1.5"
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
            {currentOrg?.plan || 'FREE'}
          </span>
        </Link>
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
                  asChild
                >
                  <Link href={`/org/${org.slug}`}>
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
                        {org.plan || 'FREE'} Plan
                      </span>
                    </div>
                    {org.slug === orgId && (
                      <Check className="size-3.5 text-emerald-500" />
                    )}
                  </Link>
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
              asChild
              className="gap-2 p-2 hover:bg-accent focus:bg-accent cursor-pointer rounded-md text-muted-foreground hover:text-foreground"
            >
              <Link href="/org" className="flex items-center gap-2 w-full">
                <div className="flex size-7 items-center justify-center rounded-md border border-border bg-muted">
                  <Search className="size-3.5" strokeWidth={1.5} />
                </div>
                <div className="font-medium text-xs">
                  All Organizations
                </div>
              </Link>
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
