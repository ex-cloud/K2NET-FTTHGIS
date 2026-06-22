import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDebounce } from "./use-debounce";

describe("useDebounce", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("should return initial value immediately", () => {
    const { result } = renderHook(() => useDebounce("hello", 300));
    expect(result.current).toBe("hello");
  });

  test("should update debounced value only after the delay", () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
      initialProps: { value: "hello" },
    });

    expect(result.current).toBe("hello");

    // Rerender with new value
    rerender({ value: "world" });

    // Value should still be "hello" immediately after rerender
    expect(result.current).toBe("hello");

    // Fast-forward time by 150ms (before delay is reached)
    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(result.current).toBe("hello");

    // Fast-forward another 150ms (total 300ms delay reached)
    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(result.current).toBe("world");
  });
});
