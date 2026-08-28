/**
 * Lightweight in-memory TTL caching utility for client-side navigation.
 * Provides instant 0ms perceived load during Secondary Sidebar & sub-menu transitions.
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const memoryStore = new Map<string, CacheEntry<any>>();

export const memoryCache = {
  get<T>(key: string, maxAgeMs = 60_000): T | null {
    const entry = memoryStore.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > maxAgeMs) {
      return entry.data; // Stale data available for background revalidation
    }
    return entry.data;
  },

  isFresh(key: string, maxAgeMs = 30_000): boolean {
    const entry = memoryStore.get(key);
    if (!entry) return false;
    return Date.now() - entry.timestamp < maxAgeMs;
  },

  set<T>(key: string, data: T): void {
    memoryStore.set(key, {
      data,
      timestamp: Date.now(),
    });
  },

  delete(key: string): void {
    memoryStore.delete(key);
  },

  clear(): void {
    memoryStore.clear();
  },
};
