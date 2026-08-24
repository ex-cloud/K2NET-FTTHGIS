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
