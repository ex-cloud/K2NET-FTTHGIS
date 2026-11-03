import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { httpClient } from "@/lib/httpClient";
import { getBackendBaseUrl } from "@/lib/api-config";
import { toast } from "sonner";
import type { EnrichedOrganization } from "../../types";
import type { TenantUser, DynamicRole } from "./types";

interface UseOrgTeamMutationsParams {
  org: EnrichedOrganization;
  token?: string;
  inviteName: string;
  setInviteName: (v: string) => void;
  inviteEmail: string;
  setInviteEmail: (v: string) => void;
  invitePhone: string;
  setInvitePhone: (v: string) => void;
  inviteJobTitle: string;
  setInviteJobTitle: (v: string) => void;
  selectedRoleId: number | null;
  setSelectedRoleId: (v: number | null) => void;
  creationMode: "INVITE" | "DIRECT";
  setCreationMode: (v: "INVITE" | "DIRECT") => void;
  customPassword: string;
  setCustomPassword: (v: string) => void;
  selectedProjectId: string;
  setSelectedProjectId: (v: string) => void;
  availableRoles: DynamicRole[];
  setIsSubmitting: (v: boolean) => void;
  setInviteOpen: (v: boolean) => void;
}

export function useOrgTeamMutations(params: UseOrgTeamMutationsParams) {
  const queryClient = useQueryClient();
  const {
    org,
    token,
    inviteName,
    setInviteName,
    inviteEmail,
    setInviteEmail,
    invitePhone,
    setInvitePhone,
    inviteJobTitle,
    setInviteJobTitle,
    selectedRoleId,
    setSelectedRoleId,
    creationMode,
    setCreationMode,
    customPassword,
    setCustomPassword,
    selectedProjectId,
    setSelectedProjectId,
    availableRoles,
    setIsSubmitting,
    setInviteOpen,
  } = params;

  const handleSendInvite = useCallback(async () => {
    if (!inviteName.trim() || !inviteEmail.trim()) {
      toast.error("Please enter full name and corporate email");
      return;
    }
    if (creationMode === "DIRECT" && (!customPassword || customPassword.length < 14)) {
      toast.error("Temporary password must be at least 14 characters");
      return;
    }

    setIsSubmitting(true);
    try {
      const baseUrl = getBackendBaseUrl();
      const targetRole = availableRoles.find((r) => r.id === selectedRoleId) || availableRoles[0];
      const roleId = targetRole ? targetRole.id : (selectedRoleId || 7);

      const payload = {
        fullName: inviteName.trim(),
        email: inviteEmail.trim(),
        phone: invitePhone.trim(),
        jobTitle: inviteJobTitle.trim(),
        globalRoleId: roleId,
        creationMode,
        customPassword: creationMode === "DIRECT" ? customPassword : "",
        projectRoles: selectedProjectId ? [{ projectId: selectedProjectId, roleId }] : [],
      };

      const res = await httpClient(`${baseUrl}/organizations/${org.id || org.slug}/users/invite`, {
        method: "POST",
        token: token || undefined,
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to invite member");
      }

      toast.success(
        creationMode === "DIRECT"
          ? `User ${inviteName} created successfully!`
          : `Invitation sent to ${inviteEmail}!`
      );

      setInviteOpen(false);
      setInviteName("");
      setInviteEmail("");
      setInvitePhone("");
      setInviteJobTitle("");
      setSelectedRoleId(null);
      setCreationMode("INVITE");
      setCustomPassword("");
      setSelectedProjectId("");

      queryClient.invalidateQueries({ queryKey: ["tenant-team-users", org.slug] });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to invite member";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    inviteName,
    inviteEmail,
    invitePhone,
    inviteJobTitle,
    selectedRoleId,
    availableRoles,
    creationMode,
    customPassword,
    selectedProjectId,
    org.id,
    org.slug,
    token,
    queryClient,
    setIsSubmitting,
    setInviteOpen,
    setInviteName,
    setInviteEmail,
    setInvitePhone,
    setInviteJobTitle,
    setSelectedRoleId,
    setCreationMode,
    setCustomPassword,
    setSelectedProjectId,
  ]);

  const handleCopy = useCallback((text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  }, []);

  const handleResendInvite = useCallback((user: TenantUser) => {
    toast.success(`Invitation email resent to ${user.email}`);
  }, []);

  const handleChangeRole = useCallback(
    async (userId: string, newRole: string) => {
      if (!token) return;
      try {
        const baseUrl = getBackendBaseUrl();
        const roleName = String(newRole).toLowerCase();
        const res = await httpClient(`${baseUrl}/users/${userId}`, {
          method: "PUT",
          token,
          body: JSON.stringify({ role: roleName }),
        });

        if (!res.ok) {
          throw new Error("Failed to update role");
        }

        toast.success(`Role updated to ${newRole}`);
        queryClient.invalidateQueries({ queryKey: ["tenant-team-users", org.slug] });
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Failed to change role";
        toast.error(msg);
      }
    },
    [org.slug, token, queryClient]
  );

  const handleToggleStatus = useCallback(
    async (user: TenantUser) => {
      if (!token) return;
      const newStatus = user.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
      try {
        const baseUrl = getBackendBaseUrl();
        const res = await httpClient(`${baseUrl}/users/${user.id}`, {
          method: "PUT",
          token,
          body: JSON.stringify({ status: newStatus }),
        });

        if (!res.ok) {
          throw new Error(`Failed to set status to ${newStatus}`);
        }

        toast.success(`Account for ${user.name} is now ${newStatus}`);
        queryClient.invalidateQueries({ queryKey: ["tenant-team-users", org.slug] });
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Failed to update status";
        toast.error(msg);
      }
    },
    [org.slug, token, queryClient]
  );

  const handleRemoveUser = useCallback(
    async (userId: string, userName: string) => {
      if (!token) return;
      try {
        const baseUrl = getBackendBaseUrl();
        const res = await httpClient(`${baseUrl}/organizations/${org.slug}/members/${userId}`, {
          method: "DELETE",
          token,
        });

        if (!res.ok) {
          const resUser = await httpClient(`${baseUrl}/users/${userId}`, {
            method: "DELETE",
            token,
          });
          if (!resUser.ok) {
            throw new Error(`Could not remove ${userName}`);
          }
        }

        toast.success(`User ${userName} removed from ${org.name}`);
        queryClient.invalidateQueries({ queryKey: ["tenant-team-users", org.slug] });
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : `Failed to remove user ${userName}`;
        toast.error(msg);
      }
    },
    [org.slug, org.name, token, queryClient]
  );

  return {
    handleSendInvite,
    handleCopy,
    handleResendInvite,
    handleChangeRole,
    handleToggleStatus,
    handleRemoveUser,
  };
}

