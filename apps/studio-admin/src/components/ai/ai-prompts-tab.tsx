import React from "react";
import { useAiPromptsManagement } from "./prompts/useAiPromptsManagement";
import { PromptsKpiCards } from "./prompts/PromptsKpiCards";
import { TrendingTopicsSection } from "./prompts/TrendingTopicsSection";
import { PromptsManagementTable } from "./prompts/PromptsManagementTable";
import { PromptFormModal } from "./prompts/PromptFormModal";
import { PromptDeleteModal } from "./prompts/PromptDeleteModal";

export function AiPromptsTab() {
  const {
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
  } = useAiPromptsManagement();

  const totalPrompts = prompts.length;
  const pinnedCount = prompts.filter((p) => p.is_pinned).length;
  const activeCount = prompts.filter((p) => p.is_active).length;

  return (
    <div className="space-y-6">
      <PromptsKpiCards
        totalPrompts={totalPrompts}
        activeCount={activeCount}
        pinnedCount={pinnedCount}
        totalQueriesAnalyzed={totalQueriesAnalyzed}
        trendingCount={trending.length}
      />

      <TrendingTopicsSection
        trending={trending}
        trendingLoading={trendingLoading}
        onConvertTrendingToPrompt={handleConvertTrendingToPrompt}
      />

      <PromptsManagementTable
        prompts={prompts}
        loading={loading}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        onOpenCreateModal={handleOpenCreateModal}
        onOpenEditModal={handleOpenEditModal}
        onTogglePin={handleTogglePin}
        onToggleActive={handleToggleActive}
        onDeletePromptId={setDeletePromptId}
      />

      <PromptFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingPrompt={editingPrompt}
        formData={formData}
        setFormData={setFormData}
        formSubmitting={formSubmitting}
        onSubmit={handleFormSubmit}
      />

      <PromptDeleteModal
        deletePromptId={deletePromptId}
        onClose={() => setDeletePromptId(null)}
        isDeleting={isDeleting}
        onConfirmDelete={handleDeletePrompt}
      />
    </div>
  );
}
