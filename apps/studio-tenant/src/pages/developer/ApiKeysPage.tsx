import * as React from "react";
import { Key, Plus, Ban } from "lucide-react";
import {
  PageLayout,
  PageHero,
  Card,
  CardContent,
  Button,
  Badge,
  Skeleton,
} from "@k2net/ui";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslation } from "@k2net/i18n";
import { apiClient } from "../../lib/api-client";
import { getCurrentOrgSlug } from "../../lib/domain";
import { CreateApiKeyModal } from "./components/CreateApiKeyModal";
import { ShowApiKeySecretModal } from "./components/ShowApiKeySecretModal";
import { RevokeApiKeyDialog } from "./components/RevokeApiKeyDialog";

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

  const { data: keys = [], isLoading } = useQuery<ApiKeyItem[]>({
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

  return (
    <PageLayout variant="workspace" spaceY="space-y-6">
      <PageHero
        bordered={false}
        className="pb-0"
        eyebrow={t("settings.developer.title")}
        title={t("settings.developer.api_keys_title")}
        icon={Key}
        subtitle={t("settings.developer.api_keys_subtitle")}
        actions={
          <Button
            size="sm"
            onClick={() => setCreateModalOpen(true)}
            className="gap-1.5 shadow-sm"
          >
            <Plus className="size-3.5" />
            <span>{t("settings.developer.create_key_btn")}</span>
          </Button>
        }
      />

      {isLoading ? (
        <Card className="border border-border bg-card">
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      ) : keys.length === 0 ? (
        <Card className="border border-dashed border-border bg-card/50">
          <CardContent className="p-12 text-center flex flex-col items-center justify-center space-y-4">
            <div className="size-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
              <Key className="size-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-foreground">
                {t("settings.developer.empty_keys")}
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm">
                {t("settings.developer.api_keys_subtitle")}
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => setCreateModalOpen(true)}
              className="gap-1.5"
            >
              <Plus className="size-3.5" />
              <span>{t("settings.developer.create_key_btn")}</span>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {keys.map((key) => {
            const isExpired =
              key.expiresAt && new Date(key.expiresAt).getTime() < Date.now();
            return (
              <Card
                key={key.id}
                className="border border-border bg-card hover:border-foreground/20 transition-colors shadow-xs"
              >
                <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-foreground">
                        {key.name}
                      </span>
                      {key.isActive && !isExpired ? (
                        <Badge
                          variant="outline"
                          className="text-[11px] font-mono text-primary border-primary/30 bg-primary/10"
                        >
                          {t("settings.developer.status_active")}
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-[11px] font-mono text-muted-foreground border-border bg-muted/30"
                        >
                          {isExpired ? t("settings.developer.expires_at") : t("settings.developer.status_revoked")}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
                      <span className="bg-muted px-2 py-0.5 rounded border border-border">
                        {key.maskedKey}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
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

                  <div className="flex items-center gap-3 text-xs text-muted-foreground sm:text-right">
                    <div className="space-y-0.5">
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
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive border-border shrink-0 gap-1"
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
