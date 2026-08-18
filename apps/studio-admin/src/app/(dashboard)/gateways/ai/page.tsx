"use client";

import { useEffect, useState, useTransition } from "react";
import { 
  Sparkles, 
  BrainCircuit, 
  Database, 
  Layers, 
  RefreshCw, 
  Plus, 
  UploadCloud, 
  FileText, 
  Trash2, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Cpu, 
  ShieldCheck, 
  FolderSync, 
  FileCode, 
  ExternalLink,
  ChevronRight,
  BookOpen,
  Save,
  Loader2,
  Eye,
  EyeOff
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@k2net/ui";
import { Button } from "@k2net/ui";
import { Input } from "@k2net/ui";
import { Label } from "@k2net/ui";
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
  AiKnowledgeStats, 
  AiDocumentItem 
} from "@/lib/actions/gateways";

const CATEGORIES = [
  { id: "ALL", label: "Semua Kategori" },
  { id: "TROUBLESHOOTING", label: "Troubleshooting OLT/Optical", color: "text-amber-400 border-amber-500/30 bg-amber-500/10" },
  { id: "NETWORK_CONFIG", label: "Arsitektur & Jaringan", color: "text-blue-400 border-blue-500/30 bg-blue-500/10" },
  { id: "GIS_MANUAL", label: "GIS & Survey Spasial", color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" },
  { id: "INFRASTRUCTURE", label: "DevOps & Server", color: "text-purple-400 border-purple-500/30 bg-purple-500/10" },
  { id: "PLANS", label: "Plans & Roadmap", color: "text-cyan-400 border-cyan-500/30 bg-cyan-500/10" },
  { id: "GENERAL", label: "General & SOP", color: "text-zinc-400 border-zinc-500/30 bg-zinc-500/10" },
];

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export default function AiGatewayPage() {
  const [activeTab, setActiveTab] = useState<"KNOWLEDGE" | "UPLOAD" | "MANUAL" | "CONFIG">("KNOWLEDGE");
  const [stats, setStats] = useState<AiKnowledgeStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Knowledge Documents state
  const [documents, setDocuments] = useState<AiDocumentItem[]>([]);
  const [docsTotal, setDocsTotal] = useState(0);
  const [docsLoading, setDocsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [isPending, startTransition] = useTransition();

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
  const [censored, setCensored] = useState<Record<string, string>>({});
  const [configLoading, setConfigLoading] = useState(false);
  const [configSaving, setConfigSaving] = useState(false);
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [showOpenaiKey, setShowOpenaiKey] = useState(false);

  // ── Load Stats & Documents ──────────────────────────────────────────────────
  const loadStats = async () => {
    try {
      setStatsLoading(true);
      const data = await getAiKnowledgeStats();
      setStats(data);
    } catch (err) {
      console.error(err);
    } finally {
      setStatsLoading(false);
    }
  };

  const loadDocuments = async () => {
    try {
      setDocsLoading(true);
      const res = await getAiDocuments({
        category: selectedCategory === "ALL" ? undefined : selectedCategory,
        search: searchQuery.trim() || undefined,
        limit: 50,
      });
      setDocuments(res.documents);
      setDocsTotal(res.total);
    } catch (err) {
      console.error(err);
    } finally {
      setDocsLoading(false);
    }
  };

  const loadConfig = async () => {
    try {
      setConfigLoading(true);
      const data = await getGatewayConfigByKey("ai");
      if (data && data.status === "ok") {
        const flat: Record<string, string> = {};
        const flatCensored: Record<string, string> = {};
        Object.values(data.sections).forEach((entries) => {
          entries.forEach((e) => {
            flat[e.key] = e.censored;
            flatCensored[e.key] = e.censored;
          });
        });
        setConfig(flat);
        setCensored(flatCensored);
      }
    } catch (err) {
      console.warn("Config load fallback:", err);
    } finally {
      setConfigLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
    loadDocuments();
  }, [selectedCategory]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadDocuments();
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle.trim() || !manualContent.trim()) {
      toast.error("Judul dan isi konten manual wajib diisi.");
      return;
    }

    try {
      setManualSubmitting(true);
      const res = await createManualAiDocument({
        title: manualTitle.trim(),
        category: manualCategory,
        content: manualContent.trim(),
      });
      toast.success(`Dokumen '${res.title}' berhasil dibuat dan sedang diindeks ke pgvector!`);
      setManualTitle("");
      setManualContent("");
      setActiveTab("KNOWLEDGE");
      loadDocuments();
      loadStats();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal membuat dokumen manual");
    } finally {
      setManualSubmitting(false);
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error("Pilih file PDF, Markdown, atau TXT terlebih dahulu.");
      return;
    }
    const finalTitle = uploadTitle.trim() || selectedFile.name;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("title", finalTitle);
      formData.append("category", uploadCategory);

      const res = await fetch("/api/v1/ai/documents", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(errJson.detail || "Gagal mengunggah file");
      }

      toast.success(`File '${finalTitle}' berhasil diunggah! Indexing pgvector berjalan di latar belakang.`);
      setSelectedFile(null);
      setUploadTitle("");
      setActiveTab("KNOWLEDGE");
      loadDocuments();
      loadStats();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengunggah berkas");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId: string, title: string) => {
    if (!confirm(`Hapus dokumen '${title}' dari memori AI Assistant? Vektor embedding akan ikut dihapus permanen.`)) {
      return;
    }

    try {
      await deleteAiDocument(docId);
      toast.success(`Dokumen '${title}' berhasil dihapus.`);
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
      loadStats();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus dokumen");
    }
  };

  const handleSyncServerDocs = () => {
    startTransition(async () => {
      try {
        const res = await triggerServerDocsSync();
        toast.success(res.message);
        setTimeout(() => {
          loadDocuments();
          loadStats();
        }, 2000);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Gagal memicu sinkronisasi server");
      }
    });
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setConfigSaving(true);
      const changes: Record<string, string> = {};
      Object.keys(config).forEach((k) => {
        if (config[k] !== censored[k]) {
          changes[k] = config[k];
        }
      });

      if (Object.keys(changes).length === 0) {
        toast.info("Tidak ada perubahan konfigurasi.");
        return;
      }

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

  return (
    <GatewayPageWrapper>
      <div className="flex-1 flex flex-col pt-16 px-4 md:px-8 bg-background h-full overflow-y-auto custom-scrollbar">
        <div className="w-full max-w-6xl mx-auto space-y-8 pb-20">
          
          {/* Header Banner */}
          <div className="flex items-center gap-4 border-b border-border pb-6">
            <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2.5">
                AI Assistant Gateway
                <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-400 bg-emerald-500/10 font-mono">
                  Port 5012
                </Badge>
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Orkestrasi pgvector RAG Knowledge Base, SOP indexing, Google Gemini/OpenAI engines, dan SSE streaming copilot.
              </p>
            </div>
          </div>
        
        {/* ── Top KPI Metrics ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-border bg-card shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-foreground/75 dark:text-muted-foreground">
                Service Engine
              </span>
              <Cpu className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                Port 5012 Active
              </div>
              <p className="text-xs text-foreground/70 dark:text-muted-foreground mt-1 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                FastAPI • pgvector 0.8.6
              </p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-foreground/75 dark:text-muted-foreground">
                Dokumen Terindeks
              </span>
              <BookOpen className="w-4 h-4 text-cyan-400" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold tracking-tight text-foreground">
                {statsLoading ? "..." : `${stats?.total_documents || 0} Berkas`}
              </div>
              <p className="text-xs text-foreground/70 dark:text-muted-foreground mt-1">
                Ukuran: {formatBytes(stats?.total_size_bytes || 0)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-foreground/75 dark:text-muted-foreground">
                Vector Chunks
              </span>
              <BrainCircuit className="w-4 h-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold tracking-tight text-foreground">
                {statsLoading ? "..." : `${stats?.total_chunks || 0} Chunks`}
              </div>
              <p className="text-xs text-foreground/70 dark:text-muted-foreground mt-1">
                HNSW Cosine • 1536 dim
              </p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-foreground/75 dark:text-muted-foreground">
                Active LLM Provider
              </span>
              <Sparkles className="w-4 h-4 text-amber-400" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold tracking-tight text-foreground">
                {stats?.llm_provider || "GEMINI"}
              </div>
              <p className="text-xs text-foreground/70 dark:text-muted-foreground mt-1 truncate">
                {stats?.chat_model || "gemini-1.5-flash"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* ── Navigation Tabs ───────────────────────────────────────────────── */}
        <div className="flex items-center justify-between border-b border-border pb-3 flex-wrap gap-3">
          <div className="flex items-center gap-1.5 bg-muted/60 p-1 rounded-lg border border-border">
            <Button
              variant={activeTab === "KNOWLEDGE" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("KNOWLEDGE")}
              className="text-xs font-medium gap-1.5"
            >
              <Layers className="w-3.5 h-3.5" />
              Daftar Pengetahuan ({docsTotal})
            </Button>
            <Button
              variant={activeTab === "UPLOAD" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("UPLOAD")}
              className="text-xs font-medium gap-1.5"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              Unggah Berkas SOP
            </Button>
            <Button
              variant={activeTab === "MANUAL" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("MANUAL")}
              className="text-xs font-medium gap-1.5"
            >
              <FileCode className="w-3.5 h-3.5" />
              Tulis Manual (Quick Note)
            </Button>
            <Button
              variant={activeTab === "CONFIG" ? "default" : "ghost"}
              size="sm"
              onClick={() => {
                setActiveTab("CONFIG");
                loadConfig();
              }}
              className="text-xs font-medium gap-1.5"
            >
              <Cpu className="w-3.5 h-3.5" />
              Engine Config
            </Button>
          </div>

          {activeTab === "KNOWLEDGE" && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSyncServerDocs}
                disabled={isPending}
                className="text-xs gap-1.5 border-primary/40 hover:bg-primary/10 text-primary font-medium"
              >
                <FolderSync className={`w-3.5 h-3.5 ${isPending ? "animate-spin" : ""}`} />
                {isPending ? "Menyinkronkan Server..." : "Sinkronkan Folder Server Docs"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  loadDocuments();
                  loadStats();
                }}
                className="text-xs gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${docsLoading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          )}
        </div>

        {/* ── TAB 1: KNOWLEDGE LIST ─────────────────────────────────────────── */}
        {activeTab === "KNOWLEDGE" && (
          <div className="space-y-4">
            {/* Search & Category Filter */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 custom-scrollbar">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap transition-all border ${
                      selectedCategory === cat.id
                        ? "bg-primary text-primary-foreground border-primary font-medium shadow-xs"
                        : "bg-muted/40 hover:bg-muted text-muted-foreground border-border/60"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-72">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Cari judul dokumen..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="text-xs pl-8 pr-4 h-9 bg-card border-border"
                />
              </form>
            </div>

            {/* Table */}
            <Card className="border-border bg-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/50 border-b border-border text-foreground/75 dark:text-muted-foreground uppercase text-[10px] font-semibold tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Judul Pengetahuan</th>
                      <th className="py-3 px-4">Kategori</th>
                      <th className="py-3 px-4">Ukuran</th>
                      <th className="py-3 px-4">Vector Chunks</th>
                      <th className="py-3 px-4">Status Indeks</th>
                      <th className="py-3 px-4">Tanggal Diperbarui</th>
                      <th className="py-3 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {docsLoading ? (
                      <tr>
                        <td colSpan={7} className="text-center py-12 text-muted-foreground">
                          <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-primary" />
                          Memuat data knowledge base...
                        </td>
                      </tr>
                    ) : documents.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-12 text-muted-foreground">
                          <BookOpen className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
                          Belum ada dokumen terindeks pada kategori ini.
                          <div className="mt-3 flex justify-center gap-2">
                            <Button size="sm" variant="outline" onClick={() => setActiveTab("UPLOAD")}>
                              <UploadCloud className="w-3.5 h-3.5 mr-1.5" /> Unggah Berkas
                            </Button>
                            <Button size="sm" variant="outline" onClick={handleSyncServerDocs}>
                              <FolderSync className="w-3.5 h-3.5 mr-1.5" /> Sinkronkan Server Docs
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      documents.map((doc) => {
                        const catMeta = CATEGORIES.find((c) => c.id === doc.category);
                        return (
                          <tr key={doc.id} className="hover:bg-muted/30 transition-colors group">
                            <td className="py-3 px-4 font-medium text-foreground">
                              <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-primary shrink-0" />
                                <div>
                                  <div className="font-semibold text-foreground">{doc.title}</div>
                                  {doc.file_name && (
                                    <div className="text-[10px] text-muted-foreground font-mono truncate max-w-[220px]">
                                      {doc.file_name}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${catMeta?.color || "text-zinc-400 border-zinc-500/30 bg-zinc-500/10"}`}>
                                {catMeta?.label || doc.category}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-muted-foreground font-mono">
                              {formatBytes(doc.file_size_bytes)}
                            </td>
                            <td className="py-3 px-4">
                              <Badge variant="secondary" className="text-[10px] font-mono">
                                {doc.chunk_count} chunk
                              </Badge>
                            </td>
                            <td className="py-3 px-4">
                              {doc.status === "INDEXED" && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Terindeks
                                </span>
                              )}
                              {doc.status === "PROCESSING" && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-400">
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Memproses...
                                </span>
                              )}
                              {doc.status === "PENDING" && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-400">
                                  <Clock className="w-3.5 h-3.5" /> Antrean
                                </span>
                              )}
                              {doc.status === "FAILED" && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-400" title={doc.error_message || ""}>
                                  <AlertCircle className="w-3.5 h-3.5" /> Gagal
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-muted-foreground">
                              {new Date(doc.updated_at || doc.created_at).toLocaleDateString("id-ID", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(doc.id, doc.title)}
                                className="h-7 w-7 p-0 text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 rounded-md"
                                title="Hapus dari memori AI"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* ── TAB 2: UPLOAD FILE ────────────────────────────────────────────── */}
        {activeTab === "UPLOAD" && (
          <Card className="border-border bg-card max-w-2xl mx-auto shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-primary" />
                Unggah Berkas Pengetahuan SOP / Manual
              </CardTitle>
              <CardDescription className="text-xs">
                Format didukung: PDF, Markdown (.md), atau Plain Text (.txt). Maksimal 20 MB.
                Sistem otomatis memecah file menjadi token chunks dan menyimpan embedding ke pgvector.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleFileUpload} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="uploadTitle" className="text-xs">Judul Dokumen (Opsional, default sesuai nama file)</Label>
                  <Input
                    id="uploadTitle"
                    placeholder="Contoh: SOP Penanganan Alarm LOS ZTE C320"
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    className="text-xs h-9"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="uploadCategory" className="text-xs">Kategori Pengetahuan</Label>
                  <select
                    id="uploadCategory"
                    value={uploadCategory}
                    onChange={(e) => setUploadCategory(e.target.value)}
                    className="w-full text-xs h-9 px-3 rounded-md bg-background border border-border text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
                  >
                    {CATEGORIES.filter((c) => c.id !== "ALL").map((c) => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Pilih Berkas</Label>
                  <div className="border-2 border-dashed border-border/80 hover:border-primary/60 rounded-lg p-6 text-center transition-colors bg-muted/20">
                    <input
                      type="file"
                      id="fileInput"
                      accept=".pdf,.md,.txt"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                    <label htmlFor="fileInput" className="cursor-pointer flex flex-col items-center">
                      <UploadCloud className="w-8 h-8 text-primary mb-2 animate-bounce" />
                      {selectedFile ? (
                        <div className="text-xs font-semibold text-foreground">
                          {selectedFile.name} ({formatBytes(selectedFile.size)})
                        </div>
                      ) : (
                        <>
                          <span className="text-xs font-medium text-foreground">
                            Klik untuk memilih berkas atau geser file ke sini
                          </span>
                          <span className="text-[10px] text-muted-foreground mt-1">
                            PDF, MD, atau TXT hingga 20 MB
                          </span>
                        </>
                      )}
                    </label>
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setActiveTab("KNOWLEDGE")}>
                    Batal
                  </Button>
                  <Button type="submit" size="sm" disabled={uploading || !selectedFile} className="gap-1.5">
                    {uploading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    {uploading ? "Mengunggah & Mengindeks..." : "Unggah & Simpan ke Memori"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* ── TAB 3: MANUAL NOTE ENTRY ──────────────────────────────────────── */}
        {activeTab === "MANUAL" && (
          <Card className="border-border bg-card max-w-3xl mx-auto shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <FileCode className="w-4 h-4 text-primary" />
                Tulis Catatan Teknis / SOP Manual
              </CardTitle>
              <CardDescription className="text-xs">
                Tulis langsung pedoman lapangan, catatan konfigurasi, atau aturan teknis.
                Mendukung format Markdown untuk tabel, bullet points, dan blok kode.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleManualSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1.5 md:col-span-2">
                    <Label htmlFor="manualTitle" className="text-xs">Judul SOP / Catatan Teknis</Label>
                    <Input
                      id="manualTitle"
                      placeholder="Contoh: Standar Redaman GPON Splitter 1:64"
                      value={manualTitle}
                      onChange={(e) => setManualTitle(e.target.value)}
                      required
                      className="text-xs h-9"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="manualCategory" className="text-xs">Kategori</Label>
                    <select
                      id="manualCategory"
                      value={manualCategory}
                      onChange={(e) => setManualCategory(e.target.value)}
                      className="w-full text-xs h-9 px-3 rounded-md bg-background border border-border text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
                    >
                      {CATEGORIES.filter((c) => c.id !== "ALL").map((c) => (
                        <option key={c.id} value={c.id}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="manualContent" className="text-xs">Konten Markdown</Label>
                  <textarea
                    id="manualContent"
                    rows={12}
                    placeholder={`# Standar Redaman GPON 1:64\n\n- Batas minimum: -27 dBm\n- Batas ideal: -15 s/d -22 dBm\n- Batas saturasi receiver: -8 dBm\n\n## Perhitungan Splitter:\nSplitter 1:64 = redaman nominal ~20.5 dB.`}
                    value={manualContent}
                    onChange={(e) => setManualContent(e.target.value)}
                    required
                    className="w-full p-3 text-xs font-mono rounded-md bg-background border border-border text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary custom-scrollbar leading-relaxed"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setActiveTab("KNOWLEDGE")}>
                    Batal
                  </Button>
                  <Button type="submit" size="sm" disabled={manualSubmitting} className="gap-1.5">
                    {manualSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    {manualSubmitting ? "Menyimpan & Menghitung Embedding..." : "Simpan Pengetahuan"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* ── TAB 4: CONFIGURATION ──────────────────────────────────────────── */}
        {activeTab === "CONFIG" && (
          <Card className="border-border bg-card max-w-2xl mx-auto shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Cpu className="w-4 h-4 text-primary" />
                Konfigurasi AI Engine & Provider LLM
              </CardTitle>
              <CardDescription className="text-xs">
                Kelola API Keys dan engine default untuk AI Assistant Gateway.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {configLoading ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-primary" />
                  Memuat konfigurasi engine...
                </div>
              ) : (
                <form onSubmit={handleSaveConfig} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="provider" className="text-xs">Default LLM Provider</Label>
                    <select
                      id="provider"
                      value={config["DEFAULT_LLM_PROVIDER"] || "gemini"}
                      onChange={(e) => setConfig({ ...config, DEFAULT_LLM_PROVIDER: e.target.value })}
                      className="w-full text-xs h-9 px-3 rounded-md bg-background border border-border text-foreground"
                    >
                      <option value="gemini">Google Gemini (Gemini 1.5 Flash / Pro)</option>
                      <option value="openai">OpenAI (GPT-4o / GPT-4o-mini)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="geminiKey" className="text-xs">Google Gemini API Key</Label>
                    <div className="relative">
                      <Input
                        id="geminiKey"
                        type={showGeminiKey ? "text" : "password"}
                        value={config["GEMINI_API_KEY"] || ""}
                        onChange={(e) => setConfig({ ...config, GEMINI_API_KEY: e.target.value })}
                        placeholder="AIzaSy..."
                        className="text-xs h-9 pr-9 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowGeminiKey(!showGeminiKey)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showGeminiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="openaiKey" className="text-xs">OpenAI API Key</Label>
                    <div className="relative">
                      <Input
                        id="openaiKey"
                        type={showOpenaiKey ? "text" : "password"}
                        value={config["OPENAI_API_KEY"] || ""}
                        onChange={(e) => setConfig({ ...config, OPENAI_API_KEY: e.target.value })}
                        placeholder="sk-proj-..."
                        className="text-xs h-9 pr-9 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowOpenaiKey(!showOpenaiKey)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showOpenaiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <Button type="submit" size="sm" disabled={configSaving} className="gap-1.5">
                      {configSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      <Save className="w-3.5 h-3.5" />
                      {configSaving ? "Menyimpan..." : "Simpan Konfigurasi"}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        )}

        </div>
      </div>
    </GatewayPageWrapper>
  );
}
