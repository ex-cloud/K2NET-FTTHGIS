"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HelpCircle, MessageSquare, ShieldCheck, ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { UserNav } from "../user-nav";
import { HealthBadge } from "../health-badge";

import { getBaseUrl, getLogoUrl } from "@/lib/domain";

import Image from "next/image";
import { useSystemSettings } from "@/hooks/useSystemSettings";

export function SystemHeader() {
  const pathname = usePathname();
  const { settings = [] } = useSystemSettings();

  const appName = settings.find((s) => s.key === "app_name")?.value || "System Admin";
  const logoUrl = settings.find((s) => s.key === "logo_url")?.value || "";

  return (
    <header className="flex h-12 shrink-0 w-full items-center justify-between border-b border-border bg-background px-4 z-50 py-2">
      <div className="flex items-center gap-x-1">
        <Link href="/system" className="flex items-center cursor-pointer mr-1">
          <div className={logoUrl ? "flex h-5 w-5 items-center justify-center rounded overflow-hidden" : "flex h-5 w-5 items-center justify-center rounded bg-emerald-600/20 border border-emerald-500/30 group overflow-hidden"}>
            {logoUrl ? (
              <Image
                src={getLogoUrl(logoUrl)}
                width={20}
                height={20}
                className="h-5 w-5 object-contain"
                alt="Logo"
                unoptimized
              />
            ) : (
              <ShieldCheck className="h-3 w-3 text-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
            )}
          </div>
        </Link>
        <Separator orientation="vertical" className="mx-0.5 h-4 bg-border/40" />
        
        <div className="flex items-center px-2 gap-2">
          <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-500">
            {appName}
          </span>
          <Separator orientation="vertical" className="mx-0.5 h-3 bg-border/40 -rotate-12" />
          <span className="text-[11px] font-medium text-muted-foreground capitalize">
            {pathname.split('/').pop() || 'Overview'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="hidden text-muted-foreground hover:text-foreground md:flex text-[11px] font-medium h-8 px-2 gap-2"
          onClick={() => window.location.assign(getBaseUrl())}
        >
          <ArrowLeftRight className="h-3.5 w-3.5" />
          Switch to Tenant
        </Button>

        <div className="flex items-center gap-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <HelpCircle className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
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
