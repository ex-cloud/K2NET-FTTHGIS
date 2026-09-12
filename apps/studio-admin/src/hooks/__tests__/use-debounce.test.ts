import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, beforeAll, beforeEach, afterAll, afterEach, vi } from "vitest";
import { useDebounce } from "../use-debounce";

describe("useDebounce", () => {
  beforeAll(() => {
    vi.useFakeTimers();
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  beforeEach(() => {
    vi.clearAllTimers();
  });

  afterEach(() => {
    // Don't call useRealTimers() here: React 19 passive effects cleanup
    // (clearTimeout calls) happen asynchronously after afterEach, which
    // would fire after real timers are restored → "clearTimeout is not defined".
    vi.clearAllTimers();
  });

  it("should return initial value immediately", () => {
    const { result } = renderHook(() => useDebounce("initial", 400));
    expect(result.current).toBe("initial");
  });

  it("should NOT update value before delay elapses", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: "first", delay: 400 } }
    );

    rerender({ value: "second", delay: 400 });

    // Before delay — should still be first value
    vi.advanceTimersByTime(200);
    expect(result.current).toBe("first");
  });

  it("should update value after delay elapses", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: "first", delay: 400 } }
    );

    rerender({ value: "second", delay: 400 });

    // After full delay — should update
    act(() => {
      vi.advanceTimersByTime(400);
    });
    expect(result.current).toBe("second");
  });

  it("should reset timer on rapid changes (debounce behavior)", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 400),
      { initialProps: { value: "a" } }
    );

    rerender({ value: "ab" });
    vi.advanceTimersByTime(200);
    rerender({ value: "abc" });
    vi.advanceTimersByTime(200);
    // Only 200ms since last change — should NOT have updated yet
    expect(result.current).toBe("a");

    // After full 400ms from last change
    act(() => {
      vi.advanceTimersByTime(400);
    });
    expect(result.current).toBe("abc");
  });

  it("should use default delay of 400ms", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value),
      { initialProps: { value: "initial" } }
    );

    rerender({ value: "updated" });

    act(() => { vi.advanceTimersByTime(399); });
    expect(result.current).toBe("initial");

    act(() => { vi.advanceTimersByTime(1); });
    expect(result.current).toBe("updated");
  });

  it("should cleanup timer on unmount (no memory leak)", () => {
    const clearTimeoutSpy = vi.spyOn(window, "clearTimeout");
    const { rerender, unmount } = renderHook(
      ({ value }) => useDebounce(value, 400),
      { initialProps: { value: "initial" } }
    );

    rerender({ value: "changed" });
    unmount();

    // clearTimeout should have been called during cleanup
    expect(clearTimeoutSpy).toHaveBeenCalled();
  });

  it("should handle number values", async () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 0 } }
    );

    rerender({ value: 42 });

    act(() => { vi.advanceTimersByTime(300); });
    expect(result.current).toBe(42);

    // Advance past any lingering timers before afterEach restores real timers
    act(() => { vi.runAllTimers(); });
  });

  it("should handle object values", async () => {
    const obj1 = { page: 1 };
    const obj2 = { page: 2 };

    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: obj1 } }
    );

    rerender({ value: obj2 });
    act(() => { vi.advanceTimersByTime(300); });

    expect(result.current).toEqual({ page: 2 });

    // Advance past any lingering timers before afterEach restores real timers
    act(() => { vi.runAllTimers(); });
  });
});
