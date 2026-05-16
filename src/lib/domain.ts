/**
 * Utility to handle multi-tenant domain and subdomain routing.
 */

/**
 * Constructs a full URL for a specific tenant, handling both localhost and production domains.
 * @param slug The organization slug (subdomain)
 * @param path Optional path within the tenant dashboard (defaults to /dashboard)
 * @returns Full URL string
 */
export function getTenantUrl(slug: string, path: string = "/dashboard"): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  
  try {
    const url = new URL(appUrl);
    const protocol = url.protocol; // http: or https:
    const host = url.host; // localhost:3000 or ftthgis.com

    // Construct subdomain: http://slug.host
    return `${protocol}//${slug}.${host}${path}`;
  } catch {
    // Fallback if URL is invalid
    return `http://${slug}.localhost:3000${path}`;
  }
}

/**
 * Returns the base application URL (root domain).
 */
export function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

/**
 * Returns the System Admin URL.
 */
export function getSystemUrl(path: string = "/organizations"): string {
  const baseUrl = getBaseUrl();
  try {
    const url = new URL(baseUrl);
    return `${url.protocol}//system.${url.host}${path}`;
  } catch {
    return `http://system.localhost:3000${path}`;
  }
}

/**
 * Detects the current subdomain from the window location and returns it as the organization slug.
 * This is the reliable way to get the orgId in clean URL scenarios.
 */
export function getCurrentOrgSlug(): string | null {
  if (typeof window === "undefined") return null;
  
  const hostname = window.location.hostname;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  
  try {
    const url = new URL(appUrl);
    const rootHost = url.hostname;
    
    if (hostname.endsWith(`.${rootHost}`)) {
      const subdomain = hostname.replace(`.${rootHost}`, "");
      if (subdomain && subdomain !== "www" && subdomain !== "system") {
        return subdomain;
      }
    }
    
    // Fallback for localhost.me or other dev setups
    if (hostname.includes(".lvh.me") || hostname.includes(".localhost")) {
      const parts = hostname.split(".");
      if (parts.length > 2) {
        const subdomain = parts[0];
        if (subdomain !== "www" && subdomain !== "system") return subdomain;
      }
    }
  } catch {
    // Ignore
  }
  
  return null;
}
