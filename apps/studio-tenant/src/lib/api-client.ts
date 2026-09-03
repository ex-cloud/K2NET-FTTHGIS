let activeToken: string | null = null;
let activeImpersonationSessionId: string | null = null;

export function setApiAuthToken(token: string | null) {
  activeToken = token;
  if (typeof window !== "undefined") {
    if (token) {
      sessionStorage.setItem("k2net_impersonation_token", token);
      localStorage.setItem("k2net_impersonation_token", token);
    } else {
      sessionStorage.removeItem("k2net_impersonation_token");
      localStorage.removeItem("k2net_impersonation_token");
    }
  }
}

export function getApiAuthToken(): string | null {
  if (!activeToken && typeof window !== "undefined") {
    activeToken = sessionStorage.getItem("k2net_impersonation_token") || localStorage.getItem("k2net_impersonation_token");
  }
  return activeToken;
}

export function setImpersonationSessionId(sessionId: string | null) {
  activeImpersonationSessionId = sessionId;
  if (typeof window !== "undefined") {
    if (sessionId) {
      sessionStorage.setItem("k2net_impersonation_session_id", sessionId);
      localStorage.setItem("k2net_impersonation_session_id", sessionId);
    } else {
      sessionStorage.removeItem("k2net_impersonation_session_id");
      localStorage.removeItem("k2net_impersonation_session_id");
    }
  }
}

export function getImpersonationSessionId(): string | null {
  if (!activeImpersonationSessionId && typeof window !== "undefined") {
    activeImpersonationSessionId = sessionStorage.getItem("k2net_impersonation_session_id") || localStorage.getItem("k2net_impersonation_session_id");
  }
  return activeImpersonationSessionId;
}

export interface FetchOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

export async function apiClient<T = any>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { params, headers = {}, ...customConfig } = options;

  let url = endpoint;
  if (params) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined) query.append(key, String(val));
    });
    const queryString = query.toString();
    if (queryString) {
      url += (url.includes("?") ? "&" : "?") + queryString;
    }
  }

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

  const response = await fetch(url, {
    headers: reqHeaders,
    ...customConfig,
  });

  if (!response.ok) {
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
