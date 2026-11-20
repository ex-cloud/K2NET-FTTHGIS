import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/lib/auth-compat";

export type ModuleScope = "SYSTEM" | "TENANT";
export type ModuleStatus = "ACTIVE" | "MAINTENANCE" | "DISABLED";
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
  name: string;
  description?: string;
  scope: ModuleScope;
  category: string;
  minPlanTier: ModulePlanTier;
  serviceTarget: string;
  status: ModuleStatus;
  icon?: string;
  sortOrder: number;
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

      return res.json();
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

      return res.json();
    },
    enabled: enabled && Boolean(token),
  });
}
