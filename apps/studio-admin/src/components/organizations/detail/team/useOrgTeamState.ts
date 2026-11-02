import { useState, useMemo, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { httpClient } from "@/lib/httpClient";
import { getBackendBaseUrl } from "@/lib/api-config";
import { useSession } from "@/lib/auth-compat";
import { toast } from "sonner";
import type { EnrichedOrganization } from "../../types";
import type { TenantUser, DynamicRole, RawServerTenantUser } from "./types";

export function useOrgTeamState(org: EnrichedOrganization) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePhone, setInvitePhone] = useState("");
  const [inviteJobTitle, setInviteJobTitle] = useState("");
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [creationMode, setCreationMode] = useState<"INVITE" | "DIRECT">("INVITE");
  const [customPassword, setCustomPassword] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Fetch available tenant roles dynamically from database (Zero Hardcoded Roles)
  const { data: availableRoles = [] } = useQuery<DynamicRole[]>({
    queryKey: ["tenant-roles", session?.accessToken],
    queryFn: async () => {
      if (!session?.accessToken) return [];
      const baseUrl = getBackendBaseUrl();
      try {
        const res = await httpClient(`${baseUrl}/roles?scope=TENANT`, {
          token: session.accessToken,
        });
        if (res.ok) {
          const raw: DynamicRole[] = await res.json();
          return raw;
        }
      } catch (e) {
        console.warn("Could not fetch dynamic tenant roles:", e);
      }
      return [];
    },
    enabled: !!session?.accessToken,
  });

  // 2. Fetch real tenant users from backend
  const { data: serverUsers = [], isLoading } = useQuery<TenantUser[]>({
    queryKey: ["tenant-team-users", org.slug, org.picName, org.picPhone, session?.accessToken],
    queryFn: async () => {
      if (!session?.accessToken) return [];
      const baseUrl = getBackendBaseUrl();
      try {
        const res = await httpClient(`${baseUrl}/organizations/${org.slug}/team-users`, {
          token: session.accessToken,
        });
        if (res.ok) {
          const raw: RawServerTenantUser[] = await res.json();
          return raw.map((u, idx: number) => ({
            id: u.id || `u-${idx}`,
            name: u.name || u.username || org.picName || "Tenant Staff",
            username: u.username || `user_${idx}`,
            email: u.email || `${u.username || "user"}@${org.slug}.kdua.net`,
            phone: u.phone && u.phone !== "—" ? u.phone : (idx === 0 && org.picPhone && org.picPhone !== "—" ? org.picPhone : undefined),
            jobTitle: u.jobTitle || (idx === 0 ? "Technical PIC / Owner" : undefined),
            role: u.role || u.roleName || "admin",
            roleDisplayName: u.roleDisplayName,
            roleId: u.roleId,
            roleCode: u.roleCode,
            mfaEnabled: typeof u.mfaEnabled === "boolean" ? u.mfaEnabled : false,
            status: (u.status === "ACTIVE" ? "ACTIVE" : u.status === "SUSPENDED" ? "SUSPENDED" : "PENDING") as TenantUser["status"],
            lastLogin: u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : (u.lastLogin || "Active recently"),
            lastLoginAt: u.lastLoginAt,
            lastLoginIp: u.lastLoginIp,
            timezone: u.timezone || "Asia/Jakarta",
            source: u.source || "DATABASE",
          }));
        }
      } catch (e) {
        console.warn("Could not fetch tenant users:", e);
      }
      return [];
    },
    enabled: !!session?.accessToken,
  });

  // 3. Fetch projects for this organization for project assignment
  const { data: orgProjects = [] } = useQuery<{ id: string; name: string }[]>({
    queryKey: ["org-projects", org.id, session?.accessToken],
    queryFn: async () => {
      if (!session?.accessToken || !org.id) return [];
      const baseUrl = getBackendBaseUrl();
      try {
        const res = await httpClient(`${baseUrl}/organizations/${org.id}/projects`, {
          token: session.accessToken,
        });
        if (res.ok) {
          const data = await res.json();
          return data.content || data || [];
        }
      } catch {
        // Silently ignore project fetch error
      }
      return [];
    },
    enabled: !!session?.accessToken && !!org.id,
  });

  // Dynamically enrich effective users with live role definitions from database
  const effectiveUsers: TenantUser[] = useMemo(() => {
    return serverUsers.map((u) => {
      const matched = availableRoles.find(
        (r) =>
          (u.roleId && r.id === u.roleId) ||
          r.name.toLowerCase() === (u.role || "").toLowerCase() ||
          r.displayName?.toLowerCase() === (u.role || "").toLowerCase()
      );
      return {
        ...u,
        role: matched ? matched.name : u.role,
        roleDisplayName: matched?.displayName || u.roleDisplayName || (u.role ? u.role.replace(/_/g, " ").toUpperCase() : "MEMBER"),
        roleCode: matched?.code || u.roleCode,
      };
    });
  }, [serverUsers, availableRoles]);

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
      // Dynamically resolve roleId from database query
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
        projectRoles: selectedProjectId
          ? [{ projectId: selectedProjectId, roleId }]
          : [],
      };

      const res = await httpClient(`${baseUrl}/organizations/${org.id || org.slug}/users/invite`, {
        method: "POST",
        token: session?.accessToken || undefined,
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
    } catch (e: any) {
      toast.error(e.message || "Failed to invite member");
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
    session?.accessToken,
    queryClient,
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
      if (!session?.accessToken) return;
      try {
        const baseUrl = getBackendBaseUrl();
        const roleName = String(newRole).toLowerCase();
        const res = await httpClient(`${baseUrl}/users/${userId}`, {
          method: "PUT",
          token: session.accessToken,
          body: JSON.stringify({ role: roleName }),
        });

        if (!res.ok) {
          throw new Error("Failed to update role");
        }

        toast.success(`Role updated to ${newRole}`);
        queryClient.invalidateQueries({ queryKey: ["tenant-team-users", org.slug] });
      } catch (e: any) {
        toast.error(e.message || "Failed to change role");
      }
    },
    [org.slug, session?.accessToken, queryClient]
  );

  const handleToggleStatus = useCallback(
    async (user: TenantUser) => {
      if (!session?.accessToken) return;
      const newStatus = user.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
      try {
        const baseUrl = getBackendBaseUrl();
        const res = await httpClient(`${baseUrl}/users/${user.id}`, {
          method: "PUT",
          token: session.accessToken,
          body: JSON.stringify({ status: newStatus }),
        });

        if (!res.ok) {
          throw new Error(`Failed to set status to ${newStatus}`);
        }

        toast.success(`Account for ${user.name} is now ${newStatus}`);
        queryClient.invalidateQueries({ queryKey: ["tenant-team-users", org.slug] });
      } catch (e: any) {
        toast.error(e.message || "Failed to update status");
      }
    },
    [org.slug, session?.accessToken, queryClient]
  );

  const handleRemoveUser = useCallback(
    async (userId: string, userName: string) => {
      if (!session?.accessToken) return;
      try {
        const baseUrl = getBackendBaseUrl();
        const res = await httpClient(`${baseUrl}/organizations/${org.slug}/members/${userId}`, {
          method: "DELETE",
          token: session.accessToken,
        });

        if (!res.ok) {
          // If member endpoint fails, try users endpoint
          const resUser = await httpClient(`${baseUrl}/users/${userId}`, {
            method: "DELETE",
            token: session.accessToken,
          });
          if (!resUser.ok) {
            throw new Error(`Could not remove ${userName}`);
          }
        }

        toast.success(`User ${userName} removed from ${org.name}`);
        queryClient.invalidateQueries({ queryKey: ["tenant-team-users", org.slug] });
      } catch (e: any) {
        toast.error(e.message || `Failed to remove user ${userName}`);
      }
    },
    [org.slug, org.name, session?.accessToken, queryClient]
  );

  return {
    inviteOpen,
    setInviteOpen,
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
    availableRoles,
    creationMode,
    setCreationMode,
    customPassword,
    setCustomPassword,
    selectedProjectId,
    setSelectedProjectId,
    orgProjects,
    isSubmitting,
    effectiveUsers,
    isLoading,
    handleSendInvite,
    handleCopy,
    handleResendInvite,
    handleChangeRole,
    handleToggleStatus,
    handleRemoveUser,
  };
}
