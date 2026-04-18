"use client";

import * as React from "react";
import { Plus, Search, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { OrganizationWizard } from "@/components/tenant/organization-wizard";
import { useOrganizations } from "@/hooks/useOrganizations";

export default function OrgsPage() {
  const { organizations, loading, refresh } = useOrganizations();
  const [wizardOpen, setWizardOpen] = React.useState(false);

  return (
    <div className="flex-1 flex flex-col pt-16 px-8 bg-background h-full overflow-y-auto">
      <div className="w-full max-w-5xl mx-auto space-y-12">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-normal text-foreground tracking-tight">
            Your Organizations
          </h1>
          <Button 
            onClick={() => setWizardOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2 font-medium h-9 px-4 text-xs transition-colors"
          >
            <Plus className="h-4 w-4" />
            New organization
          </Button>
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
            {loading ? (
              // Loading Skeletons
              [1, 2].map((i) => (
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
                <Link key={org.slug} href={`/org/${org.slug}`}>
                  <div className="group flex items-center gap-4 p-5 rounded-lg border border-border bg-muted/30 hover:border-border/80 hover:bg-accent transition-all cursor-pointer h-24">
                    <div className="flex h-11 w-11 items-center justify-center rounded bg-muted/80 border border-border transition-colors">
                      <div className="h-6 w-6 rounded-sm bg-muted/50 flex items-center justify-center border border-border/30">
                        <LayoutGrid className="h-3.5 w-3.5 text-muted-foreground group-hover:text-emerald-500 transition-colors" />
                      </div>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium text-foreground group-hover:text-emerald-500 transition-colors">
                        {org.name}
                      </span>
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                        <span>Free Plan</span>
                        {org.description && (
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
