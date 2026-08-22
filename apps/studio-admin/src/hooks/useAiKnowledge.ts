"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { 
  getAiKnowledgeStats, 
  getAiDocuments, 
  deleteAiDocument, 
  approveAiDocument,
  rejectAiDocument,
  triggerServerDocsSync,
  getAiServerSyncStatus,
  AiKnowledgeStats, 
  AiDocumentItem,
  ServerSyncStatus,
} from "@/lib/actions/gateways";

export function useAiKnowledge() {
  const [stats, setStats] = useState<AiKnowledgeStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<ServerSyncStatus | null>(null);
  const [syncStatusLoading, setSyncStatusLoading] = useState(false);

  const [documents, setDocuments] = useState<AiDocumentItem[]>([]);
  const [docsTotal, setDocsTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedScope, setSelectedScope] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const mounted = useRef(true);
  const offsetRef = useRef(0);
  const hasMoreRef = useRef(true);
  const loadingRef = useRef(true);
  const loadingMoreRef = useRef(false);
  const isFetchingRef = useRef(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const limit = 30;

  const fetchStatsAndSync = useCallback(async () => {
    try {
      setStatsLoading(true);
      setSyncStatusLoading(true);
      const [statsData, syncData] = await Promise.all([
        getAiKnowledgeStats().catch(() => null),
        getAiServerSyncStatus().catch(() => null),
      ]);
      if (mounted.current) {
        if (statsData) setStats(statsData);
        if (syncData) setSyncStatus(syncData);
      }
    } finally {
      if (mounted.current) {
        setStatsLoading(false);
        setSyncStatusLoading(false);
      }
    }
  }, []);

  const fetchDocuments = useCallback(
    async (resetList = true) => {
      if (resetList) {
        setLoading(true);
        loadingRef.current = true;
        offsetRef.current = 0;
        hasMoreRef.current = true;
        setHasMore(true);
        setDocuments([]);
      } else {
        if (loadingRef.current || loadingMoreRef.current || !hasMoreRef.current || isFetchingRef.current) {
          return;
        }
        loadingMoreRef.current = true;
        setLoadingMore(true);
      }

      isFetchingRef.current = true;

      try {
        const currentOffset = resetList ? 0 : offsetRef.current;
        const res = await getAiDocuments({
          category: selectedCategory === "ALL" ? undefined : selectedCategory,
          scope: selectedScope === "ALL" ? undefined : selectedScope,
          status: selectedStatus === "ALL" ? undefined : selectedStatus,
          search: searchQuery.trim() || undefined,
          limit,
          offset: currentOffset,
        });

        if (mounted.current) {
          const newDocs = res?.documents || [];
          const total = res?.total || 0;

          if (resetList) {
            setDocuments(newDocs);
            offsetRef.current = newDocs.length;
          } else {
            setDocuments((prev) => {
              const existingIds = new Set(prev.map((d) => d.id));
              const filtered = newDocs.filter((d) => !existingIds.has(d.id));
              const combined = [...prev, ...filtered];
              offsetRef.current = combined.length;
              return combined;
            });
          }

          setDocsTotal(total);
          const stillHasMore = newDocs.length === limit && offsetRef.current < total;
          hasMoreRef.current = stillHasMore;
          setHasMore(stillHasMore);
          setError(null);
        }
      } catch (err: any) {
        if (mounted.current) {
          setError(err.message || "Gagal memuat dokumen AI");
          if (resetList) setDocuments([]);
        }
      } finally {
        if (mounted.current) {
          setLoading(false);
          setLoadingMore(false);
          loadingRef.current = false;
          loadingMoreRef.current = false;
          isFetchingRef.current = false;
        }
      }
    },
    [selectedCategory, selectedScope, selectedStatus, searchQuery]
  );

  // Re-fetch whenever filters change
  useEffect(() => {
    mounted.current = true;
    fetchStatsAndSync();
    fetchDocuments(true);
    return () => {
      mounted.current = false;
    };
  }, [selectedCategory, selectedScope, selectedStatus]);

  const fetchMore = useCallback(async () => {
    if (loadingRef.current || loadingMoreRef.current || !hasMoreRef.current) return;
    await fetchDocuments(false);
  }, [fetchDocuments]);

  const refresh = useCallback(async () => {
    fetchStatsAndSync();
    await fetchDocuments(true);
  }, [fetchStatsAndSync, fetchDocuments]);

  const handleSearchSubmit = useCallback((e?: React.FormEvent) => {
    if (e) e.preventDefault();
    fetchDocuments(true);
  }, [fetchDocuments]);

  const approve = useCallback(async (id: string, title: string) => {
    try {
      await approveAiDocument(id);
      toast.success(`Dokumen "${title}" berhasil disetujui dan diindeks ke pgvector!`);
      refresh();
    } catch (err: any) {
      toast.error(err.message || "Gagal menyetujui dokumen");
    }
  }, [refresh]);

  const reject = useCallback(async (id: string, title: string) => {
    try {
      await rejectAiDocument(id);
      toast.success(`Dokumen "${title}" ditolak.`);
      refresh();
    } catch (err: any) {
      toast.error(err.message || "Gagal menolak dokumen");
    }
  }, [refresh]);

  const remove = useCallback(async (id: string, title: string) => {
    if (!confirm(`Hapus dokumen "${title}" beserta seluruh vektor embedding dari database?`)) {
      return;
    }
    try {
      const res = await deleteAiDocument(id);
      if (res && (res.status === "SUCCESS" || res.status === "deleted" || res.message)) {
        toast.success(`Dokumen "${title}" berhasil dihapus dari vector store`);
        refresh();
      } else {
        toast.error("Gagal menghapus dokumen");
      }
    } catch {
      toast.error("Terjadi kesalahan jaringan saat menghapus dokumen");
    }
  }, [refresh]);

  const syncServerDocs = useCallback(async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      const res = await triggerServerDocsSync();
      toast.success(res.message || "Sinkronisasi direktori server /opt/project5/docs dimulai di latar belakang!");
      // Progressive polling to show real-time chunk & metadata updates
      const t1 = setTimeout(() => refresh(), 3000);
      const t2 = setTimeout(() => refresh(), 7000);
      const t3 = setTimeout(() => refresh(), 12000);
      const t4 = setTimeout(() => {
        refresh();
        setIsSyncing(false);
      }, 18000);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
        clearTimeout(t4);
      };
    } catch {
      toast.error("Terjadi kesalahan koneksi saat memicu sinkronisasi");
      setIsSyncing(false);
    }
  }, [isSyncing, refresh]);

  return {
    documents,
    docsTotal,
    totalCount: stats?.total_documents || docsTotal,
    totalChunks: stats?.total_chunks || 0,
    totalBytes: stats?.total_size_bytes || 0,
    stats,
    statsLoading,
    syncStatus,
    syncStatusLoading,
    loading,
    loadingMore,
    hasMore,
    error,
    selectedCategory,
    setSelectedCategory,
    selectedScope,
    setSelectedScope,
    selectedStatus,
    setSelectedStatus,
    searchQuery,
    setSearchQuery,
    handleSearchSubmit,
    fetchMore,
    refresh,
    approve,
    reject,
    remove,
    syncServerDocs,
    isSyncing,
  };
}
