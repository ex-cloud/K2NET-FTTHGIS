import * as React from "react";
import { PageHero, Button, PageLayout } from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import { MessageSquare, RefreshCcw } from "lucide-react";
import {
  useMessageTemplates,
  useDeleteMessageTemplate,
  type MessageTemplate,
} from "@/hooks/useMessageTemplates";
import { TemplateKpiCards } from "@/components/templates/TemplateKpiCards";
import { MessageTemplatesTable } from "@/components/templates/MessageTemplatesTable";
import { EditMessageTemplateModal } from "@/components/templates/EditMessageTemplateModal";
import { PreviewTemplateModal } from "@/components/templates/PreviewTemplateModal";
import { DeleteTemplateConfirmDialog } from "@/components/templates/DeleteTemplateConfirmDialog";

export default function MessageTemplatesPage() {
  const { t } = useTranslation();
  const { data: templates = [], isLoading, refetch, isFetching } = useMessageTemplates();
  const deleteMutation = useDeleteMessageTemplate();

  const [selectedTemplate, setSelectedTemplate] = React.useState<MessageTemplate | null>(null);
  const [editModalOpen, setEditModalOpen] = React.useState<boolean>(false);
  const [previewModalOpen, setPreviewModalOpen] = React.useState<boolean>(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState<boolean>(false);

  const handleCreateNew = () => {
    setSelectedTemplate(null);
    setEditModalOpen(true);
  };

  const handleEdit = (tpl: MessageTemplate) => {
    setSelectedTemplate(tpl);
    setEditModalOpen(true);
  };

  const handlePreview = (tpl: MessageTemplate) => {
    setSelectedTemplate(tpl);
    setPreviewModalOpen(true);
  };

  const handleDeletePrompt = (tpl: MessageTemplate) => {
    setSelectedTemplate(tpl);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async (id: string) => {
    await deleteMutation.mutateAsync(id);
  };

  return (
    <PageLayout variant="workspace" spaceY="space-y-6">
      {/* Page Hero Header */}
      <PageHero
        bordered={false}
        className="pb-0"
        eyebrow="CATALOG"
        title={t("nav.message_templates")}
        icon={MessageSquare}
        subtitle={t("billing.templates_subtitle")}
        meta={
          <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm text-muted-foreground/90 font-medium">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-foreground font-mono">{templates.length}</span>
              <span>{t("billing.templates_kpi_total")}</span>
            </div>
            <span className="text-muted-foreground/30 px-1">/</span>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-foreground font-mono">
                {templates.filter((tpl) => tpl.active).length}
              </span>
              <span>{t("billing.templates_kpi_active")}</span>
            </div>
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="gap-1.5 text-xs font-medium"
            >
              <RefreshCcw className={`size-3.5 ${isFetching ? "animate-spin" : ""}`} />
              <span>{t("common.refresh")}</span>
            </Button>
          </div>
        }
      />

      {/* Main Content Area */}
      <TemplateKpiCards templates={templates} loading={isLoading} />

      <MessageTemplatesTable
        templates={templates}
        loading={isLoading}
        onPreview={handlePreview}
        onEdit={handleEdit}
        onDelete={handleDeletePrompt}
        onCreateNew={handleCreateNew}
      />

      {/* Modals & Dialogs */}
      <EditMessageTemplateModal
        template={selectedTemplate}
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        onSuccess={() => refetch()}
      />

      <PreviewTemplateModal
        template={selectedTemplate}
        open={previewModalOpen}
        onOpenChange={setPreviewModalOpen}
      />

      <DeleteTemplateConfirmDialog
        template={selectedTemplate}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        isSubmitting={deleteMutation.isPending}
      />
    </PageLayout>
  );
}
