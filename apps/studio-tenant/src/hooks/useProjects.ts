import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../lib/api-client";
import { getCurrentOrgSlug } from "../lib/domain";

export type ProjectStatus = "ACTIVE" | "ARCHIVED";

export interface Project {
  id: string;
  name: string;
  code: string;
  slug?: string;
  region?: string;
  description?: string;
  status: ProjectStatus;
  customerCount?: number;
  odcCount?: number;
  odpCount?: number;
  cableLengthKm?: number;
  oltCount?: number;
  totalSubscribers?: number;
  onlineSubscribers?: number;
  organizationId?: string;
  boundaryGeom?: unknown;
  archivedAt?: string;
  archivedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateProjectPayload {
  name: string;
  code: string;
  region?: string;
  description?: string;
  status?: ProjectStatus;
  boundaryGeom?: unknown;
}

export function useProjects() {
  const queryClient = useQueryClient();
  const orgSlug = getCurrentOrgSlug() || "system";

  const {
    data: projects = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<Project[]>({
    queryKey: ["tenant-projects", orgSlug],
    queryFn: async () => {
      try {
        const res = await apiClient<Project[] | { content: Project[] }>(
          `/api/v1/organizations/${orgSlug}/projects`
        );
        if (Array.isArray(res)) {
          return res;
        }
        if (res && Array.isArray((res as { content: Project[] }).content)) {
          return (res as { content: Project[] }).content;
        }
        return [];
      } catch (err) {
        console.warn("Failed to fetch projects from backend:", err);
        return [];
      }
    },
    staleTime: 60 * 1000,
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["tenant-projects", orgSlug] });
    queryClient.invalidateQueries({ queryKey: ["tenant-subscription-summary", orgSlug] });
  };

  const createProjectMutation = useMutation({
    mutationFn: async (payload: CreateProjectPayload) => {
      return apiClient<Project>(`/api/v1/organizations/${orgSlug}/projects`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: invalidateAll,
  });

  const updateProjectMutation = useMutation({
    mutationFn: async ({ id, ...payload }: Partial<CreateProjectPayload> & { id: string }) => {
      return apiClient<Project>(`/api/v1/organizations/${orgSlug}/projects/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: invalidateAll,
  });

  const archiveProjectMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient<Project>(`/api/v1/organizations/${orgSlug}/projects/${id}/archive`, {
        method: "POST",
      });
    },
    onSuccess: invalidateAll,
  });

  const unarchiveProjectMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient<Project>(`/api/v1/organizations/${orgSlug}/projects/${id}/unarchive`, {
        method: "POST",
      });
    },
    onSuccess: invalidateAll,
  });

  const deleteProjectMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient(`/api/v1/organizations/${orgSlug}/projects/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: invalidateAll,
  });

  return {
    projects,
    isLoading,
    isError,
    error,
    refetch,
    createProject: createProjectMutation.mutateAsync,
    isCreating: createProjectMutation.isPending,
    updateProject: updateProjectMutation.mutateAsync,
    isUpdating: updateProjectMutation.isPending,
    archiveProject: archiveProjectMutation.mutateAsync,
    isArchiving: archiveProjectMutation.isPending,
    unarchiveProject: unarchiveProjectMutation.mutateAsync,
    isUnarchiving: unarchiveProjectMutation.isPending,
    deleteProject: deleteProjectMutation.mutateAsync,
    isDeleting: deleteProjectMutation.isPending,
  };
}
