import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { httpClient } from "@/lib/httpClient";
import { getBackendBaseUrl } from "@/lib/api-config";
import { useSession } from "@/lib/auth-compat";

export interface MessageTemplate {
  id: string;
  code: string;
  name: string;
  channel: "EMAIL" | "WHATSAPP" | "SMS" | "ALL";
  category: string;
  subjectTemplate?: string;
  bodyTemplate: string;
  variablesDescription?: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateMessageTemplateInput {
  code: string;
  name: string;
  channel: string;
  category?: string;
  subjectTemplate?: string;
  bodyTemplate: string;
  variablesDescription?: string;
  active?: boolean;
}

export interface UpdateMessageTemplateInput {
  name: string;
  channel: string;
  category?: string;
  subjectTemplate?: string;
  bodyTemplate: string;
  variablesDescription?: string;
  active?: boolean;
}

export interface PreviewMessageTemplateInput {
  subjectTemplate?: string;
  bodyTemplate: string;
  variables?: Record<string, string>;
}

export interface PreviewMessageTemplateResponse {
  subject: string;
  body: string;
  appliedVariables?: Record<string, string>;
}

export function useMessageTemplates() {
  const { data: session } = useSession();

  return useQuery<MessageTemplate[]>({
    queryKey: ["message-templates", session?.accessToken],
    queryFn: async () => {
      const baseUrl = getBackendBaseUrl();
      const res = await httpClient(`${baseUrl}/system/catalog/templates`, {
        token: session?.accessToken ?? undefined,
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch message templates: ${res.status}`);
      }
      return res.json();
    },
    staleTime: 30 * 1000,
  });
}

export function useCreateMessageTemplate() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateMessageTemplateInput) => {
      const baseUrl = getBackendBaseUrl();
      const res = await httpClient(`${baseUrl}/system/catalog/templates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        token: session?.accessToken ?? undefined,
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => "Unknown error");
        throw new Error(`Failed to create message template: ${res.status} - ${errorText}`);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["message-templates"] });
    },
  });
}

export function useUpdateMessageTemplate() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: UpdateMessageTemplateInput }) => {
      const baseUrl = getBackendBaseUrl();
      const res = await httpClient(`${baseUrl}/system/catalog/templates/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        token: session?.accessToken ?? undefined,
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => "Unknown error");
        throw new Error(`Failed to update message template: ${res.status} - ${errorText}`);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["message-templates"] });
    },
  });
}

export function useDeleteMessageTemplate() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const baseUrl = getBackendBaseUrl();
      const res = await httpClient(`${baseUrl}/system/catalog/templates/${id}`, {
        method: "DELETE",
        token: session?.accessToken ?? undefined,
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => "Unknown error");
        throw new Error(`Failed to delete message template: ${res.status} - ${errorText}`);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["message-templates"] });
    },
  });
}

export function usePreviewMessageTemplate() {
  const { data: session } = useSession();

  return useMutation({
    mutationFn: async (payload: PreviewMessageTemplateInput): Promise<PreviewMessageTemplateResponse> => {
      const baseUrl = getBackendBaseUrl();
      const res = await httpClient(`${baseUrl}/system/catalog/templates/preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        token: session?.accessToken ?? undefined,
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => "Unknown error");
        throw new Error(`Failed to preview message template: ${res.status} - ${errorText}`);
      }
      return res.json();
    },
  });
}
