

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "@/lib/auth-compat";
import { memoryCache } from "@/lib/memoryCache";
import { toast } from "sonner";

export interface TrashItem {
  id: string;
  name: string;
  type: "ORGANIZATION" | "PROJECT" | "TASK" | "NETWORK_NODE" | "NETWORK_EDGE" | "DOCUMENT";
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
  documents: number;
}

const CACHE_KEY_PREFIX = "trash_can_";

function getLocalTrashItems(): TrashItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("k2net_system_trash");
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error("Failed to parse k2net_system_trash", e);
    return [];
  }
}

function saveLocalTrashItems(items: TrashItem[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("k2net_system_trash", JSON.stringify(items));
  } catch (e) {
    console.error("Failed to save k2net_system_trash", e);
  }
}

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
        const queryParams = new URLSearchParams();
        if (category && category !== "all" && category !== "documents") {
          queryParams.set("category", category);
        }
        if (searchQuery.trim()) {
          queryParams.set("query", searchQuery.trim());
        }

        let apiItems: TrashItem[] = [];
        let apiStats = {
          total: 0,
          organizations: 0,
          projects: 0,
          tasks: 0,
          networkAssets: 0,
        };

        if (category !== "documents") {
          try {
            const res = await fetch(`/api/v1/system/trash?${queryParams.toString()}`, {
              headers: {
                Authorization: `Bearer ${session.accessToken}`,
              },
              cache: "no-store",
            });

            if (res.ok) {
              const data = await res.json();
              apiItems = data.items || [];
              apiStats = data.stats || apiStats;
            }
          } catch (e) {
            console.warn("Failed to fetch API trash items:", e);
          }
        }

        // Get local trash items (Document Vault deleted items)
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

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          combinedItems = combinedItems.filter((item) => {
            const nameMatch = item.name.toLowerCase().includes(q);
            const idMatch = item.identifier.toLowerCase().includes(q);
            const orgMatch = item.originName.toLowerCase().includes(q);
            const pathMatch =
              item.details?.path &&
              typeof item.details.path === "string" &&
              item.details.path.toLowerCase().includes(q);
            return nameMatch || idMatch || orgMatch || pathMatch;
          });
        }

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
        try {
          const localTrash = getLocalTrashItems();
          const target = localTrash.find((item) => item.id === id || item.identifier === id);

          if (target && target.details) {
            const orgSlug = (target.details.orgSlug as string) || "tenant";
            const docData = target.details.docData as Record<string, unknown> | undefined;

            if (docData && typeof window !== "undefined") {
              const rawVault = localStorage.getItem(`k2net_vault_docs_${orgSlug}`);
              const vaultDocs = rawVault ? JSON.parse(rawVault) : [];
              vaultDocs.unshift(docData);
              localStorage.setItem(`k2net_vault_docs_${orgSlug}`, JSON.stringify(vaultDocs));
            }
          }

          const remaining = localTrash.filter((item) => item.id !== id && item.identifier !== id);
          saveLocalTrashItems(remaining);

          toast.success("Dokumen Berhasil Dipulihkan", {
            description: `"${name}" telah dikembalikan ke Vault Dokumen tenant ${target?.originName || ""}.`,
          });

          memoryCache.clear();
          fetchData(true);
          return true;
        } catch (err) {
          toast.error("Gagal Memulihkan Dokumen", {
            description: err instanceof Error ? err.message : "Terjadi kesalahan lokal.",
          });
          return false;
        }
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
        try {
          const localTrash = getLocalTrashItems();
          const remaining = localTrash.filter((item) => item.id !== id && item.identifier !== id);
          saveLocalTrashItems(remaining);

          toast.success("Dokumen Dihapus Permanen", {
            description: `"${name}" telah dihapus secara fisik dan permanen.`,
          });

          memoryCache.clear();
          fetchData(true);
          return true;
        } catch (err) {
          toast.error("Gagal Menghapus Dokumen Permanen", {
            description: err instanceof Error ? err.message : "Terjadi kesalahan.",
          });
          return false;
        }
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
