import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import type {
  UnifiedRoleOption,
  UnifiedProjectOption,
  UnifiedTranslateFn,
} from "@k2net/ui";
import { apiClient } from "../../lib/api-client";
import type { LiveRoleDto, RoleCardItem } from "./TeamRolesAndDialogs";
import type { UserDto } from "./TeamMembersTableSection";

interface UseTenantTeamDataArgs {
  orgSlug: string;
  subView: "members" | "roles" | "activity";
  t: UnifiedTranslateFn;
}

export function useTenantTeamData({
  orgSlug,
  subView,
  t,
}: UseTenantTeamDataArgs) {
  const { data: usersPage, isLoading } = useQuery<
    { content: UserDto[] } | UserDto[]
  >({
    queryKey: ["tenant-team-members", orgSlug],
    queryFn: async () => {
      try {
        return await apiClient<{ content: UserDto[] } | UserDto[]>(
          `/api/v1/users?org=${encodeURIComponent(orgSlug)}`
        );
      } catch {
        return [];
      }
    },
    staleTime: 30 * 1000,
  });

  const members: UserDto[] = React.useMemo(() => {
    if (!usersPage) return [];
    if (Array.isArray(usersPage)) return usersPage;
    if (Array.isArray(usersPage.content)) return usersPage.content;
    return [];
  }, [usersPage]);

  const { data: liveTenantRoles, isLoading: isLoadingRoles } = useQuery<
    LiveRoleDto[]
  >({
    queryKey: ["tenant-roles-catalog", orgSlug],
    queryFn: async () => {
      try {
        return await apiClient<LiveRoleDto[]>("/api/v1/roles?scope=TENANT");
      } catch {
        return [];
      }
    },
    enabled: subView === "roles" || subView === "members",
    staleTime: 60 * 1000,
  });

  const { data: tenantProjects = [] } = useQuery<UnifiedProjectOption[]>({
    queryKey: ["tenant-projects-options", orgSlug],
    queryFn: async () => {
      try {
        const res = await apiClient<
          { content?: UnifiedProjectOption[] } | UnifiedProjectOption[]
        >("/api/v1/projects");
        if (Array.isArray(res)) return res;
        if (res && Array.isArray(res.content)) return res.content;
        return [];
      } catch {
        return [];
      }
    },
    enabled: subView === "members",
    staleTime: 60 * 1000,
  });

  const unifiedRoleOptions: UnifiedRoleOption[] = React.useMemo(() => {
    if (Array.isArray(liveTenantRoles) && liveTenantRoles.length > 0) {
      return liveTenantRoles.map((r) => ({
        id: r.id,
        name: r.name,
        displayName: r.displayName || r.name.toUpperCase(),
        code: r.code || `TENT-${r.id}`,
        description: r.description,
        isSystemRole: r.isSystemRole,
        isTemplate: r.isTemplate,
        permissions: r.permissions,
      }));
    }
    return [
      { id: 1, name: "admin", displayName: t("users.role_org_admin"), code: "TENT-01" },
      { id: 2, name: "noc", displayName: t("users.role_operator"), code: "TENT-02" },
      { id: 3, name: "technician", displayName: t("users.role_field_tech"), code: "TENT-03" },
      { id: 4, name: "viewer", displayName: t("users.role_viewer"), code: "TENT-04" },
    ];
  }, [liveTenantRoles, t]);

  const rolesList: RoleCardItem[] = React.useMemo(() => {
    if (!Array.isArray(liveTenantRoles)) return [];
    return liveTenantRoles.map((r) => ({
      raw: r,
      id: r.id,
      name: r.name,
      isSystemRole: Boolean(r.isSystemRole || r.isTemplate),
      code: r.code || `TENT-${r.id}`,
      title: r.displayName || r.name.toUpperCase(),
      description: r.description || r.name,
      permissions: (r.permissions || []).map((p) => p.code),
    }));
  }, [liveTenantRoles]);

  return {
    members,
    isLoading,
    isLoadingRoles,
    tenantProjects,
    unifiedRoleOptions,
    rolesList,
  };
}
