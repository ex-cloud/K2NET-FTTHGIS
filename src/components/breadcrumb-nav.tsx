"use client";

import * as React from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
} from "@/components/ui/breadcrumb";
import { usePathname } from "next/navigation";
import { Plug2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BreadcrumbNav() {
  const pathname = usePathname();
  const parts = pathname?.split("/") || [];

  const isLanding = pathname === "/org";
  const projectId = parts[4];

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
           <Button variant="outline" size="sm" className="h-7 text-xs font-semibold gap-1.5 rounded-full px-3 border-border text-foreground hover:bg-accent">
             <Plug2 className="w-3.5 h-3.5" />
             Connect
           </Button>
         </div>
      )}
    </div>
  );
}
