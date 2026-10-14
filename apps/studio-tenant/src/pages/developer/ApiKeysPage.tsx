import * as React from "react";
import { Key, Plus, Ban, RefreshCw, Webhook, Plug, Copy, Check, ShieldCheck, Search } from "lucide-react";
import {
  PageLayout,
  PageHero,
  Card,
  CardContent,
  Button,
  Badge,
  Skeleton,
  Input,
} from "@k2net/ui";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { useTranslation } from "@k2net/i18n";
import { apiClient } from "../../lib/api-client";
import { getCurrentOrgSlug } from "../../lib/domain";
import {
  CreateApiKeyModal,
  ShowApiKeySecretModal,
  RevokeApiKeyDialog,
} from "../../components/developer";

export interface ApiKeyItem {
  id: string;
  name: string;
  keyPrefix: string;
  maskedKey: string;
  plainTextKey?: string;
  scopes: string[];
  isActive: boolean;
  lastUsedAt?: string | null;
  expiresAt?: string | null;
  createdAt: string;
}

export function ApiKeysPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const orgSlug = getCurrentOrgSlug() || "system";

  const [createModalOpen, setCreateModalOpen] = React.useState(false);
  const [createdKey, setCreatedKey] = React.useState<ApiKeyItem | null>(null);
  const [keyToRevoke, setKeyToRevoke] = React.useState<ApiKeyItem | null>(null);
  const [copiedKeyId, setCopiedKeyId] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");

  const { data: keys = [], isLoading, refetch, isFetching } = useQuery<ApiKeyItem[]>({
    queryKey: ["tenant-developer-api-keys", orgSlug],
    queryFn: async () => {
      const res = await apiClient<ApiKeyItem[]>(
        `/api/v1/organizations/${orgSlug}/developer/api-keys`
      );
      return Array.isArray(res) ? res : [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: {
      name: string;
      scopes: string[];
      expirationDays: number;
    }) => {
      return await apiClient<ApiKeyItem>(
        `/api/v1/organizations/${orgSlug}/developer/api-keys`,
        {
          method: "POST",
          body: JSON.stringify(payload),
        }
      );
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["tenant-developer-api-keys", orgSlug] });
      setCreateModalOpen(false);
      setCreatedKey(data);
      toast.success(t("settings.developer.created_success"));
    },
    onError: (err: unknown) => {
      const msg = (err as Error)?.message || "Failed to create API key";
      toast.error(msg);
    },
  });

  const revokeMutation = useMutation({
    mutationFn: async (keyId: string) => {
      return await apiClient(
        `/api/v1/organizations/${orgSlug}/developer/api-keys/${keyId}/revoke`,
        {
          method: "POST",
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-developer-api-keys", orgSlug] });
      setKeyToRevoke(null);
      toast.success(t("settings.developer.revoked_success"));
    },
    onError: (err: unknown) => {
      const msg = (err as Error)?.message || "Failed to revoke API key";
      toast.error(msg);
    },
  });

  const handleCopyMasked = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKeyId(id);
    toast.success(t("settings.developer.copied"));
    setTimeout(() => setCopiedKeyId(null), 2500);
  };

  const activeKeysCount = keys.filter((k) => k.isActive).length;
  const filteredKeys = keys.filter(
    (k) =>
      k.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      k.maskedKey.toLowerCase().includes(searchQuery.toLowerCase()) ||
      k.scopes.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <PageLayout variant="workspace" spaceY="space-y-6">
      <PageHero
        bordered={true}
        eyebrow={t("settings.developer.title")}
        title={t("settings.developer.api_keys_title")}
        icon={Key}
        subtitle={t("settings.developer.api_keys_subtitle")}
        meta={
          <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm text-muted-foreground font-medium">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-foreground font-mono">{activeKeysCount}</span>
              <span>{t("settings.developer.status_active")}</span>
            </div>
            <span className="text-muted-foreground/30 px-1">/</span>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-foreground font-mono">{keys.length}</span>
              <span>Total Keys</span>
            </div>
            <span className="text-muted-foreground/30 px-1">/</span>
            <div className="flex items-center gap-1 text-primary font-mono text-xs">
              <ShieldCheck className="size-3" />
              <span>Gateway Token Enforced</span>
            </div>
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="gap-1.5 h-7 px-2.5 text-xs font-medium"
            >
              <RefreshCw className={`size-3.5 ${isFetching ? "animate-spin" : ""}`} />
              <span>{t("license.refresh_btn")}</span>
            </Button>
            <Button
              size="sm"
              variant="default"
              onClick={() => setCreateModalOpen(true)}
              className="gap-1.5 h-7 px-2.5 text-xs font-medium shadow-xs"
            >
              <Plus className="size-3.5" />
              <span>{t("settings.developer.create_key_btn")}</span>
            </Button>
          </div>
        }
      />

      {/* Module Navigation Tabs */}
      <div className="flex items-center gap-1.5 border-b border-border/60 pb-3">
        <Link
          to="/developer/api-keys"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-secondary text-secondary-foreground shadow-2xs transition-colors"
        >
          <Key className="size-3.5 text-primary" />
          <span>{t("settings.developer.api_keys_title")}</span>
          <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0 border-border bg-muted/40">
            {keys.length}
          </Badge>
        </Link>
        <Link
          to="/developer/webhooks"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
        >
          <Webhook className="size-3.5" />
          <span>{t("settings.developer.webhooks_title")}</span>
        </Link>
        <Link
          to="/integrations"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
        >
          <Plug className="size-3.5" />
          <span>{t("nav.developer_gateways")}</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      {keys.length > 0 && (
        <div className="flex items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search keys by name, prefix, or scopes..."
              className="h-7 text-xs pl-8 pr-3"
            />
          </div>
          <span className="text-[11px] font-mono text-muted-foreground">
            Showing {filteredKeys.length} of {keys.length} keys
          </span>
        </div>
      )}

      {isLoading ? (
        <Card className="border border-border bg-card">
          <CardContent className="p-6 space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </CardContent>
        </Card>
      ) : keys.length === 0 ? (
        <Card className="border border-dashed border-border/80 bg-card/40">
          <CardContent className="p-12 text-center flex flex-col items-center justify-center space-y-4 max-w-md mx-auto">
            <div className="size-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
              <Key className="size-5" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-sm font-semibold text-foreground">
                {t("settings.developer.empty_keys")}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t("settings.developer.api_keys_subtitle")}
              </p>
            </div>
            <Button
              size="sm"
              variant="default"
              onClick={() => setCreateModalOpen(true)}
              className="gap-1.5 h-7 px-2.5 text-xs font-medium"
            >
              <Plus className="size-3.5" />
              <span>{t("settings.developer.create_key_btn")}</span>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2.5">
          {filteredKeys.map((key) => {
            const isExpired =
              key.expiresAt && new Date(key.expiresAt).getTime() < Date.now();
            return (
              <Card
                key={key.id}
                className="border border-border/80 bg-card hover:border-foreground/20 transition-colors shadow-2xs"
              >
                <div className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-foreground">
                        {key.name}
                      </span>
                      {key.isActive && !isExpired ? (
                        <Badge
                          variant="outline"
                          className="text-[10px] font-mono text-primary border-primary/30 bg-primary/10 py-0 px-1.5"
                        >
                          {t("settings.developer.status_active")}
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-[10px] font-mono text-muted-foreground border-border bg-muted/30 py-0 px-1.5"
                        >
                          {isExpired ? t("settings.developer.expires_at") : t("settings.developer.status_revoked")}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
                      <span className="bg-muted/60 px-2 py-0.5 rounded border border-border/60 text-[11px]">
                        {key.maskedKey}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyMasked(key.id, key.maskedKey)}
                        className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded hover:bg-muted"
                        title="Copy key prefix"
                      >
                        {copiedKeyId === key.id ? (
                          <Check className="size-3 text-primary" />
                        ) : (
                          <Copy className="size-3" />
                        )}
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-1 pt-0.5">
                      {key.scopes.map((scope) => (
                        <span
                          key={scope}
                          className="text-[10px] bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded font-mono"
                        >
                          {scope}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground sm:text-right shrink-0">
                    <div className="space-y-0.5 font-mono">
                      <div>
                        {t("settings.developer.expires_at")}:{" "}
                        <span className="font-medium text-foreground">
                          {key.expiresAt
                            ? new Date(key.expiresAt).toLocaleDateString()
                            : t("settings.developer.no_expiration")}
                        </span>
                      </div>
                      <div>
                        {t("settings.developer.last_used")}:{" "}
                        <span className="font-medium text-foreground">
                          {key.lastUsedAt
                            ? new Date(key.lastUsedAt).toLocaleDateString()
                            : "—"}
                        </span>
                      </div>
                    </div>

                    {key.isActive && !isExpired && (
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => setKeyToRevoke(key)}
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive border-border shrink-0 gap-1 h-6 px-2 text-[11px]"
                      >
                        <Ban className="size-3" />
                        <span>{t("settings.developer.revoke_btn")}</span>
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <CreateApiKeyModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSubmit={(payload) => createMutation.mutate(payload)}
        isPending={createMutation.isPending}
      />

      <ShowApiKeySecretModal
        apiKey={createdKey}
        onClose={() => setCreatedKey(null)}
      />

      <RevokeApiKeyDialog
        apiKey={keyToRevoke}
        onClose={() => setKeyToRevoke(null)}
        onConfirm={(keyId) => revokeMutation.mutate(keyId)}
        isPending={revokeMutation.isPending}
      />
    </PageLayout>
  );
}
