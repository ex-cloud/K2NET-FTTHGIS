"use client";

import { useEffect, useState, useTransition, useCallback } from "react";
import { Sparkles, Plus } from "lucide-react";
import { Badge, Button, ActionTooltip } from "@k2net/ui";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { AiPageWrapper } from "@/components/page-guards/ai-page-wrapper";
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

import { AiKpiCards } from "../gateways/ai/components/ai-kpi-cards";
import { AiKnowledgeTable } from "../gateways/ai/components/ai-knowledge-table";
import { AiVectorExplorerModal } from "../gateways/ai/components/ai-vector-explorer-modal";
import { AiEditKnowledgeModal } from "../gateways/ai/components/ai-edit-knowledge-modal";

export default function AiKnowledgePage() {
  const router = useRouter();
  const [stats, setStats] = useState<AiKnowledgeStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Knowledge Documents state (100% Real-time from pgvector)
  const [documents, setDocuments] = useState<AiDocumentItem[]>([]);
  const [docsTotal, setDocsTotal] = useState(0);
  const [docsLoading, setDocsLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedScope, setSelectedScope] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  // Edit Knowledge Modal state
  const [editingDoc, setEditingDoc] = useState<AiDocumentItem | null>(null);

  // Server Files Sync Detection State
  const [syncStatus, setSyncStatus] = useState<ServerSyncStatus | null>(null);
  const [syncStatusLoading, setSyncStatusLoading] = useState(false);

  const hasMore = documents.length < docsTotal;

  // Vector Explorer Dialog State
  const [isExplorerOpen, setIsExplorerOpen] = useState(false);

  // Load KPI Stats
  const loadStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const data = await getAiKnowledgeStats();
      setStats(data);
    } catch (err) {
      console.error("Gagal memuat stats AI:", err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // Load Sync Status
  const loadSyncStatus = useCallback(async () => {
    try {
      setSyncStatusLoading(true);
      const data = await getAiServerSyncStatus();
      setSyncStatus(data);
    } catch (err) {
      console.error("Gagal memuat status sinkronisasi server docs:", err);
    } finally {
      setSyncStatusLoading(false);
    }
  }, []);

  // Load Documents from pgvector
  const loadDocuments = useCallback(async (
    category = selectedCategory, 
    scope = selectedScope,
    status = selectedStatus,
    search = searchQuery, 
    reset = true
  ) => {
    try {
      if (reset) setDocsLoading(true);
      else setLoadingMore(true);

      const offset = reset ? 0 : documents.length;
      const res = await getAiDocuments({
        category: category === "ALL" ? undefined : category,
        scope: scope === "ALL" ? undefined : scope,
        status: status === "ALL" ? undefined : status,
        search: search.trim() || undefined,
        limit: 30,
        offset,
      });

      if (res && res.documents) {
        if (reset) {
          setDocuments(res.documents || []);
        } else {
          setDocuments((prev) => [...prev, ...(res.documents || [])]);
        }
        setDocsTotal(res.total || 0);
      } else {
        if (reset) setDocuments([]);
      }
    } catch (err) {
      console.error("Gagal memuat dokumen AI:", err);
      if (reset) setDocuments([]);
    } finally {
      setDocsLoading(false);
      setLoadingMore(false);
    }
  }, [selectedCategory, selectedScope, selectedStatus, searchQuery, documents.length]);

  useEffect(() => {
    loadStats();
    loadDocuments();
    loadSyncStatus();
  }, [loadStats, loadDocuments, loadSyncStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadDocuments(selectedCategory, selectedScope, selectedStatus, searchQuery, true);
  };

  const handleFetchMore = () => {
    if (!loadingMore && hasMore) {
      loadDocuments(selectedCategory, selectedScope, selectedStatus, searchQuery, false);
    }
  };

  const handleEdit = (doc: AiDocumentItem) => {
    setEditingDoc(doc);
  };

  const handleApprove = async (id: string, title: string) => {
    try {
      await approveAiDocument(id);
      toast.success(`Dokumen "${title}" berhasil disetujui dan diindeks ke pgvector!`);
      loadDocuments(selectedCategory, selectedScope, selectedStatus, searchQuery, true);
      loadStats();
      loadSyncStatus();
    } catch (err: any) {
      toast.error(err.message || "Gagal menyetujui dokumen");
    }
  };

  const handleReject = async (id: string, title: string) => {
    try {
      await rejectAiDocument(id);
      toast.success(`Dokumen "${title}" ditolak.`);
      loadDocuments(selectedCategory, selectedScope, selectedStatus, searchQuery, true);
      loadStats();
      loadSyncStatus();
    } catch (err: any) {
      toast.error(err.message || "Gagal menolak dokumen");
    }
  };

  const handleDelete = async (docId: string, title: string) => {
    if (!confirm(`Hapus dokumen "${title}" beserta seluruh vektor embedding dari database?`)) {
      return;
    }
    try {
      const res = await deleteAiDocument(docId);
      if (res && (res.status === "SUCCESS" || res.status === "deleted" || res.message)) {
        toast.success(`Dokumen "${title}" berhasil dihapus dari vector store`);
        loadDocuments(selectedCategory, selectedScope, selectedStatus, searchQuery, true);
        loadStats();
        loadSyncStatus();
      } else {
        toast.error("Gagal menghapus dokumen");
      }
    } catch {
      toast.error("Terjadi kesalahan jaringan saat menghapus dokumen");
    }
  };

  const handleSyncServerDocs = () => {
    startTransition(async () => {
      try {
        const res = await triggerServerDocsSync();
        toast.success(res.message || "Sinkronisasi direktori server /opt/project5/docs dimulai di latar belakang!");
        setTimeout(() => {
          loadStats();
          loadDocuments(selectedCategory, selectedScope, selectedStatus, searchQuery, true);
          loadSyncStatus();
        }, 3000);
      } catch {
        toast.error("Terjadi kesalahan koneksi saat memicu sinkronisasi");
      }
    });
  };

  return (
    <AiPageWrapper>
      <div className="flex-1 w-full bg-background overflow-y-auto custom-scrollbar p-6 space-y-6">
        
        {/* Top Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
                  Daftar Pengetahuan SOP & RAG
                </h1>
                <Badge variant="outline" className="text-[10px] font-mono px-2 py-0.5 border-primary/30 text-primary bg-primary/10">
                  pgvector 1536 dim
                </Badge>
              </div>
              <p className="text-xs text-foreground/75 dark:text-muted-foreground mt-0.5">
                Basis data pengetahuan teknis FTTH, manual hardware OLT/ONT, dan prosedur operasional jaringan K2NET.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ActionTooltip label="Tulis Dokumen SOP Baru" shortcut="N">
              <Button
                size="sm"
                onClick={() => router.push("/ai/add")}
                className="text-xs gap-1.5 bg-primary text-primary-foreground font-semibold cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                Tulis SOP Baru
              </Button>
            </ActionTooltip>
          </div>
        </div>

        {/* KPI Metrics Cards */}
        <AiKpiCards 
          stats={stats} 
          loading={statsLoading} 
          onOpenExplorer={() => setIsExplorerOpen(true)}
        />

        {/* Full-Width Table View with Solid Sticky Header & Proportional Grid */}
        <AiKnowledgeTable
          documents={documents}
          docsLoading={docsLoading}
          loadingMore={loadingMore}
          hasMore={hasMore}
          totalCount={stats?.total_documents || docsTotal}
          totalChunks={stats?.total_chunks || 0}
          totalBytes={stats?.total_size_bytes || 0}
          selectedCategory={selectedCategory}
          setSelectedCategory={(cat) => {
            setSelectedCategory(cat);
            loadDocuments(cat, selectedScope, selectedStatus, searchQuery, true);
          }}
          selectedScope={selectedScope}
          setSelectedScope={(scope) => {
            setSelectedScope(scope);
            loadDocuments(selectedCategory, scope, selectedStatus, searchQuery, true);
          }}
          selectedStatus={selectedStatus}
          setSelectedStatus={(st) => {
            setSelectedStatus(st);
            loadDocuments(selectedCategory, selectedScope, st, searchQuery, true);
          }}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onSearchSubmit={handleSearchSubmit}
          onEdit={handleEdit}
          onApprove={handleApprove}
          onReject={handleReject}
          onDelete={handleDelete}
          onGoToUpload={() => router.push("/ai/add")}
          onSyncServerDocs={handleSyncServerDocs}
          onRefresh={() => {
            loadDocuments(selectedCategory, selectedScope, selectedStatus, searchQuery, true);
            loadStats();
            loadSyncStatus();
          }}
          onFetchMore={handleFetchMore}
          isSyncing={isPending}
          syncStatus={syncStatus}
          syncStatusLoading={syncStatusLoading}
          onInspectVector={() => setIsExplorerOpen(true)}
          onTestSimulator={(title) => {
            router.push(`/ai/simulator?query=${encodeURIComponent(title)}`);
          }}
        />

        {/* Edit Knowledge Modal */}
        <AiEditKnowledgeModal
          document={editingDoc}
          isOpen={!!editingDoc}
          onClose={() => setEditingDoc(null)}
          onSuccess={() => {
            loadDocuments(selectedCategory, selectedScope, selectedStatus, searchQuery, true);
            loadStats();
            loadSyncStatus();
          }}
        />

        {/* Vector Chunk Explorer Modal */}
        <AiVectorExplorerModal
          isOpen={isExplorerOpen}
          setIsOpen={setIsExplorerOpen}
          stats={stats}
          documents={documents}
          onOpenSimulator={() => {
            setIsExplorerOpen(false);
            router.push("/ai/simulator");
          }}
        />

      </div>
    </AiPageWrapper>
  );
}
