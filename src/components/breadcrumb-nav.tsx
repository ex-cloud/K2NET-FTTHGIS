"use client";

import * as React from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { usePathname } from "next/navigation";

import { NavOrgSwitcher } from "./nav-org-switcher";
import { NavProjectSwitcher } from "./nav-project-switcher";

export function BreadcrumbNav() {
  const pathname = usePathname();
  const parts = pathname?.split("/") || [];

  // parts[1] = "org"
  // parts[2] = [orgId]
  // parts[3] = "project"
  // parts[4] = [projectId]

  const isLanding = pathname === "/org";
  const orgId = parts[2];
  const projectId = parts[4];
  const currentPage = parts.length > 5 ? parts[parts.length - 1] : "";

  if (isLanding) {
    return (
      <Breadcrumb className="flex items-center">
        <BreadcrumbList className="flex items-center gap-1.5">
          <span className="text-zinc-700 text-sm font-light select-none">
            /
          </span>
          <BreadcrumbItem>
            <span className="text-sm font-medium text-zinc-400">
              Organizations
            </span>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    );
  }

  return (
    <Breadcrumb className="flex items-center">
      <BreadcrumbList className="flex items-center gap-1.5">
        <span className="text-zinc-700 text-sm font-light select-none">/</span>

        {orgId && (
          <>
            <BreadcrumbItem>
              <NavOrgSwitcher />
            </BreadcrumbItem>
          </>
        )}

        {projectId && (
          <>
            <BreadcrumbSeparator className="text-zinc-700">
              <span className="text-zinc-700 text-sm font-light">/</span>
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <NavProjectSwitcher />
            </BreadcrumbItem>
          </>
        )}

        {currentPage && currentPage !== "project" && (
          <>
            <BreadcrumbSeparator className="text-zinc-700">
              <span className="text-zinc-700 text-sm font-light">/</span>
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                <span className="capitalize">
                  {currentPage.replace(/-/g, " ")}
                </span>
                {currentPage === "main" && (
                  <span className="text-[10px] bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-full text-amber-500 font-bold uppercase tracking-tight">
                    Production
                  </span>
                )}
              </div>
            </BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
