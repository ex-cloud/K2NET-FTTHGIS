import {
  getAuthHeaders,
  verifySuperAdmin,
} from "../common";
import type {
  VectorSearchResultItem,
  KnowledgeGraphData,
} from "./ai-types";

export async function simulateVectorSearch(payload: {
  query: string;
  limit?: number;
  min_similarity?: number;
  scope?: string;
}): Promise<{ query: string; total_matches: number; results: VectorSearchResultItem[] }> {
  await verifySuperAdmin();

  const res = await fetch(`/api/v1/ai/documents/simulate-search`, {
    method: "POST",
    headers: getAuthHeaders({
      "Content-Type": "application/json",
    }),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    return { query: payload.query, total_matches: 0, results: [] };
  }

  return res.json();
}

export async function getKnowledgeGraphData(): Promise<KnowledgeGraphData> {
  await verifySuperAdmin();

  const res = await fetch(`/api/v1/ai/knowledge/graph`, {
    method: "GET",
    headers: getAuthHeaders(),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Gagal memuat visualisasi Knowledge Graph.");
  }

  return res.json();
}
