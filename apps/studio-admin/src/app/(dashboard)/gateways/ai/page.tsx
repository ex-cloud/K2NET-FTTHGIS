"use client";

import { useEffect, useState, useTransition, useCallback } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Badge, Button } from "@k2net/ui";
import { toast } from "sonner";
import { GatewayPageWrapper } from "@/components/page-guards/gateway-page-wrapper";
import { 
  getAiKnowledgeStats, 
  getAiDocuments, 
  createManualAiDocument, 
  deleteAiDocument, 
  approveAiDocument,
  rejectAiDocument,
  triggerServerDocsSync,
  getAiServerSyncStatus,
  getGatewayConfigByKey,
  updateGatewayConfigByKey,
  simulateVectorSearch,
  AiKnowledgeStats, 
  AiDocumentItem,
  ServerSyncStatus,
} from "@/lib/actions/gateways";

import { AiTabType, KnowledgeScope, KnowledgeTemplateItem } from "./components/types";
import { AiKpiCards } from "./components/ai-kpi-cards";
import { AiNavTabs } from "./components/ai-nav-tabs";
import { AiKnowledgeTable } from "./components/ai-knowledge-table";
import { AiKnowledgeGraphTab } from "./components/ai-knowledge-graph-tab";
import { AiSemanticSimulator } from "./components/ai-semantic-simulator";
import { AiTemplatesTab } from "./components/ai-templates-tab";
import { AiAddKnowledgeTab } from "./components/ai-add-knowledge-tab";
import { AiConfigTab } from "./components/ai-config-tab";
import { AiVectorExplorerModal } from "./components/ai-vector-explorer-modal";
import { AiEditKnowledgeModal } from "./components/ai-edit-knowledge-modal";

export default function AiGatewayPage() {
  const [activeTab, setActiveTab] = useState<AiTabType>("KNOWLEDGE");
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

  const hasMore = documents.length < docsTotal;

  // Semantic Search Simulator State (Real-time pgvector testing)
  const [simQuery, setSimQuery] = useState("Standar redaman GPON ZTE C320");
  const [simMinSimilarity, setSimMinSimilarity] = useState(0.2);
  const [simLimit, setSimLimit] = useState(4);
  const [simScope, setSimScope] = useState("GENERAL");
  const [simResults, setSimResults] = useState<any[]>([]);
  const [simTotalMatches, setSimTotalMatches] = useState(0);
  const [simSearching, setSimSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Vector Explorer Dialog State
  const [isExplorerOpen, setIsExplorerOpen] = useState(false);

  // Manual Form State
  const [manualTitle, setManualTitle] = useState("");
  const [manualCategory, setManualCategory] = useState("GENERAL");
  const [manualScope, setManualScope] = useState<KnowledgeScope>("GLOBAL");
  const [manualAutoApprove, setManualAutoApprove] = useState(true);
  const [manualIsDraft, setManualIsDraft] = useState(false);
  const [manualContent, setManualContent] = useState("");
  const [manualSubmitting, setManualSubmitting] = useState(false);

  // Upload Form State
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadCategory, setUploadCategory] = useState("GENERAL");
  const [uploadScope, setUploadScope] = useState<KnowledgeScope>("GLOBAL");
  const [uploadAutoApprove, setUploadAutoApprove] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Config State
  const [config, setConfig] = useState<Record<string, string>>({});
  const [configLoading, setConfigLoading] = useState(false);
  const [configSaving, setConfigSaving] = useState(false);

  // Server Files Sync Detection State
  const [syncStatus, setSyncStatus] = useState<ServerSyncStatus | null>(null);
  const [syncStatusLoading, setSyncStatusLoading] = useState(false);

  // ── Load Real-Time Stats & Documents from PostgreSQL pgvector ─────────────
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

  const loadDocuments = useCallback(async () => {
    try {
      setDocsLoading(true);
      const res = await getAiDocuments({
        category: selectedCategory === "ALL" ? undefined : selectedCategory,
        scope: selectedScope === "ALL" ? undefined : selectedScope,
        status: selectedStatus === "ALL" ? undefined : selectedStatus,
        search: searchQuery.trim() || undefined,
        limit: 30,
        offset: 0,
      });
      setDocuments(res.documents || []);
      setDocsTotal(res.total || 0);
    } catch (err) {
      console.error("Gagal memuat dokumen AI:", err);
    } finally {
      setDocsLoading(false);
    }
  }, [selectedCategory, selectedScope, selectedStatus, searchQuery]);

  const handleFetchMore = async () => {
    if (loadingMore || !hasMore || docsLoading) return;
    try {
      setLoadingMore(true);
      const res = await getAiDocuments({
        category: selectedCategory === "ALL" ? undefined : selectedCategory,
        scope: selectedScope === "ALL" ? undefined : selectedScope,
        status: selectedStatus === "ALL" ? undefined : selectedStatus,
        search: searchQuery.trim() || undefined,
        limit: 30,
        offset: documents.length,
      });
      if (res.documents && res.documents.length > 0) {
        setDocuments((prev) => [...prev, ...res.documents]);
      }
      setDocsTotal(res.total || 0);
    } catch (err) {
      console.error("Gagal memuat dokumen tambahan:", err);
    } finally {
      setLoadingMore(false);
    }
  };

  const loadConfig = useCallback(async () => {
    try {
      setConfigLoading(true);
      const res = await getGatewayConfigByKey("ai");
      const flatConfig: Record<string, string> = {};
      if (res && res.sections) {
        Object.values(res.sections).forEach((entries) => {
          entries.forEach((entry) => {
            flatConfig[entry.key] = entry.value || "";
          });
        });
      }
      setConfig(flatConfig);
    } catch (err) {
      console.error("Gagal memuat config:", err);
    } finally {
      setConfigLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
    loadDocuments();
    loadSyncStatus();
  }, [loadStats, loadDocuments, loadSyncStatus]);

  // ── Event Handlers ──────────────────────────────────────────────────────────
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadDocuments();
  };

  const handleEdit = (doc: AiDocumentItem) => {
    setEditingDoc(doc);
  };

  const handleApprove = async (id: string, title: string) => {
    try {
      await approveAiDocument(id);
      toast.success(`Dokumen "${title}" berhasil disetujui dan diindeks ke pgvector!`);
      loadDocuments();
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
      loadDocuments();
      loadStats();
      loadSyncStatus();
    } catch (err: any) {
      toast.error(err.message || "Gagal menolak dokumen");
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Hapus dokumen "${title}" beserta seluruh vektor embedding dari database?`)) {
      return;
    }
    try {
      await deleteAiDocument(id);
      toast.success(`Dokumen "${title}" berhasil dihapus dari memori AI!`);
      loadDocuments();
      loadStats();
      loadSyncStatus();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus dokumen");
    }
  };

  const handleSyncServerDocs = () => {
    startTransition(async () => {
      try {
        const res = await triggerServerDocsSync();
        toast.success(res.message || "Sinkronisasi direktori server /opt/project5/docs dimulai di latar belakang!");
        setTimeout(() => {
          loadStats();
          loadDocuments();
          loadSyncStatus();
        }, 3000);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Gagal sinkronisasi server docs");
      }
    });
  };

  const handleSimulateSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!simQuery.trim()) return;

    try {
      setSimSearching(true);
      setHasSearched(true);
      const res = await simulateVectorSearch({
        query: simQuery,
        limit: simLimit,
        min_similarity: simMinSimilarity,
        scope: simScope === "ALL" ? "GENERAL" : simScope,
      });
      setSimResults(res.results || []);
      setSimTotalMatches(res.total_matches || 0);
      if (res.total_matches === 0) {
        toast.info("Tidak ada dokumen yang melebihi ambang batas similarity.");
      } else {
        toast.success(`Ditemukan ${res.total_matches} chunks relevan di pgvector!`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal simulasi pencarian vektor");
    } finally {
      setSimSearching(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle.trim() || !manualContent.trim()) return;

    try {
      setManualSubmitting(true);
      await createManualAiDocument({
        title: manualTitle,
        category: manualCategory,
        scope: manualScope,
        content: manualContent,
        auto_approve: manualAutoApprove,
        is_draft: !manualAutoApprove,
      });
      toast.success(
        manualAutoApprove
          ? "Catatan SOP berhasil disimpan dan diindeks ke pgvector!"
          : "Catatan SOP berhasil disimpan sebagai draf pending review."
      );
      setManualTitle("");
      setManualContent("");
      setActiveTab("KNOWLEDGE");
      loadDocuments();
      loadStats();
      loadSyncStatus();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan catatan");
    } finally {
      setManualSubmitting(false);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", selectedFile);
      if (uploadTitle.trim()) formData.append("title", uploadTitle);
      formData.append("category", uploadCategory);
      formData.append("scope", uploadScope);
      formData.append("auto_approve", String(uploadAutoApprove));

      const res = await fetch("/api/v1/ai/documents", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Gagal mengunggah file");
      }

      toast.success(
        uploadAutoApprove
          ? "Dokumen berhasil diunggah! Indexing pgvector berjalan di latar belakang."
          : "Dokumen berhasil diunggah sebagai draf pending review."
      );
      setSelectedFile(null);
      setUploadTitle("");
      setActiveTab("KNOWLEDGE");
      loadDocuments();
      loadStats();
      loadSyncStatus();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengunggah file");
    } finally {
      setUploading(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setConfigSaving(true);
      const changes: Record<string, string> = {};
      if (config["DEFAULT_LLM_PROVIDER"]) changes["DEFAULT_LLM_PROVIDER"] = config["DEFAULT_LLM_PROVIDER"];
      if (config["GEMINI_API_KEY"]) changes["GEMINI_API_KEY"] = config["GEMINI_API_KEY"];
      if (config["OPENAI_API_KEY"]) changes["OPENAI_API_KEY"] = config["OPENAI_API_KEY"];
      if (config["OLLAMA_BASE_URL"]) changes["OLLAMA_BASE_URL"] = config["OLLAMA_BASE_URL"];
      if (config["OLLAMA_CHAT_MODEL"]) changes["OLLAMA_CHAT_MODEL"] = config["OLLAMA_CHAT_MODEL"];

      await updateGatewayConfigByKey("ai", changes);
      toast.success("Konfigurasi AI Assistant Gateway berhasil diperbarui!");
      loadConfig();
      loadStats();
      loadSyncStatus();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan konfigurasi");
    } finally {
      setConfigSaving(false);
    }
  };

  const handleUseTemplate = (template: KnowledgeTemplateItem) => {
    setManualTitle(template.title);
    setManualCategory(template.category);
    setManualContent(template.content);
    setActiveTab("ADD_KNOWLEDGE");
    toast.info(`Template '${template.title}' dimuat ke editor manual.`);
  };

  return (
    <GatewayPageWrapper>
      <div className="flex-1 flex flex-col pt-6 pb-16 px-4 md:px-6 bg-background h-full overflow-y-auto custom-scrollbar w-full gap-6 select-none">
        
        {/* Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground tracking-tight flex items-center gap-2">
                AI Assistant Gateway
                <Badge variant="outline" className="text-[10px] border-primary/30 text-primary bg-primary/10 font-mono">
                  Port 5012
                </Badge>
              </h1>
              <p className="text-xs text-foreground/75 dark:text-muted-foreground mt-0.5">
                Orkestrasi pgvector RAG Knowledge Base, SOP indexing, Google Gemini/OpenAI engines, dan SSE streaming copilot.
              </p>
            </div>
          </div>

          <div>
            <Link href="/ai">
              <Button size="sm" className="text-xs gap-1.5 bg-primary text-primary-foreground font-semibold cursor-pointer shadow-xs">
                <Sparkles className="w-3.5 h-3.5" />
                Buka AI Workspace Mandiri
              </Button>
            </Link>
          </div>
        </div>
      
        {/* Top KPI Metrics */}
        <AiKpiCards 
          stats={stats} 
          loading={statsLoading} 
          onOpenExplorer={() => setIsExplorerOpen(true)} 
        />

        {/* Navigation Tabs */}
        <AiNavTabs
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          docsTotal={docsTotal}
          onSyncServerDocs={handleSyncServerDocs}
          onRefresh={() => {
            loadDocuments();
            loadStats();
            loadSyncStatus();
          }}
          isSyncing={isPending}
          docsLoading={docsLoading}
          onLoadConfig={loadConfig}
        />

        {/* TAB 1: KNOWLEDGE LIST */}
        {activeTab === "KNOWLEDGE" && (
          <AiKnowledgeTable
            documents={documents}
            docsLoading={docsLoading}
            loadingMore={loadingMore}
            hasMore={hasMore}
            totalCount={stats?.total_documents || docsTotal}
            totalChunks={stats?.total_chunks || 0}
            totalBytes={stats?.total_size_bytes || 0}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            selectedScope={selectedScope}
            setSelectedScope={setSelectedScope}
            selectedStatus={selectedStatus}
            setSelectedStatus={setSelectedStatus}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onSearchSubmit={handleSearchSubmit}
            onEdit={handleEdit}
            onApprove={handleApprove}
            onReject={handleReject}
            onDelete={handleDelete}
            onGoToUpload={() => setActiveTab("ADD_KNOWLEDGE")}
            onSyncServerDocs={handleSyncServerDocs}
            onRefresh={() => {
              loadDocuments();
              loadStats();
              loadSyncStatus();
            }}
            onFetchMore={handleFetchMore}
            isSyncing={isPending}
            syncStatus={syncStatus}
            syncStatusLoading={syncStatusLoading}
            onInspectVector={() => setIsExplorerOpen(true)}
            onTestSimulator={(title) => {
              setSimQuery(title);
              setActiveTab("SIMULATOR");
            }}
          />
        )}

        {/* TAB 2: 2D OBSIDIAN-STYLE INTERACTIVE KNOWLEDGE GRAPH */}
        {activeTab === "GRAPH" && (
          <AiKnowledgeGraphTab
            onTestSimulator={(title) => {
              setSimQuery(title);
              setActiveTab("SIMULATOR");
            }}
            onOpenExplorer={() => setIsExplorerOpen(true)}
          />
        )}

        {/* TAB 3: RAG SEMANTIC SIMULATOR & VECTOR SEARCH INSPECTOR */}
        {activeTab === "SIMULATOR" && (
          <AiSemanticSimulator
            simQuery={simQuery}
            setSimQuery={setSimQuery}
            simMinSimilarity={simMinSimilarity}
            setSimMinSimilarity={setSimMinSimilarity}
            simLimit={simLimit}
            setSimLimit={setSimLimit}
            simScope={simScope}
            setSimScope={setSimScope}
            simResults={simResults}
            simTotalMatches={simTotalMatches}
            simSearching={simSearching}
            hasSearched={hasSearched}
            onSimulateSearch={handleSimulateSearch}
          />
        )}

        {/* TAB 4: CONTOH & TEMPLATE SOP */}
        {activeTab === "TEMPLATES" && (
          <AiTemplatesTab onUseTemplate={handleUseTemplate} />
        )}

        {/* TAB 5: TAMBAH PENGETAHUAN (UNIFIED: UPLOAD + MANUAL NOTE) */}
        {activeTab === "ADD_KNOWLEDGE" && (
          <AiAddKnowledgeTab
            uploadTitle={uploadTitle}
            setUploadTitle={setUploadTitle}
            uploadCategory={uploadCategory}
            setUploadCategory={setUploadCategory}
            uploadScope={uploadScope}
            setUploadScope={setUploadScope}
            uploadAutoApprove={uploadAutoApprove}
            setUploadAutoApprove={setUploadAutoApprove}
            selectedFile={selectedFile}
            setSelectedFile={setSelectedFile}
            uploading={uploading}
            onUploadSubmit={handleUploadSubmit}
            manualTitle={manualTitle}
            setManualTitle={setManualTitle}
            manualCategory={manualCategory}
            setManualCategory={setManualCategory}
            manualScope={manualScope}
            setManualScope={setManualScope}
            manualAutoApprove={manualAutoApprove}
            setManualAutoApprove={setManualAutoApprove}
            manualIsDraft={manualIsDraft}
            setManualIsDraft={setManualIsDraft}
            manualContent={manualContent}
            setManualContent={setManualContent}
            manualSubmitting={manualSubmitting}
            onManualSubmit={handleManualSubmit}
            onCancel={() => setActiveTab("KNOWLEDGE")}
            onGoToTemplates={() => setActiveTab("TEMPLATES")}
          />
        )}

        {/* TAB 6: ENGINE CONFIGURATION */}
        {activeTab === "CONFIG" && (
          <AiConfigTab
            config={config}
            setConfig={setConfig}
            configLoading={configLoading}
            configSaving={configSaving}
            onSaveConfig={handleSaveConfig}
          />
        )}

        {/* Vector Chunk Explorer Modal */}
        <AiVectorExplorerModal
          isOpen={isExplorerOpen}
          setIsOpen={setIsExplorerOpen}
          stats={stats}
          documents={documents}
          onOpenSimulator={() => {
            setIsExplorerOpen(false);
            setActiveTab("SIMULATOR");
          }}
        />

        {/* Edit Knowledge Revision Modal */}
        <AiEditKnowledgeModal
          document={editingDoc}
          isOpen={!!editingDoc}
          onClose={() => setEditingDoc(null)}
          onSuccess={() => {
            loadDocuments();
            loadStats();
          }}
        />

      </div>
    </GatewayPageWrapper>
  );
}
