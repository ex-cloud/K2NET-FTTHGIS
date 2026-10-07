import * as React from "react";
import { useParams } from "@tanstack/react-router";
import {
  Save,
  Trash2,
  AlertTriangle,
  Archive,
  RotateCcw,
} from "lucide-react";
import {
  PageHeader,
  PageContentShell,
  Card,
  Button,
  Input,
  Label,
  Textarea,
} from "@k2net/ui";
import { toast } from "sonner";
import { useProjects } from "../../../hooks/useProjects";
import { useTranslation } from "@k2net/i18n";

export function ProjectGeneralSettings() {
  const { t } = useTranslation();
  const params = useParams({ strict: false }) as { projectId?: string };
  const projectId = params?.projectId || "proj-bdg-01";
  const { projects, updateProject, archiveProject, unarchiveProject, deleteProject } = useProjects();

  const project = React.useMemo(() => {
    return projects.find((p) => p.id === projectId) || {
      name: "FTTH Bandung Timur Cluster",
      code: "BDG-TMR",
      status: "ACTIVE" as const,
      description: "Area deployment fiber optik Bandung Timur & Arcamanik",
    };
  }, [projects, projectId]);

  const [name, setName] = React.useState(project.name);
  const [description, setDescription] = React.useState(project.description || "");
  const isArchived = project.status === "ARCHIVED";

  React.useEffect(() => {
    setName(project.name);
    setDescription(project.description || "");
  }, [project]);

  const handleSave = async () => {
    try {
      await updateProject({ id: projectId, name, description });
      toast.success(t("common.success"));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("common.error");
      toast.error(msg);
    }
  };

  const handleToggleArchive = async () => {
    try {
      if (isArchived) {
        await unarchiveProject(projectId);
        toast.success(t("projects.restore_success"));
      } else {
        await archiveProject(projectId);
        toast.success(t("projects.archive_success"));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("common.error");
      toast.error(msg);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <PageHeader
        breadcrumbs={[
          { label: t("nav.projects"), href: "/projects" },
          { label: t("nav.settings"), href: `/project/${projectId}/settings/general` },
          { label: t("projects.general_settings_title") },
        ]}
        title={t("projects.general_settings_title")}
        actions={
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isArchived}
            className="h-8 px-3 text-xs font-semibold gap-1.5 shadow-xs"
          >
            <Save className="h-3.5 w-3.5" />
            {t("common.save")}
          </Button>
        }
      />

      <PageContentShell className="space-y-5 custom-scrollbar max-w-4xl">
        {isArchived && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-600 dark:text-amber-400 flex items-center justify-between">
            <span>{t("projects.archived_read_only_hint")}</span>
            <Button
              size="xs"
              variant="outline"
              onClick={handleToggleArchive}
              className="h-6 text-xs gap-1 font-medium bg-card"
            >
              <RotateCcw className="size-3" />
              {t("projects.restore_project")}
            </Button>
          </div>
        )}

        <Card className="p-5 border-border/60 bg-card space-y-4 shadow-xs">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">{t("projects.project_name")}</Label>
            <Input
              value={name}
              disabled={isArchived}
              onChange={(e) => setName(e.target.value)}
              className="h-8.5 text-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">{t("projects.project_code")}</Label>
              <Input
                defaultValue={project.code}
                disabled
                className="h-8.5 text-xs font-mono bg-muted/40"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">{t("projects.project_status")}</Label>
              <div className="flex items-center h-8.5 px-3 rounded-md border border-border/60 bg-muted/30">
                <span
                  className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${
                    isArchived
                      ? "bg-muted text-muted-foreground border-border/80"
                      : "bg-primary/10 text-primary border-primary/20"
                  }`}
                >
                  {isArchived ? t("projects.status_archived") : t("projects.status_active")}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">{t("projects.project_description")}</Label>
            <Textarea
              value={description}
              disabled={isArchived}
              onChange={(e) => setDescription(e.target.value)}
              className="text-xs min-h-[70px] resize-none"
            />
          </div>
        </Card>

        {/* Danger Zone */}
        <Card className="p-5 border-destructive/40 bg-destructive/5 space-y-3 shadow-xs">
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-4 w-4" />
            <h4 className="text-xs font-bold uppercase tracking-wider">{t("projects.danger_zone")}</h4>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {t("projects.delete_project_warning")}
          </p>
          <div className="flex items-center gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleArchive}
              className="h-8 text-xs font-medium gap-1.5 bg-card hover:bg-accent cursor-pointer"
            >
              {isArchived ? (
                <>
                  <RotateCcw className="h-3.5 w-3.5 text-primary" />
                  <span>{t("projects.restore_project")}</span>
                </>
              ) : (
                <>
                  <Archive className="h-3.5 w-3.5 text-amber-500" />
                  <span>{t("projects.archive_project")}</span>
                </>
              )}
            </Button>

            <Button
              variant="destructive"
              size="sm"
              onClick={() => deleteProject(projectId)}
              className="h-8 text-xs font-medium gap-1.5 cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {t("common.delete")}
            </Button>
          </div>
        </Card>
      </PageContentShell>
    </div>
  );
}
