import { signOut } from "next-auth/react";

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

    if (response.status === 401) {
      console.warn(`[HTTP Client] 401 Unauthorized detected at ${url}. Redirecting to login...`);
      signOut({ callbackUrl: "/login" });
      
      // Return the response so the caller can still see the status if needed,
      // but the app will redirect shortly.
      return response;
    }

    return response;
  } catch (error) {
    console.error(`[HTTP Client] Fetch error at ${url}:`, error);
    throw error;
  }
}
