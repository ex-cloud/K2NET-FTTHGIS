import { describe, test, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useIsMobile } from "./use-mobile";

describe("useIsMobile", () => {
  beforeEach(() => {
    // Reset window innerWidth
    vi.stubGlobal("innerWidth", 1024);
    
    // Mock matchMedia
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  test("should return false on desktop resolution", () => {
    vi.stubGlobal("innerWidth", 1024);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });

  test("should return true on mobile resolution", () => {
    vi.stubGlobal("innerWidth", 500);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });
});
