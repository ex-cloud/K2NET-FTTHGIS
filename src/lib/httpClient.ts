import { signOut } from "next-auth/react";
import { useUIStore } from "@/store/ui-store";

export interface HttpClientOptions extends RequestInit {
  token?: string;
  projectId?: string;
}

/**
 * A centralized fetch wrapper that handles:
 * 1. Authorization header injecting
 * 2. Project ID header injecting
 * 3. Graceful 401 Unauthorized handling (automatic logout)
 */
export async function httpClient(url: string, options: HttpClientOptions = {}) {
  const { token, projectId, headers, ...rest } = options;

  const requestHeaders = new Headers(headers);

  if (token) {
    requestHeaders.set("Authorization", `Bearer ${token}`);
    
    // Automatic Impersonation Logic for Superadmin
    // We use the activeTenantId from the UI store which is synchronized by NavOrgSwitcher
    if (typeof window !== "undefined") {
      const hostname = window.location.hostname;
      const isSystemSubdomain = hostname.startsWith("system.");
      
      // JANGAN kirim X-Tenant-ID jika kita di subdomain system
      if (!isSystemSubdomain) {
        const activeTenantId = useUIStore.getState().activeTenantId;
        if (activeTenantId) {
          requestHeaders.set("X-Tenant-ID", activeTenantId);
        }
      }
    }
  }

  if (projectId) {
    requestHeaders.set("X-Project-ID", projectId);
  }

  // Ensure JSON content type if body is present and not already set
  if (rest.body && !requestHeaders.has("Content-Type") && typeof rest.body === "string") {
    requestHeaders.set("Content-Type", "application/json");
  }

  try {
    const response = await fetch(url, {
      ...rest,
      headers: requestHeaders,
    });

    if (response.status === 403) {
      // Try to parse the error to see if it's a suspension
      const clone = response.clone();
      try {
        const errorData = await clone.json();
        if (errorData.error === "ORGANIZATION_SUSPENDED") {
          const { useUIStore } = await import("@/store/ui-store");
          useUIStore.getState().setOrganizationSuspended(true);
        }
      } catch {
        // Not JSON or other error, ignore
      }
      return response;
    }

    if (response.status === 401) {
      // Get the last login time to detect transient sync issues right after login
      const lastLoginStr = typeof window !== 'undefined' ? localStorage.getItem('last_login_time') : null;
      const lastLogin = lastLoginStr ? parseInt(lastLoginStr, 10) : Date.now();
      const now = Date.now();
      const isTransient = (now - lastLogin) < 30000; 

      if (isTransient) {
        let retryAttempt = 0;
        const maxSilentRetries = 3;
        
        while (retryAttempt < maxSilentRetries) {
          retryAttempt++;
          const waitTime = retryAttempt * 2000;
          
          await new Promise(resolve => setTimeout(resolve, waitTime));
          
          const retryResponse = await fetch(url, { ...rest, headers: requestHeaders });
          if (retryResponse.ok) {
            return retryResponse;
          }
          
          if (retryResponse.status !== 401) break;
        }
      } else {
        signOut({ callbackUrl: "/login" });
      }
      
      return response;
    }

    // Record login time on first successful authorized request if not exists
    if (response.ok && token && typeof window !== 'undefined' && !localStorage.getItem('last_login_time')) {
      localStorage.setItem('last_login_time', Date.now().toString());
    }

    return response;
  } catch (error) {
    console.error(`[HTTP Client] Fetch error at ${url}:`, error);
    throw error;
  }
}
