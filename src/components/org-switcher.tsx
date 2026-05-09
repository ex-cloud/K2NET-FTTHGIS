"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useOrganizations } from "@/hooks/useOrganizations";

export function OrgSwitcher() {
  const { isMobile } = useSidebar();
  const pathname = usePathname();
  const { organizations } = useOrganizations();

  // Extract orgId from URL
  const match = pathname?.match(/\/org\/([^\/]+)/);
  const orgId = match ? match[1] : "default";
  const currentOrg = organizations.find((o) => o.slug === orgId);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="flex items-center justify-center p-0 h-10 w-10 hover:bg-accent data-[state=open]:bg-accent transition-colors rounded-lg border border-border/50"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold text-lg shadow-sm">
                <span>{(currentOrg?.name || orgId || "O").charAt(0).toUpperCase()}</span>
              </div>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-56 rounded-lg bg-popover border-border shadow-xl"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={10}
          >
            <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-3 py-2">
              Organizations
            </DropdownMenuLabel>
            {organizations.map((org) => (
              <DropdownMenuItem key={org.id} asChild className="gap-2 p-3 hover:bg-accent focus:bg-accent cursor-pointer">
                <Link href={`/org/${org.slug}`}>
                  <div className={`flex size-7 items-center justify-center rounded-md border border-border ${org.slug === orgId ? 'bg-emerald-600 text-white' : 'bg-muted/50'}`}>
                    <span className="font-bold text-xs">{org.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium">{org.name}</span>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-tight">
                      {org.subscriptionPlan?.name || 'Free'} Plan
                    </span>
                  </div>
                </Link>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem asChild className="gap-2 p-3 hover:bg-accent focus:bg-accent cursor-pointer">
              <Link href="/org">
                <div className="flex size-7 items-center justify-center rounded-md border border-border bg-muted text-muted-foreground">
                  <Plus className="size-4" />
                </div>
                <div className="font-medium text-sm text-muted-foreground">
                  New Organization
                </div>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
