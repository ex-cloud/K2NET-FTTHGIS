import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  UnifiedUserManagementTable,
  UnifiedUserInvitePanel,
  UnifiedUserEditPolicyPanel,
  type UnifiedUserRecord,
  type UnifiedInviteSubmitPayload,
  type UnifiedEditSubmitPayload,
  type UnifiedResetPasswordPayload,
  type UnifiedTranslateFn,
} from "@k2net/ui";
import { useTranslation, type TranslationKey } from "@k2net/i18n";
import type { EnrichedOrganization } from "../types";
import { useOrgTeamState } from "./team/useOrgTeamState";
import { TeamHeaderBar } from "./team/TeamHeaderBar";
import { useSession } from "@/lib/auth-compat";
import { getBackendBaseUrl } from "@/lib/api-config";
import { httpClient } from "@/lib/httpClient";

export type { TenantUser, TenantUserRole, TenantUserStatus } from "./team/types";

interface OrgTeamAccessTabProps {
  organization: EnrichedOrganization;
}

export function OrgTeamAccessTab({ organization: org }: OrgTeamAccessTabProps) {
  const { t, formatDate } = useTranslation();
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const token = session?.accessToken || "";

  const translate: UnifiedTranslateFn = React.useCallback(
    (key, params) => t(key as TranslationKey, params as Record<string, string>),
    [t]
  );

  const {
    availableRoles,
    orgProjects,
    effectiveUsers,
    isLoading,
    handleCopy,
    handleToggleStatus,
    handleRemoveUser,
  } = useOrgTeamState(org);

  const [viewMode, setViewMode] = React.useState<"list" | "invite" | "edit">("list");
  const [selectedUser, setSelectedUser] = React.useState<UnifiedUserRecord | null>(null);
  const [focusPasswordReset, setFocusPasswordReset] = React.useState(false);
  const [resendingUserId, setResendingUserId] = React.useState<string | null>(null);
  const [isSubmittingInvite, setIsSubmittingInvite] = React.useState(false);
  const [isSavingEdit, setIsSavingEdit] = React.useState(false);
  const [isDeletingUser, setIsDeletingUser] = React.useState(false);
  const [isResettingPassword, setIsResettingPassword] = React.useState(false);

  const unifiedUsers: UnifiedUserRecord[] = React.useMemo(
    () =>
      effectiveUsers.map((u) => ({
        id: u.id,
        email: u.email,
        username: u.username,
        fullName: u.name,
        phone: u.phone,
        jobTitle: u.jobTitle,
        status: u.status,
        emailVerified: u.emailVerified,
        mfaEnabled: u.mfaEnabled,
        roleId: u.roleId ?? null,
        roleName: u.role,
        roleDisplayName: u.roleDisplayName,
        roleCode: u.roleCode ?? null,
        organizationId: org.id,
        organizationName: org.name,
        organizationSlug: org.slug,
        lastLoginAt: u.lastLoginAt,
        lastLogin: u.lastLogin,
        lastLoginIp: u.lastLoginIp,
        createdAt: u.createdAt,
      })),
    [effectiveUsers, org.id, org.name, org.slug]
  );

  const handleResendVerification = async (user: UnifiedUserRecord) => {
    if (!token || !user.id) return;
    setResendingUserId(user.id);
    try {
      const baseUrl = getBackendBaseUrl();
      const res = await httpClient(
        `${baseUrl}/organizations/${encodeURIComponent(org.slug)}/members/${encodeURIComponent(user.id)}/resend-invitation`,
        {
          method: "POST",
          token,
        }
      );
      if (!res.ok) {
        const fallback = await httpClient(
          `${baseUrl}/users/${encodeURIComponent(user.id)}/resend-verification`,
          {
            method: "POST",
            token,
          }
        );
        if (!fallback.ok) {
          throw new Error(t("common.error"));
        }
      }
      toast.success(
        t("users.resend_verification_success", { email: user.email })
      );
      await queryClient.invalidateQueries({
        queryKey: ["tenant-team-users", org.slug],
      });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : t("common.error"));
    } finally {
      setResendingUserId(null);
    }
  };

  const handleInviteSubmit = async (payload: UnifiedInviteSubmitPayload) => {
    if (!token) return;
    setIsSubmittingInvite(true);
    try {
      const baseUrl = getBackendBaseUrl();
      const targetRole =
        availableRoles.find((r) => r.id === payload.roleId) ||
        availableRoles.find(
          (r) => r.name.toLowerCase() === payload.roleName.toLowerCase()
        ) ||
        availableRoles[0];
      const roleId = targetRole ? targetRole.id : payload.roleId || 5;

      const res = await httpClient(
        `${baseUrl}/organizations/${org.id || org.slug}/users/invite`,
        {
          method: "POST",
          token,
          body: JSON.stringify({
            fullName: payload.fullName,
            email: payload.email,
            phone: payload.phone,
            jobTitle: payload.jobTitle,
            globalRoleId: roleId,
            creationMode: payload.creationMode,
            customPassword:
              payload.creationMode === "DIRECT" ? payload.customPassword : "",
            projectRoles: payload.projectId
              ? [{ projectId: payload.projectId, roleId }]
              : [],
          }),
        }
      );

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
      await queryClient.invalidateQueries({
        queryKey: ["tenant-team-users", org.slug],
      });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : t("common.error"));
    } finally {
      setIsSubmittingInvite(false);
    }
  };

  const handleSaveEdit = async (payload: UnifiedEditSubmitPayload) => {
    if (!token) return;
    setIsSavingEdit(true);
    try {
      const baseUrl = getBackendBaseUrl();
      const res = await httpClient(`${baseUrl}/users/${payload.id}`, {
        method: "PUT",
        token,
        body: JSON.stringify({
          fullName: payload.fullName,
          role: payload.roleName.toLowerCase(),
          roleId: payload.roleId,
          status: payload.status,
          jobTitle: payload.jobTitle,
          phone: payload.phone,
          reason: payload.reason,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || t("common.error"));
      }

      toast.success(t("users.member_updated_success"));
      setViewMode("list");
      setSelectedUser(null);
      await queryClient.invalidateQueries({
        queryKey: ["tenant-team-users", org.slug],
      });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : t("common.error"));
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleResetPassword = async (payload: UnifiedResetPasswordPayload) => {
    if (!token) return;
    setIsResettingPassword(true);
    try {
      const baseUrl = getBackendBaseUrl();
      const res = await httpClient(
        `${baseUrl}/users/${payload.userId}/reset-password`,
        {
          method: "POST",
          token,
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

  const handleDeleteUser = async (user: UnifiedUserRecord) => {
    setIsDeletingUser(true);
    try {
      await handleRemoveUser(user.id, user.fullName || user.email);
      setViewMode("list");
      setSelectedUser(null);
    } finally {
      setIsDeletingUser(false);
    }
  };

  const scopeAccountName = `${org.name} (${org.slug}.kdua.net)`;

  if (viewMode === "invite") {
    return (
      <UnifiedUserInvitePanel
        scope="tenant"
        scopeAccountName={scopeAccountName}
        roles={availableRoles}
        projects={orgProjects}
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
        scope="tenant"
        scopeAccountName={scopeAccountName}
        user={selectedUser}
        roles={availableRoles}
        projects={orgProjects}
        isSaving={isSavingEdit}
        isDeleting={isDeletingUser}
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
        onDelete={handleDeleteUser}
        onResendVerification={handleResendVerification}
        onResetPassword={handleResetPassword}
      />
    );
  }

  return (
    <div className="space-y-6">
      <TeamHeaderBar
        slug={org.slug}
        onOpenInvite={() => setViewMode("invite")}
      />

      <UnifiedUserManagementTable
        scope="tenant"
        users={unifiedUsers}
        isLoading={isLoading}
        canManageUsers={true}
        canInviteUsers={true}
        resendingUserId={resendingUserId}
        t={translate}
        formatDate={formatDate}
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
        onToggleStatus={(u) => {
          const matched = effectiveUsers.find((eu) => eu.id === u.id);
          if (matched) handleToggleStatus(matched);
        }}
        onViewAudit={(u) => {
          window.location.assign(
            `/security/audit?user=${encodeURIComponent(u.email)}`
          );
        }}
        onCopyEmail={(email) => handleCopy(email, "Email")}
        onCopyUserId={(id) => handleCopy(id, "User ID")}
        onRemoveUser={(u) => handleRemoveUser(u.id, u.fullName || u.email)}
      />
    </div>
  );
}
