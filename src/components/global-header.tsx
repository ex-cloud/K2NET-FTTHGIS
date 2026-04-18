"use client";

import * as React from "react";
import Link from "next/link";
import { HelpCircle, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import { BreadcrumbNav } from "./breadcrumb-nav";
import { UserNav } from "./user-nav";
import { HealthBadge } from "./health-badge";
import { GlobalSearch } from "./dashboard/global-search";

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
        <GlobalSearch />

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
