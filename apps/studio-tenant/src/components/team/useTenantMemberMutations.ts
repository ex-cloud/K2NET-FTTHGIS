import * as React from "react";
import { toast } from "sonner";
import type { QueryClient } from "@tanstack/react-query";
import type {
  UnifiedInviteSubmitPayload,
  UnifiedEditSubmitPayload,
  UnifiedTranslateFn,
} from "@k2net/ui";
import { apiClient } from "../../lib/api-client";
import type { UserDto } from "./TeamMembersTableSection";

export interface UseTenantMemberMutationsArgs {
  orgSlug: string;
  t: UnifiedTranslateFn;
  queryClient: QueryClient;
  removingMember: UserDto | null;
  setRemovingMember: (m: UserDto | null) => void;
  setIsRemovingMember: (v: boolean) => void;
  setResendingMemberId: (id: string | null) => void;
  setIsSubmittingInvite: (v: boolean) => void;
  setIsSavingEdit: (v: boolean) => void;
  setMemberViewMode: (mode: "list" | "invite" | "edit") => void;
  setSelectedMember: (m: UserDto | null) => void;
}

async function requestInviteMember(
  orgSlug: string,
  payload: UnifiedInviteSubmitPayload
) {
  return apiClient(
    `/api/v1/organizations/${encodeURIComponent(orgSlug)}/members/invite`,
    {
      method: "POST",
      body: JSON.stringify({
        email: payload.email,
        fullName: payload.fullName,
        phone: payload.phone,
        jobTitle: payload.jobTitle,
        roleName: payload.roleName,
        globalRoleId: payload.roleId,
        creationMode: payload.creationMode,
        customPassword:
          payload.creationMode === "DIRECT" ? payload.customPassword : "",
        projectId: payload.projectId || null,
      }),
    }
  );
}

async function requestUpdateMember(payload: UnifiedEditSubmitPayload) {
  return apiClient(`/api/v1/users/${encodeURIComponent(payload.id)}`, {
    method: "PUT",
    body: JSON.stringify({
      fullName: payload.fullName,
      role: payload.roleName.toLowerCase(),
      status: payload.status,
      jobTitle: payload.jobTitle,
      phone: payload.phone,
      reason: payload.reason || "Updated by Tenant Administrator",
    }),
  });
}

export function useTenantMemberMutations({
  orgSlug,
  t,
  queryClient,
  removingMember,
  setRemovingMember,
  setIsRemovingMember,
  setResendingMemberId,
  setIsSubmittingInvite,
  setIsSavingEdit,
  setMemberViewMode,
  setSelectedMember,
}: UseTenantMemberMutationsArgs) {
  const handleCopyEmail = React.useCallback(
    async (email: string) => {
      try {
        await navigator.clipboard.writeText(email);
        toast.success(t("common.copied"));
      } catch {
        toast.info(email);
      }
    },
    [t]
  );

  const handleResendVerification = React.useCallback(
    async (member: UserDto) => {
      if (!member?.id) return;
      setResendingMemberId(member.id);
      try {
        await apiClient(
          `/api/v1/organizations/${encodeURIComponent(orgSlug)}/members/${encodeURIComponent(member.id)}/resend-invitation`,
          { method: "POST" }
        );
        toast.success(
          t("users.resend_verification_success", { email: member.email })
        );
        await queryClient.invalidateQueries({
          queryKey: ["tenant-team-members"],
        });
      } catch (err: unknown) {
        toast.error((err as Error)?.message || t("common.error"));
      } finally {
        setResendingMemberId(null);
      }
    },
    [orgSlug, queryClient, setResendingMemberId, t]
  );

  const handleInviteSubmit = React.useCallback(
    async (payload: UnifiedInviteSubmitPayload) => {
      setIsSubmittingInvite(true);
      try {
        await requestInviteMember(orgSlug, payload);
        toast.success(
          payload.creationMode === "DIRECT"
            ? t("users.invite_direct_success", { name: payload.fullName })
            : t("users.invite_success", { email: payload.email })
        );
        setMemberViewMode("list");
        await queryClient.invalidateQueries({
          queryKey: ["tenant-team-members", orgSlug],
        });
      } catch (err: unknown) {
        toast.error((err as Error)?.message || t("common.error"));
      } finally {
        setIsSubmittingInvite(false);
      }
    },
    [orgSlug, queryClient, setIsSubmittingInvite, setMemberViewMode, t]
  );

  const handleSaveEdit = React.useCallback(
    async (payload: UnifiedEditSubmitPayload) => {
      setIsSavingEdit(true);
      try {
        await requestUpdateMember(payload);
        toast.success(t("users.member_updated_success"));
        setMemberViewMode("list");
        setSelectedMember(null);
        await queryClient.invalidateQueries({
          queryKey: ["tenant-team-members", orgSlug],
        });
        await queryClient.invalidateQueries({
          queryKey: ["user-profile-pbac"],
        });
      } catch (err: unknown) {
        toast.error((err as Error)?.message || t("common.error"));
      } finally {
        setIsSavingEdit(false);
      }
    },
    [
      orgSlug,
      queryClient,
      setIsSavingEdit,
      setMemberViewMode,
      setSelectedMember,
      t,
    ]
  );

  const handleToggleStatus = React.useCallback(
    async (member: UserDto) => {
      const nextStatus =
        (member.status || "").toUpperCase() === "SUSPENDED"
          ? "ACTIVE"
          : "SUSPENDED";
      try {
        await apiClient(`/api/v1/users/${encodeURIComponent(member.id)}`, {
          method: "PUT",
          body: JSON.stringify({
            status: nextStatus,
            reason: "Status toggled by Tenant Administrator",
          }),
        });
        toast.success(t("users.member_updated_success"));
        await queryClient.invalidateQueries({
          queryKey: ["tenant-team-members", orgSlug],
        });
      } catch (err: unknown) {
        toast.error((err as Error)?.message || t("common.error"));
      }
    },
    [orgSlug, queryClient, t]
  );

  const handleDeleteFromEditPanel = React.useCallback(
    async (memberId: string) => {
      setIsRemovingMember(true);
      try {
        await apiClient(
          `/api/v1/organizations/${encodeURIComponent(orgSlug)}/members/${encodeURIComponent(memberId)}`,
          { method: "DELETE" }
        );
        toast.success(t("users.member_removed_success"));
        setMemberViewMode("list");
        setSelectedMember(null);
        await queryClient.invalidateQueries({
          queryKey: ["tenant-team-members"],
        });
      } catch (err: unknown) {
        toast.error((err as Error)?.message || t("common.error"));
      } finally {
        setIsRemovingMember(false);
      }
    },
    [
      orgSlug,
      queryClient,
      setIsRemovingMember,
      setMemberViewMode,
      setSelectedMember,
      t,
    ]
  );

  const handleConfirmRemoveMember = React.useCallback(async () => {
    if (!removingMember) return;
    setIsRemovingMember(true);
    try {
      await apiClient(
        `/api/v1/organizations/${encodeURIComponent(orgSlug)}/members/${removingMember.id}`,
        { method: "DELETE" }
      );
      toast.success(t("users.member_removed_success"));
      await queryClient.invalidateQueries({
        queryKey: ["tenant-team-members"],
      });
      setRemovingMember(null);
    } catch (err: unknown) {
      toast.error((err as Error)?.message || t("common.error"));
    } finally {
      setIsRemovingMember(false);
    }
  }, [
    orgSlug,
    queryClient,
    removingMember,
    setIsRemovingMember,
    setRemovingMember,
    t,
  ]);

  return {
    handleCopyEmail,
    handleResendVerification,
    handleInviteSubmit,
    handleSaveEdit,
    handleToggleStatus,
    handleDeleteFromEditPanel,
    handleConfirmRemoveMember,
  };
}
