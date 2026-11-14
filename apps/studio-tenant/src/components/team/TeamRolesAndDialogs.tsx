import * as React from "react";
import { Shield, Loader2, Pencil, Trash2 } from "lucide-react";
import {
  Button,
  Card,
  Badge,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import type { EditableTenantRole } from "./TenantRoleBuilderDialog";

export interface LiveRoleDto {
  id: number;
  name: string;
  displayName?: string;
  code?: string;
  description?: string;
  isSystemRole?: boolean;
  permissions?: Array<{ id: number; code: string }>;
}

export interface RoleCardItem {
  raw: LiveRoleDto;
  id: number;
  name: string;
  isSystemRole: boolean;
  code: string;
  title: string;
  description: string;
  permissions: string[];
}

export interface RemovableMemberInfo {
  id: string;
  email: string;
  username: string;
  fullName: string;
}

export function TeamRolesGrid({
  isLoading,
  rolesList,
  canManageRoles,
  onEditRole,
  onDeleteRole,
}: {
  isLoading: boolean;
  rolesList: RoleCardItem[];
  canManageRoles: boolean;
  onEditRole: (role: EditableTenantRole) => void;
  onDeleteRole: (role: EditableTenantRole) => void;
}) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {rolesList.map((role) => (
        <Card key={role.id} className="p-4 border-border/60 bg-card space-y-3 shadow-xs flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Shield className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-bold text-foreground">{role.title}</h3>
                    <Badge variant="outline" className="text-[9px] font-mono px-1.5 py-0 bg-muted/40">
                      {role.isSystemRole ? t("security.role_badge_template") : t("security.role_badge_custom")}
                    </Badge>
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground">{role.name}</span>
                </div>
              </div>
              {role.code && (
                <Badge variant="outline" className="text-[10px] font-mono bg-primary/10 text-primary border-primary/20">
                  {role.code}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed min-h-[36px]">{role.description}</p>
            <div className="pt-2 border-t border-border/40">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                {t("security.roles_matrix")} ({role.permissions.length}):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {role.permissions.map((p, pIdx) => (
                  <span
                    key={pIdx}
                    className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted/60 text-foreground border border-border/60"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {canManageRoles && (
            <div className="pt-3 border-t border-border/40 flex items-center justify-end gap-2">
              {!role.isSystemRole && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDeleteRole(role.raw)}
                  className="h-7 px-2.5 text-xs font-medium text-destructive hover:text-destructive gap-1.5"
                >
                  <Trash2 className="size-3.5" />
                  {t("common.delete")}
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEditRole(role.raw)}
                className="h-7 px-2.5 text-xs font-medium gap-1.5"
              >
                <Pencil className="size-3.5" />
                {t("security.edit_permissions_btn")}
              </Button>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}

export function TeamConfirmDialogs({
  removingMember,
  onCloseRemoveMember,
  onConfirmRemoveMember,
  isRemovingMember,
  deletingRole,
  onCloseDeleteRole,
  onConfirmDeleteRole,
  isDeletingRole,
}: {
  removingMember: RemovableMemberInfo | null;
  onCloseRemoveMember: () => void;
  onConfirmRemoveMember: () => void;
  isRemovingMember: boolean;
  deletingRole: EditableTenantRole | null;
  onCloseDeleteRole: () => void;
  onConfirmDeleteRole: () => void;
  isDeletingRole: boolean;
}) {
  const { t } = useTranslation();

  return (
    <>
      <Dialog open={Boolean(removingMember)} onOpenChange={(open) => !open && onCloseRemoveMember()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-destructive">
              {t("users.member_remove_confirm_title")}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {t("users.member_remove_confirm_desc", {
                name: removingMember?.fullName || removingMember?.username || "",
                email: removingMember?.email || "",
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onCloseRemoveMember}
              disabled={isRemovingMember}
              className="h-7 px-2.5 text-xs font-medium"
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={onConfirmRemoveMember}
              disabled={isRemovingMember}
              className="h-7 px-2.5 text-xs font-medium gap-1.5"
            >
              {isRemovingMember && <Loader2 className="size-3.5 animate-spin" />}
              {t("users.member_remove_btn")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deletingRole)} onOpenChange={(open) => !open && onCloseDeleteRole()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-destructive">
              {t("security.delete_role_confirm_title")}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {t("security.delete_role_confirm_desc", {
                name: deletingRole?.displayName || deletingRole?.name || "",
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onCloseDeleteRole}
              disabled={isDeletingRole}
              className="h-7 px-2.5 text-xs font-medium"
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={onConfirmDeleteRole}
              disabled={isDeletingRole}
              className="h-7 px-2.5 text-xs font-medium gap-1.5"
            >
              {isDeletingRole && <Loader2 className="size-3.5 animate-spin" />}
              {t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
