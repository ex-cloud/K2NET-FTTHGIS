import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "@/lib/auth-compat";
import { memoryCache } from "@/lib/memoryCache";
import { toast } from "sonner";
import {
  type TrashItem,
  type TrashStats,
  getLocalTrashItems,
  saveLocalTrashItems,
  filterTrashItems,
  restoreDocumentLocal,
  deleteDocumentLocal,
  fetchApiTrash,
} from "./trashCanUtils";

export type { TrashItem, TrashStats };

const CACHE_KEY_PREFIX = "trash_can_";

export function useTrashCan(category: string = "all", searchQuery: string = "") {
  const { data: session } = useSession();
  const cacheKey = `${CACHE_KEY_PREFIX}${category}_${searchQuery}`;

  const cachedData = memoryCache.get<{ items: TrashItem[]; stats: TrashStats }>(cacheKey);

  const [items, setItems] = useState<TrashItem[]>(cachedData?.items ?? []);
  const [stats, setStats] = useState<TrashStats>(
    cachedData?.stats ?? {
      total: 0,
      organizations: 0,
      projects: 0,
      tasks: 0,
      networkAssets: 0,
      documents: 0,
    }
  );
  const [loading, setLoading] = useState<boolean>(!cachedData);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  const fetchData = useCallback(
    async (isSilent: boolean = false) => {
      if (!session?.accessToken) return;

      if (!isSilent && !memoryCache.get(cacheKey)) {
        setLoading(true);
      }

      try {
        const { items: apiItems, stats: apiStats } = await fetchApiTrash(
          category,
          searchQuery,
          session.accessToken
        );

        const localTrash = getLocalTrashItems();
        const docCount = localTrash.length;

        let combinedItems: TrashItem[] = [];
        if (category === "all") {
          combinedItems = [...localTrash, ...apiItems];
        } else if (category === "documents") {
          combinedItems = localTrash.filter((item) => item.type === "DOCUMENT");
        } else {
          combinedItems = apiItems;
        }

        combinedItems = filterTrashItems(combinedItems, searchQuery);

        const combinedStats: TrashStats = {
          total: (apiStats.total || 0) + docCount,
          organizations: apiStats.organizations || 0,
          projects: apiStats.projects || 0,
          tasks: apiStats.tasks || 0,
          networkAssets: apiStats.networkAssets || 0,
          documents: docCount,
        };

        if (mounted.current) {
          setItems(combinedItems);
          setStats(combinedStats);
          setError(null);

          memoryCache.set(cacheKey, {
            items: combinedItems,
            stats: combinedStats,
          });
        }
      } catch (err) {
        if (mounted.current) {
          setError(err instanceof Error ? err.message : "Gagal memuat data Recycle Bin");
        }
      } finally {
        if (mounted.current) setLoading(false);
      }
    },
    [session?.accessToken, category, searchQuery, cacheKey]
  );

  const restoreItem = useCallback(
    async (type: string, id: string, name: string) => {
      if (type === "DOCUMENT") {
        const res = restoreDocumentLocal(id);
        if (res.success) {
          toast.success("Dokumen Berhasil Dipulihkan", {
            description: `"${name}" telah dikembalikan ke Vault Dokumen tenant ${res.originName || ""}.`,
          });
          memoryCache.clear();
          fetchData(true);
          return true;
        }
        toast.error("Gagal Memulihkan Dokumen");
        return false;
      }

      if (!session?.accessToken) return false;
      try {
        const res = await fetch("/api/v1/system/trash/restore", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.accessToken}`,
          },
          body: JSON.stringify({ type, id }),
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        toast.success("Item Berhasil Dipulihkan", {
          description: `"${name}" telah dikembalikan ke data aktif.`,
        });

        memoryCache.clear();
        fetchData(true);
        return true;
      } catch (err) {
        toast.error("Gagal Memulihkan Item", {
          description: err instanceof Error ? err.message : "Terjadi kesalahan server.",
        });
        return false;
      }
    },
    [session?.accessToken, fetchData]
  );

  const permanentDelete = useCallback(
    async (type: string, id: string, name: string) => {
      if (type === "DOCUMENT") {
        const success = deleteDocumentLocal(id);
        if (success) {
          toast.success("Dokumen Dihapus Permanen", {
            description: `"${name}" telah dihapus secara fisik dan permanen.`,
          });
          memoryCache.clear();
          fetchData(true);
          return true;
        }
        toast.error("Gagal Menghapus Dokumen Permanen");
        return false;
      }

      if (!session?.accessToken) return false;
      try {
        const res = await fetch("/api/v1/system/trash/permanent", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.accessToken}`,
          },
          body: JSON.stringify({ type, id }),
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        toast.success("Item Dihapus Permanen", {
          description: `"${name}" telah dihapus secara fisik dari database.`,
        });

        memoryCache.clear();
        fetchData(true);
        return true;
      } catch (err) {
        toast.error("Gagal Menghapus Permanen", {
          description: err instanceof Error ? err.message : "Terjadi kesalahan server.",
        });
        return false;
      }
    },
    [session?.accessToken, fetchData]
  );

  const emptyTrash = useCallback(
    async (cat: string = "all") => {
      if (cat === "all" || cat === "documents") {
        saveLocalTrashItems([]);
      }

      if (cat !== "documents" && session?.accessToken) {
        try {
          const res = await fetch(`/api/v1/system/trash/empty?category=${cat}`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${session.accessToken}`,
            },
          });

          if (!res.ok) throw new Error(`HTTP ${res.status}`);
        } catch (err) {
          console.warn("Failed to empty server trash", err);
        }
      }

      toast.success("Recycle Bin Dikosongkan", {
        description: "Seluruh data terhapus telah dibersihkan secara permanen.",
      });

      memoryCache.clear();
      fetchData(true);
      return true;
    },
    [session?.accessToken, fetchData]
  );

  useEffect(() => {
    mounted.current = true;
    fetchData();
    return () => {
      mounted.current = false;
    };
  }, [fetchData]);

  return {
    items,
    stats,
    loading,
    error,
    refresh: () => fetchData(false),
    restoreItem,
    permanentDelete,
    emptyTrash,
  };
}
