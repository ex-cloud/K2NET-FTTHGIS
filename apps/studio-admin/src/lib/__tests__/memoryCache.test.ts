import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { memoryCache } from "../../lib/memoryCache";

describe("memoryCache", () => {
  beforeEach(() => {
    memoryCache.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    memoryCache.clear();
  });

  describe("set & get", () => {
    it("should store and retrieve a value", () => {
      memoryCache.set("key1", { data: [1, 2, 3] });
      const result = memoryCache.get<{ data: number[] }>("key1");
      expect(result).toEqual({ data: [1, 2, 3] });
    });

    it("should return null for non-existent key", () => {
      const result = memoryCache.get("nonexistent");
      expect(result).toBeNull();
    });

    it("should handle string values", () => {
      memoryCache.set("strKey", "hello world");
      expect(memoryCache.get<string>("strKey")).toBe("hello world");
    });

    it("should handle number values", () => {
      memoryCache.set("numKey", 42);
      expect(memoryCache.get<number>("numKey")).toBe(42);
    });

    it("should handle null values", () => {
      memoryCache.set("nullKey", null);
      expect(memoryCache.get("nullKey")).toBeNull();
    });

    it("should overwrite existing key", () => {
      memoryCache.set("key", "first");
      memoryCache.set("key", "second");
      expect(memoryCache.get<string>("key")).toBe("second");
    });
  });

  describe("isFresh", () => {
    it("should return false for non-existent key", () => {
      expect(memoryCache.isFresh("missing")).toBe(false);
    });

    it("should return true for freshly set key within maxAge", () => {
      memoryCache.set("freshKey", "data");
      expect(memoryCache.isFresh("freshKey", 30_000)).toBe(true);
    });

    it("should return false for key past maxAge", () => {
      memoryCache.set("oldKey", "data");
      // Advance time past maxAge
      vi.advanceTimersByTime(30_001);
      expect(memoryCache.isFresh("oldKey", 30_000)).toBe(false);
    });

    it("should return true for key within custom maxAge", () => {
      memoryCache.set("key", "data");
      vi.advanceTimersByTime(4_999);
      expect(memoryCache.isFresh("key", 5_000)).toBe(true);
    });
  });

  describe("delete", () => {
    it("should remove a key", () => {
      memoryCache.set("deleteMe", "value");
      memoryCache.delete("deleteMe");
      expect(memoryCache.get("deleteMe")).toBeNull();
    });

    it("should not throw when deleting non-existent key", () => {
      expect(() => memoryCache.delete("ghost")).not.toThrow();
    });
  });

  describe("clear", () => {
    it("should remove all keys", () => {
      memoryCache.set("k1", "v1");
      memoryCache.set("k2", "v2");
      memoryCache.set("k3", "v3");
      memoryCache.clear();
      expect(memoryCache.get("k1")).toBeNull();
      expect(memoryCache.get("k2")).toBeNull();
      expect(memoryCache.get("k3")).toBeNull();
    });
  });

  describe("stale-while-revalidate behavior", () => {
    it("should return stale data even if past maxAge (background revalidation pattern)", () => {
      memoryCache.set("staleKey", { stale: true });
      // Past the maxAge for isFresh — but get() still returns data
      vi.advanceTimersByTime(61_000);
      const data = memoryCache.get<{ stale: boolean }>("staleKey", 60_000);
      // Data still returned (stale-while-revalidate), not null
      expect(data).toEqual({ stale: true });
    });
  });
});
