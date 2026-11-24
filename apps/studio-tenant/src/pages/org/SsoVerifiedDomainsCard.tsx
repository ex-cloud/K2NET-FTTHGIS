import * as React from "react";
import {
  Globe,
  Plus,
  Copy,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  Trash2,
  Loader2,
  Info,
} from "lucide-react";
import {
  Card,
  Button,
  Input,
  Badge,
  DataTable,
  DataTableColumnHeader,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  type ColumnDef,
} from "@k2net/ui";
import { toast } from "sonner";
import { useTranslation } from "@k2net/i18n";

export interface SsoVerifiedDomainDto {
  id: string;
  domain: string;
  verificationToken: string;
  txtHost: string;
  txtAltHost: string;
  status: "PENDING" | "VERIFIED" | "FAILED" | string;
  verifiedAt?: string | null;
  lastCheckedAt?: string | null;
  lastErrorMessage?: string | null;
}

interface VerifySsoDomainApiResponse {
  verified: boolean;
  domain: SsoVerifiedDomainDto;
  message: string;
  observedTxtRecords?: string[];
}

export interface SsoVerifiedDomainsCardProps {
  slug?: string;
  isSsoInteractive: boolean;
  canManageSso: boolean;
}

export function SsoVerifiedDomainsCard({
  slug,
  isSsoInteractive,
  canManageSso,
}: SsoVerifiedDomainsCardProps) {
  const { t } = useTranslation();
  const [domains, setDomains] = React.useState<SsoVerifiedDomainDto[]>([]);
  const [newDomain, setNewDomain] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [isAdding, setIsAdding] = React.useState(false);
  const [verifyingId, setVerifyingId] = React.useState<string | null>(null);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<SsoVerifiedDomainDto | null>(null);

  const loadDomains = React.useCallback(async () => {
    if (!slug) return;
    setIsLoading(true);
    try {
      const { apiClient } = await import("../../lib/api-client");
      const res = await apiClient<SsoVerifiedDomainDto[]>(
        `/api/v1/organizations/${encodeURIComponent(slug)}/sso/domains`
      );
      if (Array.isArray(res)) {
        setDomains(res);
      }
    } catch {
      // ignore if SSO entitlement locked
    } finally {
      setIsLoading(false);
    }
  }, [slug]);

  React.useEffect(() => {
    loadDomains();
  }, [loadDomains]);

  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug || !newDomain.trim() || !isSsoInteractive) return;
    setIsAdding(true);
    try {
      const { apiClient } = await import("../../lib/api-client");
      const created = await apiClient<SsoVerifiedDomainDto>(
        `/api/v1/organizations/${encodeURIComponent(slug)}/sso/domains`,
        {
          method: "POST",
          body: JSON.stringify({ domain: newDomain.trim() }),
        }
      );
      if (created) {
        setDomains((prev) => [...prev, created]);
        setNewDomain("");
        toast.success(t("settings.sso_verified_domains_added_toast"));
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setIsAdding(false);
    }
  };

  const handleVerifyDomain = React.useCallback(
    async (row: SsoVerifiedDomainDto) => {
      if (!slug || verifyingId) return;
      setVerifyingId(row.id);
      try {
        const { apiClient } = await import("../../lib/api-client");
        const res = await apiClient<VerifySsoDomainApiResponse>(
          `/api/v1/organizations/${encodeURIComponent(slug)}/sso/domains/${encodeURIComponent(row.id)}/verify`,
          { method: "POST" }
        );
        if (res?.domain) {
          setDomains((prev) =>
            prev.map((d) => (d.id === res.domain.id ? res.domain : d))
          );
        }
        if (res?.verified) {
          toast.success(t("settings.sso_verified_domains_verified_toast"));
        } else {
          toast.error(res?.message || t("settings.sso_verified_domains_failed_toast"));
        }
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : String(err));
      } finally {
        setVerifyingId(null);
      }
    },
    [slug, t, verifyingId]
  );

  const handleCopyToken = React.useCallback(
    (token: string) => {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        navigator.clipboard.writeText(token);
        toast.success(t("settings.sso_verified_domains_copied"));
      }
    },
    [t]
  );

  const handleConfirmDelete = async () => {
    if (!slug || !deleteTarget) return;
    const target = deleteTarget;
    setDeletingId(target.id);
    setDeleteTarget(null);
    try {
      const { apiClient } = await import("../../lib/api-client");
      await apiClient(
        `/api/v1/organizations/${encodeURIComponent(slug)}/sso/domains/${encodeURIComponent(target.id)}`,
        { method: "DELETE" }
      );
      setDomains((prev) => prev.filter((d) => d.id !== target.id));
      toast.success(t("settings.sso_verified_domains_deleted_toast"));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setDeletingId(null);
    }
  };

  const columns = React.useMemo<ColumnDef<SsoVerifiedDomainDto, unknown>[]>(
    () => [
      {
        accessorKey: "domain",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t("settings.sso_verified_domains_col_domain")}
          />
        ),
        cell: ({ row }) => (
          <div className="space-y-0.5">
            <div className="font-mono text-xs font-medium text-foreground">
              {row.original.domain}
            </div>
            <div className="font-mono text-[10px] text-muted-foreground">
              {row.original.txtAltHost}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "verificationToken",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t("settings.sso_verified_domains_col_txt_record")}
          />
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5 max-w-xs">
            <code className="truncate rounded border border-border/60 bg-muted/40 px-1.5 py-0.5 font-mono text-[10px] text-foreground">
              {row.original.verificationToken}
            </code>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={() => handleCopyToken(row.original.verificationToken)}
              className="h-6 px-2 text-[11px] shrink-0"
              aria-label={t("settings.sso_verified_domains_copy_btn")}
            >
              <Copy className="size-3" />
            </Button>
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t("settings.sso_verified_domains_col_status")}
          />
        ),
        cell: ({ row }) => {
          const st = (row.original.status || "").toUpperCase();
          if (st === "VERIFIED") {
            return (
              <Badge
                variant="outline"
                className="border-primary/40 bg-primary/10 text-primary text-[10px] gap-1"
              >
                <CheckCircle2 className="size-3" />
                {t("settings.sso_verified_domains_status_verified")}
              </Badge>
            );
          }
          if (st === "FAILED") {
            return (
              <Badge
                variant="outline"
                className="border-destructive/40 bg-destructive/10 text-destructive text-[10px] gap-1"
              >
                <AlertCircle className="size-3" />
                {t("settings.sso_verified_domains_status_failed")}
              </Badge>
            );
          }
          return (
            <Badge
              variant="outline"
              className="border-border bg-muted/40 text-muted-foreground text-[10px] gap-1"
            >
              <Clock className="size-3" />
              {t("settings.sso_verified_domains_status_pending")}
            </Badge>
          );
        },
      },
      {
        accessorKey: "verifiedAt",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t("settings.sso_verified_domains_col_verified_at")}
          />
        ),
        cell: ({ row }) => {
          const ts = row.original.verifiedAt || row.original.lastCheckedAt;
          return (
            <span className="font-mono text-[11px] text-muted-foreground">
              {ts ? new Date(ts).toLocaleString() : "—"}
            </span>
          );
        },
      },
      {
        id: "actions",
        enableSorting: false,
        header: () => (
          <div className="text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {t("settings.sso_verified_domains_col_action")}
          </div>
        ),
        cell: ({ row }) => {
          const item = row.original;
          const isRowVerifying = verifyingId === item.id;
          const isRowDeleting = deletingId === item.id;
          return (
            <div className="flex items-center justify-end gap-1.5">
              {canManageSso && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    disabled={!isSsoInteractive || Boolean(verifyingId) || isRowDeleting}
                    onClick={() => handleVerifyDomain(item)}
                    className="h-6 px-2 text-[11px] gap-1"
                  >
                    {isRowVerifying ? (
                      <Loader2 className="size-3 animate-spin" />
                    ) : (
                      <RefreshCw className="size-3" />
                    )}
                    {isRowVerifying
                      ? t("settings.sso_verified_domains_verifying")
                      : t("settings.sso_verified_domains_verify_btn")}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    disabled={!isSsoInteractive || isRowVerifying || isRowDeleting}
                    onClick={() => setDeleteTarget(item)}
                    className="h-6 px-2 text-[11px] text-destructive hover:text-destructive hover:bg-destructive/10"
                    aria-label={t("settings.sso_verified_domains_remove_btn")}
                  >
                    {isRowDeleting ? (
                      <Loader2 className="size-3 animate-spin" />
                    ) : (
                      <Trash2 className="size-3" />
                    )}
                  </Button>
                </>
              )}
            </div>
          );
        },
      },
    ],
    [canManageSso, deletingId, handleCopyToken, handleVerifyDomain, isSsoInteractive, t, verifyingId]
  );

  return (
    <Card className="p-5 border-border/60 bg-card space-y-4 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <h4 className="text-xs font-semibold flex items-center gap-2 text-foreground">
            <Globe className="size-3.5 text-primary" />
            {t("settings.sso_verified_domains_title")}
          </h4>
          <p className="text-[11px] text-muted-foreground">
            {t("settings.sso_verified_domains_desc")}
          </p>
        </div>

        {canManageSso && (
          <form onSubmit={handleAddDomain} className="flex items-center gap-2">
            <Input
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              disabled={!isSsoInteractive || isAdding}
              placeholder={t("settings.sso_verified_domains_input_placeholder")}
              className="h-7 w-56 text-xs font-mono bg-background border-border/80"
            />
            <Button
              type="submit"
              size="sm"
              disabled={!isSsoInteractive || isAdding || !newDomain.trim()}
              className="h-7 px-2.5 text-xs font-medium gap-1.5 shrink-0"
            >
              {isAdding ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Plus className="size-3.5" />
              )}
              {isAdding
                ? t("settings.sso_verified_domains_adding")
                : t("settings.sso_verified_domains_add_btn")}
            </Button>
          </form>
        )}
      </div>

      <div className="flex items-start gap-2.5 rounded-lg border border-border/50 bg-muted/30 p-3">
        <Info className="size-3.5 text-primary shrink-0 mt-0.5" />
        <div className="space-y-0.5 text-[11px]">
          <div className="font-semibold text-foreground">
            {t("settings.sso_verified_domains_instructions_title")}
          </div>
          <p className="text-muted-foreground leading-relaxed">
            {t("settings.sso_verified_domains_instructions_desc")}
          </p>
        </div>
      </div>

      <DataTable<SsoVerifiedDomainDto, unknown>
        columns={columns}
        data={domains}
        isLoading={isLoading}
        skeletonRowCount={3}
        density="compact"
        emptyState={{
          title: t("settings.sso_verified_domains_empty_title"),
          description: t("settings.sso_verified_domains_empty_desc"),
          icon: <Globe className="size-4 text-muted-foreground" />,
        }}
      />

      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-md border-border/80 bg-card">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">
              {t("settings.sso_verified_domains_delete_title")}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {t("settings.sso_verified_domains_delete_confirm", {
                domain: deleteTarget?.domain || "",
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDeleteTarget(null)}
              className="h-7 px-2.5 text-xs"
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleConfirmDelete}
              className="h-7 px-2.5 text-xs gap-1.5"
            >
              <Trash2 className="size-3.5" />
              {t("settings.sso_verified_domains_remove_btn")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
