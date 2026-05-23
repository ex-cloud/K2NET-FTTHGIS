"use client";

import {
  SidebarModeProvider,
} from "@/components/sidebar-mode-context";
import { SuspensionOverlay } from "@/components/tenant/suspension-overlay";
import { GlobalHeader } from "@/components/global-header";
import { useUIStore } from "@/store/ui-store";
import React, { useEffect } from "react";
import { useParams } from "next/navigation";
import { getCurrentOrgSlug, getLogoUrl } from "@/lib/domain";

import { usePathname } from "next/navigation";
import { useOrganizations } from "@/hooks/useOrganizations";
import { useSystemSettings } from "@/hooks/useSystemSettings";
import { useProjects } from "@/hooks/useProjects";

export default function OrgLayout({ children }: { children: React.ReactNode }) {
  const { setOrganizationSuspended } = useUIStore();
  const params = useParams();
  const pathname = usePathname();
  const { organizations = [] } = useOrganizations();
  const { settings = [] } = useSystemSettings();

  // Resolve active org dynamically (handles subdomains and path-based development routes)
  const hostname = typeof window !== "undefined" ? window.location.hostname : "";
  const isSystemSubdomain = hostname.startsWith("system.") || hostname.startsWith("system-");
  const tenantSlug = getCurrentOrgSlug();

  const segmentsList = pathname?.split("/").filter(Boolean) || [];
  const orgIdFromPath = segmentsList[0] === "org" ? segmentsList[1] : (segmentsList[0] !== "project" ? segmentsList[0] : "");
  const activeSlug = tenantSlug || orgIdFromPath || (params?.orgId as string) || "";
  const currentOrg = organizations.find((o) => o.slug === activeSlug || o.id === activeSlug);

  // Load projects for active org to resolve dynamic project names
  const { projects = [] } = useProjects(currentOrg?.id);

  // Reset suspension state when returning to the organization list
  useEffect(() => {
    if (!params?.orgId) {
      setOrganizationSuspended(false);
    }
  }, [params?.orgId, setOrganizationSuspended]);

  // Dynamic tenant-level tab title & favicon sync
  const desiredTitleRef = React.useRef<string>("");
  
  useEffect(() => {
    const appName = settings.find((s) => s.key === "app_name")?.value || "FTTH GIS";
    const systemLogo = settings.find((s) => s.key === "logo_url")?.value || "";

    // 1. Determine Tab Title
    const segments = pathname.split("/").filter(Boolean);
    const lastSegment = segments[segments.length - 1] || "Dashboard";
    
    // Check if there is an active project UUID in params or pathname
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const resolvedProjectId = (params?.projectId as string) || segments.find(s => uuidRegex.test(s)) || "";
    
    const activeProject = resolvedProjectId ? projects.find(p => p.id === resolvedProjectId) : null;
    const projectName = activeProject?.name || (resolvedProjectId ? "Project" : "");

    let pageTitle = "";
    if (uuidRegex.test(lastSegment)) {
      // If the last segment is the project UUID itself, show the project name
      pageTitle = projectName;
    } else {
      // Standard page name
      const rawTitle = lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1);
      
      // If we are deep inside a project, format: "Subpage - Project Name"
      if (projectName && pathname.includes("/project/")) {
        pageTitle = `${rawTitle} - ${projectName}`;
      } else {
        pageTitle = rawTitle;
      }
    }

    let computedTitle = "";
    if (currentOrg) {
      computedTitle = lastSegment === activeSlug 
        ? `${currentOrg.name} | ${appName}`
        : `${pageTitle} | ${currentOrg.name} - ${appName}`;
    } else {
      computedTitle = `Select Organization | ${appName}`;
    }

    desiredTitleRef.current = computedTitle;
    document.title = computedTitle;

    // 2. Observe <title> mutations to re-assert our title
    // This guards against Next.js soft-navigation resetting the title
    // to the root layout metadata default ("FTTH GIS") on same-page navigations.
    const titleEl = document.querySelector("title");
    if (titleEl) {
      const observer = new MutationObserver(() => {
        if (document.title !== desiredTitleRef.current && desiredTitleRef.current) {
          document.title = desiredTitleRef.current;
        }
      });
      observer.observe(titleEl, { childList: true, characterData: true, subtree: true });
      // Cleanup observer on effect re-run
      return () => observer.disconnect();
    }

    // 3. Determine Tab Favicon (Tenant Logo -> System Logo -> fallback)
    const favUrl = (currentOrg && currentOrg.logoUrl && currentOrg.logoUrl.trim() !== "") 
      ? getLogoUrl(currentOrg.logoUrl) 
      : getLogoUrl(systemLogo);

    if (favUrl) {
      let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      link.href = favUrl;
    }
  }, [organizations, settings, pathname, params?.orgId, params?.projectId, projects, currentOrg, activeSlug]);

  return (
    <SidebarModeProvider>
      <div className="flex flex-col h-screen w-full bg-background overflow-hidden font-sans">
        <SuspensionOverlay />
        <GlobalHeader />
        <div className="flex flex-1 w-full overflow-hidden relative">
          {children}
        </div>
      </div>
    </SidebarModeProvider>
  );
}
