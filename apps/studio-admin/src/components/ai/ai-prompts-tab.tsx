"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  Zap, 
  MapPin, 
  Activity, 
  Database, 
  GitPullRequest, 
  ShieldCheck, 
  Flame, 
  Sparkles, 
  Cpu, 
  Layers, 
  HelpCircle,
  Plus,
  Search,
  Pin,
  PinOff,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Loader2,
  ArrowUpRight,
  Filter,
  Check,
  X
} from "lucide-react";
import { 
  Button, 
  Input, 
  Label, 
  Badge, 
  ActionTooltip 
} from "@k2net/ui";
import { toast } from "sonner";
import { 
  fetchAdminAiPrompts, 
  createAiPrompt, 
  updateAiPrompt, 
  deleteAiPrompt, 
  togglePinAiPrompt, 
  fetchAiTrendingTopics,
  SuggestedPromptItem,
  TrendingTopicItem
} from "@/lib/actions/gateways";
import { cn } from "@/lib/utils";

// ─── Available Icons Palette ────────────────────────────────────────────────
const AVAILABLE_ICONS = [
  { id: "Zap", label: "Zap (Listrik/Optik)", icon: Zap },
  { id: "MapPin", label: "MapPin (Spasial/GIS)", icon: MapPin },
  { id: "Activity", label: "Activity (Health/Metrics)", icon: Activity },
  { id: "Database", label: "Database (Storage/Backup)", icon: Database },
  { id: "GitPullRequest", label: "Git / Task (DevOps)", icon: GitPullRequest },
  { id: "ShieldCheck", label: "Shield (Security/RBAC)", icon: ShieldCheck },
  { id: "Flame", label: "Flame (Trending/Popular)", icon: Flame },
  { id: "Sparkles", label: "Sparkles (AI/Smart)", icon: Sparkles },
  { id: "Cpu", label: "Cpu (Hardware/Server)", icon: Cpu },
  { id: "Layers", label: "Layers (Arsitektur)", icon: Layers },
  { id: "HelpCircle", label: "Help (Bantuan/FAQ)", icon: HelpCircle },
];

const CATEGORIES = [
  { id: "ALL", label: "Semua Kategori" },
  { id: "OLT_TROUBLESHOOTING", label: "OLT & Redaman Optik" },
  { id: "GIS_SPATIAL", label: "GIS Spasial & ODP" },
  { id: "DEVOPS_INFRA", label: "DevOps & Infrastruktur" },
  { id: "BACKUP_RECOVERY", label: "Backup & Pemulihan" },
  { id: "RBAC_SECURITY", label: "Keamanan & Multi-Tenant" },
  { id: "GENERAL", label: "Umum / Bantuan" },
];

const ROLES = [
  { id: "ALL", label: "Semua Pengguna (Global)" },
  { id: "SUPER_ADMIN", label: "Super Admin Only" },
  { id: "TENANT_ADMIN", label: "Tenant Admin" },
  { id: "TECHNICIAN", label: "Teknisi Lapangan" },
];

export function AiPromptsTab() {
  const [prompts, setPrompts] = useState<SuggestedPromptItem[]>([]);
  const [trending, setTrending] = useState<TrendingTopicItem[]>([]);
  const [totalQueriesAnalyzed, setTotalQueriesAnalyzed] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [trendingLoading, setTrendingLoading] = useState(true);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modal Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<SuggestedPromptItem | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    prompt: "",
    icon: "Zap",
    category: "GENERAL",
    target_role: "ALL",
    is_pinned: false,
    is_active: true,
  });

  // Delete confirm state
  const [deletePromptId, setDeletePromptId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // ── Load Prompts ──────────────────────────────────────────────────────────
  const loadPrompts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchAdminAiPrompts({
        category: selectedCategory !== "ALL" ? selectedCategory : undefined,
        search: searchQuery || undefined,
        status: statusFilter !== "ALL" ? statusFilter : undefined,
      });
      if (res && res.prompts) {
        setPrompts(res.prompts);
      }
    } catch (err) {
      console.error("Gagal memuat daftar prompt:", err);
      toast.error("Gagal memuat daftar prompt rekomendasi");
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, searchQuery, statusFilter]);

  // ── Load Trending Topics ──────────────────────────────────────────────────
  const loadTrending = useCallback(async () => {
    try {
      setTrendingLoading(true);
      const res = await fetchAiTrendingTopics(7);
      if (res) {
        setTrending(res.trending || []);
        setTotalQueriesAnalyzed(res.total_queries_analyzed || 0);
      }
    } catch (err) {
      console.warn("Gagal memuat trending topics:", err);
    } finally {
      setTrendingLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPrompts();
  }, [loadPrompts]);

  useEffect(() => {
    loadTrending();
  }, [loadTrending]);

  // ── Open Modal for Create / Edit ──────────────────────────────────────────
  const handleOpenCreateModal = () => {
    setEditingPrompt(null);
    setFormData({
      title: "",
      description: "",
      prompt: "",
      icon: "Zap",
      category: "GENERAL",
      target_role: "ALL",
      is_pinned: false,
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: SuggestedPromptItem) => {
    setEditingPrompt(item);
    setFormData({
      title: item.title,
      description: item.description || "",
      prompt: item.prompt,
      icon: item.icon || "Zap",
      category: item.category || "GENERAL",
      target_role: item.target_role || "ALL",
      is_pinned: item.is_pinned,
      is_active: item.is_active,
    });
    setIsModalOpen(true);
  };

  const handleConvertTrendingToPrompt = (topic: TrendingTopicItem) => {
    setEditingPrompt(null);
    setFormData({
      title: topic.topic,
      description: `Rekomendasi otomatis berdasarkan ${topic.count} pertanyaan pengguna minggu ini.`,
      prompt: topic.sample_query,
      icon: "Flame",
      category: topic.category || "GENERAL",
      target_role: "ALL",
      is_pinned: false,
      is_active: true,
    });
    setIsModalOpen(true);
  };

  // ── Submit Create / Update ────────────────────────────────────────────────
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.prompt.trim()) {
      toast.error("Judul dan teks prompt wajib diisi.");
      return;
    }

    try {
      setFormSubmitting(true);
      if (editingPrompt) {
        await updateAiPrompt(editingPrompt.id, formData);
        toast.success("Prompt rekomendasi berhasil diperbarui!");
      } else {
        await createAiPrompt(formData);
        toast.success("Prompt rekomendasi baru berhasil ditambahkan!");
      }
      setIsModalOpen(false);
      loadPrompts();
      loadTrending();
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Gagal menyimpan prompt";
      toast.error(errMsg);
    } finally {
      setFormSubmitting(false);
    }
  };

  // ── Toggle Pin Status ─────────────────────────────────────────────────────
  const handleTogglePin = async (item: SuggestedPromptItem) => {
    try {
      await togglePinAiPrompt(item.id);
      toast.success(item.is_pinned ? "Pin dilepas dari prompt" : "Prompt berhasil di-pin di urutan teratas!");
      loadPrompts();
      // Notify FloatingAiAssistant to refresh its pinned ideas list
      window.dispatchEvent(new CustomEvent("k2net-prompt-pinned"));
    } catch (err) {
      toast.error("Gagal mengubah status pin prompt.");
    }
  };


  // ── Toggle Active Status ──────────────────────────────────────────────────
  const handleToggleActive = async (item: SuggestedPromptItem) => {
    try {
      await updateAiPrompt(item.id, { is_active: !item.is_active });
      toast.success(!item.is_active ? "Prompt diaktifkan di Drawer" : "Prompt dinonaktifkan");
      loadPrompts();
    } catch (err) {
      toast.error("Gagal mengubah status aktif prompt.");
    }
  };

  // ── Delete Prompt ─────────────────────────────────────────────────────────
  const handleDeletePrompt = async () => {
    if (!deletePromptId) return;
    try {
      setIsDeleting(true);
      await deleteAiPrompt(deletePromptId);
      toast.success("Prompt rekomendasi berhasil dihapus.");
      setDeletePromptId(null);
      loadPrompts();
      loadTrending();
    } catch (err) {
      toast.error("Gagal menghapus prompt.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Calculate KPIs
  const totalPrompts = prompts.length;
  const pinnedCount = prompts.filter((p) => p.is_pinned).length;
  const activeCount = prompts.filter((p) => p.is_active).length;

  return (
    <div className="space-y-6">
      
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* 1. KPI STATS CARDS                                                */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Prompts */}
        <div className="p-4 rounded-xl bg-card border border-border/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-foreground/75 dark:text-muted-foreground">Total Kartu Rekomendasi</p>
            <h3 className="text-2xl font-bold text-foreground mt-1">{totalPrompts}</h3>
            <p className="text-[10px] text-primary mt-0.5">{activeCount} Prompt Aktif di Drawer</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>

        {/* Pinned Prompts */}
        <div className="p-4 rounded-xl bg-card border border-border/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-foreground/75 dark:text-muted-foreground">Prompt Di-Pin (Prioritas)</p>
            <h3 className="text-2xl font-bold text-foreground mt-1">{pinnedCount}</h3>
            <p className="text-[10px] text-amber-500 mt-0.5">Tampil paling atas di Ask AI</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
            <Pin className="w-5 h-5" />
          </div>
        </div>

        {/* Total Analytics Queries */}
        <div className="p-4 rounded-xl bg-card border border-border/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-foreground/75 dark:text-muted-foreground">Analisis Query Pengguna</p>
            <h3 className="text-2xl font-bold text-foreground mt-1">
              {totalQueriesAnalyzed}
            </h3>
            <p className="text-[10px] text-primary mt-0.5">Log pertanyaan 7 hari terakhir</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
            <Activity className="w-5 h-5" />
          </div>
        </div>

        {/* Trending Topics Detected */}
        <div className="p-4 rounded-xl bg-card border border-border/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-foreground/75 dark:text-muted-foreground">Topik Populer Terdeteksi</p>
            <h3 className="text-2xl font-bold text-foreground mt-1">{trending.length}</h3>
            <p className="text-[10px] text-rose-500 mt-0.5">Trending di lapangan</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 shrink-0">
            <Flame className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* 2. REAL-TIME TRENDING TOPICS AGGREGATOR                            */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      <div className="rounded-xl border border-border/80 bg-card text-card-foreground shadow-xs overflow-hidden">
        <div className="p-4 border-b border-border/70 bg-muted/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">
                Trending Pertanyaan Pengguna (7 Hari Terakhir)
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Pertanyaan yang paling sering diajukan oleh teknisi dan operator di Ask AI.
              </p>
            </div>
          </div>
          <Badge variant="outline" className="text-[10px] font-mono border-rose-500/30 text-rose-500 bg-rose-500/10 gap-1">
            <Flame className="w-3 h-3" /> Live Telemetry
          </Badge>
        </div>

        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          {trendingLoading ? (
            <div className="col-span-3 py-6 text-center text-xs text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin mx-auto mb-1 text-primary" />
              Menganalisis frekuensi query pengguna...
            </div>
          ) : trending.length === 0 ? (
            <div className="col-span-3 py-8 text-center space-y-1.5">
              <Activity className="w-6 h-6 text-muted-foreground/40 mx-auto" />
              <p className="text-xs font-semibold text-foreground">Belum ada log pertanyaan pengguna tercatat minggu ini</p>
              <p className="text-[11px] text-muted-foreground max-w-md mx-auto">
                Topik trending akan otomatis terbentuk dan diagregasikan secara real-time dari riwayat percakapan teknisi di Ask AI Copilot.
              </p>
            </div>
          ) : (
            trending.map((topic, i) => (
              <div 
                key={i}
                className="p-3 rounded-xl bg-background border border-border hover:border-primary/40 transition-colors flex flex-col justify-between space-y-2 shadow-xs"
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <Badge variant="outline" className="text-[9px] font-mono px-1 py-0 border-border text-muted-foreground">
                      #{i + 1}
                    </Badge>
                    <span className="text-[10px] font-bold text-rose-500 flex items-center gap-1 font-mono">
                      <Flame className="w-2.5 h-2.5" /> {topic.count}x ditanyakan
                    </span>
                  </div>
                  <h4 className="text-xs font-semibold text-foreground line-clamp-1">
                    {topic.topic}
                  </h4>
                  <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5 italic">
                    &ldquo;{topic.sample_query}&rdquo;
                  </p>
                </div>

                <div className="pt-2 border-t border-border/60 flex items-center justify-between">
                  <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-border text-foreground/75 dark:text-muted-foreground">
                    {topic.category}
                  </Badge>

                  {topic.is_already_prompt ? (
                    <span className="text-[10px] text-primary flex items-center gap-1 font-medium">
                      <CheckCircle2 className="w-3 h-3" /> Sudah Ada
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleConvertTrendingToPrompt(topic)}
                      className="text-[11px] text-primary hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                    >
                      <span>+ Jadi Quick Prompt</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* 3. PROMPT MANAGEMENT TABLE & CONTROLS                              */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      <div className="rounded-xl border border-border/80 bg-card text-card-foreground shadow-xs overflow-hidden">
        
        {/* Table Toolbar */}
        <div className="p-4 border-b border-border/70 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Cari judul atau prompt..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="text-xs h-8 pl-8 font-mono bg-background border-border"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="text-xs h-8 px-2.5 rounded-lg bg-background border border-border text-foreground font-mono cursor-pointer outline-hidden"
            >
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs h-8 px-2.5 rounded-lg bg-background border border-border text-foreground font-mono cursor-pointer outline-hidden"
            >
              <option value="ALL">Semua Status</option>
              <option value="active">Hanya Aktif</option>
              <option value="pinned">Hanya Pinned</option>
              <option value="inactive">Hanya Nonaktif</option>
            </select>
          </div>

          {/* Add Prompt Button */}
          <Button
            size="sm"
            onClick={handleOpenCreateModal}
            className="text-xs gap-1.5 font-bold px-4 h-8 bg-primary text-primary-foreground cursor-pointer shrink-0 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Prompt Baru</span>
          </Button>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="text-center py-16 text-xs text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-primary" />
              Memuat master kartu rekomendasi prompt...
            </div>
          ) : prompts.length === 0 ? (
            <div className="text-center py-16 text-xs text-muted-foreground space-y-2">
              <p>Tidak ada prompt yang sesuai dengan filter pencarian.</p>
              <Button variant="outline" size="sm" onClick={handleOpenCreateModal} className="text-xs">
                Buat Prompt Pertama
              </Button>
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/70 bg-muted/20 text-foreground/75 dark:text-muted-foreground font-semibold">
                  <th className="py-3 px-4 w-12 text-center">Ikon</th>
                  <th className="py-3 px-4">Judul & Deskripsi</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4">Target Role</th>
                  <th className="py-3 px-4 text-center">Pin</th>
                  <th className="py-3 px-4 text-center">Dipakai</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 font-sans">
                {prompts.map((item) => {
                  const IconComp = AVAILABLE_ICONS.find((ic) => ic.id === item.icon)?.icon || Zap;
                  return (
                    <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                      {/* Icon */}
                      <td className="py-3 px-4 text-center">
                        <div className="w-7 h-7 mx-auto rounded-lg bg-primary/10 text-primary flex items-center justify-center shadow-xs">
                          <IconComp className="w-3.5 h-3.5" />
                        </div>
                      </td>

                      {/* Title & Description */}
                      <td className="py-3 px-4 max-w-sm">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-foreground">{item.title}</span>
                          {item.is_pinned && (
                            <Badge variant="outline" className="text-[9px] font-mono px-1 py-0 text-amber-500 border-amber-500/30 bg-amber-500/10">
                              Pinned
                            </Badge>
                          )}
                          {item.is_trending && (
                            <Badge variant="outline" className="text-[9px] font-mono px-1 py-0 text-primary border-primary/30 bg-primary/10">
                              Trending
                            </Badge>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                          {item.description || item.prompt}
                        </p>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="text-[10px] font-mono border-border text-foreground/75 dark:text-muted-foreground">
                          {item.category}
                        </Badge>
                      </td>

                      {/* Target Role */}
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="text-[10px] font-mono border-border text-foreground/75 dark:text-muted-foreground">
                          {item.target_role}
                        </Badge>
                      </td>

                      {/* Pin Toggle */}
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleTogglePin(item)}
                          className={cn(
                            "p-1.5 rounded-lg border transition-colors cursor-pointer",
                            item.is_pinned 
                              ? "bg-amber-500/15 border-amber-500/40 text-amber-500 hover:bg-amber-500/25" 
                              : "bg-background border-border text-muted-foreground hover:text-foreground"
                          )}
                          title={item.is_pinned ? "Lepas Pin" : "Pin ke Urutan Teratas"}
                        >
                          <Pin className="w-3.5 h-3.5" />
                        </button>
                      </td>

                      {/* Usage Count */}
                      <td className="py-3 px-4 text-center font-mono text-[11px]">
                        <span className="px-2 py-0.5 rounded-full bg-muted/60 text-foreground font-semibold">
                          {item.usage_count}x
                        </span>
                      </td>

                      {/* Active Status */}
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(item)}
                          className={cn(
                            "text-[10px] font-mono px-2 py-0.5 rounded-full font-bold cursor-pointer transition-colors border",
                            item.is_active 
                              ? "bg-primary/10 border-primary/30 text-primary hover:bg-primary/20" 
                              : "bg-muted border-border text-muted-foreground hover:bg-muted/80"
                          )}
                        >
                          {item.is_active ? "Aktif" : "Nonaktif"}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(item)}
                            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                            title="Edit Prompt"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletePromptId(item.id)}
                            className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                            title="Hapus Prompt"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

      </div>

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* 4. MODAL DIALOG: TAMBAH / EDIT PROMPT                              */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-card border border-border rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="p-4 border-b border-border/70 bg-muted/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-foreground">
                  {editingPrompt ? "Edit Kartu Prompt Rekomendasi" : "Tambah Prompt Rekomendasi Baru"}
                </h3>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleFormSubmit} className="p-5 space-y-4">
              
              {/* Judul Prompt */}
              <div className="space-y-1.5">
                <Label htmlFor="promptTitle" className="text-xs font-medium text-foreground">
                  Judul Kartu (Ringkas & Informatif) *
                </Label>
                <Input
                  id="promptTitle"
                  type="text"
                  required
                  maxLength={120}
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Contoh: Diagnosa Port OLT ZTE C320"
                  className="text-xs h-8 bg-background border-border"
                />
              </div>

              {/* Deskripsi Singkat */}
              <div className="space-y-1.5">
                <Label htmlFor="promptDesc" className="text-xs font-medium text-foreground">
                  Deskripsi Singkat (Muncul di bawah judul pada Drawer)
                </Label>
                <Input
                  id="promptDesc"
                  type="text"
                  maxLength={200}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Contoh: Standar redaman optik dBm dan troubleshooting LOS..."
                  className="text-xs h-8 bg-background border-border"
                />
              </div>

              {/* Teks Prompt Lengkap */}
              <div className="space-y-1.5">
                <Label htmlFor="promptText" className="text-xs font-medium text-foreground">
                  Teks Prompt Lengkap (Akan disuntikkan ke kolom chat saat kartu diklik) *
                </Label>
                <textarea
                  id="promptText"
                  required
                  rows={3}
                  value={formData.prompt}
                  onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                  placeholder="Contoh: Bagaimana cara troubleshooting OLT ZTE C320 jika port PON statusnya LOS..."
                  className="w-full text-xs p-2.5 rounded-lg bg-background border border-border text-foreground font-sans outline-hidden focus:ring-1 focus:ring-primary resize-y"
                />
              </div>

              {/* Kategori & Target Role */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="promptCategory" className="text-xs font-medium text-foreground">
                    Kategori Sistem
                  </Label>
                  <select
                    id="promptCategory"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full text-xs h-8 px-2.5 rounded-lg bg-background border border-border text-foreground font-mono cursor-pointer outline-hidden"
                  >
                    {CATEGORIES.filter((c) => c.id !== "ALL").map((c) => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="promptRole" className="text-xs font-medium text-foreground">
                    Target Hak Akses / Role
                  </Label>
                  <select
                    id="promptRole"
                    value={formData.target_role}
                    onChange={(e) => setFormData({ ...formData, target_role: e.target.value })}
                    className="w-full text-xs h-8 px-2.5 rounded-lg bg-background border border-border text-foreground font-mono cursor-pointer outline-hidden"
                  >
                    {ROLES.map((r) => (
                      <option key={r.id} value={r.id}>{r.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Pemilih Ikon Visual */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">
                  Pilih Ikon Visual Kartu
                </Label>
                <div className="grid grid-cols-6 gap-2 pt-1">
                  {AVAILABLE_ICONS.map((item) => {
                    const IconC = item.icon;
                    const isSelected = formData.icon === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, icon: item.id })}
                        className={cn(
                          "p-2 rounded-lg border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer",
                          isSelected
                            ? "bg-primary/15 border-primary text-primary shadow-xs"
                            : "bg-background border-border text-muted-foreground hover:text-foreground hover:bg-muted/40"
                        )}
                        title={item.label}
                      >
                        <IconC className="w-4 h-4" />
                        <span className="text-[9px] truncate max-w-full font-mono">{item.id}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Toggles: Pin & Active */}
              <div className="pt-2 border-t border-border/70 flex items-center justify-between gap-4">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-foreground">
                  <input
                    type="checkbox"
                    checked={formData.is_pinned}
                    onChange={(e) => setFormData({ ...formData, is_pinned: e.target.checked })}
                    className="rounded border-border text-primary focus:ring-0 cursor-pointer"
                  />
                  <span className="font-medium">Pin Kartu ke Posisi Teratas</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-foreground">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="rounded border-border text-primary focus:ring-0 cursor-pointer"
                  />
                  <span className="font-medium">Aktifkan di Ask AI Drawer</span>
                </label>
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-border/70 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                  className="text-xs cursor-pointer"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={formSubmitting}
                  className="text-xs font-bold gap-1.5 px-4 bg-primary text-primary-foreground cursor-pointer shadow-xs"
                >
                  {formSubmitting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>{editingPrompt ? "Simpan Perubahan" : "Buat Prompt"}</span>
                </Button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* 5. MODAL DIALOG: KONFIRMASI HAPUS PROMPT                           */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {deletePromptId && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-xl p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
                <AlertCircle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Hapus Prompt Rekomendasi?</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Prompt ini akan dihapus permanen dari basis data dan tidak akan lagi muncul di Ask AI Drawer pengguna.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/70">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeletePromptId(null)}
                disabled={isDeleting}
                className="text-xs cursor-pointer"
              >
                Batal
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeletePrompt}
                disabled={isDeleting}
                className="text-xs font-bold gap-1.5 cursor-pointer shadow-xs"
              >
                {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>Hapus Permanen</span>
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
