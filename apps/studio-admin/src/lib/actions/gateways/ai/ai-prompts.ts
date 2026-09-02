import {
  getAuthHeaders,
  verifySuperAdmin,
} from "../common";
import type {
  SuggestedPromptItem,
  SuggestedPromptListResponse,
  TrendingTopicsResponse,
} from "./ai-types";

export async function fetchAiPromptIdeas(category?: string): Promise<SuggestedPromptItem[]> {
  const query = new URLSearchParams();
  if (category && category !== "ALL") query.set("category", category);

  const res = await fetch(`/api/v1/ai/prompts/ideas?${query.toString()}`, {
    headers: getAuthHeaders(),
    cache: "no-store",
  });

  if (!res.ok) {
    return [];
  }

  return res.json();
}

export async function fetchAdminAiPrompts(params?: {
  category?: string;
  search?: string;
  status?: string;
}): Promise<SuggestedPromptListResponse> {
  await verifySuperAdmin();

  const query = new URLSearchParams();
  if (params?.category) query.set("category", params.category);
  if (params?.search) query.set("search", params.search);
  if (params?.status) query.set("status", params.status);

  const res = await fetch(`/api/v1/ai/prompts?${query.toString()}`, {
    headers: getAuthHeaders(),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch suggested prompts: ${res.statusText}`);
  }

  return res.json();
}

export async function createAiPrompt(payload: {
  title: string;
  description?: string;
  prompt: string;
  icon?: string;
  category?: string;
  target_role?: string;
  is_pinned?: boolean;
  is_active?: boolean;
}): Promise<SuggestedPromptItem> {
  await verifySuperAdmin();

  const res = await fetch(`/api/v1/ai/prompts`, {
    method: "POST",
    headers: getAuthHeaders({
      "Content-Type": "application/json",
    }),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Gagal menambahkan prompt");
  }

  return res.json();
}

export async function updateAiPrompt(
  promptId: string,
  payload: Partial<{
    title: string;
    description: string;
    prompt: string;
    icon: string;
    category: string;
    target_role: string;
    is_pinned: boolean;
    is_active: boolean;
  }>
): Promise<SuggestedPromptItem> {
  await verifySuperAdmin();

  const res = await fetch(`/api/v1/ai/prompts/${promptId}`, {
    method: "PUT",
    headers: getAuthHeaders({
      "Content-Type": "application/json",
    }),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Gagal memperbarui prompt");
  }

  return res.json();
}

export async function deleteAiPrompt(promptId: string): Promise<void> {
  await verifySuperAdmin();

  const res = await fetch(`/api/v1/ai/prompts/${promptId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Gagal menghapus prompt");
  }
}

export async function togglePinAiPrompt(promptId: string): Promise<SuggestedPromptItem> {
  await verifySuperAdmin();

  const res = await fetch(`/api/v1/ai/prompts/${promptId}/toggle-pin`, {
    method: "POST",
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Gagal mengubah pin prompt");
  }

  return res.json();
}

export async function incrementAiPromptUsage(promptId: string): Promise<void> {
  fetch(`/api/v1/ai/prompts/${promptId}/increment`, {
    method: "POST",
    headers: getAuthHeaders(),
  }).catch(() => {});
}

export async function fetchAiTrendingTopics(days: number = 7): Promise<TrendingTopicsResponse> {
  await verifySuperAdmin();

  const res = await fetch(`/api/v1/ai/prompts/trending?days=${days}`, {
    headers: getAuthHeaders(),
    cache: "no-store",
  });

  if (!res.ok) {
    return {
      trending: [],
      topics: [],
      period_days: days,
      total_queries_analyzed: 0,
      total_queries: 0,
    };
  }

  return res.json();
}
