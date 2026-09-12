import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  setApiAuthToken,
  getApiAuthToken,
  setImpersonationSessionId,
  getImpersonationSessionId,
  apiClient,
} from "../api-client";

describe("Tenant apiClient", () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    setApiAuthToken(null);
    setImpersonationSessionId(null);
    vi.restoreAllMocks();
  });

  it("should set and retrieve auth token in sessionStorage", () => {
    setApiAuthToken("tenant-jwt-token-123");
    expect(getApiAuthToken()).toBe("tenant-jwt-token-123");
    expect(sessionStorage.getItem("k2net_impersonation_token")).toBe("tenant-jwt-token-123");

    setApiAuthToken(null);
    expect(getApiAuthToken()).toBeNull();
  });

  it("should set and retrieve impersonation session ID", () => {
    setImpersonationSessionId("session-uuid-456");
    expect(getImpersonationSessionId()).toBe("session-uuid-456");
    expect(sessionStorage.getItem("k2net_impersonation_session_id")).toBe("session-uuid-456");

    setImpersonationSessionId(null);
    expect(getImpersonationSessionId()).toBeNull();
  });

  it("should attach Authorization and Impersonation headers to requests", async () => {
    setApiAuthToken("test-jwt");
    setImpersonationSessionId("imp-session-789");

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ "content-type": "application/json" }),
      json: () => Promise.resolve({ success: true }),
    });
    global.fetch = mockFetch;

    const data = await apiClient("/api/v1/network/nodes");
    expect(data).toEqual({ success: true });
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/v1/network/nodes",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer test-jwt",
          "X-Impersonation-Session-Id": "imp-session-789",
        }),
      })
    );
  });

  it("should handle 401 response and clear impersonation token", async () => {
    setApiAuthToken("expired-token");
    setImpersonationSessionId("expired-session");

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
      text: () => Promise.resolve("Token expired"),
      headers: new Headers(),
    });

    await expect(apiClient("/api/v1/protected")).rejects.toThrow("Token expired");
    expect(getApiAuthToken()).toBeNull();
    expect(getImpersonationSessionId()).toBeNull();
  });
});
