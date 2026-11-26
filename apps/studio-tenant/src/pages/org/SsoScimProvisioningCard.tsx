import * as React from "react";
import {
  Users,
  KeyRound,
  Plus,
  Copy,
  ShieldCheck,
  Trash2,
  Loader2,
  Info,
} from "lucide-react";
import {
  Card,
  Button,
  Badge,
  DataTable,
  DataTableColumnHeader,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  type ColumnDef,
} from "@k2net/ui";
import { toast } from "sonner";
import { useTranslation } from "@k2net/i18n";
import { SsoScimTokenModal, SsoScimConfirmDialog } from "./SsoScimTokenModal";

export interface ScimTokenDto {
  id: string;
  name: string;
  tokenPrefix: string;
  maskedToken: string;
  active: boolean;
  expiresAt?: string | null;
  lastUsedAt?: string | null;
  lastUsedIp?: string | null;
  revokedAt?: string | null;
  createdAt?: string | null;
}

export interface ScimGroupMappingDto {
  id: string;
  displayName: string;
  externalId?: string | null;
  mappedRoleId?: number | null;
  mappedRoleName?: string | null;
  mappedRoleDisplayName?: string | null;
  memberCount: number;
  updatedAt?: string | null;
}

export interface ScimRoleOptionDto {
  id: number;
  name: string;
  displayName: string;
  code?: string | null;
}

export interface ScimSummaryResponse {
  organizationSlug: string;
  scimBaseUrl: string;
  activeTokensCount: number;
  scimManagedUsersCount: number;
  syncedGroupsCount: number;
  tokens: ScimTokenDto[];
  groups: ScimGroupMappingDto[];
  availableRoles: ScimRoleOptionDto[];
}

export interface SsoScimProvisioningCardProps {
  slug?: string;
  isSsoInteractive: boolean;
  canManageSso: boolean;
}

function ScimKpiAndEndpointOverview({
  summary,
  liveBaseUrl,
  onCopyEndpoint,
}: {
  summary: ScimSummaryResponse | null;
  liveBaseUrl: string;
  onCopyEndpoint: () => void;
}) {
  const { t } = useTranslation();

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-lg border border-border/60 bg-muted/20 p-3 space-y-1">
          <div className="text-[11px] text-muted-foreground">{t("settings.sso_scim_kpi_tokens")}</div>
          <div className="text-base font-semibold font-mono text-foreground">
            {summary?.activeTokensCount ?? 0}
          </div>
        </div>
        <div className="rounded-lg border border-border/60 bg-muted/20 p-3 space-y-1">
          <div className="text-[11px] text-muted-foreground">{t("settings.sso_scim_kpi_users")}</div>
          <div className="text-base font-semibold font-mono text-foreground">
            {summary?.scimManagedUsersCount ?? 0}
          </div>
        </div>
        <div className="rounded-lg border border-border/60 bg-muted/20 p-3 space-y-1">
          <div className="text-[11px] text-muted-foreground">{t("settings.sso_scim_kpi_groups")}</div>
          <div className="text-base font-semibold font-mono text-foreground">
            {summary?.syncedGroupsCount ?? 0}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border/50 bg-muted/30 p-3.5 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
            <ShieldCheck className="size-3.5 text-primary" />
            {t("settings.sso_scim_endpoint_label")}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCopyEndpoint}
            disabled={!liveBaseUrl}
            className="h-7 px-2.5 text-xs font-medium gap-1.5"
          >
            <Copy className="size-3.5" />
            {t("settings.sso_scim_copy_btn")}
          </Button>
        </div>
        <code className="block rounded border border-border/60 bg-background px-2.5 py-1.5 font-mono text-[11px] text-foreground break-all select-all">
          {liveBaseUrl}
        </code>
        <div className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
          <Info className="size-3.5 shrink-0 mt-0.5 text-primary" />
          <span>{t("settings.sso_scim_endpoint_hint")}</span>
        </div>
      </div>
    </>
  );
}

function useScimTokenColumns({
  canManageSso,
  isSsoInteractive,
  revokingId,
  onSelectRevoke,
}: {
  canManageSso: boolean;
  isSsoInteractive: boolean;
  revokingId: string | null;
  onSelectRevoke: (item: ScimTokenDto) => void;
}) {
  const { t } = useTranslation();

  return React.useMemo<ColumnDef<ScimTokenDto, unknown>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("settings.sso_scim_col_token_name")} />
        ),
        cell: ({ row }) => (
          <div className="space-y-0.5">
            <div className="text-xs font-medium text-foreground">{row.original.name}</div>
            <div className="font-mono text-[10px] text-muted-foreground">{row.original.maskedToken}</div>
          </div>
        ),
      },
      {
        accessorKey: "active",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("settings.sso_scim_col_status")} />
        ),
        cell: ({ row }) =>
          row.original.active ? (
            <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary text-[10px]">
              {t("settings.sso_scim_status_active")}
            </Badge>
          ) : (
            <Badge variant="outline" className="border-destructive/40 bg-destructive/10 text-destructive text-[10px]">
              {t("settings.sso_scim_status_revoked")}
            </Badge>
          ),
      },
      {
        accessorKey: "lastUsedAt",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("settings.sso_scim_col_last_used")} />
        ),
        cell: ({ row }) => (
          <div className="font-mono text-[11px] text-muted-foreground">
            {row.original.lastUsedAt ? new Date(row.original.lastUsedAt).toLocaleString() : t("settings.sso_scim_never_used")}
          </div>
        ),
      },
      {
        accessorKey: "expiresAt",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("settings.sso_scim_col_expires")} />
        ),
        cell: ({ row }) => (
          <div className="font-mono text-[11px] text-muted-foreground">
            {row.original.expiresAt ? new Date(row.original.expiresAt).toLocaleDateString() : t("settings.sso_scim_expiry_never")}
          </div>
        ),
      },
      {
        id: "actions",
        enableSorting: false,
        header: () => (
          <div className="text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {t("settings.sso_scim_col_action")}
          </div>
        ),
        cell: ({ row }) => {
          const item = row.original;
          const isRevoking = revokingId === item.id;
          return (
            <div className="flex items-center justify-end">
              {canManageSso && item.active && (
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  disabled={!isSsoInteractive || isRevoking}
                  onClick={() => onSelectRevoke(item)}
                  className="h-6 px-2 text-[11px] text-destructive hover:text-destructive hover:bg-destructive/10 gap-1"
                >
                  {isRevoking ? <Loader2 className="size-3 animate-spin" /> : <Trash2 className="size-3" />}
                  {t("settings.sso_scim_revoke_btn")}
                </Button>
              )}
            </div>
          );
        },
      },
    ],
    [canManageSso, isSsoInteractive, onSelectRevoke, revokingId, t]
  );
}

function useScimGroupColumns({
  availableRoles,
  canManageSso,
  isSsoInteractive,
  updatingGroupId,
  onRoleMappingChange,
  onSelectDeleteGroup,
}: {
  availableRoles: ScimRoleOptionDto[];
  canManageSso: boolean;
  isSsoInteractive: boolean;
  updatingGroupId: string | null;
  onRoleMappingChange: (groupId: string, val: string) => void;
  onSelectDeleteGroup: (item: ScimGroupMappingDto) => void;
}) {
  const { t } = useTranslation();

  return React.useMemo<ColumnDef<ScimGroupMappingDto, unknown>[]>(
    () => [
      {
        accessorKey: "displayName",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("settings.sso_scim_col_group_name")} />
        ),
        cell: ({ row }) => (
          <div className="space-y-0.5">
            <div className="text-xs font-medium text-foreground">{row.original.displayName}</div>
            {row.original.externalId && (
              <div className="font-mono text-[10px] text-muted-foreground">{row.original.externalId}</div>
            )}
          </div>
        ),
      },
      {
        accessorKey: "memberCount",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("settings.sso_scim_col_members")} />
        ),
        cell: ({ row }) => (
          <Badge variant="outline" className="border-border bg-muted/40 text-foreground font-mono text-[10px]">
            {row.original.memberCount}
          </Badge>
        ),
      },
      {
        accessorKey: "mappedRoleName",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("settings.sso_scim_col_mapped_role")} />
        ),
        cell: ({ row }) => {
          const item = row.original;
          const isBusy = updatingGroupId === item.id;
          return (
            <div className="flex items-center gap-2 max-w-[200px]">
              <Select
                value={item.mappedRoleName || "__none__"}
                disabled={!isSsoInteractive || !canManageSso || isBusy}
                onValueChange={(val) => onRoleMappingChange(item.id, val)}
              >
                <SelectTrigger className="h-7 text-xs bg-background border-border/80">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">{t("settings.sso_scim_role_unmapped")}</SelectItem>
                  {availableRoles.map((role) => (
                    <SelectItem key={role.id} value={role.name}>
                      {role.displayName || role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isBusy && <Loader2 className="size-3 animate-spin text-muted-foreground" />}
            </div>
          );
        },
      },
      {
        id: "actions",
        enableSorting: false,
        header: () => (
          <div className="text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {t("settings.sso_scim_col_action")}
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex items-center justify-end">
            {canManageSso && (
              <Button
                type="button"
                variant="ghost"
                size="xs"
                disabled={!isSsoInteractive || updatingGroupId === row.original.id}
                onClick={() => onSelectDeleteGroup(row.original)}
                className="h-6 px-2 text-[11px] text-destructive hover:text-destructive hover:bg-destructive/10"
                aria-label={t("settings.sso_scim_delete_group_btn")}
              >
                <Trash2 className="size-3" />
              </Button>
            )}
          </div>
        ),
      },
    ],
    [availableRoles, canManageSso, isSsoInteractive, onRoleMappingChange, onSelectDeleteGroup, t, updatingGroupId]
  );
}

export function SsoScimProvisioningCard({
  slug,
  isSsoInteractive,
  canManageSso,
}: SsoScimProvisioningCardProps) {
  const { t } = useTranslation();
  const [summary, setSummary] = React.useState<ScimSummaryResponse | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [tokenModalOpen, setTokenModalOpen] = React.useState(false);
  const [isCreatingToken, setIsCreatingToken] = React.useState(false);
  const [createdPlainTextToken, setCreatedPlainTextToken] = React.useState<string | null>(null);
  const [revokeTarget, setRevokeTarget] = React.useState<ScimTokenDto | null>(null);
  const [revokingId, setRevokingId] = React.useState<string | null>(null);
  const [updatingGroupId, setUpdatingGroupId] = React.useState<string | null>(null);
  const [deleteGroupTarget, setDeleteGroupTarget] = React.useState<ScimGroupMappingDto | null>(null);

  const loadSummary = React.useCallback(async () => {
    if (!slug) return;
    setIsLoading(true);
    try {
      const { apiClient } = await import("../../lib/api-client");
      const res = await apiClient<ScimSummaryResponse>(
        `/api/v1/organizations/${encodeURIComponent(slug)}/sso/scim/summary`
      );
      if (res) {
        setSummary(res);
      }
    } catch {
      // ignore if entitlement locked
    } finally {
      setIsLoading(false);
    }
  }, [slug]);

  React.useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const liveBaseUrl = React.useMemo(() => {
    if (!slug) return "";
    if (typeof window !== "undefined" && window.location?.origin) {
      return `${window.location.origin}/api/v1/scim/v2/${slug}`;
    }
    return summary?.scimBaseUrl || "";
  }, [slug, summary?.scimBaseUrl]);

  const handleCopyEndpoint = () => {
    if (!liveBaseUrl || typeof navigator === "undefined" || !navigator.clipboard) return;
    navigator.clipboard.writeText(liveBaseUrl);
    toast.success(t("settings.sso_scim_endpoint_copied"));
  };

  const handleCreateToken = async (name: string, expirationDays?: number) => {
    if (!slug) return;
    setIsCreatingToken(true);
    try {
      const { apiClient } = await import("../../lib/api-client");
      const res = await apiClient<{ token: ScimTokenDto; plainTextToken: string }>(
        `/api/v1/organizations/${encodeURIComponent(slug)}/sso/scim/tokens`,
        { method: "POST", body: JSON.stringify({ name, expirationDays }) }
      );
      if (res?.plainTextToken) {
        setCreatedPlainTextToken(res.plainTextToken);
        toast.success(t("settings.sso_scim_token_created_toast"));
        await loadSummary();
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setIsCreatingToken(false);
    }
  };

  const handleConfirmRevoke = async () => {
    if (!slug || !revokeTarget) return;
    const target = revokeTarget;
    setRevokeTarget(null);
    setRevokingId(target.id);
    try {
      const { apiClient } = await import("../../lib/api-client");
      await apiClient(
        `/api/v1/organizations/${encodeURIComponent(slug)}/sso/scim/tokens/${encodeURIComponent(target.id)}`,
        { method: "DELETE" }
      );
      toast.success(t("settings.sso_scim_token_revoked_toast"));
      await loadSummary();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setRevokingId(null);
    }
  };

  const handleRoleMappingChange = React.useCallback(
    async (groupId: string, value: string) => {
      if (!slug || !isSsoInteractive) return;
      setUpdatingGroupId(groupId);
      try {
        const { apiClient } = await import("../../lib/api-client");
        const updated = await apiClient<ScimGroupMappingDto>(
          `/api/v1/organizations/${encodeURIComponent(slug)}/sso/scim/groups/${encodeURIComponent(groupId)}/role-mapping`,
          { method: "PUT", body: JSON.stringify({ roleName: value === "__none__" ? null : value }) }
        );
        if (updated) {
          setSummary((prev) =>
            prev ? { ...prev, groups: prev.groups.map((g) => (g.id === updated.id ? updated : g)) } : prev
          );
          toast.success(t("settings.sso_scim_group_mapped_toast"));
        }
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : String(err));
      } finally {
        setUpdatingGroupId(null);
      }
    },
    [isSsoInteractive, slug, t]
  );

  const handleConfirmDeleteGroup = async () => {
    if (!slug || !deleteGroupTarget) return;
    const target = deleteGroupTarget;
    setDeleteGroupTarget(null);
    setUpdatingGroupId(target.id);
    try {
      const { apiClient } = await import("../../lib/api-client");
      await apiClient(
        `/api/v1/organizations/${encodeURIComponent(slug)}/sso/scim/groups/${encodeURIComponent(target.id)}`,
        { method: "DELETE" }
      );
      toast.success(t("settings.sso_scim_group_deleted_toast"));
      await loadSummary();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setUpdatingGroupId(null);
    }
  };

  const tokenColumns = useScimTokenColumns({
    canManageSso,
    isSsoInteractive,
    revokingId,
    onSelectRevoke: setRevokeTarget,
  });

  const groupColumns = useScimGroupColumns({
    availableRoles: summary?.availableRoles ?? [],
    canManageSso,
    isSsoInteractive,
    updatingGroupId,
    onRoleMappingChange: handleRoleMappingChange,
    onSelectDeleteGroup: setDeleteGroupTarget,
  });

  return (
    <Card className="p-5 border-border/60 bg-card space-y-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <h4 className="text-xs font-semibold flex items-center gap-2 text-foreground">
            <Users className="size-3.5 text-primary" />
            {t("settings.sso_scim_title")}
            <Badge variant="outline" className="border-border text-muted-foreground text-[10px] font-mono">
              SCIM 2.0
            </Badge>
          </h4>
          <p className="text-[11px] text-muted-foreground">{t("settings.sso_scim_desc")}</p>
        </div>

        {canManageSso && (
          <Button
            type="button"
            size="sm"
            disabled={!isSsoInteractive}
            onClick={() => {
              setCreatedPlainTextToken(null);
              setTokenModalOpen(true);
            }}
            className="h-7 px-2.5 text-xs font-medium gap-1.5 shrink-0"
          >
            <Plus className="size-3.5" />
            {t("settings.sso_scim_new_token_btn")}
          </Button>
        )}
      </div>

      <ScimKpiAndEndpointOverview
        summary={summary}
        liveBaseUrl={liveBaseUrl}
        onCopyEndpoint={handleCopyEndpoint}
      />

      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
          <KeyRound className="size-3.5 text-muted-foreground" />
          {t("settings.sso_scim_tokens_section_title")}
        </div>
        <DataTable<ScimTokenDto, unknown>
          columns={tokenColumns}
          data={summary?.tokens ?? []}
          isLoading={isLoading}
          skeletonRowCount={2}
          density="compact"
          emptyState={{
            title: t("settings.sso_scim_tokens_empty_title"),
            description: t("settings.sso_scim_tokens_empty_desc"),
            icon: <KeyRound className="size-4 text-muted-foreground" />,
          }}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
          <Users className="size-3.5 text-muted-foreground" />
          {t("settings.sso_scim_groups_section_title")}
        </div>
        <DataTable<ScimGroupMappingDto, unknown>
          columns={groupColumns}
          data={summary?.groups ?? []}
          isLoading={isLoading}
          skeletonRowCount={2}
          density="compact"
          emptyState={{
            title: t("settings.sso_scim_groups_empty_title"),
            description: t("settings.sso_scim_groups_empty_desc"),
            icon: <Users className="size-4 text-muted-foreground" />,
          }}
        />
      </div>

      <SsoScimTokenModal
        open={tokenModalOpen}
        isCreating={isCreatingToken}
        createdPlainTextToken={createdPlainTextToken}
        onClose={() => {
          setTokenModalOpen(false);
          setCreatedPlainTextToken(null);
        }}
        onCreate={handleCreateToken}
      />

      <SsoScimConfirmDialog
        open={Boolean(revokeTarget)}
        title={t("settings.sso_scim_revoke_title")}
        description={t("settings.sso_scim_revoke_confirm", { name: revokeTarget?.name || "" })}
        confirmLabel={t("settings.sso_scim_revoke_btn")}
        onClose={() => setRevokeTarget(null)}
        onConfirm={handleConfirmRevoke}
      />

      <SsoScimConfirmDialog
        open={Boolean(deleteGroupTarget)}
        title={t("settings.sso_scim_delete_group_title")}
        description={t("settings.sso_scim_delete_group_confirm", { name: deleteGroupTarget?.displayName || "" })}
        confirmLabel={t("settings.sso_scim_delete_group_btn")}
        onClose={() => setDeleteGroupTarget(null)}
        onConfirm={handleConfirmDeleteGroup}
      />
    </Card>
  );
}
