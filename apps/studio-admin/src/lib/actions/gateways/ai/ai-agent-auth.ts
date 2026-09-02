import {
  getAuthHeaders,
} from "../common";
import type {
  AgentAuthorizationData,
  PermissionCatalogData,
  RolePresetData,
} from "./ai-types";

export async function fetchAgentAuthorization(
  scope: string = "PLATFORM_INTERNAL"
): Promise<AgentAuthorizationData> {
  try {
    const res = await fetch(`/api/v1/ai/agent/authorization`, {
      headers: getAuthHeaders({
        "X-User-Scope": scope,
      }),
      cache: "no-store",
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
        agent_id: "k2-agent",
        role: "SUPER_ADMIN",
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
      agent_id: "k2-agent",
      role: "SUPER_ADMIN",
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
  const res = await fetch(`/api/v1/ai/agent/authorization`, {
    method: "POST",
    headers: getAuthHeaders({
      "Content-Type": "application/json",
      "X-User-Scope": payload.user_scope || "PLATFORM_INTERNAL",
      "X-User-Role": "SUPER_ADMIN",
    }),
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
  const res = await fetch(`/api/v1/ai/agent/authorization`, {
    method: "DELETE",
    headers: getAuthHeaders({
      "X-User-Scope": "PLATFORM_INTERNAL",
    }),
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
  const res = await fetch(`/api/v1/ai/agent/catalog?scope=${scope}`, {
    headers: getAuthHeaders(),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch permissions catalog: ${res.statusText}`);
  }

  return res.json();
}

export async function fetchAgentRolePresets(
  scope: string = "PLATFORM_INTERNAL"
): Promise<{ scope: string; presets: RolePresetData[] }> {
  const res = await fetch(`/api/v1/ai/agent/presets?scope=${scope}`, {
    headers: getAuthHeaders(),
    cache: "no-store",
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
  try {
    const res = await fetch(`/api/v1/ai/feedback`, {
      method: "POST",
      headers: getAuthHeaders({
        "Content-Type": "application/json",
      }),
      body: JSON.stringify(payload),
    });
    return res.json();
  } catch (err) {
    console.warn("Gagal mengirim AI feedback:", err);
    return { status: "error", message: String(err) };
  }
}
