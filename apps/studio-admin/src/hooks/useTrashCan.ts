"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { memoryCache } from "@/lib/memoryCache";
import { toast } from "sonner";

export interface TrashItem {
  id: string;
  name: string;
  type: "ORGANIZATION" | "PROJECT" | "TASK" | "NETWORK_NODE" | "NETWORK_EDGE";
  identifier: string;
  originName: string;
  deletedAt: string;
  deletedBy: string;
  daysRemaining: number;
  details?: Record<string, unknown>;
}

export interface TrashStats {
  total: number;
  organizations: number;
  projects: number;
  tasks: number;
  networkAssets: number;
}

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
        const queryParams = new URLSearchParams();
        if (category && category !== "all") queryParams.set("category", category);
        if (searchQuery.trim()) queryParams.set("query", searchQuery.trim());

        const res = await fetch(`/api/v1/system/trash?${queryParams.toString()}`, {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
          cache: "no-store",
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch trash items`);

        const data = await res.json();
        if (mounted.current) {
          setItems(data.items || []);
          setStats(
            data.stats || {
              total: 0,
              organizations: 0,
              projects: 0,
              tasks: 0,
              networkAssets: 0,
            }
          );
          setError(null);

          memoryCache.set(cacheKey, {
            items: data.items || [],
            stats: data.stats || {},
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
      if (!session?.accessToken) return false;
      try {
        const res = await fetch(`/api/v1/system/trash/empty?category=${cat}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        toast.success("Recycle Bin Dikosongkan", {
          description: "Seluruh data terhapus telah dibersihkan secara permanen.",
        });

        memoryCache.clear();
        fetchData(true);
        return true;
      } catch (err) {
        toast.error("Gagal Mengosongkan Recycle Bin", {
          description: err instanceof Error ? err.message : "Terjadi kesalahan server.",
        });
        return false;
      }
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
