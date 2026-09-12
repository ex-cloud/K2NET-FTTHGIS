import { signOut } from "@/lib/auth-compat";

export interface HttpClientOptions extends RequestInit {
  token?: string;
  projectId?: string;
}

async function handleOfflineEnqueue(
  url: string,
  method: string,
  body: BodyInit | null | undefined,
  requestHeaders: Headers
): Promise<Response | null> {
  try {
    const { enqueueOfflineRequest } = await import("@/lib/offline/offlineQueue");
    const plainHeaders: Record<string, string> = {};
    requestHeaders.forEach((value, key) => {
      plainHeaders[key] = value;
    });

    await enqueueOfflineRequest(url, method, body, plainHeaders);
    return new Response(JSON.stringify({ offline: true, success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (enqueueError) {
    console.error("Failed to enqueue offline request:", enqueueError);
    return null;
  }
}

async function handle403Response(response: Response): Promise<Response> {
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

async function handle401Response(
  response: Response,
  url: string,
  rest: RequestInit,
  requestHeaders: Headers
): Promise<Response> {
  const lastLoginStr = typeof window !== "undefined" ? localStorage.getItem("last_login_time") : null;
  const lastLogin = lastLoginStr ? parseInt(lastLoginStr, 10) : Date.now();
  const isTransient = Date.now() - lastLogin < 30000;

  if (!isTransient) {
    signOut();
    return response;
  }

  const maxSilentRetries = 3;
  for (let attempt = 1; attempt <= maxSilentRetries; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, attempt * 2000));
    const retryResponse = await fetch(url, { ...rest, headers: requestHeaders });
    if (retryResponse.ok || retryResponse.status !== 401) {
      return retryResponse;
    }
  }

  return response;
}

/**
 * A centralized fetch wrapper that handles:
 * 1. Authorization header injecting
 * 2. Project ID header injecting
 * 3. Graceful 401 Unauthorized handling (automatic logout)
 */
export async function httpClient(url: string, options: HttpClientOptions = {}): Promise<Response> {
  const { token, projectId, headers, ...rest } = options;
  const method = (rest.method || "GET").toUpperCase();
  const isWrite = ["POST", "PUT", "DELETE", "PATCH"].includes(method);
  const requestHeaders = new Headers(headers);

  if (typeof window !== "undefined" && !navigator.onLine && isWrite) {
    if (token) requestHeaders.set("Authorization", `Bearer ${token}`);
    if (projectId) requestHeaders.set("X-Project-ID", projectId);
    const offlineRes = await handleOfflineEnqueue(url, method, rest.body, requestHeaders);
    if (offlineRes) return offlineRes;
  }

  if (token) requestHeaders.set("Authorization", `Bearer ${token}`);
  if (projectId) requestHeaders.set("X-Project-ID", projectId);

  if (rest.body && !requestHeaders.has("Content-Type") && typeof rest.body === "string") {
    requestHeaders.set("Content-Type", "application/json");
  }

  try {
    const response = await fetch(url, {
      ...rest,
      headers: requestHeaders,
    });

    if (response.status === 403) {
      return handle403Response(response);
    }

    if (response.status === 401) {
      return handle401Response(response, url, rest, requestHeaders);
    }

    if (response.ok && token && typeof window !== "undefined" && !localStorage.getItem("last_login_time")) {
      localStorage.setItem("last_login_time", Date.now().toString());
    }

    return response;
  } catch (error) {
    console.error(`[HTTP Client] Fetch error at ${url}:`, error);

    if (isWrite && typeof window !== "undefined") {
      const offlineRes = await handleOfflineEnqueue(url, method, rest.body, requestHeaders);
      if (offlineRes) return offlineRes;
    }

    throw error;
  }
}
