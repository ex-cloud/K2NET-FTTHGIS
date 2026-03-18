"use client";

import * as React from "react";
import Link from "next/link";
import { Search, HelpCircle, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import { BreadcrumbNav } from "./breadcrumb-nav";
import { UserNav } from "./user-nav";
import { HealthBadge } from "./health-badge";

export function GlobalHeader() {
  return (
    <header className="flex h-12 w-full items-center justify-between border-b border-border bg-background px-4 z-50 py-2">
      <div className="flex items-center gap-x-2">
        <Link href="/org" className="flex items-center cursor-pointer">
          <div className="flex h-5 w-5 items-center justify-center rounded bg-emerald-600/20 border border-emerald-500/30 group ">
            <div
              className="h-2 w-2 bg-emerald-500 group-hover:scale-110 transition-transform shadow-[0_0_10px_rgba(16,185,129,0.5)]"
              style={{ clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)" }}
            />
          </div>
        </Link>
        <BreadcrumbNav />
      </div>

      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          className="hidden text-muted-foreground hover:text-foreground md:flex text-xs font-medium"
        >
          Feedback
        </Button>
        <div className="relative hidden lg:block">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-3.5 w-3.5 text-muted-foreground/70" />
          </div>
          <input
            type="text"
            placeholder="Search..."
            className="flex h-8 w-60 items-center rounded-md border border-border bg-muted/40 pl-9 pr-2 text-xs text-muted-foreground hover:border-accent-foreground/20 transition-colors focus:outline-hidden focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                alert(`Searching for: ${e.currentTarget.value}`);
              }
            }}
          />
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() => alert("Help Center feature coming soon!")}
          >
            <HelpCircle className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() =>
              (window.location.href = "mailto:support@ftthgis.com")
            }
          >
            <MessageSquare className="h-4 w-4" />
          </Button>
          <HealthBadge />
          <Separator orientation="vertical" className="mx-1 h-4 bg-border" />
          <UserNav />
        </div>
      </div>
    </header>
  );
}
