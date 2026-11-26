import {
  Activity,
  CheckCircle2,
  KeyRound,
  Pencil,
  Play,
  Power,
  Trash2,
  XCircle,
} from "lucide-react";
import {
  Badge,
  Button,
  DataTableColumnHeader,
  type ColumnDef,
} from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import type { SiemEndpointItem } from "./SecuritySiemModals";

export function SiemStatsRow({
  activeCount,
  autoDisabledCount,
  totalDlq,
}: {
  activeCount: number;
  autoDisabledCount: number;
  totalDlq: number;
}) {
  const { t } = useTranslation();
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div className="rounded-lg border border-border/50 bg-muted/20 p-3">
        <div className="text-[11px] text-muted-foreground">{t("settings.siem.stat_active_streams")}</div>
        <div className="text-lg font-semibold font-mono text-foreground">{activeCount}</div>
      </div>
      <div className="rounded-lg border border-border/50 bg-muted/20 p-3">
        <div className="text-[11px] text-muted-foreground">{t("settings.siem.stat_auto_disabled")}</div>
        <div className="text-lg font-semibold font-mono text-foreground">{autoDisabledCount}</div>
      </div>
      <div className="rounded-lg border border-border/50 bg-muted/20 p-3">
        <div className="text-[11px] text-muted-foreground">{t("settings.siem.stat_dlq_count")}</div>
        <div className="text-lg font-semibold font-mono text-foreground">{totalDlq}</div>
      </div>
    </div>
  );
}

function SiemEndpointHealthBadge({ item }: { item: SiemEndpointItem }) {
  const { t } = useTranslation();
  const isAutoDisabled = !item.isActive && Boolean(item.autoDisabledAt);
  return (
    <div className="space-y-1">
      {isAutoDisabled ? (
        <Badge variant="outline" className="text-[10px] border-destructive/40 text-destructive bg-destructive/10 gap-1">
          <XCircle className="size-3" />
          {t("settings.siem.status_auto_disabled")}
        </Badge>
      ) : item.isActive ? (
        <Badge variant="outline" className="text-[10px] border-primary/40 text-primary bg-primary/10 gap-1">
          <CheckCircle2 className="size-3" />
          {t("settings.siem.status_active")}
        </Badge>
      ) : (
        <Badge variant="outline" className="text-[10px] text-muted-foreground">
          {t("settings.siem.status_paused")}
        </Badge>
      )}
      <div className="text-[10px] font-mono text-muted-foreground">
        {item.lastDeliveryAt
          ? `${item.lastDeliveryStatus || "OK"} (${item.lastHttpStatus ?? "-"})`
          : t("settings.siem.never_delivered")}
      </div>
    </div>
  );
}

function SiemEndpointRowActions({
  item,
  canManage,
  testingId,
  reEnablingId,
  onReEnable,
  onTest,
  onLogs,
  onEdit,
  onConfirmAction,
}: {
  item: SiemEndpointItem;
  canManage: boolean;
  testingId: string | null;
  reEnablingId: string | null;
  onReEnable: (item: SiemEndpointItem) => void;
  onTest: (item: SiemEndpointItem) => void;
  onLogs: (item: SiemEndpointItem) => void;
  onEdit: (item: SiemEndpointItem) => void;
  onConfirmAction: (item: SiemEndpointItem, kind: "roll" | "delete") => void;
}) {
  const { t } = useTranslation();
  const isAutoDisabled = !item.isActive && Boolean(item.autoDisabledAt);
  return (
    <div className="flex items-center justify-end gap-1 flex-wrap">
      {isAutoDisabled && canManage && (
        <Button
          type="button"
          size="xs"
          variant="default"
          disabled={reEnablingId === item.id}
          onClick={() => onReEnable(item)}
          className="gap-1"
        >
          <Power className="size-3" />
          {t("settings.siem.re_enable_btn")}
        </Button>
      )}
      {canManage && (
        <Button
          type="button"
          size="xs"
          variant="outline"
          disabled={testingId === item.id}
          onClick={() => onTest(item)}
          className="gap-1"
        >
          <Play className="size-3" />
          {t("settings.siem.test_btn")}
        </Button>
      )}
      <Button type="button" size="xs" variant="outline" onClick={() => onLogs(item)} className="gap-1">
        <Activity className="size-3" />
        {t("settings.siem.logs_btn")}
      </Button>
      {canManage && (
        <>
          <Button type="button" size="xs" variant="outline" onClick={() => onConfirmAction(item, "roll")} className="gap-1">
            <KeyRound className="size-3" />
            {t("settings.siem.roll_secret_btn")}
          </Button>
          <Button type="button" size="xs" variant="outline" onClick={() => onEdit(item)} className="gap-1">
            <Pencil className="size-3" />
            {t("settings.siem.edit_endpoint_btn")}
          </Button>
          <Button
            type="button"
            size="xs"
            variant="outline"
            onClick={() => onConfirmAction(item, "delete")}
            className="gap-1 text-destructive hover:text-destructive border-destructive/30"
          >
            <Trash2 className="size-3" />
            {t("settings.siem.delete_btn")}
          </Button>
        </>
      )}
    </div>
  );
}

export function buildSiemColumns({
  t,
  canManage,
  testingId,
  reEnablingId,
  onReEnable,
  onTest,
  onLogs,
  onEdit,
  onConfirmAction,
}: {
  t: (k: string) => string;
  canManage: boolean;
  testingId: string | null;
  reEnablingId: string | null;
  onReEnable: (item: SiemEndpointItem) => void;
  onTest: (item: SiemEndpointItem) => void;
  onLogs: (item: SiemEndpointItem) => void;
  onEdit: (item: SiemEndpointItem) => void;
  onConfirmAction: (item: SiemEndpointItem, kind: "roll" | "delete") => void;
}): ColumnDef<SiemEndpointItem>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("settings.siem.col_name")} />
      ),
      cell: ({ row }) => (
        <div className="space-y-0.5 max-w-[230px]">
          <div className="text-xs font-semibold text-foreground truncate">{row.original.name}</div>
          <div className="text-[11px] font-mono text-muted-foreground truncate">{row.original.targetUrl}</div>
          <div className="text-[10px] font-mono text-muted-foreground">{row.original.signingSecretPrefix}</div>
        </div>
      ),
    },
    {
      accessorKey: "targetFormat",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("settings.siem.col_format")} />
      ),
      cell: ({ row }) => (
        <Badge variant="outline" className="text-[10px] font-mono">{row.original.targetFormat}</Badge>
      ),
    },
    {
      accessorKey: "minSeverity",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("settings.siem.col_filter")} />
      ),
      cell: ({ row }) => (
        <div className="space-y-0.5">
          <Badge variant="outline" className="text-[10px] font-mono">{row.original.minSeverity}+</Badge>
          <div className="text-[10px] font-mono text-muted-foreground">
            {(row.original.eventCategories || []).join(", ")}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "isActive",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("settings.siem.col_health")} />
      ),
      cell: ({ row }) => <SiemEndpointHealthBadge item={row.original} />,
    },
    {
      accessorKey: "dlqCount",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("settings.siem.col_dlq")} />
      ),
      cell: ({ row }) => (
        <span className="text-xs font-mono font-semibold text-foreground">{row.original.dlqCount ?? 0}</span>
      ),
    },
    {
      id: "actions",
      header: () => <div className="text-right text-xs">{t("settings.siem.col_actions")}</div>,
      cell: ({ row }) => (
        <SiemEndpointRowActions
          item={row.original}
          canManage={canManage}
          testingId={testingId}
          reEnablingId={reEnablingId}
          onReEnable={onReEnable}
          onTest={onTest}
          onLogs={onLogs}
          onEdit={onEdit}
          onConfirmAction={onConfirmAction}
        />
      ),
    },
  ];
}
