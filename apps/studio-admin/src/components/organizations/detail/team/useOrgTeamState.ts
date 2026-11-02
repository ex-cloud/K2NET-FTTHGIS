import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { httpClient } from "@/lib/httpClient";
import { getBackendBaseUrl } from "@/lib/api-config";
import { useSession } from "@/lib/auth-compat";
import type { EnrichedOrganization } from "../../types";
import type { TenantUser, DynamicRole, RawServerTenantUser } from "./types";
import { useOrgTeamMutations } from "./useOrgTeamMutations";

export function useOrgTeamState(org: EnrichedOrganization) {
  const { data: session } = useSession();

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

  const mutations = useOrgTeamMutations({
    org,
    token: session?.accessToken || undefined,
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
  });

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
    creationMode,
    setCreationMode,
    customPassword,
    setCustomPassword,
    selectedProjectId,
    setSelectedProjectId,
    isSubmitting,
    isLoading,
    users: effectiveUsers,
    effectiveUsers,
    availableRoles,
    orgProjects,
    ...mutations,
  };
}
