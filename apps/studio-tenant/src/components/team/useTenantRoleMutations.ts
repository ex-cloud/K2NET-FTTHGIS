import * as React from "react";
import { toast } from "sonner";
import type { QueryClient } from "@tanstack/react-query";
import type { UnifiedResetPasswordPayload, UnifiedTranslateFn } from "@k2net/ui";
import { apiClient } from "../../lib/api-client";
import type { EditableTenantRole } from "./TenantRoleBuilderDialog";

export interface UseTenantRoleMutationsArgs {
  t: UnifiedTranslateFn;
  queryClient: QueryClient;
  deletingRole: EditableTenantRole | null;
  setDeletingRole: (r: EditableTenantRole | null) => void;
  setIsDeletingRole: (v: boolean) => void;
  setIsResettingPassword: (v: boolean) => void;
}

export function useTenantRoleMutations({
  t,
  queryClient,
  deletingRole,
  setDeletingRole,
  setIsDeletingRole,
  setIsResettingPassword,
}: UseTenantRoleMutationsArgs) {
  const handleResetPassword = React.useCallback(
    async (payload: UnifiedResetPasswordPayload) => {
      setIsResettingPassword(true);
      try {
        await apiClient(
          `/api/v1/users/${encodeURIComponent(payload.userId)}/reset-password`,
          {
            method: "POST",
            body: JSON.stringify({
              newPassword: payload.newPassword,
              temporary: payload.temporary,
            }),
          }
        );
        toast.success(
          t("users.cf_reset_password_success", { email: payload.email })
        );
      } catch (err: unknown) {
        toast.error((err as Error)?.message || t("common.error"));
      } finally {
        setIsResettingPassword(false);
      }
    },
    [setIsResettingPassword, t]
  );

  const handleConfirmDeleteRole = React.useCallback(async () => {
    if (!deletingRole) return;
    setIsDeletingRole(true);
    try {
      await apiClient(`/api/v1/roles/${deletingRole.id}`, { method: "DELETE" });
      toast.success(
        t("security.role_deleted_success", {
          name: deletingRole.displayName || deletingRole.name,
        })
      );
      await queryClient.invalidateQueries({
        queryKey: ["tenant-roles-catalog"],
      });
      setDeletingRole(null);
    } catch (err: unknown) {
      toast.error((err as Error)?.message || t("security.failed_delete_role"));
    } finally {
      setIsDeletingRole(false);
    }
  }, [deletingRole, queryClient, setDeletingRole, setIsDeletingRole, t]);

  return {
    handleResetPassword,
    handleConfirmDeleteRole,
  };
}
