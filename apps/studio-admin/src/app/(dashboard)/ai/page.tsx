"use client";

import { useEffect, useState, useTransition, useCallback } from "react";
import { Sparkles, FolderSync, RefreshCw, Plus } from "lucide-react";
import { Badge, Button } from "@k2net/ui";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { AiPageWrapper } from "@/components/page-guards/ai-page-wrapper";
import { 
  getAiKnowledgeStats, 
  getAiDocuments, 
  deleteAiDocument, 
  triggerServerDocsSync,
  AiKnowledgeStats, 
  AiDocumentItem 
} from "@/lib/actions/gateways";

import { AiKpiCards } from "../gateways/ai/components/ai-kpi-cards";
import { AiKnowledgeTable } from "../gateways/ai/components/ai-knowledge-table";
import { AiVectorExplorerModal } from "../gateways/ai/components/ai-vector-explorer-modal";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [isPending, startTransition] = useTransition();

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

  // Load Documents from pgvector
  const loadDocuments = useCallback(async (category = selectedCategory, search = searchQuery, reset = true) => {
    try {
      if (reset) setDocsLoading(true);
      else setLoadingMore(true);

      const offset = reset ? 0 : documents.length;
      const res = await getAiDocuments({
        category: category === "ALL" ? undefined : category,
        search: search.trim() || undefined,
        limit: 50,
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
  }, [selectedCategory, searchQuery, documents.length]);

  useEffect(() => {
    loadStats();
    loadDocuments();
  }, [loadStats, loadDocuments]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadDocuments(selectedCategory, searchQuery, true);
  };

  const handleFetchMore = () => {
    if (!loadingMore && hasMore) {
      loadDocuments(selectedCategory, searchQuery, false);
    }
  };

  const handleDelete = async (docId: string, title: string) => {
    try {
      const res = await deleteAiDocument(docId);
      if (res && (res.status === "SUCCESS" || res.status === "deleted" || res.message)) {
        toast.success(`Dokumen "${title}" berhasil dihapus dari vector store`);
        loadDocuments(selectedCategory, searchQuery, true);
        loadStats();
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
        if (res && (res.status === "SUCCESS" || res.message)) {
          toast.success(res.message || "Sinkronisasi direktori server docs berhasil");
          loadDocuments(selectedCategory, searchQuery, true);
          loadStats();
        } else {
          toast.error("Gagal menyinkronkan berkas server");
        }
      } catch {
        toast.error("Terjadi kesalahan koneksi saat memicu sinkronisasi");
      }
    });
  };

  return (
    <AiPageWrapper>
      <div className="flex-1 w-full bg-background overflow-y-auto custom-scrollbar p-6 space-y-6">
        
        {/* Top Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
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
              <p className="text-xs text-muted-foreground mt-0.5">
                Basis data pengetahuan teknis FTTH, manual hardware OLT/ONT, dan prosedur operasional jaringan K2NET.
              </p>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSyncServerDocs}
              disabled={isPending}
              className="text-xs gap-1.5 border-primary/40 hover:bg-primary/10 text-primary font-medium cursor-pointer"
            >
              <FolderSync className={`w-3.5 h-3.5 ${isPending ? "animate-spin" : ""}`} />
              {isPending ? "Menyinkronkan..." : "Sinkronkan Server Docs"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                loadDocuments();
                loadStats();
              }}
              className="text-xs gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${docsLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              size="sm"
              onClick={() => router.push("/ai/add")}
              className="text-xs gap-1.5 bg-primary text-primary-foreground font-semibold cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Tambah Pengetahuan
            </Button>
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
            loadDocuments(cat, searchQuery, true);
          }}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onSearchSubmit={handleSearchSubmit}
          onDelete={handleDelete}
          onGoToUpload={() => router.push("/ai/add")}
          onSyncServerDocs={handleSyncServerDocs}
          onRefresh={() => {
            loadDocuments();
            loadStats();
          }}
          onFetchMore={handleFetchMore}
          isSyncing={isPending}
          onInspectVector={() => setIsExplorerOpen(true)}
          onTestSimulator={(title) => {
            router.push(`/ai/simulator?query=${encodeURIComponent(title)}`);
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
