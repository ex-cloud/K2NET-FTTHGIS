import "@testing-library/jest-dom";
import { vi } from "vitest";

// ── Timer Globals Polyfill ───────────────────────────────────────────────────
// jsdom may not expose clearTimeout/clearInterval as globals in all contexts.
// Polyfill to prevent "clearTimeout is not defined" in React cleanup effects.
if (typeof globalThis.clearTimeout === "undefined") {
  globalThis.clearTimeout = (id) => { if (id) global.clearTimeout(id as NodeJS.Timeout); };
}
if (typeof globalThis.clearInterval === "undefined") {
  globalThis.clearInterval = (id) => { if (id) global.clearInterval(id as NodeJS.Timeout); };
}

// ── Browser API Mocks ─────────────────────────────────────────────────────────

// Mock window.matchMedia (used by theme detection & responsive hooks)
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver (used by layout and sidebar components)
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver (used by virtual scroll components)
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock scrollTo (jsdom doesn't implement it)
window.scrollTo = vi.fn();

// ── Storage Mocks ─────────────────────────────────────────────────────────────

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
    get length() { return Object.keys(store).length; },
    key: (i: number) => Object.keys(store)[i] ?? null,
  };
})();

Object.defineProperty(window, "localStorage", { value: localStorageMock });
Object.defineProperty(window, "sessionStorage", { value: localStorageMock });

// ── Module Mocks ──────────────────────────────────────────────────────────────

// Mock @k2net/auth/client — avoid full Keycloak initialization in tests
vi.mock("@k2net/auth/client", () => ({
  useAuth: vi.fn(() => ({
    token: "mock-jwt-token",
    isAuthenticated: true,
    user: {
      id: "test-user-id",
      email: "admin@k2net.id",
      name: "Test Admin",
      roles: ["super_admin"],
      permissions: [
        "system.support.impersonate",
        "system.organizations.manage",
        "system.users.manage",
      ],
    },
    signOut: vi.fn(),
  })),
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock @k2net/auth — avoid Keycloak in tests
vi.mock("@k2net/auth", () => ({
  getToken: vi.fn(() => Promise.resolve("mock-jwt-token")),
  signOut: vi.fn(),
}));

// Mock sonner toast (avoid DOM side effects in tests)
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
