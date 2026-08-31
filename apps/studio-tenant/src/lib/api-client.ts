let activeToken: string | null = null;

export function setApiAuthToken(token: string | null) {
  activeToken = token;
}

export function getApiAuthToken(): string | null {
  return activeToken;
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

  if (activeToken) {
    reqHeaders["Authorization"] = `Bearer ${activeToken}`;
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
