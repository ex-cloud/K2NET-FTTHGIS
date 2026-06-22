import { describe, test, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTracePath } from "./use-trace-path";
import { networkApi } from "@/lib/api/network";

// Mock dependencies
vi.mock("next-auth/react", () => ({
  useSession: () => ({
    data: { accessToken: "mock-token" },
  }),
}));

vi.mock("@/lib/api/network", () => ({
  networkApi: {
    tracePath: vi.fn(),
    traceUpstream: vi.fn(),
  },
}));

describe("useTracePath", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("should initialize with default states", () => {
    const { result } = renderHook(() => useTracePath());
    expect(result.current.traceData).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  test("should fetch trace path and format GeoJSON", async () => {
    const mockCables = [
      {
        id: "cable-1",
        code: "C-01",
        status: "ACTIVE",
        geometry: {
          type: "LineString" as const,
          coordinates: [[107.6, -6.9], [107.61, -6.91]],
        },
      },
    ];

    vi.mocked(networkApi.tracePath).mockResolvedValueOnce(mockCables);

    const { result } = renderHook(() => useTracePath());

    let path;
    await act(async () => {
      path = await result.current.fetchTracePath("node-a", "node-b");
    });

    expect(networkApi.tracePath).toHaveBeenCalledWith("node-a", "node-b", "mock-token", "");
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.traceData).toEqual({
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: mockCables[0].geometry,
          properties: {
            id: "cable-1",
            code: "C-01",
            status: "ACTIVE",
          },
        },
      ],
    });
    expect(path).toEqual(result.current.traceData);
  });

  test("should handle trace path errors gracefully", async () => {
    vi.mocked(networkApi.tracePath).mockRejectedValueOnce(new Error("Network trace failed"));

    const { result } = renderHook(() => useTracePath());

    let path;
    await act(async () => {
      path = await result.current.fetchTracePath("node-a", "node-b");
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe("Network trace failed");
    expect(result.current.traceData).toBeNull();
    expect(path).toBeNull();
  });
});
