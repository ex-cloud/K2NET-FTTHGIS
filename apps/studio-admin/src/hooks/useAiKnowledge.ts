

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
  type AiKnowledgeStats, 
  type AiDocumentItem,
  type ServerSyncStatus,
} from "@/lib/actions/gateways";

function mergeDocuments(prev: AiDocumentItem[], newDocs: AiDocumentItem[]): AiDocumentItem[] {
  const existingIds = new Set(prev.map((d) => d.id));
  const filtered = newDocs.filter((d) => !existingIds.has(d.id));
  return [...prev, ...filtered];
}

interface FetchDocumentsParams {
  category: string;
  scope: string;
  status: string;
  search: string;
  limit: number;
  offset: number;
}

async function executeDocumentFetch(params: FetchDocumentsParams) {
  return getAiDocuments({
    category: params.category === "ALL" ? undefined : params.category,
    scope: params.scope === "ALL" ? undefined : params.scope,
    status: params.status === "ALL" ? undefined : params.status,
    search: params.search.trim() || undefined,
    limit: params.limit,
    offset: params.offset,
  });
}

function useAiDocMutations(refresh: (silent?: boolean) => void) {
  const [isSyncing, setIsSyncing] = useState(false);

  const approve = useCallback(async (id: string, title: string) => {
    try {
      await approveAiDocument(id);
      toast.success(`Dokumen "${title}" disetujui & aktif untuk RAG context.`);
      refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal menyetujui dokumen");
    }
  }, [refresh]);

  const reject = useCallback(async (id: string, title: string) => {
    try {
      await rejectAiDocument(id);
      toast.success(`Dokumen "${title}" ditolak.`);
      refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal menolak dokumen");
    }
  }, [refresh]);

  const remove = useCallback(async (id: string, title: string) => {
    if (!confirm(`Hapus dokumen "${title}" beserta seluruh vektor embedding dari database?`)) return;
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
      const t1 = setTimeout(() => refresh(true), 3000);
      const t2 = setTimeout(() => refresh(true), 6000);
      const t3 = setTimeout(() => refresh(true), 10000);
      const t4 = setTimeout(() => {
        refresh(true);
        setIsSyncing(false);
      }, 15000);
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

  return { approve, reject, remove, syncServerDocs, isSyncing };
}

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

  const limit = 30;

  const fetchStatsAndSync = useCallback(async (silent = false) => {
    try {
      if (!silent) {
        setStatsLoading(true);
        setSyncStatusLoading(true);
      }
      const [statsData, syncData] = await Promise.all([
        getAiKnowledgeStats().catch(() => null),
        getAiServerSyncStatus().catch(() => null),
      ]);
      if (mounted.current) {
        if (statsData) setStats(statsData);
        if (syncData) setSyncStatus(syncData);
      }
    } finally {
      if (mounted.current && !silent) {
        setStatsLoading(false);
        setSyncStatusLoading(false);
      }
    }
  }, []);

  const fetchDocuments = useCallback(
    async (resetList = true, silent = false) => {
      if (resetList) {
        if (!silent) {
          setLoading(true);
          loadingRef.current = true;
          setDocuments([]);
        }
        offsetRef.current = 0;
        hasMoreRef.current = true;
        setHasMore(true);
      } else {
        if (loadingRef.current || loadingMoreRef.current || !hasMoreRef.current || isFetchingRef.current) return;
        loadingMoreRef.current = true;
        setLoadingMore(true);
      }

      isFetchingRef.current = true;

      try {
        const res = await executeDocumentFetch({
          category: selectedCategory,
          scope: selectedScope,
          status: selectedStatus,
          search: searchQuery,
          limit,
          offset: resetList ? 0 : offsetRef.current,
        });

        if (!mounted.current) return;
        const newDocs = res?.documents || [];
        const total = res?.total || 0;

        if (resetList) {
          setDocuments(newDocs);
          offsetRef.current = newDocs.length;
        } else {
          setDocuments((prev) => {
            const combined = mergeDocuments(prev, newDocs);
            offsetRef.current = combined.length;
            return combined;
          });
        }

        setDocsTotal(total);
        const stillHasMore = newDocs.length === limit && offsetRef.current < total;
        hasMoreRef.current = stillHasMore;
        setHasMore(stillHasMore);
        setError(null);
      } catch (err: unknown) {
        if (!mounted.current) return;
        setError(err instanceof Error ? err.message : "Gagal memuat dokumen AI");
        if (resetList && !silent) setDocuments([]);
      } finally {
        if (mounted.current) {
          if (!silent) setLoading(false);
          setLoadingMore(false);
          loadingRef.current = false;
          loadingMoreRef.current = false;
          isFetchingRef.current = false;
        }
      }
    },
    [selectedCategory, selectedScope, selectedStatus, searchQuery]
  );

  const refresh = useCallback((silent = false) => {
    fetchStatsAndSync(silent);
    fetchDocuments(true, silent);
  }, [fetchStatsAndSync, fetchDocuments]);

  useEffect(() => {
    mounted.current = true;
    fetchStatsAndSync();
    fetchDocuments(true);
    return () => {
      mounted.current = false;
    };
  }, [fetchStatsAndSync, fetchDocuments, selectedCategory, selectedScope, selectedStatus]);

  const fetchMore = useCallback(async () => {
    if (!loadingMore && hasMore) await fetchDocuments(false);
  }, [fetchDocuments, loadingMore, hasMore]);

  const handleSearchSubmit = useCallback((e?: React.FormEvent) => {
    if (e) e.preventDefault();
    fetchDocuments(true);
  }, [fetchDocuments]);

  const mutations = useAiDocMutations(refresh);

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
    ...mutations,
  };
}
