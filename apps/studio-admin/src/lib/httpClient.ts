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
  const auth =
    typeof window !== "undefined"
      ? (window as unknown as {
          __K2NET_AUTH__?: {
            updateToken?: (minValidity?: number) => Promise<boolean>;
            token?: string;
          };
        }).__K2NET_AUTH__
      : undefined;

  if (auth?.updateToken) {
    try {
      const refreshed = await auth.updateToken(30);
      if (refreshed && auth.token) {
        requestHeaders.set("Authorization", `Bearer ${auth.token}`);
        const retryResponse = await fetch(url, { ...rest, headers: requestHeaders });
        if (retryResponse.ok || retryResponse.status !== 401) {
          return retryResponse;
        }
      }
    } catch (e) {
      console.warn("[HTTP Client] Silent token refresh on 401 failed:", e);
    }
  }

  return response;
}

function prepareRequestHeaders(
  options: HttpClientOptions,
  effectiveToken?: string
): Headers {
  const requestHeaders = new Headers(options.headers);

  if (effectiveToken && !requestHeaders.has("Authorization")) {
    requestHeaders.set("Authorization", `Bearer ${effectiveToken}`);
  }
  if (options.projectId && !requestHeaders.has("X-Project-ID")) {
    requestHeaders.set("X-Project-ID", options.projectId);
  }
  if (options.body && !requestHeaders.has("Content-Type") && typeof options.body === "string") {
    requestHeaders.set("Content-Type", "application/json");
  }

  return requestHeaders;
}

async function handleResponseStatus(
  response: Response,
  url: string,
  rest: RequestInit,
  requestHeaders: Headers,
  effectiveToken?: string
): Promise<Response> {
  if (response.status === 403) {
    return handle403Response(response);
  }

  if (response.status === 401) {
    return handle401Response(response, url, rest, requestHeaders);
  }

  if (response.ok && effectiveToken && typeof window !== "undefined" && !localStorage.getItem("last_login_time")) {
    localStorage.setItem("last_login_time", Date.now().toString());
  }

  return response;
}

/**
 * A centralized fetch wrapper that handles:
 * 1. Authorization header injecting (with auto-fallback to active Keycloak session)
 * 2. Project ID header injecting
 * 3. Graceful 401 Unauthorized handling
 */
export async function httpClient(url: string, options: HttpClientOptions = {}): Promise<Response> {
  const { token, projectId: _pid, ...rest } = options;
  const method = (rest.method || "GET").toUpperCase();
  const isWrite = ["POST", "PUT", "DELETE", "PATCH"].includes(method);

  const activeAuth =
    typeof window !== "undefined"
      ? (window as unknown as { __K2NET_AUTH__?: { token?: string } }).__K2NET_AUTH__
      : undefined;
  const effectiveToken = token || activeAuth?.token;

  const requestHeaders = prepareRequestHeaders(options, effectiveToken);

  if (typeof window !== "undefined" && !navigator.onLine && isWrite) {
    const offlineRes = await handleOfflineEnqueue(url, method, rest.body, requestHeaders);
    if (offlineRes) return offlineRes;
  }

  try {
    const response = await fetch(url, {
      ...rest,
      headers: requestHeaders,
    });

    return await handleResponseStatus(response, url, rest, requestHeaders, effectiveToken);
  } catch (error) {
    console.error(`[HTTP Client] Fetch error at ${url}:`, error);

    if (isWrite && typeof window !== "undefined") {
      const offlineRes = await handleOfflineEnqueue(url, method, rest.body, requestHeaders);
      if (offlineRes) return offlineRes;
    }

    throw error;
  }
}
