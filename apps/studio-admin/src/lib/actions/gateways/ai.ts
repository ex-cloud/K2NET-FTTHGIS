"use server";

import {
  getGatewayToken,
  verifySuperAdmin,
  GATEWAY_URL_MAP,
} from "./common";

// ─── AI Assistant Gateway & Knowledge Base Actions ──────────────────────────

export type AiKnowledgeStats = {
  total_documents: number;
  total_chunks: number;
  total_size_bytes: number;
  llm_provider: string;
  embedding_model: string;
  chat_model: string;
  db_connected: boolean;
};

export type AiDocumentItem = {
  id: string;
  tenant_id: string;
  title: string;
  category: string;
  scope: "PLATFORM_INTERNAL" | "TENANT_INTERNAL" | "GLOBAL";
  file_name?: string | null;
  file_size_bytes: number;
  mime_type?: string | null;
  status: "INDEXED" | "PENDING_REVIEW" | "DRAFT" | "PROCESSING" | "PENDING" | "REJECTED" | "FAILED";
  chunk_count: number;
  raw_content?: string | null;
  error_message?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
};

export type AiDocumentDetail = AiDocumentItem;

export type AiDocumentListResponse = {
  total: number;
  documents: AiDocumentItem[];
};

export async function getAiKnowledgeStats(): Promise<AiKnowledgeStats> {
  await verifySuperAdmin();
  const token = getGatewayToken();
  const aiGatewayUrl = GATEWAY_URL_MAP["ai"];

  const res = await fetch(`${aiGatewayUrl}/api/v1/ai/documents/stats`, {
    headers: {
      "X-Gateway-Token": token,
      "X-Tenant-ID": "00000000-0000-0000-0000-000000000000",
    },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch AI knowledge stats: ${res.statusText}`);
  }

  return res.json();
}

export async function getAiDocuments(params?: {
  category?: string;
  scope?: string;
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<AiDocumentListResponse> {
  await verifySuperAdmin();
  const token = getGatewayToken();
  const aiGatewayUrl = GATEWAY_URL_MAP["ai"];

  const query = new URLSearchParams();
  if (params?.category) query.set("category", params.category);
  if (params?.scope) query.set("scope", params.scope);
  if (params?.status) query.set("status", params.status);
  if (params?.search) query.set("search", params.search);
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.offset) query.set("offset", String(params.offset));

  const res = await fetch(`${aiGatewayUrl}/api/v1/ai/documents?${query.toString()}`, {
    headers: {
      "X-Gateway-Token": token,
      "X-Tenant-ID": "00000000-0000-0000-0000-000000000000",
    },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch AI documents: ${res.statusText}`);
  }

  return res.json();
}

export async function getAiDocumentDetail(docId: string): Promise<AiDocumentDetail> {
  await verifySuperAdmin();
  const token = getGatewayToken();
  const aiGatewayUrl = GATEWAY_URL_MAP["ai"];

  const res = await fetch(`${aiGatewayUrl}/api/v1/ai/documents/${docId}`, {
    headers: {
      "X-Gateway-Token": token,
      "X-Tenant-ID": "00000000-0000-0000-0000-000000000000",
    },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Gagal memuat detail dokumen AI");
  }

  return res.json();
}

export async function createManualAiDocument(payload: {
  title: string;
  category: string;
  content: string;
  scope?: "PLATFORM_INTERNAL" | "TENANT_INTERNAL" | "GLOBAL";
  is_draft?: boolean;
  auto_approve?: boolean;
}): Promise<{ id: string; status: string; title: string }> {
  await verifySuperAdmin();
  const token = getGatewayToken();
  const aiGatewayUrl = GATEWAY_URL_MAP["ai"];

  const res = await fetch(`${aiGatewayUrl}/api/v1/ai/documents/text`, {
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
    throw new Error(err.detail || "Gagal membuat dokumen manual");
  }

  return res.json();
}

export async function updateAiDocument(
  docId: string,
  payload: {
    title?: string;
    category?: string;
    scope?: "PLATFORM_INTERNAL" | "TENANT_INTERNAL" | "GLOBAL";
    content?: string;
    status?: string;
    reindex?: boolean;
  }
): Promise<AiDocumentDetail> {
  await verifySuperAdmin();
  const token = getGatewayToken();
  const aiGatewayUrl = GATEWAY_URL_MAP["ai"];

  const res = await fetch(`${aiGatewayUrl}/api/v1/ai/documents/${docId}`, {
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
    throw new Error(err.detail || "Gagal mengupdate dokumen");
  }

  return res.json();
}

export async function approveAiDocument(
  docId: string,
  payload?: { scope?: "PLATFORM_INTERNAL" | "TENANT_INTERNAL" | "GLOBAL" }
): Promise<{ id: string; status: string; title: string }> {
  await verifySuperAdmin();
  const token = getGatewayToken();
  const aiGatewayUrl = GATEWAY_URL_MAP["ai"];

  const res = await fetch(`${aiGatewayUrl}/api/v1/ai/documents/${docId}/approve`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Gateway-Token": token,
      "X-Tenant-ID": "00000000-0000-0000-0000-000000000000",
    },
    body: JSON.stringify(payload || {}),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Gagal menyetujui dokumen");
  }

  return res.json();
}

export async function rejectAiDocument(
  docId: string,
  payload?: { reason?: string }
): Promise<{ id: string; status: string; title: string }> {
  await verifySuperAdmin();
  const token = getGatewayToken();
  const aiGatewayUrl = GATEWAY_URL_MAP["ai"];

  const res = await fetch(`${aiGatewayUrl}/api/v1/ai/documents/${docId}/reject`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Gateway-Token": token,
      "X-Tenant-ID": "00000000-0000-0000-0000-000000000000",
    },
    body: JSON.stringify(payload || {}),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Gagal menolak dokumen");
  }

  return res.json();
}

export async function deleteAiDocument(docId: string): Promise<{ status: string; message: string }> {
  await verifySuperAdmin();
  const token = getGatewayToken();
  const aiGatewayUrl = GATEWAY_URL_MAP["ai"];

  const res = await fetch(`${aiGatewayUrl}/api/v1/ai/documents/${docId}`, {
    method: "DELETE",
    headers: {
      "X-Gateway-Token": token,
      "X-Tenant-ID": "00000000-0000-0000-0000-000000000000",
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Gagal menghapus dokumen");
  }

  return res.json();
}

export async function triggerServerDocsSync(): Promise<{ status: string; message: string }> {
  await verifySuperAdmin();
  const token = getGatewayToken();
  const aiGatewayUrl = GATEWAY_URL_MAP["ai"];

  const res = await fetch(`${aiGatewayUrl}/api/v1/ai/documents/sync-server`, {
    method: "POST",
    headers: {
      "X-Gateway-Token": token,
      "X-Tenant-ID": "00000000-0000-0000-0000-000000000000",
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Gagal memicu sinkronisasi dokumen server");
  }

  return res.json();
}

export async function simulateVectorSearch(payload: {
  query: string;
  limit?: number;
  min_similarity?: number;
  scope?: string;
}): Promise<{ query: string; total_matches: number; results: any[] }> {
  await verifySuperAdmin();
  const token = getGatewayToken();
  const aiGatewayUrl = GATEWAY_URL_MAP["ai"];

  const res = await fetch(`${aiGatewayUrl}/api/v1/ai/documents/simulate-search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Gateway-Token": token,
      "X-Tenant-ID": "00000000-0000-0000-0000-000000000000",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    return { query: payload.query, total_matches: 0, results: [] };
  }

  return res.json();
}

export async function testAiProviderConnection(payload: {
  provider: string;
  api_key?: string;
  base_url?: string;
  model?: string;
}): Promise<{
  provider: string;
  success: boolean;
  latency_ms: number;
  message: string;
  models_available?: string[];
  error_detail?: string;
}> {
  await verifySuperAdmin();
  const token = getGatewayToken();
  const aiGatewayUrl = GATEWAY_URL_MAP["ai"];

  const res = await fetch(`${aiGatewayUrl}/api/v1/ai/providers/test`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Gateway-Token": token,
      "X-Tenant-ID": "00000000-0000-0000-0000-000000000000",
    },
    body: JSON.stringify(payload),
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    return {
      provider: payload.provider,
      success: false,
      latency_ms: 0,
      message: err.detail || "Gagal menguji koneksi provider.",
      error_detail: err.detail,
    };
  }

  return res.json();
}

export type ModelCatalogItem = {
  id: string;
  name: string;
  description: string;
  category: string;
  badge?: string;
  context_window?: string;
  is_default?: boolean;
};

export type ProviderModelsResponse = {
  provider: string;
  models: ModelCatalogItem[];
  detected_live: boolean;
  source: string;
};

export async function fetchAiProviderModels(
  provider: string = "gemini",
  apiKey?: string,
  baseUrl?: string
): Promise<ProviderModelsResponse> {
  await verifySuperAdmin();
  const token = getGatewayToken();
  const aiGatewayUrl = GATEWAY_URL_MAP["ai"];

  const query = new URLSearchParams({ provider });
  if (apiKey && !apiKey.includes("••••")) query.set("api_key", apiKey);
  if (baseUrl) query.set("base_url", baseUrl);

  const res = await fetch(`${aiGatewayUrl}/api/v1/ai/providers/models?${query.toString()}`, {
    headers: {
      "X-Gateway-Token": token,
      "X-Tenant-ID": "00000000-0000-0000-0000-000000000000",
    },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch models for provider ${provider}: ${res.statusText}`);
  }

  return res.json();
}

export type ActiveChatModelsResponse = {
  default_model: string;
  active_primary: string;
  active_fallback: string;
  models: ModelCatalogItem[];
  configured_providers: string[];
};

export async function fetchActiveChatModels(): Promise<ActiveChatModelsResponse> {
  await verifySuperAdmin();
  const token = getGatewayToken();
  const aiGatewayUrl = GATEWAY_URL_MAP["ai"];

  const res = await fetch(`${aiGatewayUrl}/api/v1/ai/providers/active-models`, {
    headers: {
      "X-Gateway-Token": token,
      "X-Tenant-ID": "00000000-0000-0000-0000-000000000000",
    },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch active chat models: ${res.statusText}`);
  }

  return res.json();
}

export type KnowledgeGraphData = {
  nodes: Array<{
    id: string;
    label: string;
    title: string;
    category: string;
    chunk_count: number;
    file_size_bytes: number;
    vendor: string;
    status: string;
    degree: number;
    group: number;
    val: number;
  }>;
  links: Array<{
    source: string;
    target: string;
    similarity: number;
    value: number;
    relation: string;
  }>;
  stats: {
    total_nodes: number;
    total_links: number;
    categories_count: number;
    max_chunks: number;
    top_categories: Array<{ category: string; count: number }>;
  };
};

export async function getKnowledgeGraphData(): Promise<KnowledgeGraphData> {
  await verifySuperAdmin();
  const token = getGatewayToken();
  const aiGatewayUrl = GATEWAY_URL_MAP["ai"];

  const res = await fetch(`${aiGatewayUrl}/api/v1/ai/knowledge/graph`, {
    method: "GET",
    headers: {
      "X-Gateway-Token": token,
      "X-Tenant-ID": "00000000-0000-0000-0000-000000000000",
    },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    throw new Error("Gagal memuat visualisasi Knowledge Graph.");
  }

  return res.json();
}

export type ServerSyncStatus = {
  total_server_files: number;
  indexed_count: number;
  unindexed_count: number;
  unindexed_files: Array<{
    path: string;
    title: string;
    category: string;
    size_bytes: number;
  }>;
  is_synced: boolean;
};

export async function getAiServerSyncStatus(): Promise<ServerSyncStatus> {
  await verifySuperAdmin();
  const token = getGatewayToken();
  const aiGatewayUrl = GATEWAY_URL_MAP["ai"];

  try {
    const res = await fetch(`${aiGatewayUrl}/api/v1/ai/documents/sync-status`, {
      method: "GET",
      headers: {
        "X-Gateway-Token": token,
        "X-Tenant-ID": "00000000-0000-0000-0000-000000000000",
      },
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      return {
        total_server_files: 0,
        indexed_count: 0,
        unindexed_count: 0,
        unindexed_files: [],
        is_synced: true,
      };
    }

    return res.json();
  } catch (err) {
    console.warn("Gagal memuat status sync dokumen server:", err);
    return {
      total_server_files: 0,
      indexed_count: 0,
      unindexed_count: 0,
      unindexed_files: [],
      is_synced: true,
    };
  }
}

export interface ServerFilePreview {
  path: string;
  title: string;
  category: string;
  scope: string;
  content: string;
  size_bytes: number;
  line_count: number;
  word_count: number;
  char_count: number;
}

export async function previewAiServerFile(filePath: string): Promise<ServerFilePreview> {
  await verifySuperAdmin();
  const token = getGatewayToken();
  const aiGatewayUrl = GATEWAY_URL_MAP["ai"];

  const res = await fetch(
    `${aiGatewayUrl}/api/v1/ai/documents/server-file/preview?path=${encodeURIComponent(filePath)}`,
    {
      headers: {
        "X-Gateway-Token": token,
        "X-Tenant-ID": "00000000-0000-0000-0000-000000000000",
      },
      next: { revalidate: 0 },
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Gagal mempratinjau berkas server");
  }

  return res.json();
}

export async function rejectAiServerFile(payload: {
  path: string;
  title?: string;
  category?: string;
  reason?: string;
}): Promise<{ status: string; message: string; id: string }> {
  await verifySuperAdmin();
  const token = getGatewayToken();
  const aiGatewayUrl = GATEWAY_URL_MAP["ai"];

  const res = await fetch(`${aiGatewayUrl}/api/v1/ai/documents/server-file/reject`, {
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
    throw new Error(err.detail || "Gagal menolak berkas server");
  }

  return res.json();
}

export async function indexSingleAiServerFile(payload: {
  path: string;
  title?: string;
  category?: string;
  scope?: string;
}): Promise<{ id: string; status: string; title: string }> {
  await verifySuperAdmin();
  const token = getGatewayToken();
  const aiGatewayUrl = GATEWAY_URL_MAP["ai"];

  const res = await fetch(`${aiGatewayUrl}/api/v1/ai/documents/server-file/index-single`, {
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
    throw new Error(err.detail || "Gagal mengindeks berkas server");
  }

  return res.json();
}

export async function uploadKnowledgeImage(formData: FormData): Promise<{ url: string; filename: string }> {
  await verifySuperAdmin();
  const token = getGatewayToken();
  const storageGatewayUrl = GATEWAY_URL_MAP["storage"] || "http://ftth-storage-gateway:5004";

  if (!formData.has("bucket")) {
    formData.append("bucket", "public-contents");
  }
  if (!formData.has("folder")) {
    formData.append("folder", "knowledge/images");
  }

  const res = await fetch(`${storageGatewayUrl}/api/v1/upload`, {
    method: "POST",
    headers: {
      "X-Gateway-Token": token,
      "X-Tenant-ID": "00000000-0000-0000-0000-000000000000",
    },
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || "Gagal mengunggah gambar ke MinIO S3");
  }

  return res.json();
}

// ─── Suggested Prompts & Trending Topics Server Actions ─────────────────────

export type SuggestedPromptItem = {
  id: string;
  tenant_id?: string | null;
  title: string;
  description?: string | null;
  prompt: string;
  icon: string;
  category: string;
  target_role: string;
  is_pinned: boolean;
  is_active: boolean;
  is_trending?: boolean;
  usage_count: number;
  created_at?: string;
  updated_at?: string;
};

export type SuggestedPromptListResponse = {
  total: number;
  prompts: SuggestedPromptItem[];
};

export type TrendingTopicItem = {
  topic: string;
  count: number;
  category: string;
  sample_query: string;
  is_already_prompt: boolean;
};

export type TrendingTopicsResponse = {
  total_queries_analyzed: number;
  trending: TrendingTopicItem[];
};

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
    next: { revalidate: 0 },
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
    next: { revalidate: 0 },
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
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    return { total_queries_analyzed: 0, trending: [] };
  }

  return res.json();
}

// ─── K2 Agent Onboarding & Granular Permissions Server Actions ───────────────

export type AgentAuthorizationData = {
  is_authorized: boolean;
  agent_name: string;
  user_scope: string; // PLATFORM_INTERNAL | TENANT
  user_role: string;
  access_tier: string; // FULL | READ_ONLY | ROLE_PRESET | CUSTOM
  role_preset?: string | null;
  granted_permissions: string[];
  is_active: boolean;
  authorized_at?: string | null;
};

export type PermissionItemData = {
  id: string;
  name: string;
  scope: string; // Read | Write
  description: string;
};

export type PermissionDomainData = {
  id: string;
  title: string;
  icon: string;
  description: string;
  target_scope: string;
  permissions: PermissionItemData[];
};

export type PermissionCatalogData = {
  scope: string;
  total_permissions: number;
  domains: PermissionDomainData[];
};

export type RolePresetData = {
  id: string;
  name: string;
  badge: string;
  icon: string;
  description: string;
  target_scope: string;
  default_permissions: string[];
};

export async function fetchAgentAuthorization(
  scope: string = "PLATFORM_INTERNAL"
): Promise<AgentAuthorizationData> {
  const token = getGatewayToken();
  const aiGatewayUrl = GATEWAY_URL_MAP["ai"];

  try {
    const res = await fetch(`${aiGatewayUrl}/api/v1/ai/agent/authorization`, {
      headers: {
        "X-Gateway-Token": token,
        "X-Tenant-ID": "00000000-0000-0000-0000-000000000000",
        "X-User-Scope": scope,
      },
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      return {
        is_authorized: false,
        agent_name: "K2 Agent",
        user_scope: scope,
        user_role: "SUPER_ADMIN",
        access_tier: "FULL",
        role_preset: "SUPER_ADMIN",
        granted_permissions: [],
        is_active: false,
      };
    }

    return res.json();
  } catch (err) {
    console.warn("Gagal memuat status otorisasi K2 Agent:", err);
    return {
      is_authorized: false,
      agent_name: "K2 Agent",
      user_scope: scope,
      user_role: "SUPER_ADMIN",
      access_tier: "FULL",
      role_preset: "SUPER_ADMIN",
      granted_permissions: [],
      is_active: false,
    };
  }
}

export async function saveAgentAuthorization(payload: {
  agent_name?: string;
  user_scope?: string;
  access_tier: string;
  role_preset?: string;
  granted_permissions?: string[];
}): Promise<AgentAuthorizationData> {
  const token = getGatewayToken();
  const aiGatewayUrl = GATEWAY_URL_MAP["ai"];

  const res = await fetch(`${aiGatewayUrl}/api/v1/ai/agent/authorization`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Gateway-Token": token,
      "X-Tenant-ID": "00000000-0000-0000-0000-000000000000",
      "X-User-Scope": payload.user_scope || "PLATFORM_INTERNAL",
      "X-User-Role": "SUPER_ADMIN",
    },
    body: JSON.stringify({
      agent_name: payload.agent_name || "K2 Agent",
      user_scope: payload.user_scope || "PLATFORM_INTERNAL",
      access_tier: payload.access_tier,
      role_preset: payload.role_preset,
      granted_permissions: payload.granted_permissions || [],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Gagal menyimpan otorisasi K2 Agent");
  }

  return res.json();
}

export async function revokeAgentAuthorization(): Promise<{ status: string; message: string }> {
  const token = getGatewayToken();
  const aiGatewayUrl = GATEWAY_URL_MAP["ai"];

  const res = await fetch(`${aiGatewayUrl}/api/v1/ai/agent/authorization`, {
    method: "DELETE",
    headers: {
      "X-Gateway-Token": token,
      "X-Tenant-ID": "00000000-0000-0000-0000-000000000000",
      "X-User-Scope": "PLATFORM_INTERNAL",
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Gagal mencabut otorisasi K2 Agent");
  }

  return res.json();
}

export async function fetchAgentPermissionsCatalog(
  scope: string = "PLATFORM_INTERNAL"
): Promise<PermissionCatalogData> {
  const token = getGatewayToken();
  const aiGatewayUrl = GATEWAY_URL_MAP["ai"];

  const res = await fetch(`${aiGatewayUrl}/api/v1/ai/agent/catalog?scope=${scope}`, {
    headers: {
      "X-Gateway-Token": token,
      "X-Tenant-ID": "00000000-0000-0000-0000-000000000000",
    },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch permissions catalog: ${res.statusText}`);
  }

  return res.json();
}

export async function fetchAgentRolePresets(
  scope: string = "PLATFORM_INTERNAL"
): Promise<{ scope: string; presets: RolePresetData[] }> {
  const token = getGatewayToken();
  const aiGatewayUrl = GATEWAY_URL_MAP["ai"];

  const res = await fetch(`${aiGatewayUrl}/api/v1/ai/agent/presets?scope=${scope}`, {
    headers: {
      "X-Gateway-Token": token,
      "X-Tenant-ID": "00000000-0000-0000-0000-000000000000",
    },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch role presets: ${res.statusText}`);
  }

  return res.json();
}

export async function sendAiFeedback(payload: {
  sessionId?: string;
  messageId?: string;
  queryText?: string;
  responseText?: string;
  feedbackType: "like" | "dislike";
  reason?: string;
  modelUsed?: string;
}): Promise<{ status: string; message: string }> {
  const token = getGatewayToken();
  const aiGatewayUrl = GATEWAY_URL_MAP["ai"];

  try {
    const res = await fetch(`${aiGatewayUrl}/api/v1/ai/feedback`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Gateway-Token": token,
        "X-Tenant-ID": "00000000-0000-0000-0000-000000000000",
      },
      body: JSON.stringify(payload),
    });
    return res.json();
  } catch (err) {
    console.warn("Gagal mengirim AI feedback:", err);
    return { status: "error", message: String(err) };
  }
}


