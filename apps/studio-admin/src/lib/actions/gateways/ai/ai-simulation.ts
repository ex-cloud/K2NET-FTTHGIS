import {
  getGatewayToken,
  verifySuperAdmin,
  GATEWAY_URL_MAP,
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
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Gagal memuat visualisasi Knowledge Graph.");
  }

  return res.json();
}
