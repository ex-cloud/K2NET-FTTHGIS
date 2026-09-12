import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  fetchAdminAiPrompts,
  createAiPrompt,
  updateAiPrompt,
  deleteAiPrompt,
  togglePinAiPrompt,
  fetchAiTrendingTopics,
  type SuggestedPromptItem,
  type TrendingTopicItem,
} from "@/lib/actions/gateways";
import type { PromptFormData } from "./PromptFormModal";

const INITIAL_FORM_DATA: PromptFormData = {
  title: "",
  description: "",
  prompt: "",
  icon: "Zap",
  category: "GENERAL",
  target_role: "ALL",
  is_pinned: false,
  is_active: true,
};

export function useAiPromptsManagement() {
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
  const [formData, setFormData] = useState<PromptFormData>(INITIAL_FORM_DATA);

  // Delete confirm state
  const [deletePromptId, setDeletePromptId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleOpenCreateModal = () => {
    setEditingPrompt(null);
    setFormData(INITIAL_FORM_DATA);
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

  const handleTogglePin = async (item: SuggestedPromptItem) => {
    try {
      await togglePinAiPrompt(item.id);
      toast.success(
        item.is_pinned ? "Pin dilepas dari prompt" : "Prompt berhasil di-pin di urutan teratas!"
      );
      loadPrompts();
      window.dispatchEvent(new CustomEvent("k2net-prompt-pinned"));
    } catch (_err) {
      toast.error("Gagal mengubah status pin prompt.");
    }
  };

  const handleToggleActive = async (item: SuggestedPromptItem) => {
    try {
      await updateAiPrompt(item.id, { is_active: !item.is_active });
      toast.success(!item.is_active ? "Prompt diaktifkan di Drawer" : "Prompt dinonaktifkan");
      loadPrompts();
    } catch (_err) {
      toast.error("Gagal mengubah status aktif prompt.");
    }
  };

  const handleDeletePrompt = async () => {
    if (!deletePromptId) return;
    try {
      setIsDeleting(true);
      await deleteAiPrompt(deletePromptId);
      toast.success("Prompt rekomendasi berhasil dihapus.");
      setDeletePromptId(null);
      loadPrompts();
      loadTrending();
    } catch (_err) {
      toast.error("Gagal menghapus prompt.");
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    prompts,
    trending,
    totalQueriesAnalyzed,
    loading,
    trendingLoading,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    isModalOpen,
    setIsModalOpen,
    editingPrompt,
    formSubmitting,
    formData,
    setFormData,
    deletePromptId,
    setDeletePromptId,
    isDeleting,
    handleOpenCreateModal,
    handleOpenEditModal,
    handleConvertTrendingToPrompt,
    handleFormSubmit,
    handleTogglePin,
    handleToggleActive,
    handleDeletePrompt,
  };
}
