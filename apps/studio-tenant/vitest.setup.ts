import "@testing-library/jest-dom";
import { vi } from "vitest";

// ── Timer Globals Polyfill ───────────────────────────────────────────────────
if (typeof globalThis.clearTimeout === "undefined") {
  globalThis.clearTimeout = (id) => { if (id) global.clearTimeout(id as NodeJS.Timeout); };
}
if (typeof globalThis.clearInterval === "undefined") {
  globalThis.clearInterval = (id) => { if (id) global.clearInterval(id as NodeJS.Timeout); };
}

// ── Browser API Mocks ─────────────────────────────────────────────────────────

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock scrollTo
window.scrollTo = vi.fn();

// ── Storage Mocks ─────────────────────────────────────────────────────────────

const createStorageMock = () => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
    get length() { return Object.keys(store).length; },
    key: (i: number) => Object.keys(store)[i] ?? null,
  };
};

Object.defineProperty(window, "localStorage", { value: createStorageMock() });
Object.defineProperty(window, "sessionStorage", { value: createStorageMock() });

// ── Module Mocks ──────────────────────────────────────────────────────────────

// Mock @k2net/auth/client
vi.mock("@k2net/auth/client", () => ({
  useAuth: vi.fn(() => ({
    token: "mock-tenant-jwt-token",
    isAuthenticated: true,
    user: {
      id: "test-tenant-user-id",
      email: "tenant-admin@isp.id",
      name: "Tenant Admin",
      roles: ["tenant_admin"],
      permissions: [
        "network.manage",
        "customers.manage",
        "billing.view",
      ],
    },
    signOut: vi.fn(),
  })),
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock @k2net/auth
vi.mock("@k2net/auth", () => ({
  getToken: vi.fn(() => Promise.resolve("mock-tenant-jwt-token")),
  signOut: vi.fn(),
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn(),
  },
  Toaster: () => null,
}));
