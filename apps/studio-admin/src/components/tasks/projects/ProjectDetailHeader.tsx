import { PageHeader } from "@k2net/ui";
import { Box, ExternalLink, FileDown, Plus } from "lucide-react";
import { useTranslation } from "@k2net/i18n";
import type { Task } from "@/hooks/useTasksQuery";

interface ProjectDetailHeaderProps {
  title: string;
  projectTask: Task;
  onExportMarkdown: () => void;
  onOpenNewIssue: () => void;
}

export function ProjectDetailHeader({
  title,
  projectTask,
  onExportMarkdown,
  onOpenNewIssue,
}: ProjectDetailHeaderProps) {
  const { t } = useTranslation();

  return (
    <PageHeader
      breadcrumbs={[
        { label: t("workspace.plans_title"), href: "/workspace/plans" },
        { label: title || projectTask.title, icon: Box },
      ]}
      actions={
        <>
          {projectTask.obsidianRef && (
            <a
              href={`obsidian://open?vault=K2NET_Engineering_Vault&file=${projectTask.obsidianRef}`}
              className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground bg-muted/40 hover:bg-muted/70 px-2 py-1 rounded-md transition-colors font-mono"
            >
              <ExternalLink className="size-3" />
              <span>{projectTask.obsidianRef}</span>
            </a>
          )}
          <button
            onClick={onExportMarkdown}
            className="flex items-center gap-1.5 h-7 px-2.5 rounded-md border border-border hover:bg-muted text-foreground text-xs font-medium shadow-2xs transition-colors cursor-pointer"
            title={t("workspace.export_spec_title")}
          >
            <FileDown className="size-3.5 text-muted-foreground" />
            <span className="hidden sm:inline">{t("workspace.export_spec")}</span>
          </button>
          <button
            onClick={onOpenNewIssue}
            className="flex items-center gap-1.5 h-7 px-2.5 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="size-3" />
            <span>{t("workspace.action_new_issue")}</span>
          </button>
        </>
      }
    />
  );
}
