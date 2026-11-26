import * as React from "react";
import {
  CheckCircle2,
  Copy,
  KeyRound,
  Loader2,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
  XCircle,
} from "lucide-react";
import {
  Badge,
  Button,
  DataTable,
  DataTableColumnHeader,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  type ColumnDef,
} from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import { toast } from "sonner";

export type SiemTargetFormat =
  | "GENERIC_JSON"
  | "SLACK"
  | "MS_TEAMS"
  | "WAZUH_ECS"
  | "SPLUNK_HEC";

export interface SiemEndpointItem {
  id: string;
  name: string;
  targetUrl: string;
  targetFormat: SiemTargetFormat;
  signingSecretPrefix: string;
  plainTextSecret?: string | null;
  customAuthHeaderName?: string | null;
  hasCustomAuthHeader: boolean;
  eventCategories: string[];
  minSeverity: string;
  isActive: boolean;
  consecutiveFailures: number;
  autoDisabledAt?: string | null;
  autoDisabledReason?: string | null;
  lastDeliveryAt?: string | null;
  lastDeliveryStatus?: string | null;
  lastHttpStatus?: number | null;
  dlqCount: number;
  createdBy?: string | null;
  createdAt?: string | null;
}

export interface SiemDeliveryItem {
  id: string;
  endpointId: string;
  eventId: string;
  eventAction: string;
  eventCategory: string;
  eventSeverity: string;
  payloadJson: string;
  deliveryStatus: string;
  attemptCount: number;
  maxAttempts: number;
  nextRetryAt?: string | null;
  httpStatusCode?: number | null;
  responseSnippet?: string | null;
  errorMessage?: string | null;
  latencyMs?: number | null;
  deliveredAt?: string | null;
  createdAt?: string | null;
}

export interface UpsertSiemEndpointInput {
  name: string;
  targetUrl: string;
  targetFormat: SiemTargetFormat;
  eventCategories: string[];
  minSeverity: string;
  customAuthHeaderName?: string;
  customAuthHeaderValue?: string;
  isActive?: boolean;
}

const ALL_CATEGORIES = ["AUTH", "SSO", "SCIM", "SECURITY", "ADMIN"] as const;

export function SiemEndpointFormModal({
  open,
  onOpenChange,
  editingItem,
  isSaving,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingItem: SiemEndpointItem | null;
  isSaving: boolean;
  onSubmit: (payload: UpsertSiemEndpointInput) => Promise<void>;
}) {
  const { t } = useTranslation();
  const [name, setName] = React.useState("");
  const [targetUrl, setTargetUrl] = React.useState("");
  const [targetFormat, setTargetFormat] = React.useState<SiemTargetFormat>("GENERIC_JSON");
  const [minSeverity, setMinSeverity] = React.useState("WARNING");
  const [categories, setCategories] = React.useState<string[]>([...ALL_CATEGORIES]);
  const [authHeaderName, setAuthHeaderName] = React.useState("");
  const [authHeaderValue, setAuthHeaderValue] = React.useState("");
  const [isActive, setIsActive] = React.useState(true);

  React.useEffect(() => {
    if (!open) return;
    if (editingItem) {
      setName(editingItem.name || "");
      setTargetUrl(editingItem.targetUrl || "");
      setTargetFormat(editingItem.targetFormat || "GENERIC_JSON");
      setMinSeverity(editingItem.minSeverity || "WARNING");
      setCategories(
        editingItem.eventCategories && editingItem.eventCategories.length > 0
          ? editingItem.eventCategories
          : [...ALL_CATEGORIES]
      );
      setAuthHeaderName(editingItem.customAuthHeaderName || "");
      setAuthHeaderValue("");
      setIsActive(editingItem.isActive);
    } else {
      setName("");
      setTargetUrl("");
      setTargetFormat("GENERIC_JSON");
      setMinSeverity("WARNING");
      setCategories([...ALL_CATEGORIES]);
      setAuthHeaderName("");
      setAuthHeaderValue("");
      setIsActive(true);
    }
  }, [editingItem, open]);

  const toggleCategory = (cat: string) => {
    setCategories((prev) =>
      prev.includes(cat) ? prev.filter((item) => item !== cat) : [...prev, cat]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      name: name.trim(),
      targetUrl: targetUrl.trim(),
      targetFormat,
      minSeverity,
      eventCategories: categories.length > 0 ? categories : [...ALL_CATEGORIES],
      customAuthHeaderName: authHeaderName.trim() || undefined,
      customAuthHeaderValue: authHeaderValue.trim() || undefined,
      isActive,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg border-border/80 bg-card">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">
            {editingItem ? t("settings.siem.modal_edit_title") : t("settings.siem.modal_create_title")}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {t("settings.siem.modal_form_desc")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-medium">{t("settings.siem.field_name")}</Label>
              <Input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("settings.siem.field_name_placeholder")}
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium">{t("settings.siem.field_format")}</Label>
              <Select
                value={targetFormat}
                onValueChange={(v) => setTargetFormat(v as SiemTargetFormat)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GENERIC_JSON">{t("settings.siem.format_generic_json")}</SelectItem>
                  <SelectItem value="SLACK">{t("settings.siem.format_slack")}</SelectItem>
                  <SelectItem value="MS_TEAMS">{t("settings.siem.format_ms_teams")}</SelectItem>
                  <SelectItem value="WAZUH_ECS">{t("settings.siem.format_wazuh_ecs")}</SelectItem>
                  <SelectItem value="SPLUNK_HEC">{t("settings.siem.format_splunk_hec")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-medium">{t("settings.siem.field_url")}</Label>
            <Input
              required
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder={t("settings.siem.field_url_placeholder")}
              className="h-8 text-xs font-mono"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-medium">{t("settings.siem.field_min_severity")}</Label>
            <Select value={minSeverity} onValueChange={setMinSeverity}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="INFO">{t("settings.siem.severity_info")}</SelectItem>
                <SelectItem value="WARNING">{t("settings.siem.severity_warning")}</SelectItem>
                <SelectItem value="CRITICAL">{t("settings.siem.severity_critical")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">{t("settings.siem.field_categories")}</Label>
            <div className="flex flex-wrap gap-1.5">
              {ALL_CATEGORIES.map((cat) => {
                const selected = categories.includes(cat);
                return (
                  <Button
                    key={cat}
                    type="button"
                    size="xs"
                    variant={selected ? "default" : "outline"}
                    onClick={() => toggleCategory(cat)}
                    className="font-mono"
                  >
                    {cat}
                  </Button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-border/40">
            <div className="space-y-1">
              <Label className="text-xs font-medium">{t("settings.siem.field_auth_header_name")}</Label>
              <Input
                value={authHeaderName}
                onChange={(e) => setAuthHeaderName(e.target.value)}
                placeholder={t("settings.siem.field_auth_header_name_placeholder")}
                className="h-8 text-xs font-mono"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium">{t("settings.siem.field_auth_header_value")}</Label>
              <Input
                type="password"
                value={authHeaderValue}
                onChange={(e) => setAuthHeaderValue(e.target.value)}
                placeholder={t("settings.siem.field_auth_header_value_placeholder")}
                className="h-8 text-xs font-mono"
              />
              {editingItem?.hasCustomAuthHeader && (
                <p className="text-[10px] text-muted-foreground">
                  {t("settings.siem.field_auth_header_keep_hint")}
                </p>
              )}
            </div>
          </div>

          {editingItem && (
            <div className="flex items-center justify-between rounded-md border border-border/50 bg-muted/30 px-3 py-2">
              <span className="text-xs font-medium">{t("settings.siem.status_active")}</span>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>
          )}

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              {t("settings.siem.cancel_btn")}
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSaving || !name.trim() || !targetUrl.trim()}
              className="gap-1.5"
            >
              {isSaving && <Loader2 className="size-3.5 animate-spin" />}
              {isSaving ? t("settings.siem.saving_btn") : t("settings.siem.save_btn")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function SiemSecretRevealModal({
  secretValue,
  onClose,
}: {
  secretValue: string | null;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    if (!secretValue || typeof navigator === "undefined" || !navigator.clipboard) return;
    navigator.clipboard.writeText(secretValue);
    setCopied(true);
    toast.success(t("settings.siem.secret_copied"));
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={Boolean(secretValue)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg border-border/80 bg-card">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold flex items-center gap-2">
            <KeyRound className="size-4 text-primary" />
            {t("settings.siem.secret_modal_title")}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {t("settings.siem.secret_modal_desc")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Input
              readOnly
              value={secretValue || ""}
              className="h-8 text-xs font-mono bg-muted/40 select-all"
            />
            <Button type="button" size="sm" variant="outline" onClick={handleCopy} className="gap-1.5 shrink-0">
              <Copy className="size-3.5" />
              {copied ? t("common.copied") : t("settings.siem.secret_copy_btn")}
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground rounded-md border border-border/50 bg-muted/30 p-2.5 font-mono">
            {t("settings.siem.secret_verify_hint")}
          </p>
        </div>

        <DialogFooter>
          <Button type="button" size="sm" onClick={onClose}>
            {t("settings.siem.secret_done_btn")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function SiemDeliveriesModal({
  endpoint,
  deliveries,
  isLoading,
  replayingId,
  onClose,
  onRefresh,
  onReplay,
}: {
  endpoint: SiemEndpointItem | null;
  deliveries: SiemDeliveryItem[];
  isLoading: boolean;
  replayingId: string | null;
  onClose: () => void;
  onRefresh: () => Promise<void>;
  onReplay: (deliveryId: string) => Promise<void>;
}) {
  const { t } = useTranslation();

  const columns = React.useMemo<ColumnDef<SiemDeliveryItem>[]>(
    () => [
      {
        accessorKey: "eventAction",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("settings.siem.deliv_col_action")} />
        ),
        cell: ({ row }) => (
          <div className="space-y-0.5">
            <div className="text-xs font-mono font-medium text-foreground">
              {row.original.eventAction}
            </div>
            <div className="text-[10px] font-mono text-muted-foreground">
              {row.original.eventSeverity} / {row.original.eventCategory}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "deliveryStatus",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("settings.siem.deliv_col_status")} />
        ),
        cell: ({ row }) => {
          const st = row.original.deliveryStatus;
          if (st === "DELIVERED") {
            return (
              <Badge variant="outline" className="text-[10px] border-primary/40 text-primary bg-primary/10 gap-1">
                <CheckCircle2 className="size-3" />
                {st}
              </Badge>
            );
          }
          if (st === "FAILED_DLQ") {
            return (
              <Badge variant="outline" className="text-[10px] border-destructive/40 text-destructive bg-destructive/10 gap-1">
                <XCircle className="size-3" />
                {st}
              </Badge>
            );
          }
          return (
            <Badge variant="outline" className="text-[10px] gap-1">
              <ShieldAlert className="size-3" />
              {st}
            </Badge>
          );
        },
      },
      {
        accessorKey: "httpStatusCode",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("settings.siem.deliv_col_http")} />
        ),
        cell: ({ row }) => (
          <span className="text-xs font-mono text-muted-foreground">
            {row.original.httpStatusCode ?? 0} / {row.original.latencyMs ?? 0}ms
          </span>
        ),
      },
      {
        accessorKey: "attemptCount",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("settings.siem.deliv_col_attempts")} />
        ),
        cell: ({ row }) => (
          <span className="text-xs font-mono">
            {row.original.attemptCount}/{row.original.maxAttempts}
          </span>
        ),
      },
      {
        accessorKey: "createdAt",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("settings.siem.deliv_col_time")} />
        ),
        cell: ({ row }) => (
          <span className="text-[11px] font-mono text-muted-foreground">
            {row.original.createdAt ? new Date(row.original.createdAt).toLocaleString() : "-"}
          </span>
        ),
      },
      {
        id: "actions",
        header: () => <div className="text-right text-xs">{t("settings.siem.deliv_col_action_btn")}</div>,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Button
              type="button"
              size="xs"
              variant="outline"
              disabled={replayingId === row.original.id}
              onClick={() => onReplay(row.original.id)}
              className="gap-1"
            >
              {replayingId === row.original.id ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <RotateCcw className="size-3" />
              )}
              {replayingId === row.original.id ? t("settings.siem.replaying_btn") : t("settings.siem.replay_btn")}
            </Button>
          </div>
        ),
      },
    ],
    [onReplay, replayingId, t]
  );

  return (
    <Dialog open={Boolean(endpoint)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-4xl border-border/80 bg-card">
        <DialogHeader>
          <div className="flex items-center justify-between gap-2 pr-6">
            <div>
              <DialogTitle className="text-sm font-semibold">
                {t("settings.siem.deliveries_modal_title")}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {t("settings.siem.deliveries_modal_desc", { name: endpoint?.name || "" })}
              </DialogDescription>
            </div>
            <Button type="button" size="sm" variant="outline" onClick={onRefresh} disabled={isLoading} className="gap-1.5">
              <RefreshCw className={`size-3.5 ${isLoading ? "animate-spin" : ""}`} />
              {t("settings.siem.refresh_btn")}
            </Button>
          </div>
        </DialogHeader>

        <DataTable
          columns={columns}
          data={deliveries}
          isLoading={isLoading}
          density="compact"
          emptyState={{
            title: t("settings.siem.deliv_empty"),
            description: t("settings.siem.never_delivered"),
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

export function SiemConfirmDialog({
  open,
  title,
  description,
  submitLabel,
  destructive,
  isBusy,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description: string;
  submitLabel: string;
  destructive?: boolean;
  isBusy: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
}) {
  const { t } = useTranslation();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-border/80 bg-card">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">{title}</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button type="button" size="sm" variant="outline" onClick={() => onOpenChange(false)}>
            {t("settings.siem.cancel_btn")}
          </Button>
          <Button
            type="button"
            size="sm"
            variant={destructive ? "destructive" : "default"}
            disabled={isBusy}
            onClick={onConfirm}
            className="gap-1.5"
          >
            {isBusy && <Loader2 className="size-3.5 animate-spin" />}
            {submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
