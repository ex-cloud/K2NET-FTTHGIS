import {
  getGatewayToken,
  verifySuperAdmin,
  GATEWAY_URL_MAP,
} from "../common";
import type {
  SuggestedPromptItem,
  SuggestedPromptListResponse,
  TrendingTopicsResponse,
} from "./ai-types";

export async function fetchAiPromptIdeas(category?: string): Promise<SuggestedPromptItem[]> {
  const token = getGatewayToken();
  const aiGatewayUrl = GATEWAY_URL_MAP["ai"];

  const query = new URLSearchParams();
  if (category && category !== "ALL") query.set("category", category);

  const res = await fetch(`${aiGatewayUrl}/api/v1/ai/prompts/ideas?${query.toString()}`, {
    headers: {
      "X-Gateway-Token": token,
      "X-Tenant-ID": "00000000-0000-0000-0000-000000000000",
    },
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
  const token = getGatewayToken();
  const aiGatewayUrl = GATEWAY_URL_MAP["ai"];

  const query = new URLSearchParams();
  if (params?.category) query.set("category", params.category);
  if (params?.search) query.set("search", params.search);
  if (params?.status) query.set("status", params.status);

  const res = await fetch(`${aiGatewayUrl}/api/v1/ai/prompts?${query.toString()}`, {
    headers: {
      "X-Gateway-Token": token,
      "X-Tenant-ID": "00000000-0000-0000-0000-000000000000",
    },
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
  const token = getGatewayToken();
  const aiGatewayUrl = GATEWAY_URL_MAP["ai"];

  const res = await fetch(`${aiGatewayUrl}/api/v1/ai/prompts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Gateway-Token": token,
      "X-Tenant-ID": "00000000-0000-0000-0000-000000000000",
    },
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
  const token = getGatewayToken();
  const aiGatewayUrl = GATEWAY_URL_MAP["ai"];

  const res = await fetch(`${aiGatewayUrl}/api/v1/ai/prompts/${promptId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-Gateway-Token": token,
      "X-Tenant-ID": "00000000-0000-0000-0000-000000000000",
    },
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
  const token = getGatewayToken();
  const aiGatewayUrl = GATEWAY_URL_MAP["ai"];

  const res = await fetch(`${aiGatewayUrl}/api/v1/ai/prompts/${promptId}`, {
    method: "DELETE",
    headers: {
      "X-Gateway-Token": token,
      "X-Tenant-ID": "00000000-0000-0000-0000-000000000000",
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Gagal menghapus prompt");
  }
}

export async function togglePinAiPrompt(promptId: string): Promise<SuggestedPromptItem> {
  await verifySuperAdmin();
  const token = getGatewayToken();
  const aiGatewayUrl = GATEWAY_URL_MAP["ai"];

  const res = await fetch(`${aiGatewayUrl}/api/v1/ai/prompts/${promptId}/toggle-pin`, {
    method: "POST",
    headers: {
      "X-Gateway-Token": token,
      "X-Tenant-ID": "00000000-0000-0000-0000-000000000000",
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Gagal mengubah pin prompt");
  }

  return res.json();
}

export async function incrementAiPromptUsage(promptId: string): Promise<void> {
  const token = getGatewayToken();
  const aiGatewayUrl = GATEWAY_URL_MAP["ai"];

  fetch(`${aiGatewayUrl}/api/v1/ai/prompts/${promptId}/increment`, {
    method: "POST",
    headers: {
      "X-Gateway-Token": token,
      "X-Tenant-ID": "00000000-0000-0000-0000-000000000000",
    },
  }).catch(() => {});
}

export async function fetchAiTrendingTopics(days: number = 7): Promise<TrendingTopicsResponse> {
  await verifySuperAdmin();
  const token = getGatewayToken();
  const aiGatewayUrl = GATEWAY_URL_MAP["ai"];

  const res = await fetch(`${aiGatewayUrl}/api/v1/ai/prompts/trending?days=${days}`, {
    headers: {
      "X-Gateway-Token": token,
      "X-Tenant-ID": "00000000-0000-0000-0000-000000000000",
    },
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
