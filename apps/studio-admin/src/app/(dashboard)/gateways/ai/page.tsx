"use client";

import { useEffect, useState, useTransition, useCallback } from "react";
import { Sparkles } from "lucide-react";
import { Badge } from "@k2net/ui";
import { toast } from "sonner";
import { GatewayPageWrapper } from "@/components/page-guards/gateway-page-wrapper";
import { 
  getAiKnowledgeStats, 
  getAiDocuments, 
  createManualAiDocument, 
  deleteAiDocument, 
  triggerServerDocsSync,
  getGatewayConfigByKey,
  updateGatewayConfigByKey,
  simulateVectorSearch,
  AiKnowledgeStats, 
  AiDocumentItem 
} from "@/lib/actions/gateways";

// Modular Sub-Components
import { AiTabType, KnowledgeTemplateItem } from "./components/types";
import { AiKpiCards } from "./components/ai-kpi-cards";
import { AiNavTabs } from "./components/ai-nav-tabs";
import { AiKnowledgeTable } from "./components/ai-knowledge-table";
import { AiSemanticSimulator } from "./components/ai-semantic-simulator";
import { AiTemplatesTab } from "./components/ai-templates-tab";
import { AiUploadTab } from "./components/ai-upload-tab";
import { AiManualNoteTab } from "./components/ai-manual-note-tab";
import { AiConfigTab } from "./components/ai-config-tab";
import { AiVectorExplorerModal } from "./components/ai-vector-explorer-modal";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [isPending, startTransition] = useTransition();

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
  const [manualContent, setManualContent] = useState("");
  const [manualSubmitting, setManualSubmitting] = useState(false);

  // Upload Form State
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadCategory, setUploadCategory] = useState("GENERAL");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Config State
  const [config, setConfig] = useState<Record<string, string>>({});
  const [configLoading, setConfigLoading] = useState(false);
  const [configSaving, setConfigSaving] = useState(false);

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

  const loadDocuments = useCallback(async () => {
    try {
      setDocsLoading(true);
      const res = await getAiDocuments({
        category: selectedCategory === "ALL" ? undefined : selectedCategory,
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
  }, [selectedCategory, searchQuery]);

  const handleFetchMore = async () => {
    if (loadingMore || !hasMore || docsLoading) return;
    try {
      setLoadingMore(true);
      const res = await getAiDocuments({
        category: selectedCategory === "ALL" ? undefined : selectedCategory,
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
  }, [loadStats, loadDocuments]);

  // ── Event Handlers ──────────────────────────────────────────────────────────
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadDocuments();
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
        content: manualContent,
      });
      toast.success("Catatan SOP berhasil disimpan dan diindeks ke pgvector!");
      setManualTitle("");
      setManualContent("");
      setActiveTab("KNOWLEDGE");
      loadDocuments();
      loadStats();
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

      const res = await fetch("/api/v1/ai/documents", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Gagal mengunggah file");
      }

      toast.success("Dokumen berhasil diunggah! Indexing pgvector berjalan di latar belakang.");
      setSelectedFile(null);
      setUploadTitle("");
      setActiveTab("KNOWLEDGE");
      loadDocuments();
      loadStats();
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
    setActiveTab("MANUAL");
    toast.info(`Template '${template.title}' dimuat ke editor manual.`);
  };

  return (
    <GatewayPageWrapper>
      <div className="flex-1 flex flex-col pt-16 px-4 md:px-8 bg-background h-full overflow-y-auto custom-scrollbar">
        <div className="w-full max-w-6xl mx-auto space-y-8 pb-20">
          
          {/* Header Banner */}
          <div className="flex items-center gap-4 border-b border-border pb-6">
            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-xs">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2.5">
                AI Assistant Gateway
                <Badge variant="outline" className="text-[10px] border-primary/30 text-primary bg-primary/10 font-mono">
                  Port 5012
                </Badge>
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Orkestrasi pgvector RAG Knowledge Base, SOP indexing, Google Gemini/OpenAI engines, dan SSE streaming copilot.
              </p>
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
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              onSearchSubmit={handleSearchSubmit}
              onDelete={handleDelete}
              onGoToUpload={() => setActiveTab("UPLOAD")}
              onSyncServerDocs={handleSyncServerDocs}
              onRefresh={() => {
                loadDocuments();
                loadStats();
              }}
              onFetchMore={handleFetchMore}
              isSyncing={isPending}
            />
          )}

          {/* TAB 2: RAG SEMANTIC SIMULATOR & VECTOR SEARCH INSPECTOR */}
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

          {/* TAB 3: CONTOH & TEMPLATE SOP */}
          {activeTab === "TEMPLATES" && (
            <AiTemplatesTab onUseTemplate={handleUseTemplate} />
          )}

          {/* TAB 4: UNGGAH BERKAS SOP */}
          {activeTab === "UPLOAD" && (
            <AiUploadTab
              uploadTitle={uploadTitle}
              setUploadTitle={setUploadTitle}
              uploadCategory={uploadCategory}
              setUploadCategory={setUploadCategory}
              selectedFile={selectedFile}
              setSelectedFile={setSelectedFile}
              uploading={uploading}
              onUploadSubmit={handleUploadSubmit}
              onCancel={() => setActiveTab("KNOWLEDGE")}
            />
          )}

          {/* TAB 5: TULIS MANUAL (QUICK NOTE) */}
          {activeTab === "MANUAL" && (
            <AiManualNoteTab
              manualTitle={manualTitle}
              setManualTitle={setManualTitle}
              manualCategory={manualCategory}
              setManualCategory={setManualCategory}
              manualContent={manualContent}
              setManualContent={setManualContent}
              manualSubmitting={manualSubmitting}
              onManualSubmit={handleManualSubmit}
              onCancel={() => setActiveTab("KNOWLEDGE")}
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

        </div>
      </div>
    </GatewayPageWrapper>
  );
}
