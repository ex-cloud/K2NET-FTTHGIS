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
    // Fallback migrasi satu kali jika ada data lama di localStorage
    if (!activeToken) {
      const legacyToken = localStorage.getItem("k2net_impersonation_token");
      if (legacyToken) {
        activeToken = legacyToken;
        sessionStorage.setItem("k2net_impersonation_token", legacyToken);
        localStorage.removeItem("k2net_impersonation_token");
      }
    }
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
    // Fallback migrasi satu kali jika ada data lama di localStorage
    if (!activeImpersonationSessionId) {
      const legacySessionId = localStorage.getItem("k2net_impersonation_session_id");
      if (legacySessionId) {
        activeImpersonationSessionId = legacySessionId;
        sessionStorage.setItem("k2net_impersonation_session_id", legacySessionId);
        localStorage.removeItem("k2net_impersonation_session_id");
      }
    }
  }
  return activeImpersonationSessionId;
}

export interface FetchOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

export async function apiClient<T = unknown>(endpoint: string, options: FetchOptions = {}): Promise<T> {
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
    if (response.status === 401 && impersonationSessionId) {
      setImpersonationSessionId(null);
      setApiAuthToken(null);
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("k2net_impersonation_meta");
        localStorage.removeItem("k2net_impersonation_meta");
        sessionStorage.removeItem("k2net_impersonating_in_progress");
      }
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
