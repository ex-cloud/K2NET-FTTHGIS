import {
  getAuthHeaders,
  verifySuperAdmin,
} from "../common";
import type {
  AiKnowledgeStats,
  AiDocumentItem,
  AiDocumentDetail,
  AiDocumentListResponse,
} from "./ai-types";

export async function getAiKnowledgeStats(): Promise<AiKnowledgeStats> {
  await verifySuperAdmin();

  const res = await fetch(`/api/v1/ai/documents/stats`, {
    headers: getAuthHeaders(),
    cache: "no-store",
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

  const query = new URLSearchParams();
  if (params?.category) query.set("category", params.category);
  if (params?.scope) query.set("scope", params.scope);
  if (params?.status) query.set("status", params.status);
  if (params?.search) query.set("search", params.search);
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.offset) query.set("offset", String(params.offset));

  const res = await fetch(`/api/v1/ai/documents?${query.toString()}`, {
    headers: getAuthHeaders(),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch AI documents: ${res.statusText}`);
  }

  return res.json();
}

export async function getAiDocumentDetail(docId: string): Promise<AiDocumentDetail> {
  await verifySuperAdmin();

  const res = await fetch(`/api/v1/ai/documents/${docId}`, {
    headers: getAuthHeaders(),
    cache: "no-store",
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

  const res = await fetch(`/api/v1/ai/documents/text`, {
    method: "POST",
    headers: getAuthHeaders({
      "Content-Type": "application/json",
    }),
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

  const res = await fetch(`/api/v1/ai/documents/${docId}`, {
    method: "PUT",
    headers: getAuthHeaders({
      "Content-Type": "application/json",
    }),
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

  const res = await fetch(`/api/v1/ai/documents/${docId}/approve`, {
    method: "POST",
    headers: getAuthHeaders({
      "Content-Type": "application/json",
    }),
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

  const res = await fetch(`/api/v1/ai/documents/${docId}/reject`, {
    method: "POST",
    headers: getAuthHeaders({
      "Content-Type": "application/json",
    }),
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

  const res = await fetch(`/api/v1/ai/documents/${docId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Gagal menghapus dokumen");
  }

  return res.json();
}
