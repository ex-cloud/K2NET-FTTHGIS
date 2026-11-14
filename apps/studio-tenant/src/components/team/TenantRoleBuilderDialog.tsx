import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Input,
  Label,
  Badge,
  Checkbox,
} from "@k2net/ui";
import { Shield, Sparkles, Search, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "@k2net/i18n";
import { apiClient } from "../../lib/api-client";
import { getCurrentOrgSlug } from "../../lib/domain";
import {
  TENANT_ROLE_PRESETS,
  type TenantPermissionItem,
  type EditableTenantRole,
} from "./tenant-role-presets";

export type { TenantPermissionItem, EditableTenantRole };

interface TenantRoleBuilderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingRole: EditableTenantRole | null;
  onSuccess?: () => void;
}

export function TenantRoleBuilderDialog({
  open,
  onOpenChange,
  editingRole,
  onSuccess,
}: TenantRoleBuilderDialogProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const orgSlug = getCurrentOrgSlug() || "system";

  const [name, setName] = React.useState("");
  const [displayName, setDisplayName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [selectedCodes, setSelectedCodes] = React.useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);

  const { data: permissionsCatalog = [] } = useQuery<TenantPermissionItem[]>({
    queryKey: ["tenant-permissions-catalog"],
    queryFn: async () => {
      try {
        return await apiClient<TenantPermissionItem[]>("/api/v1/roles/permissions?scope=TENANT");
      } catch {
        return [];
      }
    },
    enabled: open,
    staleTime: 60 * 1000,
  });

  React.useEffect(() => {
    if (!open) return;
    if (editingRole) {
      setName(editingRole.name || "");
      setDisplayName(editingRole.displayName || editingRole.name || "");
      setDescription(editingRole.description || "");
      setSelectedCodes(new Set((editingRole.permissions || []).map((p) => p.code)));
    } else {
      setName("");
      setDisplayName("");
      setDescription("");
      setSelectedCodes(new Set(TENANT_ROLE_PRESETS.noc.codes));
    }
    setSearchQuery("");
  }, [editingRole, open]);

  const groupedPermissions = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const filtered = permissionsCatalog.filter(
      (p) =>
        !q ||
        p.code.toLowerCase().includes(q) ||
        (p.name || "").toLowerCase().includes(q) ||
        (p.module || "").toLowerCase().includes(q)
    );
    const groups: Record<string, TenantPermissionItem[]> = {};
    for (const perm of filtered) {
      const mod = perm.module || perm.code.split(".")[0].toUpperCase();
      if (!groups[mod]) groups[mod] = [];
      groups[mod].push(perm);
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [permissionsCatalog, searchQuery]);

  const togglePermission = (code: string) => {
    setSelectedCodes((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  const applyPreset = (presetKey: string) => {
    const preset = TENANT_ROLE_PRESETS[presetKey];
    if (preset) setSelectedCodes(new Set(preset.codes));
  };

  const toggleModuleAll = (items: TenantPermissionItem[], selectAll: boolean) => {
    setSelectedCodes((prev) => {
      const next = new Set(prev);
      for (const item of items) {
        if (selectAll) next.add(item.code);
        else next.delete(item.code);
      }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanDisplayName = displayName.trim();
    const cleanKey = (editingRole ? editingRole.name : name || cleanDisplayName)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_]+/g, "_")
      .replace(/^_+|_+$/g, "");

    if (!cleanKey) {
      toast.error(t("security.failed_create_role"));
      return;
    }

    setIsSaving(true);
    try {
      const selectedIds = permissionsCatalog
        .filter((p) => selectedCodes.has(p.code))
        .map((p) => p.id);

      if (editingRole) {
        if (!editingRole.isSystemRole) {
          await apiClient(`/api/v1/roles/${editingRole.id}`, {
            method: "PUT",
            body: JSON.stringify({
              displayName: cleanDisplayName || editingRole.displayName,
              description: description.trim(),
            }),
          });
        }
        await apiClient(`/api/v1/roles/${editingRole.id}/permissions`, {
          method: "PUT",
          body: JSON.stringify(selectedIds),
        });
        toast.success(
          t("security.role_updated_success", { name: cleanDisplayName || editingRole.name })
        );
      } else {
        const created = await apiClient<{ id: number; name: string }>("/api/v1/roles", {
          method: "POST",
          body: JSON.stringify({
            name: cleanKey,
            displayName: cleanDisplayName || cleanKey.toUpperCase(),
            description: description.trim(),
            scope: "TENANT",
          }),
        });
        if (created?.id) {
          await apiClient(`/api/v1/roles/${created.id}/permissions`, {
            method: "PUT",
            body: JSON.stringify(selectedIds),
          });
        }
        toast.success(
          t("security.role_created_success", { name: cleanDisplayName || cleanKey })
        );
      }

      await queryClient.invalidateQueries({ queryKey: ["tenant-roles-catalog", orgSlug] });
      await queryClient.invalidateQueries({ queryKey: ["user-profile-pbac"] });
      onOpenChange(false);
      onSuccess?.();
    } catch (err: unknown) {
      const fallbackErr = editingRole ? t("security.failed_update_role") : t("security.failed_create_role");
      toast.error(err instanceof Error ? err.message : fallbackErr);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[88vh] flex flex-col border-border/80 bg-card p-5">
        <DialogHeader className="shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
              <Shield className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-sm font-bold text-foreground">
                {editingRole
                  ? t("security.tenant_role_builder_edit_title")
                  : t("security.tenant_role_builder_title")}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {t("security.tenant_role_builder_desc")}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 space-y-3.5 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 shrink-0">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">{t("security.role_display_name")}</Label>
              <Input
                value={displayName}
                onChange={(e) => {
                  setDisplayName(e.target.value);
                  if (!editingRole) {
                    setName(
                      e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9_]+/g, "_")
                        .replace(/^_+|_+$/g, "")
                    );
                  }
                }}
                disabled={Boolean(editingRole?.isSystemRole)}
                placeholder={t("security.role_display_name_placeholder")}
                className="h-8 text-xs"
                required
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">{t("security.role_identifier_label")}</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={Boolean(editingRole)}
                placeholder={t("security.role_identifier_placeholder")}
                className="h-8 text-xs font-mono bg-muted/30"
                required
              />
            </div>
          </div>

          <div className="space-y-1 shrink-0">
            <Label className="text-xs font-semibold">{t("security.role_description_label")}</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={Boolean(editingRole?.isSystemRole)}
              placeholder={t("security.role_description_placeholder")}
              className="h-8 text-xs"
            />
          </div>

          <div className="rounded-lg border border-border/60 bg-muted/20 p-2.5 space-y-2 shrink-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <Sparkles className="size-3.5 text-primary" />
                <span>{t("security.auto_recommend_title")}</span>
              </div>
              <Badge variant="outline" className="text-[10px] font-mono bg-primary/10 text-primary border-primary/20">
                {t("security.selected_permissions_count", { count: selectedCodes.size })}
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground">
              {t("security.auto_recommend_desc")}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(TENANT_ROLE_PRESETS).map(([key, preset]) => (
                <Button
                  key={key}
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={() => applyPreset(key)}
                  className="h-6 px-2 text-[11px] font-medium border-border/80 bg-card hover:bg-accent cursor-pointer"
                >
                  {t(preset.labelKey as never)}
                </Button>
              ))}
            </div>
          </div>

          <div className="relative shrink-0">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("common.search")}
              className="h-7.5 pl-8 text-xs bg-muted/20 border-border/80"
            />
          </div>

          <div className="flex-1 min-h-[200px] max-h-[280px] overflow-y-auto rounded-lg border border-border/60 bg-background/40 p-3 space-y-3 custom-scrollbar">
            {groupedPermissions.map(([moduleName, items]) => {
              const allSelected = items.every((item) => selectedCodes.has(item.code));
              return (
                <div key={moduleName} className="space-y-1.5">
                  <div className="flex items-center justify-between border-b border-border/40 pb-1">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">
                      {moduleName} ({items.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleModuleAll(items, !allSelected)}
                      className="text-[10px] font-medium text-primary hover:underline cursor-pointer"
                    >
                      {allSelected ? t("security.clear_all_module") : t("security.select_all_module")}
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {items.map((perm) => {
                      const checked = selectedCodes.has(perm.code);
                      return (
                        <label
                          key={perm.code}
                          className={`flex items-start gap-2 rounded-md border p-2 text-xs cursor-pointer transition-colors ${
                            checked
                              ? "border-primary/40 bg-primary/5 text-foreground"
                              : "border-border/50 bg-card/60 text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={() => togglePermission(perm.code)}
                            className="mt-0.5"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="font-mono text-[11px] font-semibold truncate text-foreground">
                              {perm.code}
                            </div>
                            <div className="text-[10px] text-muted-foreground truncate">
                              {perm.name}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <DialogFooter className="pt-2 gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
              className="h-7 px-2.5 text-xs font-medium"
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              variant="default"
              size="sm"
              disabled={isSaving}
              className="h-7 px-2.5 text-xs font-medium gap-1.5"
            >
              {isSaving ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  {t("security.saving_role")}
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-3.5" />
                  {t("security.save_role_changes")}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
