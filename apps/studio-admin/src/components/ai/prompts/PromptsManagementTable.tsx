import React from "react";
import { Search, Plus, Loader2 } from "lucide-react";
import { Button, Input } from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import type { SuggestedPromptItem } from "@/lib/actions/gateways";
import { PROMPT_CATEGORIES } from "./types";
import { PromptRowItem } from "./PromptRowItem";

interface PromptsManagementTableProps {
  prompts: SuggestedPromptItem[];
  loading: boolean;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedCategory: string;
  setSelectedCategory: (c: string) => void;
  statusFilter: string;
  setStatusFilter: (s: string) => void;
  onOpenCreateModal: () => void;
  onOpenEditModal: (item: SuggestedPromptItem) => void;
  onTogglePin: (item: SuggestedPromptItem) => void;
  onToggleActive: (item: SuggestedPromptItem) => void;
  onDeletePromptId: (id: string) => void;
}

export function PromptsManagementTable({
  prompts,
  loading,
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  statusFilter,
  setStatusFilter,
  onOpenCreateModal,
  onOpenEditModal,
  onTogglePin,
  onToggleActive,
  onDeletePromptId,
}: PromptsManagementTableProps) {
  const { t } = useTranslation();

  return (
    <div className="rounded-xl border border-border/80 bg-card text-card-foreground shadow-xs overflow-hidden">
      {/* Table Toolbar */}
      <div className="p-4 border-b border-border/70 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder={t("ai.search_doc_placeholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-xs h-8 pl-8 font-mono bg-background border-border"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs h-8 px-2.5 rounded-md bg-background border border-border text-foreground font-mono cursor-pointer outline-hidden"
          >
            {PROMPT_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs h-8 px-2.5 rounded-md bg-background border border-border text-foreground font-mono cursor-pointer outline-hidden"
          >
            <option value="ALL">{t("common.all")}</option>
            <option value="active">{t("common.active")}</option>
            <option value="pinned">Pinned</option>
            <option value="inactive">{t("common.inactive")}</option>
          </select>
        </div>

        <Button
          size="sm"
          onClick={onOpenCreateModal}
          className="text-xs gap-1.5 font-medium px-4 h-8 bg-primary text-primary-foreground cursor-pointer shrink-0 shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{t("ai.create_prompt")}</span>
        </Button>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="text-center py-16 text-xs text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-primary" />
            {t("common.loading")}
          </div>
        ) : prompts.length === 0 ? (
          <div className="text-center py-16 text-xs text-muted-foreground space-y-2">
            <p>{t("common.no_results")}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenCreateModal}
              className="text-xs"
            >
              {t("ai.create_prompt")}
            </Button>
          </div>
        ) : (
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border/70 bg-muted/20 text-foreground/75 dark:text-muted-foreground font-semibold">
                <th className="py-3 px-4 w-12 text-center">Ikon</th>
                <th className="py-3 px-4">{t("ai.doc_title")}</th>
                <th className="py-3 px-4">{t("ai.prompt_category")}</th>
                <th className="py-3 px-4">{t("ai.doc_scope")}</th>
                <th className="py-3 px-4 text-center">Pin</th>
                <th className="py-3 px-4 text-center">{t("ai.prompt_clicks")}</th>
                <th className="py-3 px-4 text-center">{t("common.status")}</th>
                <th className="py-3 px-4 text-right">{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 font-sans">
              {prompts.map((item) => (
                <PromptRowItem
                  key={item.id}
                  item={item}
                  onTogglePin={onTogglePin}
                  onToggleActive={onToggleActive}
                  onOpenEditModal={onOpenEditModal}
                  onDeletePromptId={onDeletePromptId}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
