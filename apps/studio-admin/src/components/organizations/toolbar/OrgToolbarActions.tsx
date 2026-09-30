import * as React from "react";
import {
  RefreshCw,
  LayoutGrid,
  List as ListIcon,
  Table as TableIcon,
  Plus,
  Layers,
  Upload,
} from "lucide-react";
import { Button, ActionTooltip } from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/hooks/use-permissions";

interface OrgToolbarActionsProps {
  viewMode: "grid" | "list" | "table";
  setViewMode: (v: "grid" | "list" | "table") => void;
  compactView: boolean;
  setCompactView: (v: boolean | ((prev: boolean) => boolean)) => void;
  loading: boolean;
  onRefresh: () => void;
  onNewOrganization: () => void;
  onImportBackup?: () => void;
}

export function OrgToolbarActions({
  viewMode,
  setViewMode,
  compactView,
  setCompactView,
  loading,
  onRefresh,
  onNewOrganization,
  onImportBackup,
}: OrgToolbarActionsProps) {
  const { t } = useTranslation();
  const { canAccess } = usePermissions();
  const canCreateOrg = canAccess(["system.organizations.create", "system.tenants.create"]);

  return (
    <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end">
      {/* Toggle KPI Strip */}
      <ActionTooltip
        label={compactView ? t("organizations.show_metric_strip") : t("organizations.hide_metric_strip")}
        shortcut="Alt+V"
      >
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCompactView((prev) => !prev)}
          className={cn(
            "border-border/80 bg-card hover:bg-accent text-muted-foreground",
            compactView && "text-primary border-primary/40 bg-primary/5"
          )}
        >
          <Layers className="size-3.5" />
        </Button>
      </ActionTooltip>

      {/* View Switcher: Grid, List, Table */}
      <div className="flex items-center rounded-md border border-border/80 bg-card p-0.5">
        <ActionTooltip label={t("organizations.grid_view")} shortcut="1">
          <button
            onClick={() => setViewMode("grid")}
            className={cn(
              "p-1 rounded-sm text-muted-foreground hover:text-foreground transition-all cursor-pointer",
              viewMode === "grid" && "bg-secondary text-foreground shadow-xs"
            )}
          >
            <LayoutGrid className="size-3.5" />
          </button>
        </ActionTooltip>

        <ActionTooltip label={t("organizations.list_view")} shortcut="2">
          <button
            onClick={() => setViewMode("list")}
            className={cn(
              "p-1 rounded-sm text-muted-foreground hover:text-foreground transition-all cursor-pointer",
              viewMode === "list" && "bg-secondary text-foreground shadow-xs"
            )}
          >
            <ListIcon className="size-3.5" />
          </button>
        </ActionTooltip>

        <ActionTooltip label={t("organizations.table_view")} shortcut="3">
          <button
            onClick={() => setViewMode("table")}
            className={cn(
              "p-1 rounded-sm text-muted-foreground hover:text-foreground transition-all cursor-pointer",
              viewMode === "table" && "bg-secondary text-foreground shadow-xs"
            )}
          >
            <TableIcon className="size-3.5" />
          </button>
        </ActionTooltip>
      </div>

      {/* Refresh Button */}
      <ActionTooltip label={t("organizations.refresh_data")} shortcut="R">
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={loading}
          className="border-border/80 bg-card hover:bg-accent text-muted-foreground"
        >
          <RefreshCw className={cn("size-3.5", loading && "animate-spin text-primary")} />
        </Button>
      </ActionTooltip>

      {/* Import Backup Button */}
      {onImportBackup && (
        <ActionTooltip
          label={
            canCreateOrg
              ? t("organizations.import_backup")
              : t("common.error")
          }
        >
          <Button
            variant="outline"
            size="sm"
            onClick={onImportBackup}
            disabled={!canCreateOrg}
            className="border-border/80 bg-card hover:bg-accent text-foreground shadow-xs disabled:opacity-50"
          >
            <Upload className="size-3.5 text-primary" />
            <span>{t("organizations.import_backup")}</span>
          </Button>
        </ActionTooltip>
      )}

      {/* New Organization Button */}
      <ActionTooltip
        label={
          canCreateOrg
            ? t("organizations.create_org_btn")
            : t("common.error")
        }
        shortcut={canCreateOrg ? "N" : undefined}
      >
        <Button
          size="sm"
          onClick={onNewOrganization}
          disabled={!canCreateOrg}
          className="shadow-xs disabled:opacity-50"
        >
          <Plus className="size-3.5" />
          <span>{t("organizations.create_org_btn")}</span>
        </Button>
      </ActionTooltip>
    </div>
  );
}
