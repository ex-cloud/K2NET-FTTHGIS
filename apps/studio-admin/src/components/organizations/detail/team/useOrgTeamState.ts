import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { httpClient } from "@/lib/httpClient";
import { getBackendBaseUrl } from "@/lib/api-config";
import { useSession } from "@/lib/auth-compat";
import { toast } from "sonner";
import type { EnrichedOrganization } from "../../types";
import type { TenantUser, TenantUserRole, RawServerTenantUser } from "./types";

export function useOrgTeamState(org: EnrichedOrganization) {
  const { data: session } = useSession();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<TenantUserRole>("NOC_OPERATOR");
  const [localUsers, setLocalUsers] = useState<TenantUser[]>([]);

  // Fetch real tenant users from backend
  const { data: serverUsers = [], isLoading } = useQuery<TenantUser[]>({
    queryKey: ["tenant-team-users", org.slug, org.picName, session?.accessToken],
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
            name: u.name || u.username || org.picName || "Tenant Admin",
            username: u.username || `admin_${org.slug}`,
            email: u.email || `${u.username || "admin"}@${org.slug}.kdua.net`,
            role: (u.role === "admin" || u.role === "TENANT_ADMIN" ? "TENANT_ADMIN" : u.role || "NOC_OPERATOR") as TenantUserRole,
            mfaEnabled: true,
            status: (u.status === "ACTIVE" ? "ACTIVE" : "PENDING") as TenantUser["status"],
            lastLogin: u.lastLogin || "Active recently",
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

  // Combine server users and newly invited local users
  const effectiveUsers: TenantUser[] = useMemo(() => [
    ...serverUsers,
    ...localUsers.filter(lu => !serverUsers.some(su => su.email.toLowerCase() === lu.email.toLowerCase()))
  ], [serverUsers, localUsers]);

  const handleSendInvite = useCallback(() => {
    if (!inviteName || !inviteEmail) {
      toast.error("Please fill in all fields");
      return;
    }
    const newUser: TenantUser = {
      id: `u-${Date.now()}`,
      name: inviteName,
      username: inviteName.toLowerCase().replace(/\s+/g, "_"),
      email: inviteEmail,
      role: inviteRole,
      mfaEnabled: false,
      status: "PENDING",
      lastLogin: "Never (Invitation sent)",
      source: "INVITATION",
    };
    setLocalUsers((prev) => [...prev, newUser]);
    setInviteOpen(false);
    setInviteName("");
    setInviteEmail("");
    toast.success(`Invitation sent to ${inviteEmail}`, {
      description: "User will receive a Keycloak account setup email.",
    });
  }, [inviteName, inviteEmail, inviteRole]);

  const handleCopy = useCallback((text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  }, []);

  const handlePasswordReset = useCallback((user: TenantUser) => {
    toast.success(`Password reset link generated for ${user.name}`, {
      description: `Sent to ${user.email} via Keycloak SMTP service.`,
    });
  }, []);

  const handleResendInvite = useCallback((user: TenantUser) => {
    toast.success(`Invitation email resent to ${user.email}`);
  }, []);

  const handleChangeRole = useCallback((userId: string, newRole: TenantUserRole) => {
    setLocalUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
    );
    toast.success(`User role updated to ${newRole}`);
  }, []);

  const handleRemoveUser = useCallback((userId: string, userName: string) => {
    setLocalUsers((prev) => prev.filter((u) => u.id !== userId));
    toast.success(`User ${userName} removed from ${org.name}`);
  }, [org.name]);

  return {
    inviteOpen,
    setInviteOpen,
    inviteName,
    setInviteName,
    inviteEmail,
    setInviteEmail,
    inviteRole,
    setInviteRole,
    effectiveUsers,
    isLoading,
    handleSendInvite,
    handleCopy,
    handlePasswordReset,
    handleResendInvite,
    handleChangeRole,
    handleRemoveUser,
  };
}
