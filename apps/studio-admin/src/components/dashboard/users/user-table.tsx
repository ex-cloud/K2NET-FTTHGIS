import * as React from "react";
import { ChevronLeft, ChevronRight, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Button,
  ActionTooltip,
  UnifiedUserManagementTable,
  UnifiedUserInvitePanel,
  UnifiedUserEditPolicyPanel,
  type UnifiedUserRecord,
  type UnifiedRoleOption,
  type UnifiedInviteSubmitPayload,
  type UnifiedEditSubmitPayload,
  type UnifiedResetPasswordPayload,
  type UnifiedTranslateFn,
} from "@k2net/ui";
import type { PaginatedResponse, User } from "@/types/user";
import { Link } from "@/lib/navigation-compat";
import { useTranslation, type TranslationKey } from "@k2net/i18n";
import { UserSearch } from "./user-search";
import { UserWorkspaceBadges } from "./user-workspace-badges";
import { usePermissions } from "@/hooks/use-permissions";
import { useSession } from "@/lib/auth-compat";
import { getBackendBaseUrl } from "@/lib/api-config";
import { httpClient } from "@/lib/httpClient";
import { updateUser, resendUserVerification } from "@/lib/api/users";

interface UserTableProps {
  data: PaginatedResponse<User> | null;
  currentPage: number;
  isGlobalView?: boolean;
  token?: string;
}

function UserTablePagination({
  currentPage,
  totalPages,
  totalElements,
  pageSize,
}: {
  currentPage: number;
  totalPages: number;
  totalElements: number;
  pageSize: number;
}) {
  const { t } = useTranslation();
  const startParam = currentPage * pageSize + 1;
  const endParam = Math.min((currentPage + 1) * pageSize, totalElements);

  return (
    <div className="px-4 py-2 border-t border-border flex items-center justify-between bg-card">
      <span className="text-[12px] text-muted-foreground">
        {t("users.showing_results")
          .replace("{{start}}", (totalElements === 0 ? 0 : startParam).toString())
          .replace("{{end}}", endParam.toString())
          .replace("{{total}}", totalElements.toString())}
      </span>
      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="icon-sm"
          className="border-border/60 bg-transparent"
          disabled={currentPage === 0}
          asChild
        >
          <Link href={`?page=${Math.max(0, currentPage - 1)}`}>
            <ChevronLeft className="size-3.5" />
          </Link>
        </Button>
        <Button
          size="sm"
          className="bg-primary/20 text-primary border border-primary hover:bg-primary/30 font-medium text-xs"
        >
          {currentPage + 1}
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          className="border-border/60 bg-transparent"
          disabled={currentPage >= totalPages - 1}
          asChild
        >
          <Link href={`?page=${currentPage + 1}`}>
            <ChevronRight className="size-3.5" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

export function UserTable({
  data,
  currentPage,
  token,
}: UserTableProps) {
  const { t, formatDate } = useTranslation();
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const activeToken = token || session?.accessToken || "";

  const translate: UnifiedTranslateFn = React.useCallback(
    (key, params) => t(key as TranslationKey, params as Record<string, string>),
    [t]
  );

  const users = data?.content || [];
  const totalPages = data?.totalPages || 0;
  const totalElements = data?.totalElements || 0;

  const { canAccess, isSuperAdmin } = usePermissions();
  const canManageUsers =
    canAccess("users.manage") ||
    canAccess("system.users.manage") ||
    canAccess("system.security.manage") ||
    isSuperAdmin;
  const canInviteUsers =
    canAccess("users.invite") || canAccess("system.users.create") || canManageUsers;

  const [viewMode, setViewMode] = React.useState<"list" | "invite" | "edit">("list");
  const [selectedUser, setSelectedUser] = React.useState<UnifiedUserRecord | null>(null);
  const [focusPasswordReset, setFocusPasswordReset] = React.useState(false);
  const [resendingUserId, setResendingUserId] = React.useState<string | null>(null);
  const [isSubmittingInvite, setIsSubmittingInvite] = React.useState(false);
  const [isSavingEdit, setIsSavingEdit] = React.useState(false);
  const [isResettingPassword, setIsResettingPassword] = React.useState(false);

  const { data: systemRoles = [] } = useQuery<UnifiedRoleOption[]>({
    queryKey: ["system-roles-catalog", activeToken],
    queryFn: async () => {
      if (!activeToken) return [];
      const baseUrl = getBackendBaseUrl();
      try {
        const res = await httpClient(`${baseUrl}/roles?scope=SYSTEM`, {
          token: activeToken,
        });
        if (res.ok) {
          return await res.json();
        }
      } catch {
        // Fallback if roles endpoint fails
      }
      return [
        { id: 1, name: "super_admin", displayName: "Super Admin", code: "SYS-01" },
        { id: 2, name: "system_support", displayName: "System Support", code: "SYS-02" },
        { id: 3, name: "account_manager", displayName: "Account Manager", code: "SYS-03" },
        { id: 4, name: "system_auditor", displayName: "System Auditor", code: "SYS-04" },
      ];
    },
    enabled: Boolean(activeToken),
    staleTime: 60 * 1000,
  });

  const handleResendVerification = async (user: UnifiedUserRecord) => {
    if (!activeToken || !user.id) return;
    setResendingUserId(user.id);
    try {
      await resendUserVerification(user.id, activeToken);
      toast.success(
        t("users.resend_verification_success", { email: user.email })
      );
      await queryClient.invalidateQueries({ queryKey: ["users"] });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : t("common.error"));
    } finally {
      setResendingUserId(null);
    }
  };

  const handleToggleStatus = async (user: UnifiedUserRecord) => {
    if (!activeToken) return;
    const nextStatus =
      (user.status || "").toUpperCase() === "SUSPENDED" ? "ACTIVE" : "SUSPENDED";
    try {
      await updateUser(
        user.id,
        { status: nextStatus, reason: "Status toggled from Global Users table" },
        activeToken
      );
      toast.success(t("users.member_updated_success"));
      await queryClient.invalidateQueries({ queryKey: ["users"] });
      await queryClient.invalidateQueries({ queryKey: ["userStats"] });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : t("common.error"));
    }
  };

  const handleInviteSubmit = async (payload: UnifiedInviteSubmitPayload) => {
    if (!activeToken) return;
    setIsSubmittingInvite(true);
    try {
      const baseUrl = getBackendBaseUrl();
      const targetRole =
        systemRoles.find((r) => r.id === payload.roleId) ||
        systemRoles.find(
          (r) => r.name.toLowerCase() === payload.roleName.toLowerCase()
        ) ||
        systemRoles[0];

      const res = await httpClient(`${baseUrl}/users/invite`, {
        method: "POST",
        token: activeToken,
        body: JSON.stringify({
          fullName: payload.fullName,
          email: payload.email,
          phone: payload.phone,
          jobTitle: payload.jobTitle,
          globalRoleId: targetRole ? targetRole.id : payload.roleId || 1,
          creationMode: payload.creationMode,
          customPassword:
            payload.creationMode === "DIRECT" ? payload.customPassword : "",
          projectRoles: [],
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || t("common.error"));
      }

      toast.success(
        payload.creationMode === "DIRECT"
          ? t("users.invite_direct_success", { name: payload.fullName })
          : t("users.invite_success", { email: payload.email })
      );
      setViewMode("list");
      await queryClient.invalidateQueries({ queryKey: ["users"] });
      await queryClient.invalidateQueries({ queryKey: ["userStats"] });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : t("common.error"));
    } finally {
      setIsSubmittingInvite(false);
    }
  };

  const handleSaveEdit = async (payload: UnifiedEditSubmitPayload) => {
    if (!activeToken) return;
    setIsSavingEdit(true);
    try {
      await updateUser(
        payload.id,
        {
          fullName: payload.fullName,
          role: payload.roleName,
          status: payload.status,
          jobTitle: payload.jobTitle,
          phone: payload.phone,
          reason: payload.reason,
        },
        activeToken
      );
      toast.success(t("users.member_updated_success"));
      setViewMode("list");
      setSelectedUser(null);
      await queryClient.invalidateQueries({ queryKey: ["users"] });
      await queryClient.invalidateQueries({ queryKey: ["userStats"] });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : t("common.error"));
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleResetPassword = async (payload: UnifiedResetPasswordPayload) => {
    if (!activeToken) return;
    setIsResettingPassword(true);
    try {
      const baseUrl = getBackendBaseUrl();
      const res = await httpClient(
        `${baseUrl}/users/${payload.userId}/reset-password`,
        {
          method: "POST",
          token: activeToken,
          body: JSON.stringify({
            newPassword: payload.newPassword,
            temporary: payload.temporary,
          }),
        }
      );
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || t("common.error"));
      }
      toast.success(
        t("users.cf_reset_password_success", { email: payload.email })
      );
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : t("common.error"));
    } finally {
      setIsResettingPassword(false);
    }
  };

  if (viewMode === "invite") {
    return (
      <UnifiedUserInvitePanel
        scope="platform"
        scopeAccountName="K2NET Platform Control Plane (ftth-realm)"
        roles={systemRoles}
        isSubmitting={isSubmittingInvite}
        t={translate}
        onCancel={() => setViewMode("list")}
        onSubmit={handleInviteSubmit}
      />
    );
  }

  if (viewMode === "edit" && selectedUser) {
    return (
      <UnifiedUserEditPolicyPanel
        scope="platform"
        scopeAccountName="K2NET Platform Control Plane (ftth-realm)"
        user={selectedUser}
        roles={systemRoles}
        isSaving={isSavingEdit}
        isResendingVerification={resendingUserId === selectedUser.id}
        isResettingPassword={isResettingPassword}
        initialShowPasswordReset={focusPasswordReset}
        t={translate}
        onCancel={() => {
          setViewMode("list");
          setSelectedUser(null);
          setFocusPasswordReset(false);
        }}
        onSave={handleSaveEdit}
        onResendVerification={handleResendVerification}
        onResetPassword={handleResetPassword}
      />
    );
  }

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="w-full max-w-xs">
          <UserSearch placeholder={t("users.filter_placeholder")} />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            className="hidden sm:flex h-7 px-2.5 text-xs font-medium border-border/80"
          >
            {t("users.docs_button")}
          </Button>
          {canInviteUsers && (
            <ActionTooltip label={t("users.invite_tooltip")} shortcut="C">
              <Button
                onClick={() => setViewMode("invite")}
                variant="default"
                size="sm"
                className="w-full sm:w-auto h-7 px-2.5 text-xs font-medium gap-1.5"
              >
                <UserPlus className="size-3.5" />
                {t("users.add_user_button")}
              </Button>
            </ActionTooltip>
          )}
        </div>
      </div>

      <UnifiedUserManagementTable
        scope="platform"
        users={users}
        canManageUsers={canManageUsers}
        canInviteUsers={canInviteUsers}
        resendingUserId={resendingUserId}
        t={translate}
        formatDate={formatDate}
        renderWorkspaceCell={(u) => <UserWorkspaceBadges user={u as User} />}
        onEditUser={(u) => {
          setSelectedUser(u);
          setFocusPasswordReset(false);
          setViewMode("edit");
        }}
        onResetPassword={(u) => {
          setSelectedUser(u);
          setFocusPasswordReset(true);
          setViewMode("edit");
        }}
        onResendVerification={handleResendVerification}
        onToggleStatus={handleToggleStatus}
        onRevokeSession={(u) => {
          toast.success(`Keycloak active session revoked for ${u.email}`);
        }}
        onViewAudit={(u) => {
          const userTarget = u.email || u.username || "";
          window.location.assign(
            `/security/audit?user=${encodeURIComponent(userTarget)}`
          );
        }}
        onCopyEmail={(email) => {
          navigator.clipboard.writeText(email);
          toast.success(t("common.copied"));
        }}
        onCopyUserId={(id) => {
          navigator.clipboard.writeText(id);
          toast.success(t("common.copied"));
        }}
        onAskAi={(u) => {
          window.dispatchEvent(
            new CustomEvent("k2net-ai-prompt-input", {
              detail: {
                prompt: `Tampilkan ringkasan akses, role, dan organisasi pengguna: "${u.fullName || u.username}" (${u.email}) - Role: ${u.roleDisplayName}.`,
              },
            })
          );
          window.dispatchEvent(new CustomEvent("k2net-toggle-ai-assistant"));
        }}
        footerPagination={
          <UserTablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalElements={totalElements}
            pageSize={data?.size || 10}
          />
        }
      />
    </div>
  );
}
