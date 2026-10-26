import { describe, it, expect, vi } from "vitest";
import React from "react";

vi.mock("maplibre-gl", () => ({
  default: {
    Map: vi.fn(),
    NavigationControl: vi.fn(),
    Marker: vi.fn(),
    Popup: vi.fn(),
    setWorkerUrl: vi.fn(),
  },
}));

import { render } from "@testing-library/react";
import WorkspaceIssuesPage from "../page";

if (typeof window !== "undefined") {
  window.URL.createObjectURL = vi.fn(() => "blob:mock");
  window.URL.revokeObjectURL = vi.fn();
}

global.fetch = vi.fn().mockImplementation(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ permissions: [], roles: ["super_admin"] }),
  })
);

// Mock auth, router, i18n
vi.mock("@/lib/auth-compat", () => ({
  useSession: () => ({
    data: {
      user: { id: "user-1", email: "admin@example.com", name: "Admin" },
      accessToken: "fake-token",
    },
    status: "authenticated",
  }),
}));

vi.mock("@/lib/navigation-compat", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/workspace/issues",
}));

vi.mock("@k2net/i18n", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock("@/hooks/useTasksQuery", () => ({
  useTasksQuery: () => ({
    tasks: [
      {
        id: "4eeb0ec7-ce1c-440e-8ff2-44c37ef53871",
        type: "TICKET",
        title: "ISSU TENANT",
        status: "TODO",
        priority: "HIGH",
        scope: "PLATFORM_INTERNAL",
        obsidianRef: "ABC",
        createdAt: "2026-10-26T09:26:04.372252",
        updatedAt: "2026-10-26T09:26:04.372252",
      },
    ],
    loading: false,
    loadingMore: false,
    hasMore: false,
    totalElements: 1,
    error: null,
    refresh: vi.fn(),
    fetchMore: vi.fn(),
  }),
}));

vi.mock("@/hooks/useTaskSummary", () => ({
  useTaskSummary: () => ({
    summary: { totalOpen: 1, urgentCount: 0, resolvedToday: 0 },
    loading: false,
    error: null,
    refresh: vi.fn(),
  }),
}));

describe("WorkspaceIssuesPage Component Test", () => {
  it("renders without throwing an error", () => {
    expect(() => {
      render(<WorkspaceIssuesPage />);
    }).not.toThrow();
  });
});
