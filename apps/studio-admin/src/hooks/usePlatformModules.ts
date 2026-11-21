import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/lib/auth-compat";

export type ModuleScope = "SYSTEM" | "TENANT";
export type ModuleStatus =
  | "ACTIVE"
  | "IN_DEVELOPMENT"
  | "MAINTENANCE"
  | "DEPRECATED"
  | "DISABLED";
export type ModulePlanTier = "FREE" | "STARTER" | "PRO" | "ENTERPRISE";

export interface MappedPermissionItem {
  code: string;
  name: string;
  description?: string;
  scope?: string;
}

export interface PlatformModuleItem {
  id: string;
  code: string;
  moduleKey?: string;
  name: string;
  description?: string;
  scope: ModuleScope;
  category: string;
  minPlanTier: ModulePlanTier;
  serviceTarget: string;
  status: ModuleStatus;
  isEnabled?: boolean;
  licenseFlag?: string;
  icon?: string;
  sortOrder?: number;
  permissionsCount?: number;
  permissions: MappedPermissionItem[];
  createdAt?: string;
  updatedAt?: string;
}

export interface OrphanAuditResult {
  healthy: boolean;
  orphanPermissions: Array<{
    code: string;
    name: string;
    module: string;
    scope: string;
  }>;
  unmappedModules: string[];
  orphanPermissionModulesWithoutRegistry?: string[];
  registeredModuleCount: number;
  livePermissionCount: number;
}

export interface UpdateModuleStatusPayload {
  code: string;
  status: ModuleStatus;
  minPlanTier?: ModulePlanTier;
  reason?: string;
}

export function usePlatformModules(filters?: {
  scope?: string;
  status?: string;
  search?: string;
}) {
  const { data: session } = useSession();
  const token = session?.accessToken;

  return useQuery<PlatformModuleItem[]>({
    queryKey: ["platform-modules", filters, token],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.scope && filters.scope !== "ALL") params.set("scope", filters.scope);
      if (filters?.status && filters.status !== "ALL") params.set("status", filters.status);
      if (filters?.search) params.set("search", filters.search);

      const qs = params.toString() ? `?${params.toString()}` : "";
      const res = await fetch(`/api/v1/system/modules${qs}`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) {
        throw new Error(`Failed to load modules: HTTP ${res.status}`);
      }

      const raw = await res.json();
      if (!Array.isArray(raw)) return [];

      return raw.map((item: Record<string, unknown>) => {
        const itemCode = (item.code as string) || (item.moduleKey as string) || "";
        const rawPerms = Array.isArray(item.permissions) ? item.permissions : [];
        const perms: MappedPermissionItem[] = rawPerms.map((p: Record<string, unknown>) => ({
          code: (p.code as string) || "",
          name: (p.name as string) || "",
          description: (p.description as string) || "",
          scope: (p.scope as string) || "",
        }));

        return {
          id: (item.id as string) || itemCode,
          code: itemCode,
          moduleKey: (item.moduleKey as string) || itemCode,
          name: (item.name as string) || itemCode,
          description: (item.description as string) || "",
          scope: ((item.scope as string) || "TENANT").toUpperCase() as ModuleScope,
          category: (item.category as string) || "GENERAL",
          minPlanTier: ((item.minPlanTier as string) || "FREE").toUpperCase() as ModulePlanTier,
          serviceTarget: (item.serviceTarget as string) || "apps/api",
          status: ((item.status as string) || "ACTIVE").toUpperCase() as ModuleStatus,
          isEnabled: item.isEnabled !== false,
          licenseFlag: (item.licenseFlag as string) || undefined,
          icon: (item.icon as string) || undefined,
          sortOrder: typeof item.sortOrder === "number" ? item.sortOrder : 0,
          permissionsCount: typeof item.permissionsCount === "number" ? item.permissionsCount : perms.length,
          permissions: perms,
          createdAt: (item.createdAt as string) || undefined,
          updatedAt: (item.updatedAt as string) || undefined,
        } as PlatformModuleItem;
      });
    },
    enabled: Boolean(token),
  });
}

export function useUpdateModuleStatus() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: UpdateModuleStatusPayload) => {
      const res = await fetch(`/api/v1/system/modules/${encodeURIComponent(payload.code)}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {}),
        },
        body: JSON.stringify({
          status: payload.status,
          minPlanTier: payload.minPlanTier,
          reason: payload.reason,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || `Failed to update status: HTTP ${res.status}`);
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform-modules"] });
      queryClient.invalidateQueries({ queryKey: ["platform-modules-audit"] });
    },
  });
}

export function useOrphanAudit(enabled = false) {
  const { data: session } = useSession();
  const token = session?.accessToken;

  return useQuery<OrphanAuditResult>({
    queryKey: ["platform-modules-audit", token],
    queryFn: async () => {
      const res = await fetch("/api/v1/system/modules/audit-orphans", {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) {
        throw new Error(`Failed to audit module orphans: HTTP ${res.status}`);
      }

      const raw = await res.json();
      const rawOrphans = Array.isArray(raw.orphanPermissions) ? raw.orphanPermissions : [];
      const orphanPermissions = rawOrphans.map((p: unknown) => {
        if (typeof p === "string") {
          return { code: p, name: p, module: p, scope: "UNKNOWN" };
        }
        const obj = p as Record<string, unknown>;
        return {
          code: (obj.code as string) || "",
          name: (obj.name as string) || "",
          module: (obj.module as string) || "",
          scope: (obj.scope as string) || "",
        };
      });

      const unmapped = Array.isArray(raw.unmappedModules)
        ? raw.unmappedModules
        : Array.isArray(raw.orphanModulesWithoutPermissions)
        ? raw.orphanModulesWithoutPermissions
        : [];

      const healthy = raw.healthy === true || raw.status === "HEALTHY";

      return {
        healthy,
        orphanPermissions,
        unmappedModules: unmapped,
        registeredModuleCount: raw.registeredModuleCount ?? raw.totalRegisteredModules ?? 0,
        livePermissionCount: raw.livePermissionCount ?? raw.totalDistinctPermissionModules ?? 0,
      };
    },
    enabled: enabled && Boolean(token),
  });
}
