/* eslint-disable @typescript-eslint/no-explicit-any -- Test mocks require extensive `as any` casts for globalThis and mock stores */
import { describe, test, expect, vi, beforeEach } from "vitest";
import { enqueueOfflineRequest, getOfflineQueue, clearOfflineRequest, syncOfflineQueue } from "./offlineQueue";
import { toast } from "sonner";

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}));

// Initialize global mock store
(globalThis as any).mockStore = [];

vi.mock("idb", () => {
  return {
    openDB: vi.fn().mockResolvedValue({
      add: vi.fn().mockImplementation((storeName, value) => {
        const item = { ...value, id: (globalThis as any).mockStore.length + 1 };
        (globalThis as any).mockStore.push(item);
        return Promise.resolve(item.id);
      }),
      getAll: vi.fn().mockImplementation(() => {
        return Promise.resolve([...(globalThis as any).mockStore]);
      }),
      delete: vi.fn().mockImplementation((storeName, id) => {
        (globalThis as any).mockStore = (globalThis as any).mockStore.filter((item: any) => item.id !== id);
        return Promise.resolve();
      }),
    }),
  };
});

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// Mock navigator.onLine
let onlineStatus = true;
vi.stubGlobal("navigator", {
  get onLine() {
    return onlineStatus;
  },
});

describe("offlineQueue", () => {
  beforeEach(() => {
    (globalThis as any).mockStore = [];
    onlineStatus = true;
    vi.clearAllMocks();
  });

  test("should enqueue offline requests into mock IndexedDB store", async () => {
    await enqueueOfflineRequest("http://localhost/api/test", "POST", { name: "test-item" }, { "X-Test": "123" });

    expect((globalThis as any).mockStore.length).toBe(1);
    expect((globalThis as any).mockStore[0]).toEqual({
      url: "http://localhost/api/test",
      method: "POST",
      body: JSON.stringify({ name: "test-item" }),
      headers: { "X-Test": "123" },
      timestamp: expect.any(Number),
      id: 1,
    });
    expect(toast.warning).toHaveBeenCalled();
  });

  test("should retrieve and clear requests from the queue", async () => {
    await enqueueOfflineRequest("http://localhost/api/test1", "POST", {});
    await enqueueOfflineRequest("http://localhost/api/test2", "PUT", {});

    const queue = await getOfflineQueue();
    expect(queue.length).toBe(2);

    await clearOfflineRequest(1);
    const updatedQueue = await getOfflineQueue();
    expect(updatedQueue.length).toBe(1);
    expect(updatedQueue[0].id).toBe(2);
  });

  test("should process queue and dispatch fetch sequentially when syncing", async () => {
    await enqueueOfflineRequest("http://localhost/api/test1", "POST", { val: 1 });
    await enqueueOfflineRequest("http://localhost/api/test2", "POST", { val: 2 });

    // Mock successful fetch responses
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
    });

    await syncOfflineQueue();

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch).toHaveBeenNthCalledWith(1, "http://localhost/api/test1", expect.objectContaining({
      method: "POST",
      body: JSON.stringify({ val: 1 }),
    }));
    expect(mockFetch).toHaveBeenNthCalledWith(2, "http://localhost/api/test2", expect.objectContaining({
      method: "POST",
      body: JSON.stringify({ val: 2 }),
    }));

    // Queue should be completely empty after successful sync
    const queue = await getOfflineQueue();
    expect(queue.length).toBe(0);
    expect(toast.success).toHaveBeenCalledWith("Semua perubahan offline berhasil disinkronkan!");
  });
});
