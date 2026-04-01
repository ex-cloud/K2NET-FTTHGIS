"use client";

import * as React from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { usePathname } from "next/navigation";
import { Hexagon, Package, Plug2, Slash } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function BreadcrumbNav() {
  const pathname = usePathname();
  const parts = pathname?.split("/") || [];

  const isLanding = pathname === "/org";
  const orgId = parts[2] || "default";
  const projectId = parts[4];

  if (isLanding) {
    return (
      <Breadcrumb className="flex items-center">
        <BreadcrumbList className="flex items-center gap-2">
          <BreadcrumbItem>
            <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
              <span className="text-muted-foreground/50">/</span>
              Organizations
            </div>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    );
  }

  return (
    <div className="flex items-center flex-1 justify-between w-full pr-4">
      <Breadcrumb className="flex items-center">
        <BreadcrumbList className="flex items-center gap-2 sm:gap-3">
          
          {/* Org Section */}
          <BreadcrumbItem>
            <Link href={`/org/${orgId}`} className="flex items-center gap-1.5 hover:bg-accent/50 p-1 px-2 rounded-md cursor-pointer transition-colors -ml-2">
              <Hexagon className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-semibold tracking-tight text-foreground">ex-cloud&apos;s Org</span>
              <span className="text-[9px] font-bold text-muted-foreground uppercase border border-border px-1.5 py-0.5 rounded-full ml-1">
                FREE
              </span>
            </Link>
          </BreadcrumbItem>

          {/* Project Section */}
          {projectId && (
            <>
              <BreadcrumbSeparator>
                <Slash className="w-3.5 h-3.5 text-muted-foreground/30 -rotate-12" />
              </BreadcrumbSeparator>
              <BreadcrumbItem>
                <Link href={`/org/${orgId}/project/${projectId}`} className="flex items-center gap-1.5 hover:bg-accent/50 p-1 px-2 rounded-md cursor-pointer transition-colors">
                  <Package className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-semibold tracking-tight text-foreground">FTTH GIS</span>
                </Link>
              </BreadcrumbItem>

              {/* Branch Section */}
              <BreadcrumbSeparator>
                <Slash className="w-3.5 h-3.5 text-muted-foreground/30 -rotate-12" />
              </BreadcrumbSeparator>
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
           <Button variant="outline" size="sm" className="h-7 text-xs font-semibold gap-1.5 rounded-full px-3 border-border text-foreground hover:bg-accent">
             <Plug2 className="w-3.5 h-3.5" />
             Connect
           </Button>
         </div>
      )}
    </div>
  );
}
