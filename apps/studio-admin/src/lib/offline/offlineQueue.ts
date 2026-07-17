import { openDB, DBSchema, IDBPDatabase } from "idb";
import { toast } from "sonner";

interface OfflineRequest {
  id?: number;
  url: string;
  method: string;
  headers: Record<string, string>;
  body: string; // stringified body
  timestamp: number;
}

interface FTTHGisDB extends DBSchema {
  "request-queue": {
    key: number;
    value: OfflineRequest;
    autoIncrement: true;
  };
}

let dbPromise: Promise<IDBPDatabase<FTTHGisDB>> | null = null;

function getDB() {
  if (typeof window === "undefined") return null;
  if (!dbPromise) {
    dbPromise = openDB<FTTHGisDB>("ftth-gis-offline-db", 1, {
      upgrade(db) {
        db.createObjectStore("request-queue", {
          keyPath: "id",
          autoIncrement: true,
        });
      },
    });
  }
  return dbPromise;
}

export async function enqueueOfflineRequest(
  url: string,
  method: string,
  body: unknown,
  headers: Record<string, string> = {}
) {
  const db = await getDB();
  if (!db) return;

  const request: OfflineRequest = {
    url,
    method,
    headers,
    body: typeof body === "string" ? body : JSON.stringify(body),
    timestamp: Date.now(),
  };

  await db.add("request-queue", request);
  toast.warning("Koneksi internet terputus. Perubahan disimpan dalam antrean offline lokal.", {
    description: `Aset akan disinkronkan otomatis saat koneksi kembali terhubung.`,
    duration: 5000,
  });
}

export async function getOfflineQueue(): Promise<OfflineRequest[]> {
  const db = await getDB();
  if (!db) return [];
  return db.getAll("request-queue");
}

export async function clearOfflineRequest(id: number) {
  const db = await getDB();
  if (!db) return;
  await db.delete("request-queue", id);
}

export async function syncOfflineQueue() {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return;
  }

  const db = await getDB();
  if (!db) return;

  const queue = await db.getAll("request-queue");
  if (queue.length === 0) return;

  toast.info(`Menyinkronkan ${queue.length} perubahan offline...`);

  // Process requests sequentially to maintain consistency
  for (const req of queue) {
    try {
      const response = await fetch(req.url, {
        method: req.method,
        headers: {
          ...req.headers,
          "Content-Type": "application/json",
        },
        body: req.body,
      });

      if (response.ok) {
        if (req.id !== undefined) {
          await db.delete("request-queue", req.id);
        }
      } else {
        console.error(`Gagal menyinkronkan request offline: ${response.statusText}`);
        toast.error(`Sinkronisasi gagal untuk beberapa item. Mencoba lagi nanti.`);
        break; // Stop processing queue to maintain order
      }
    } catch (err) {
      console.error("Kesalahan jaringan saat sinkronisasi offline:", err);
      break;
    }
  }

  const remaining = await db.getAll("request-queue");
  if (remaining.length === 0) {
    toast.success("Semua perubahan offline berhasil disinkronkan!");
    // Trigger map tile refresh to reload layout
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("offline-sync-complete"));
    }
  }
}

// Automatically sync when browser comes online
if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    syncOfflineQueue();
  });
}
