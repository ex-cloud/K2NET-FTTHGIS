/**
 * Utility to handle multi-tenant domain and subdomain routing.
 */

export function parseDomain(hostname: string) {
  let subdomain = "";
  let baseDomain = "";
  let isHyphen = false;

  // Strip port if present (e.g., system.lvh.me:3000 -> system.lvh.me)
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
  } else if (hostOnly.endsWith("localhost")) {
    baseDomain = "localhost";
    isHyphen = false;
    const parts = hostOnly.split(".");
    if (parts.length > 2) {
      subdomain = parts[0];
    }
  } else {
    // Dynamic fallback based on env
    const appUrl = (typeof import.meta !== "undefined" && import.meta.env?.VITE_APP_URL) || (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_APP_URL) || "http://localhost:3001";
    try {
      const url = new URL(appUrl);
      baseDomain = url.host;
      if (baseDomain.startsWith("system-")) {
        baseDomain = baseDomain.substring(7);
        isHyphen = true;
      } else if (baseDomain.startsWith("system.")) {
        baseDomain = baseDomain.substring(7);
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
      baseDomain = "localhost:3001";
    }
  }

  return { subdomain, baseDomain, isHyphen };
}

/**
 * Constructs a full URL for a specific tenant, handling both localhost and production domains.
 * @param slug The organization slug (subdomain)
 * @param path Optional path within the tenant dashboard (defaults to /dashboard)
 * @returns Full URL string
 */
export function getTenantUrl(slug: string, path: string = "/dashboard"): string {
  try {
    let protocol = "https:";
    
    if (typeof window !== "undefined") {
      protocol = window.location.protocol;
      const hostname = window.location.hostname;
      const port = window.location.port;
      
      const { baseDomain, isHyphen } = parseDomain(hostname);
      // In local development, tenant SPA is on port 3002
      const tenantPort = (hostname === "localhost" || hostname === "127.0.0.1" || hostname.endsWith(".localhost")) ? ":3002" : (port ? `:${port}` : "");
      
      if (isHyphen) {
        return `${protocol}//${slug}-${baseDomain}${tenantPort}${path}`;
      } else {
        return `${protocol}//${slug}.${baseDomain}${tenantPort}${path}`;
      }
    }
    
    const appUrl = (typeof import.meta !== "undefined" && import.meta.env?.VITE_APP_URL) || (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_APP_URL) || "http://localhost:3001";
    const url = new URL(appUrl);
    protocol = url.protocol;
    let fallbackHost = url.host;
    let isHyphen = false;
    if (fallbackHost.startsWith("system-")) {
      fallbackHost = fallbackHost.substring(7);
      isHyphen = true;
    } else if (fallbackHost.startsWith("system.")) {
      fallbackHost = fallbackHost.substring(7);
    }
    
    if (isHyphen) {
      return `${protocol}//${slug}-${fallbackHost}${path}`;
    } else {
      return `${protocol}//${slug}.${fallbackHost}${path}`;
    }
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
    const appUrl = (typeof import.meta !== "undefined" && import.meta.env?.VITE_APP_URL) || (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_APP_URL) || "http://localhost:3001";
    const url = new URL(appUrl);
    let fallbackHost = url.host;
    let isHyphen = false;
    if (fallbackHost.startsWith("system-")) {
      fallbackHost = fallbackHost.substring(7);
      isHyphen = true;
    } else if (fallbackHost.startsWith("system.")) {
      fallbackHost = fallbackHost.substring(7);
    }
    if (isHyphen) {
      return `${slug}-${fallbackHost}`;
    } else {
      return `${slug}.${fallbackHost}`;
    }
  } catch {
    return `${slug}.localhost`;
  }
}

/**
 * Returns the base application URL (root domain).
 */
export function getBaseUrl(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return (typeof import.meta !== "undefined" && import.meta.env?.VITE_APP_URL) || (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_APP_URL) || "http://localhost:3001";
}

/**
 * Returns the System Admin URL.
 */
export function getSystemUrl(path: string = "/organizations"): string {
  try {
    if (typeof window !== "undefined") {
      const protocol = window.location.protocol;
      const hostname = window.location.hostname;
      const port = window.location.port;
      
      const { baseDomain, isHyphen } = parseDomain(hostname);
      const portSuffix = port ? `:${port}` : "";
      
      if (isHyphen) {
        return `${protocol}//system-${baseDomain}${portSuffix}${path}`;
      } else {
        return `${protocol}//system.${baseDomain}${portSuffix}${path}`;
      }
    }
    
    const baseUrl = getBaseUrl();
    const url = new URL(baseUrl);
    if (url.host.startsWith("system-") || url.host.startsWith("system.")) {
      return `${url.protocol}//${url.host}${path}`;
    }
    return `${url.protocol}//system.${url.host}${path}`;
  } catch {
    return `http://system.localhost:3001${path}`;
  }
}

/**
 * Detects the current subdomain from the window location and returns it as the organization slug.
 * This is the reliable way to get the orgId in clean URL scenarios.
 */
export function getCurrentOrgSlug(): string | null {
  if (typeof window === "undefined") return null;
  
  const hostname = window.location.hostname;
  const pathname = window.location.pathname;
  
  const { subdomain } = parseDomain(hostname);
  
  if (subdomain === "system") {
    if (pathname.startsWith("/org/") || pathname === "/dashboard" || pathname.startsWith("/dashboard/") || pathname.startsWith("/project/") || pathname.startsWith("/team/")) {
      return "system";
    }
    return null;
  }
  
  if (subdomain && subdomain !== "auth" && subdomain !== "www") {
    return subdomain;
  }
  
  return null;
}

/**
 * Normalizes a logo URL to a relative path reachable via the frontend proxy.
 * E.g. "http://localhost:9090/uploads/uuid.png" becomes "/uploads/uuid.png".
 */
export function getLogoUrl(logoUrl: string | undefined | null): string {
  if (!logoUrl) return "";
  if (logoUrl.includes("/uploads/")) {
    return logoUrl.substring(logoUrl.lastIndexOf("/uploads/"));
  }
  return logoUrl;
}
