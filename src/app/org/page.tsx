"use client";

import * as React from "react";
import { Plus, Search, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

export default function OrgsPage() {
  return (
    <div className="flex-1 flex flex-col pt-16 px-8 bg-background h-full overflow-y-auto">
      <div className="w-full max-w-5xl mx-auto space-y-12">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-normal text-foreground tracking-tight">
            Your Organizations
          </h1>
          <Button className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2 font-medium h-9 px-4 text-xs transition-colors">
            <Plus className="h-4 w-4" />
            New organization
          </Button>
        </div>

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
            <Link href="/org/default">
              <div className="group flex items-center gap-4 p-5 rounded-lg border border-border bg-muted/30 hover:border-border/80 hover:bg-accent transition-all cursor-pointer h-24">
                <div className="flex h-11 w-11 items-center justify-center rounded bg-muted/80 border border-border transition-colors">
                  <div className="h-6 w-6 rounded-sm bg-muted/50 flex items-center justify-center border border-border/30">
                    <LayoutGrid className="h-3.5 w-3.5 text-muted-foreground group-hover:text-emerald-500 transition-colors" />
                  </div>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium text-foreground group-hover:text-emerald-500 transition-colors">
                    ex-cloud&apos;s Org
                  </span>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span>Free Plan</span>
                    <span className="h-1 w-1 rounded-full bg-border" />
                    <span>2 projects</span>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/org/k2net">
              <div className="group flex items-center gap-4 p-5 rounded-lg border border-border bg-muted/30 hover:border-border/80 hover:bg-accent transition-all cursor-pointer h-24">
                <div className="flex h-11 w-11 items-center justify-center rounded bg-muted/80 border border-border transition-colors">
                  <div className="h-6 w-6 rounded-sm bg-muted/50 flex items-center justify-center border border-border/30">
                    <LayoutGrid className="h-3.5 w-3.5 text-muted-foreground group-hover:text-emerald-500 transition-colors" />
                  </div>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium text-foreground group-hover:text-emerald-500 transition-colors">
                    k2net
                  </span>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span>Free Plan</span>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
