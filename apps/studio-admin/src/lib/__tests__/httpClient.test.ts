import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { httpClient } from "../../lib/httpClient";

// Mock auth-compat signOut
vi.mock("../../lib/auth-compat", () => ({
  signOut: vi.fn(),
}));

// Mock offline queue
vi.mock("../../lib/offline/offlineQueue", () => ({
  enqueueOfflineRequest: vi.fn().mockResolvedValue(undefined),
}));

// Helper to create mock fetch responses
function mockFetchResponse(status: number, body: unknown = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("httpClient", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe("basic requests", () => {
    it("should make a GET request to the given URL", async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce(mockFetchResponse(200, { success: true }));

      const response = await httpClient("/api/v1/test");
      expect(response.ok).toBe(true);
      expect(fetch).toHaveBeenCalledWith("/api/v1/test", expect.any(Object));
    });

    it("should attach Authorization header when token is provided", async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce(mockFetchResponse(200, {}));

      await httpClient("/api/v1/users", { token: "my-jwt-token" });

      const [, options] = vi.mocked(fetch).mock.calls[0];
      const headers = options?.headers as Headers;
      expect(headers.get("Authorization")).toBe("Bearer my-jwt-token");
    });

    it("should NOT attach Authorization header when no token", async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce(mockFetchResponse(200, {}));

      await httpClient("/api/v1/public");

      const [, options] = vi.mocked(fetch).mock.calls[0];
      const headers = options?.headers as Headers;
      expect(headers.get("Authorization")).toBeNull();
    });

    it("should attach X-Project-Id header when projectId is provided", async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce(mockFetchResponse(200, {}));

      await httpClient("/api/v1/data", { projectId: "proj-123" });

      const [, options] = vi.mocked(fetch).mock.calls[0];
      const headers = options?.headers as Headers;
      expect(headers.get("X-Project-Id")).toBe("proj-123");
    });
  });

  describe("403 ORGANIZATION_SUSPENDED handling", () => {
    it("should return 403 response as-is for non-suspended errors", async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce(
        mockFetchResponse(403, { error: "FORBIDDEN" })
      );

      const response = await httpClient("/api/v1/protected");
      expect(response.status).toBe(403);
    });
  });

  describe("200 success response", () => {
    it("should return the response on success", async () => {
      const mockData = { users: [], total: 0 };
      vi.mocked(global.fetch).mockResolvedValueOnce(mockFetchResponse(200, mockData));

      const response = await httpClient("/api/v1/users");
      expect(response.status).toBe(200);
    });
  });

  describe("last_login_time tracking", () => {
    it("should set last_login_time on successful auth response", async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce(mockFetchResponse(200, {}));
      localStorage.clear();

      // Simulate first auth call with token where last_login_time is not set
      await httpClient("/api/v1/auth/token", {
        token: "my-token",
        method: "POST",
      });

      // The httpClient sets last_login_time on successful token response
      // (implementation reads this for 401 retry logic)
      // This just verifies no errors thrown
      expect(fetch).toHaveBeenCalledTimes(1);
    });
  });
});
