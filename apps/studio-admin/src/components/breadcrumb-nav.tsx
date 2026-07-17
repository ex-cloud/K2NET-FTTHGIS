"use client";

import * as React from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
} from "@k2net/ui";
import { usePathname } from "next/navigation";
import { Plug2 } from "lucide-react";
import { Button } from "@k2net/ui";

export function BreadcrumbNav() {
  const pathname = usePathname();
  
  // 1. Detect subdomain context
  const hostname = typeof window !== "undefined" ? window.location.hostname : "";
  const isLocal = hostname.includes("localhost") || hostname.includes("lvh.me");
  const isSystemSubdomain = hostname.startsWith("system.") || hostname.startsWith("system-");
  
  let tenantSlug = null;
  if (!isSystemSubdomain) {
    if (isLocal) {
      const parts = hostname.split(".");
      if (parts.length > 2 && parts[0] !== "www") tenantSlug = parts[0];
    } else {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL;
      if (appUrl) {
        try {
          let rootHost = new URL(appUrl).hostname;
          if (rootHost.startsWith("system-")) rootHost = rootHost.substring(7);
          else if (rootHost.startsWith("system.")) rootHost = rootHost.substring(7);
          
          if (hostname.endsWith(`-${rootHost}`)) {
            tenantSlug = hostname.substring(0, hostname.length - rootHost.length - 1);
          } else if (hostname.endsWith(`.${rootHost}`)) {
            tenantSlug = hostname.substring(0, hostname.length - rootHost.length - 1);
          }
        } catch {}
      }
    }
  }

  // 2. Extract IDs based on context
  const parts = pathname?.split("/").filter(Boolean) || [];
  let projectId = "";
  
  if (tenantSlug) {
    if (parts[0] === "project") projectId = parts[1];
  } else {
    if (parts[0] === "org" && parts[2] === "project") projectId = parts[3];
  }

  const isLanding = pathname === "/org" || pathname === "/organizations";

  if (isLanding) {
    return (
      <Breadcrumb className="flex items-center">
        <BreadcrumbList className="flex items-center gap-1">
          <BreadcrumbItem>
            <div className="flex items-center gap-1 text-sm font-medium text-foreground">
              <span className="text-muted-foreground/50">/</span>
              Organizations
            </div>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    );
  }

  return (
    <div className="flex items-center flex-1 justify-between w-full pr-1">
      <Breadcrumb className="flex items-center">
        <BreadcrumbList className="flex items-center gap-1">
          {projectId && (
            <>
              {/* Branch Section */}
              <BreadcrumbItem>
                <div className="flex items-center gap-1.5 p-1 px-2 rounded-md cursor-pointer transition-colors">
                  <span className="text-sm font-semibold tracking-tight text-foreground">main</span>
                  <span className="text-[9px] font-bold text-amber-500 uppercase border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 rounded-full ml-1">
                    PRODUCTION
                  </span>
                </div>
              </BreadcrumbItem>
            </>
          )}
        </BreadcrumbList>
      </Breadcrumb>

      {/* Connect Button (right side of breadcrumbs area) */}
      {projectId && (
         <div className="flex items-center">
           <Button variant="outline" size="sm" className="h-6 text-[10px] font-semibold gap-1.5 rounded-full px-3 border-border text-foreground hover:bg-accent">
             <Plug2 className="w-2 h-2" />
             Connect
           </Button>
         </div>
      )}
    </div>
  );
}
