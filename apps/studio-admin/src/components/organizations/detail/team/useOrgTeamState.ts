import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { httpClient } from "@/lib/httpClient";
import { getBackendBaseUrl } from "@/lib/api-config";
import { useSession } from "@/lib/auth-compat";
import type { EnrichedOrganization } from "../../types";
import type { TenantUser, DynamicRole, RawServerTenantUser } from "./types";
import { useOrgTeamMutations } from "./useOrgTeamMutations";

function resolveStatus(status?: string): TenantUser["status"] {
  if (status === "ACTIVE") return "ACTIVE";
  if (status === "SUSPENDED") return "SUSPENDED";
  return "INVITED";
}

function resolvePhone(phone: string | undefined, idx: number, orgPhone?: string): string | undefined {
  if (phone && phone !== "—") return phone;
  if (idx === 0 && orgPhone && orgPhone !== "—") return orgPhone;
  return undefined;
}

function mapRawServerTenantUser(
  u: RawServerTenantUser,
  idx: number,
  orgSlug: string,
  orgPicName?: string,
  orgPicPhone?: string
): TenantUser {
  const name = u.name || u.fullName || u.username || orgPicName || "Tenant Staff";
  const username = u.username || `user_${idx}`;
  const email = u.email || `${username}@${orgSlug}.kdua.net`;
  const isFirstMember = idx === 0;

  return {
    id: u.id || `u-${idx}`,
    name,
    username,
    email,
    phone: resolvePhone(u.phone, idx, orgPicPhone),
    jobTitle: u.jobTitle || (isFirstMember ? "Technical PIC / Owner" : undefined),
    role: u.role || u.roleName || "admin",
    roleDisplayName: u.roleDisplayName,
    roleId: u.roleId,
    roleCode: u.roleCode,
    mfaEnabled: typeof u.mfaEnabled === "boolean" ? u.mfaEnabled : false,
    emailVerified: typeof u.emailVerified === "boolean" ? u.emailVerified : u.status === "ACTIVE",
    status: resolveStatus(u.status),
    lastLogin: u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : (u.lastLogin || ""),
    lastLoginAt: u.lastLoginAt,
    lastLoginIp: u.lastLoginIp,
    createdAt: u.createdAt,
    timezone: u.timezone || "Asia/Jakarta",
    source: u.source || "DATABASE",
  };
}

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

  const orgSlug = org.slug;
  const orgPicName = org.picName;
  const orgPicPhone = org.picPhone;

  // 2. Fetch real tenant users from backend
  const { data: serverUsers = [], isLoading } = useQuery<TenantUser[]>({
    queryKey: ["tenant-team-users", orgSlug, orgPicName, orgPicPhone, session?.accessToken],
    queryFn: async () => {
      if (!session?.accessToken) return [];
      const baseUrl = getBackendBaseUrl();
      try {
        const res = await httpClient(`${baseUrl}/organizations/${orgSlug}/team-users`, {
          token: session.accessToken,
        });
        if (res.ok) {
          const raw: RawServerTenantUser[] = await res.json();
          return raw.map((u, idx: number) =>
            mapRawServerTenantUser(u, idx, orgSlug, orgPicName, orgPicPhone)
          );
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
