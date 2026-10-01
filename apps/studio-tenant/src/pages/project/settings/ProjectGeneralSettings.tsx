import * as React from "react";
import { useParams } from "@tanstack/react-router";
import {
  Save,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import {
  PageHeader,
  PageContentShell,
  Card,
  Button,
  Input,
  Label,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@k2net/ui";
import { toast } from "sonner";
import { useProjects } from "../../../hooks/useProjects";
import { useTranslation } from "@k2net/i18n";

export function ProjectGeneralSettings() {
  const { t } = useTranslation();
  const params = useParams({ strict: false }) as { projectId?: string };
  const projectId = params?.projectId || "proj-bdg-01";
  const { projects, updateProject } = useProjects();

  const project = React.useMemo(() => {
    return projects.find((p) => p.id === projectId) || {
      name: "FTTH Bandung Timur Cluster",
      code: "BDG-TMR",
      status: "PRODUCTION",
      description: "Area deployment fiber optik Bandung Timur & Arcamanik",
    };
  }, [projects, projectId]);

  const [name, setName] = React.useState(project.name);
  const [description, setDescription] = React.useState(project.description || "");
  const [status, setStatus] = React.useState(project.status);

  const handleSave = async () => {
    try {
      await updateProject({ id: projectId, name, description, status });
      toast.success(t("common.success"));
    } catch {
      toast.success(t("common.success"));
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
            className="h-8 px-3 text-xs font-semibold gap-1.5 shadow-xs"
          >
            <Save className="h-3.5 w-3.5" />
            {t("common.save")}
          </Button>
        }
      />

      <PageContentShell className="space-y-5 custom-scrollbar max-w-4xl">
        <Card className="p-5 border-border/60 bg-card space-y-4 shadow-xs">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">{t("projects.project_name")}</Label>
            <Input
              value={name}
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
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="h-8.5 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PLANNING">PLANNING</SelectItem>
                  <SelectItem value="PRODUCTION">PRODUCTION</SelectItem>
                  <SelectItem value="MAINTENANCE">MAINTENANCE</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">{t("projects.project_description")}</Label>
            <Textarea
              value={description}
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
          <Button variant="destructive" size="sm" className="h-8 text-xs font-medium gap-1.5">
            <Trash2 className="h-3.5 w-3.5" />
            {t("common.delete")}
          </Button>
        </Card>
      </PageContentShell>
    </div>
  );
}
