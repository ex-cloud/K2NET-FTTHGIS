import { Link } from "@tanstack/react-router";
import {
  Map,
  MoreVertical,
  Download,
  Copy,
  Settings,
  Trash2,
  Activity,
  Archive,
  RotateCcw,
} from "lucide-react";
import {
  Button,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  cn,
} from "@k2net/ui";
import { type Project } from "../../hooks/useProjects";
import { useTranslation } from "@k2net/i18n";
import { usePermissions } from "../../hooks/use-permissions";
import { handleExportSpatial, handleDuplicateStructure } from "./project-utils";

export interface ProjectActionMenuProps {
  project: Project;
  onDeleteProject?: (id: string) => void;
  onArchiveProject?: (id: string) => void;
  onUnarchiveProject?: (id: string) => void;
  compact?: boolean;
}

export function ProjectActionMenu({
  project,
  onDeleteProject,
  onArchiveProject,
  onUnarchiveProject,
  compact = false,
}: ProjectActionMenuProps) {
  const { t } = useTranslation();
  const { canAccess } = usePermissions();
  const isArchived = project.status === "ARCHIVED";
  const canExport = canAccess("projects.export");
  const canCreate = canAccess("projects.create");
  const canEdit = canAccess("projects.edit");
  const canArchive = canAccess("projects.archive");
  const canDelete = canAccess("projects.delete");
  const hasSecondaryActions = canArchive || canEdit || canDelete;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={compact ? "icon-xs" : "icon-sm"}
          className={cn(
            "text-muted-foreground hover:text-foreground cursor-pointer",
            compact ? "h-6 w-6" : "h-7 w-7"
          )}
        >
          <MoreVertical className={compact ? "size-3" : "size-3.5"} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 text-xs">
        <DropdownMenuItem asChild>
          <Link to="/project/$projectId/overview" params={{ projectId: project.id }}>
            <Activity className="size-3.5 mr-2" />
            {t("projects.open_summary")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link
            to="/project/$projectId/infrastructure/topology"
            params={{ projectId: project.id }}
          >
            <Map className="size-3.5 mr-2" />
            {t("projects.open_gis_map")}
          </Link>
        </DropdownMenuItem>
        {canExport && (
          <DropdownMenuItem onClick={() => handleExportSpatial(project, t("projects.import_success"))}>
            <Download className="size-3.5 mr-2" />
            {t("projects.export_spatial_data")}
          </DropdownMenuItem>
        )}
        {canCreate && (
          <DropdownMenuItem onClick={() => handleDuplicateStructure(project, t("common.copied_to_clipboard"))}>
            <Copy className="size-3.5 mr-2" />
            {t("projects.duplicate_project")}
          </DropdownMenuItem>
        )}

        {hasSecondaryActions && <DropdownMenuSeparator />}

        {canArchive &&
          (isArchived ? (
            onUnarchiveProject && (
              <DropdownMenuItem
                onClick={() => onUnarchiveProject(project.id)}
                className="cursor-pointer text-primary focus:bg-primary/10"
              >
                <RotateCcw className="size-3.5 mr-2" />
                {t("projects.restore_project")}
              </DropdownMenuItem>
            )
          ) : (
            onArchiveProject && (
              <DropdownMenuItem
                onClick={() => onArchiveProject(project.id)}
                className="cursor-pointer text-amber-600 dark:text-amber-400 focus:bg-amber-500/10"
              >
                <Archive className="size-3.5 mr-2" />
                {t("projects.archive_project")}
              </DropdownMenuItem>
            )
          ))}

        {canEdit && (
          <DropdownMenuItem asChild>
            <Link
              to="/project/$projectId/settings/general"
              params={{ projectId: project.id }}
            >
              <Settings className="size-3.5 mr-2" />
              {t("projects.project_settings")}
            </Link>
          </DropdownMenuItem>
        )}
        {canDelete && onDeleteProject && (
          <DropdownMenuItem
            onClick={() => onDeleteProject(project.id)}
            className="text-destructive focus:bg-destructive/10 cursor-pointer"
          >
            <Trash2 className="size-3.5 mr-2" />
            {t("projects.delete_project")}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
