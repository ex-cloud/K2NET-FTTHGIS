import * as React from "react";
import {
  DataTable,
  DataTableColumnHeader,
  Button,
  Badge,
  type ColumnDef,
} from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import { Boxes, ExternalLink, Server } from "lucide-react";
import type { PlatformModuleItem } from "@/hooks/usePlatformModules";
import {
  ModuleStatusBadge,
  ModuleTierBadge,
  PureModuleBadge,
} from "./module-ui-helpers";

interface ModuleDirectoryTableProps {
  modules: PlatformModuleItem[];
  isLoading: boolean;
  onInspect: (mod: PlatformModuleItem) => void;
}

export function ModuleDirectoryTable({
  modules,
  isLoading,
  onInspect,
}: ModuleDirectoryTableProps) {
  const { t } = useTranslation();

  const columns = React.useMemo<ColumnDef<PlatformModuleItem>[]>(
    () => [
      {
        accessorKey: "code",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("modules.table_code")} />
        ),
        cell: ({ row }) => (
          <span className="px-1.5 py-0.5 rounded bg-muted/60 border border-border/80 text-[11px] font-mono font-semibold text-foreground">
            {row.original.code}
          </span>
        ),
      },
      {
        accessorKey: "name",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("modules.table_name")} />
        ),
        cell: ({ row }) => {
          const mod = row.original;
          return (
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground">{mod.name}</span>
                <PureModuleBadge />
              </div>
              {mod.description && (
                <div className="text-[11px] text-muted-foreground line-clamp-1">
                  {mod.description}
                </div>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "scope",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("modules.table_scope")} />
        ),
        cell: ({ row }) => (
          <Badge
            variant={row.original.scope === "SYSTEM" ? "secondary" : "outline"}
            className="text-[10px] tracking-wide uppercase font-semibold"
          >
            {row.original.scope}
          </Badge>
        ),
      },
      {
        accessorKey: "minPlanTier",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("modules.table_min_tier")} />
        ),
        cell: ({ row }) => {
          const mod = row.original;
          return mod.scope === "TENANT" ? (
            <ModuleTierBadge tier={mod.minPlanTier} />
          ) : (
            <span className="text-[11px] text-muted-foreground">—</span>
          );
        },
      },
      {
        accessorKey: "serviceTarget",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("modules.table_target")} />
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5 truncate max-w-[180px] font-mono text-[11px] text-muted-foreground">
            <Server className="size-3 shrink-0 text-muted-foreground" />
            <span className="truncate">{row.original.serviceTarget}</span>
          </div>
        ),
      },
      {
        id: "permissions",
        header: () => (
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            {t("modules.table_permissions")}
          </span>
        ),
        cell: ({ row }) => {
          const mod = row.original;
          const permCount = mod.permissions?.length ?? mod.permissionsCount ?? 0;
          return (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onInspect(mod);
              }}
              className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-muted/80 hover:bg-muted border border-border text-foreground transition-colors"
            >
              {permCount}
            </button>
          );
        },
      },
      {
        accessorKey: "status",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("modules.table_status")} />
        ),
        cell: ({ row }) => <ModuleStatusBadge status={row.original.status} />,
      },
      {
        id: "actions",
        header: () => (
          <span className="text-right block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            {t("modules.table_actions")}
          </span>
        ),
        cell: ({ row }) => (
          <div className="text-right">
            <Button
              variant="outline"
              size="xs"
              onClick={(e) => {
                e.stopPropagation();
                onInspect(row.original);
              }}
              className="gap-1 text-[11px] h-6 px-2 font-medium"
            >
              <ExternalLink className="size-3 text-muted-foreground" />
              {t("modules.action_inspect")}
            </Button>
          </div>
        ),
      },
    ],
    [t, onInspect]
  );

  return (
    <DataTable
      columns={columns}
      data={modules}
      isLoading={isLoading}
      density="compact"
      emptyState={{
        icon: <Boxes className="size-8 mx-auto text-muted-foreground/50 mb-2" />,
        title: t("modules.empty_search_title"),
        description: t("modules.empty_search_desc"),
      }}
      onRowClick={onInspect}
    />
  );
}
