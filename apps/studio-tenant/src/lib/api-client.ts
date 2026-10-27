let activeToken: string | null = null;
let activeImpersonationSessionId: string | null = null;

export function setApiAuthToken(token: string | null) {
  activeToken = token;
  if (typeof window !== "undefined") {
    if (token) {
      sessionStorage.setItem("k2net_impersonation_token", token);
    } else {
      sessionStorage.removeItem("k2net_impersonation_token");
    }
    // Bersihkan residu legacy localStorage agar tidak bocor lintas tab
    localStorage.removeItem("k2net_impersonation_token");
  }
}

export function getApiAuthToken(): string | null {
  if (!activeToken && typeof window !== "undefined") {
    activeToken = sessionStorage.getItem("k2net_impersonation_token");
    // Bersihkan residu legacy localStorage agar tidak bocor lintas tab
    localStorage.removeItem("k2net_impersonation_token");
  }
  return activeToken;
}

export function setImpersonationSessionId(sessionId: string | null) {
  activeImpersonationSessionId = sessionId;
  if (typeof window !== "undefined") {
    if (sessionId) {
      sessionStorage.setItem("k2net_impersonation_session_id", sessionId);
    } else {
      sessionStorage.removeItem("k2net_impersonation_session_id");
    }
    // Bersihkan residu legacy localStorage agar tidak bocor lintas tab
    localStorage.removeItem("k2net_impersonation_session_id");
  }
}

export function getImpersonationSessionId(): string | null {
  if (!activeImpersonationSessionId && typeof window !== "undefined") {
    activeImpersonationSessionId = sessionStorage.getItem("k2net_impersonation_session_id");
    // Bersihkan residu legacy localStorage agar tidak bocor lintas tab
    localStorage.removeItem("k2net_impersonation_session_id");
  }
  return activeImpersonationSessionId;
}

// Single-flight promise lock for impersonation token refreshing
let refreshingPromise: Promise<string | null> | null = null;

/**
 * Proactively refresh the Super Admin access token using the backend relay.
 * Guarantees single-flight deduplication across concurrent API requests.
 */
export async function refreshImpersonationToken(): Promise<string | null> {
  const sessionId = getImpersonationSessionId();
  if (!sessionId) return null;

  if (refreshingPromise) {
    return refreshingPromise;
  }

  refreshingPromise = (async () => {
    try {
      // NOTE: Do NOT send the Authorization header here, because if the token is already expired,
      // Spring Security will intercept and return 401 before the request reaches the permitAll controller.
      const res = await fetch("/api/v1/system/impersonate/refresh-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Impersonation-Session-Id": sessionId,
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.accessToken) {
          setApiAuthToken(data.accessToken);
          return data.accessToken as string;
        }
      }
      return null;
    } catch (err) {
      console.warn("[apiClient] Failed to refresh impersonation token:", err);
      return null;
    } finally {
      refreshingPromise = null;
    }
  })();

  return refreshingPromise;
}

export interface FetchOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

function buildRequestUrl(
  endpoint: string,
  params?: Record<string, string | number | boolean | undefined>
): string {
  if (!params) return endpoint;
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined) query.append(key, String(val));
  });
  const queryString = query.toString();
  return queryString ? `${endpoint}${endpoint.includes("?") ? "&" : "?"}${queryString}` : endpoint;
}

function resolveTenantSlug(): string | null {
  if (typeof window === "undefined") return null;
  const searchParams = new URLSearchParams(window.location.search);
  const paramSlug = searchParams.get("tenant") || searchParams.get("slug");
  if (paramSlug) return paramSlug.toLowerCase().trim();

  const host = window.location.hostname;
  let detectedSlug: string | null = null;
  if (host.includes("-gis.")) {
    detectedSlug = host.split("-gis")[0];
  } else if (host.includes(".gis.")) {
    detectedSlug = host.split(".")[0];
  }

  if (detectedSlug && detectedSlug !== "system" && detectedSlug !== "api" && detectedSlug !== "gis") {
    return detectedSlug.toLowerCase().trim();
  }
  return null;
}

export async function apiClient<T = unknown>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { params, headers = {}, ...customConfig } = options;
  const url = buildRequestUrl(endpoint, params);

  const reqHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...(headers as Record<string, string>),
  };

  const token = getApiAuthToken();
  if (token) {
    reqHeaders["Authorization"] = `Bearer ${token}`;
  }

  const impersonationSessionId = getImpersonationSessionId();
  if (impersonationSessionId) {
    reqHeaders["X-Impersonation-Session-Id"] = impersonationSessionId;
  }

  const tenantSlug = resolveTenantSlug();
  if (tenantSlug) {
    reqHeaders["X-Tenant-Slug"] = tenantSlug;
  }

  let response = await fetch(url, {
    headers: reqHeaders,
    ...customConfig,
  });

  // Auto-heal 401 during active impersonation
  if (response.status === 401 && impersonationSessionId) {
    const newToken = await refreshImpersonationToken();
    if (newToken) {
      reqHeaders["Authorization"] = `Bearer ${newToken}`;
      response = await fetch(url, {
        headers: reqHeaders,
        ...customConfig,
      });
    }
  }

  if (!response.ok) {
    if (response.status === 401) {
      setApiAuthToken(null);
      setImpersonationSessionId(null);
    }
    const errorBody = await response.text().catch(() => "Unknown error");
    throw new Error(errorBody || `HTTP ${response.status} ${response.statusText}`);
  }

  // Handle empty responses
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return response.json();
  }
  return response.text() as unknown as T;
}
