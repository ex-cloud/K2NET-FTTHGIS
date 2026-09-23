/**
 * Utility to handle multi-tenant domain and subdomain routing for Tenant Portal (Vite CSR SPA).
 * Ensures strict multi-tenant isolation and prevents access leakage across scopes.
 */

export interface ParsedDomainResult {
  subdomain: string;
  baseDomain: string;
  isHyphen: boolean;
}

/**
 * Parses the hostname to extract tenant subdomain and base domain.
 * Supports production domains (*.gis.kdua.net, *-gis.kdua.net), staging, lvh.me, and localhost.
 */
export function parseDomain(hostname: string): ParsedDomainResult {
  let subdomain = "";
  let baseDomain = "";
  let isHyphen = false;

  // Strip port if present (e.g., tenant1.localhost:3002 -> tenant1.localhost)
  const hostOnly = hostname.split(":")[0];

  if (hostOnly.endsWith("gis-staging.kdua.net")) {
    baseDomain = "gis-staging.kdua.net";
    isHyphen = true;
    if (hostOnly !== baseDomain) {
      subdomain = hostOnly.substring(0, hostOnly.length - baseDomain.length - 1);
    }
  } else if (hostOnly.endsWith("gis.kdua.net")) {
    baseDomain = "gis.kdua.net";
    isHyphen = true;
    if (hostOnly !== baseDomain) {
      subdomain = hostOnly.substring(0, hostOnly.length - baseDomain.length - 1);
    }
  } else if (hostOnly.endsWith("lvh.me")) {
    baseDomain = "lvh.me";
    isHyphen = false;
    const parts = hostOnly.split(".");
    if (parts.length > 2) {
      subdomain = parts[0];
    }
  } else if (hostOnly.endsWith("localhost") || hostOnly === "127.0.0.1") {
    baseDomain = "localhost";
    isHyphen = false;
    const parts = hostOnly.split(".");
    if (parts.length > 2) {
      subdomain = parts[0];
    }
  } else {
    // Dynamic fallback based on env or current window origin
    const appUrl =
      (typeof import.meta !== "undefined" && import.meta.env?.VITE_APP_URL) ||
      (typeof window !== "undefined" && window.location.origin) ||
      "http://localhost:3002";

    try {
      const url = new URL(appUrl);
      baseDomain = url.host.split(":")[0];
      if (baseDomain.endsWith(".kdua.net")) {
        isHyphen = true;
      }

      if (isHyphen) {
        if (hostOnly.endsWith(`-${baseDomain}`)) {
          subdomain = hostOnly.substring(0, hostOnly.length - baseDomain.length - 1);
        }
      } else {
        if (hostOnly.endsWith(`.${baseDomain}`)) {
          subdomain = hostOnly.substring(0, hostOnly.length - baseDomain.length - 1);
        }
      }
    } catch {
      baseDomain = "localhost";
    }
  }

  return { subdomain, baseDomain, isHyphen };
}

/**
 * Constructs a full URL for a specific tenant organization in Tenant Portal.
 * @param slug The organization slug (subdomain)
 * @param path Path within tenant portal (defaults to /projects)
 */
export function getTenantUrl(slug: string, path: string = "/projects"): string {
  try {
    let protocol = "https:";
    
    if (typeof window !== "undefined") {
      protocol = window.location.protocol;
      const hostname = window.location.hostname;
      const port = window.location.port;
      
      const { baseDomain, isHyphen } = parseDomain(hostname);
      const portSuffix = port ? `:${port}` : "";
      
      if (isHyphen) {
        return `${protocol}//${slug}-${baseDomain}${portSuffix}${path}`;
      } else {
        return `${protocol}//${slug}.${baseDomain}${portSuffix}${path}`;
      }
    }
    
    return `http://${slug}.localhost:3002${path}`;
  } catch {
    return `http://${slug}.localhost:3002${path}`;
  }
}

/**
 * Constructs the default tenant hostname string (e.g. kircon-gis.kdua.net or kircon.localhost).
 */
export function getDefaultTenantHost(slug: string): string {
  try {
    if (typeof window !== "undefined") {
      const hostname = window.location.hostname;
      const { baseDomain, isHyphen } = parseDomain(hostname);
      if (isHyphen) {
        return `${slug}-${baseDomain}`;
      } else {
        return `${slug}.${baseDomain}`;
      }
    }
    return `${slug}.localhost`;
  } catch {
    return `${slug}.localhost`;
  }
}

/**
 * Returns the base application origin for Tenant Portal.
 */
export function getBaseUrl(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return "http://localhost:3002";
}

/**
 * Returns the System Admin portal URL (studio-admin running on port 3001 in dev, system-gis.kdua.net in prod).
 * Strictly separated from Tenant Portal.
 */
export function getSystemUrl(path: string = "/organizations"): string {
  try {
    if (typeof window !== "undefined") {
      const protocol = window.location.protocol;
      const hostname = window.location.hostname;
      
      // In production, system admin is always system-gis.kdua.net
      if (hostname.includes("gis.kdua.net") || hostname.includes("gis-staging.kdua.net")) {
        const adminHost = hostname.includes("gis-staging")
          ? "system-gis-staging.kdua.net"
          : "system-gis.kdua.net";
        return `${protocol}//${adminHost}${path}`;
      }
      
      // In local development, studio-admin is on port 3001
      return `http://localhost:3001${path}`;
    }
    return `http://localhost:3001${path}`;
  } catch {
    return `http://localhost:3001${path}`;
  }
}

/**
 * Detects the current subdomain from the window location and returns it as the organization slug.
 * "system", "auth", "www", and "api" are excluded as reserved platform domains.
 */
export function getCurrentOrgSlug(): string | null {
  if (typeof window === "undefined") return null;
  
  const hostname = window.location.hostname;
  const { subdomain } = parseDomain(hostname);
  
  const reservedSubdomains = ["system", "auth", "www", "api", "mail", "cdn"];
  if (subdomain && !reservedSubdomains.includes(subdomain)) {
    return subdomain;
  }
  
  return null;
}

/**
 * Normalizes a logo URL to a relative path reachable via the frontend proxy or CDN.
 */
export function getLogoUrl(logoUrl: string | undefined | null): string {
  if (!logoUrl) return "";
  if (logoUrl.includes("/uploads/")) {
    return logoUrl.substring(logoUrl.lastIndexOf("/uploads/"));
  }
  return logoUrl;
}
