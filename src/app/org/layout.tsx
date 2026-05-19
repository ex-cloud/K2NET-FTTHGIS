"use client";

import {
  SidebarModeProvider,
} from "@/components/sidebar-mode-context";
import { SuspensionOverlay } from "@/components/tenant/suspension-overlay";
import { GlobalHeader } from "@/components/global-header";
import { useUIStore } from "@/store/ui-store";
import { useEffect } from "react";
import { useParams } from "next/navigation";

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
  const isLocal = hostname.includes("localhost") || hostname.includes("lvh.me");
  const isSystemSubdomain = hostname.startsWith("system.");
  const tenantSlug = isLocal && !isSystemSubdomain ? hostname.split(".")[0] : null;

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
  useEffect(() => {
    const appName = settings.find((s) => s.key === "app_name")?.value || "FTTH GISS";
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

    if (currentOrg) {
      document.title = lastSegment === activeSlug 
        ? `${currentOrg.name} | ${appName}`
        : `${pageTitle} | ${currentOrg.name} - ${appName}`;
    } else {
      document.title = `Select Organization | ${appName}`;
    }

    // 2. Determine Tab Favicon (Tenant Logo -> System Logo -> fallback)
    const favUrl = (currentOrg && currentOrg.logoUrl && currentOrg.logoUrl.trim() !== "") 
      ? currentOrg.logoUrl 
      : systemLogo;

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
