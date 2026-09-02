import {
  getAuthHeaders,
  verifySuperAdmin,
} from "../common";
import type {
  ProviderModelsResponse,
  ActiveChatModelsResponse,
} from "./ai-types";

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

  const res = await fetch(`/api/v1/ai/providers/test`, {
    method: "POST",
    headers: getAuthHeaders({
      "Content-Type": "application/json",
    }),
    body: JSON.stringify(payload),
    cache: "no-store",
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

export async function fetchAiProviderModels(
  provider: string = "gemini",
  apiKey?: string,
  baseUrl?: string
): Promise<ProviderModelsResponse> {
  await verifySuperAdmin();

  const query = new URLSearchParams({ provider });
  if (apiKey && !apiKey.includes("••••")) query.set("api_key", apiKey);
  if (baseUrl) query.set("base_url", baseUrl);

  const res = await fetch(`/api/v1/ai/providers/models?${query.toString()}`, {
    headers: getAuthHeaders(),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch models for provider ${provider}: ${res.statusText}`);
  }

  return res.json();
}

export async function fetchActiveChatModels(): Promise<ActiveChatModelsResponse> {
  await verifySuperAdmin();

  const res = await fetch(`/api/v1/ai/providers/active-models`, {
    headers: getAuthHeaders(),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch active chat models: ${res.statusText}`);
  }

  return res.json();
}
