/**
 * Human-friendly route name resolver for top header and browser tab titles.
 * Safely handles dynamic parameters, UUIDs, and nested sub-routes.
 */

const ROUTE_TITLE_MAP: Record<string, string> = {
  "/overview": "Overview",
  "/organizations": "Organizations",
  "/users": "Global Users",
  "/tasks": "Projects & Issues",
  "/tasks/projects": "Projects",
  "/observability": "Observability",
  "/observability/overview": "Observability Overview",
  "/observability/compute": "Compute & Host",
  "/observability/database": "Database & Storage",
  "/observability/query-performance": "Query Performance",
  "/observability/api-gateway": "API Gateway",
  "/observability/spatial-map": "Spatial Map Engine",
  "/observability/scheduler": "Scheduler & Backups",
  "/observability/olt-poller": "OLT & Poller Engine",
  "/observability/identity": "Identity & Auth",
  "/observability/messaging": "Messaging Gateway",
  "/logs": "Global Logs",
  "/security": "Security",
  "/security/audit": "Audit Trail",
  "/security/compliance": "Compliance",
  "/security/roles": "Roles & Permissions",
  "/security/password-policy": "Password Policy",
  "/security/devices": "Trusted Devices",
  "/gateways": "Gateways",
  "/gateways/overview": "Gateways Overview",
  "/gateways/notification": "Notification Gateway",
  "/gateways/payment": "Payment Gateway",
  "/gateways/map": "Spatial Map Gateway",
  "/gateways/storage": "Storage S3 Gateway",
  "/gateways/whatsapp": "WhatsApp Gateway",
  "/gateways/scheduler": "Scheduler Gateway",
  "/gateways/export": "Export Gateway",
  "/gateways/poller": "Poller Gateway",
  "/gateways/audit": "Audit Gateway",
  "/gateways/ai": "AI Gateway",
  "/ai": "AI Assistant",
  "/ai/knowledge": "Knowledge Base",
  "/ai/add": "Add Knowledge",
  "/assets-3d": "3D Assets",
  "/settings": "Settings",
  "/settings/general": "General Settings",
  "/settings/database": "Database Config",
  "/settings/infrastructure": "Infrastructure",
  "/settings/api-tokens": "API Tokens",
  "/settings/billing": "Billing & Subscription",
  "/settings/email": "Email & SMTP",
  "/account/profile": "User Profile",
  "/account/preferences": "Preferences",
};

const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export interface RouteBreadcrumb {
  label: string;
  href?: string;
}

const ROOT_BREADCRUMB_MAP: Record<string, { label: string; defaultHref: string }> = {
  observability: { label: "Observability", defaultHref: "/observability/overview" },
  security: { label: "Security", defaultHref: "/security/audit" },
  gateways: { label: "Gateways", defaultHref: "/gateways/overview" },
  settings: { label: "Settings", defaultHref: "/settings/general" },
  tasks: { label: "Projects & Issues", defaultHref: "/tasks" },
  organizations: { label: "Organizations", defaultHref: "/organizations" },
  ai: { label: "AI Assistant", defaultHref: "/ai" },
};

/**
 * Returns an array of hierarchical breadcrumbs for the top header.
 * E.g. /observability/database -> [{ label: "Observability", href: "/observability/overview" }, { label: "Database & Storage", href: "/observability/database" }]
 */
export function getRouteBreadcrumbs(pathname: string): RouteBreadcrumb[] {
  if (!pathname || pathname === "/" || pathname === "/overview") {
    return [{ label: "Overview", href: "/overview" }];
  }

  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) {
    return [{ label: "Overview", href: "/overview" }];
  }

  const rootSeg = segments[0];
  const rootConfig = ROOT_BREADCRUMB_MAP[rootSeg];

  if (rootConfig) {
    const breadcrumbs: RouteBreadcrumb[] = [{ label: rootConfig.label, href: rootConfig.defaultHref }];

    if (segments.length > 1) {
      if (rootSeg === "organizations") {
        breadcrumbs.push({ label: "Organization Details" });
      } else if (rootSeg === "tasks" && segments[1] === "projects") {
        breadcrumbs.push({ label: "Projects", href: "/tasks/projects" });
        if (segments.length > 2) {
          breadcrumbs.push({ label: "Details" });
        }
      } else {
        const subPath = `/${rootSeg}/${segments[1]}`;
        const subLabel = ROUTE_TITLE_MAP[subPath] || segments[1].replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
        breadcrumbs.push({ label: subLabel, href: subPath });
      }
    }
    return breadcrumbs;
  }

  // Fallback: single breadcrumb
  const title = ROUTE_TITLE_MAP[pathname] || getRouteHeaderTitle(pathname);
  return [{ label: title, href: pathname }];
}

/**
 * Returns a clean, human-friendly title for the top header breadcrumb.
 * E.g. /tasks/projects/d16d2ba6-... -> "Projects"
 */
export function getRouteHeaderTitle(pathname: string): string {
  if (!pathname || pathname === "/" || pathname === "/overview") {
    return "Overview";
  }

  // Exact match first
  if (ROUTE_TITLE_MAP[pathname]) {
    return ROUTE_TITLE_MAP[pathname];
  }

  // Specific prefix rules
  if (pathname.startsWith("/tasks/projects")) {
    return "Projects";
  }
  if (pathname.startsWith("/tasks")) {
    return "Projects & Issues";
  }
  if (pathname.startsWith("/observability")) {
    return "Observability";
  }
  if (pathname.startsWith("/security")) {
    return "Security";
  }
  if (pathname.startsWith("/gateways")) {
    return "Gateways";
  }
  if (pathname.startsWith("/ai")) {
    return "AI Assistant";
  }
  if (pathname.startsWith("/settings")) {
    return "Settings";
  }
  if (pathname.startsWith("/organizations")) {
    return "Organizations";
  }
  if (pathname.startsWith("/users")) {
    return "Global Users";
  }

  // Fallback: take the last non-UUID path segment
  const segments = pathname.split("/").filter(Boolean);
  for (let i = segments.length - 1; i >= 0; i--) {
    const seg = segments[i];
    if (!UUID_REGEX.test(seg) && !/^\d+$/.test(seg)) {
      return seg.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    }
  }

  return "Overview";
}
