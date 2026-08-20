"use server";

import fs from "fs";
import { auth } from "@/auth";

const lastMetricsCache: Record<string, { count: number; time: number; throughput: number }> = {};

function getGatewayToken(): string {
  // 1. Check environment variable first (Docker / production)
  if (process.env.GATEWAY_TOKEN) {
    return process.env.GATEWAY_TOKEN;
  }

  // 2. Fallback: read from env file (host-level / development)
  try {
    const envPath = process.env.GATEWAY_ENV_PATH;
    if (!envPath || !fs.existsSync(envPath)) {
      console.warn("[Gateway Actions] Gateway env file not configured or not found");
      return "CHANGE_ME_TO_A_STRONG_RANDOM_TOKEN";
    }
    const content = fs.readFileSync(envPath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (trimmed.startsWith("GATEWAY_TOKEN=")) {
        return trimmed.substring("GATEWAY_TOKEN=".length).trim();
      }
    }
  } catch (err) {
    console.error("[Gateway Actions] Error reading gateway token:", err);
  }
  return "CHANGE_ME_TO_A_STRONG_RANDOM_TOKEN";
}

const GATEWAY_BASE_URL = process.env.NOTIFICATION_GATEWAY_URL || "http://127.0.0.1:5001";

/**
 * Map of gateway identifiers to their backend URL environment variables.
 * Each gateway has its own /api/v1/config endpoint.
 */
const GATEWAY_URL_MAP: Record<string, string> = {
  notification: process.env.NOTIFICATION_GATEWAY_URL || "http://127.0.0.1:5001",
  payment:      process.env.PAYMENT_GATEWAY_URL      || "http://127.0.0.1:5002",
  map:          process.env.MAP_GATEWAY_URL           || "http://127.0.0.1:5003",
  storage:      process.env.STORAGE_GATEWAY_URL       || "http://127.0.0.1:5004",
  whatsapp:     process.env.WHATSAPP_GATEWAY_URL      || "http://127.0.0.1:5005",
  scheduler:    process.env.SCHEDULER_GATEWAY_URL     || "http://127.0.0.1:5006",
  export:       process.env.EXPORT_GATEWAY_URL        || "http://127.0.0.1:5007",
  olt:          process.env.OLT_GATEWAY_URL           || "http://127.0.0.1:5008",
  audit:        process.env.AUDIT_GATEWAY_URL         || "http://127.0.0.1:5009",
  poller:       process.env.POLLER_GATEWAY_URL        || "http://ftth-poller:5010",
  task:         process.env.TASK_GATEWAY_URL          || "http://ftth-task-gateway:5011",
  ai:           process.env.AI_GATEWAY_URL            || "http://ftth-ai-gateway:5012",
};

async function verifySuperAdmin() {
  const session = await auth();
  const roles = session?.user?.roles || [];
  const isSuperAdmin = roles.includes("super_admin") || roles.includes("ROLE_SUPER_ADMIN");
  if (!isSuperAdmin) {
    throw new Error("Unauthorized: Superadmin access required");
  }
}

export type ConfigEntry = {
  key: string;
  value: string;
  censored: string;
  section: string;
};

export type ConfigResponse = {
  status: string;
  sections: Record<string, ConfigEntry[]>;
};

export type GatewayServiceStatus = {
  name: string;
  port: number;
  active: boolean;
  status: string;
  latency?: number;
  throughput?: number;
};

export type StatusResponse = {
  status: string;
  services: GatewayServiceStatus[];
};

export async function getGatewayConfig(): Promise<ConfigResponse> {
  await verifySuperAdmin();
  
  const token = getGatewayToken();
  const res = await fetch(`${GATEWAY_BASE_URL}/api/v1/config`, {
    headers: {
      "X-Gateway-Token": token,
    },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch config from gateway: ${res.statusText}`);
  }

  return res.json();
}

export async function updateGatewayConfig(updates: Record<string, string>): Promise<{ status: string; message: string; keys_updated: number }> {
  await verifySuperAdmin();

  const token = getGatewayToken();
  const res = await fetch(`${GATEWAY_BASE_URL}/api/v1/config`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Gateway-Token": token,
    },
    body: JSON.stringify({ updates }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(errText || `Failed to update gateway configuration: ${res.statusText}`);
  }

  return res.json();
}

export async function getGatewayStatus(): Promise<StatusResponse> {
  await verifySuperAdmin();

  const token = getGatewayToken();
  const res = await fetch(`${GATEWAY_BASE_URL}/api/v1/gateway-status`, {
    headers: {
      "X-Gateway-Token": token,
    },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch status from gateway: ${res.statusText}`);
  }

  const data = await res.json();
  
  const updatedServices = await Promise.all((data.services || []).map(async (svc: GatewayServiceStatus) => {
    if (!svc.active) {
      return { ...svc, latency: 0, throughput: 0 };
    }

    // Determine host: if NOTIFICATION_GATEWAY_URL points to a container name (Docker environment),
    // use svc.name to connect to that service container directly. Otherwise use localhost/127.0.0.1.
    const isDocker = process.env.NOTIFICATION_GATEWAY_URL && 
                     !process.env.NOTIFICATION_GATEWAY_URL.includes("localhost") && 
                     !process.env.NOTIFICATION_GATEWAY_URL.includes("127.0.0.1");
    const host = isDocker ? svc.name : "127.0.0.1";
    const url = `http://${host}:${svc.port}/metrics`;
    const start = Date.now();
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 800); // 800ms timeout
      
      const pingRes = await fetch(url, {
        signal: controller.signal,
        next: { revalidate: 0 },
      });
      clearTimeout(id);
      
      const latency = Date.now() - start;
      
      if (!pingRes.ok) {
        return { ...svc, latency, throughput: 0 };
      }

      const text = await pingRes.text();
      // Parse counter gateway_http_requests_total
      let totalRequests = 0;
      const lines = text.split("\n");
      for (const line of lines) {
        if (line.startsWith("gateway_http_requests_total")) {
          const parts = line.trim().split(" ");
          const value = parseFloat(parts[parts.length - 1]);
          if (!isNaN(value)) {
            totalRequests += value;
          }
        }
      }

      // Calculate throughput (req/min) based on difference with lastMetricsCache
      const now = Date.now();
      const prev = lastMetricsCache[svc.name];
      let throughput = 0;
      
      if (prev && now > prev.time) {
        const timeDiffMin = (now - prev.time) / 60000;
        if (timeDiffMin > 0 && totalRequests >= prev.count) {
          throughput = Math.round((totalRequests - prev.count) / timeDiffMin);
        }
      }
      
      // Update cache
      lastMetricsCache[svc.name] = {
        count: totalRequests,
        time: now,
        throughput: throughput,
      };

      return { ...svc, latency, throughput };
    } catch (err) {
      console.warn(`[Gateway Latency Check] Failed for ${svc.name}:`, err);
      return { ...svc, latency: 0, throughput: 0 };
    }
  }));

  return {
    status: "ok",
    services: updatedServices,
  };
}

export type StorageStats = {
  total_files: number;
  total_original_size: number;
  total_compressed_size: number;
  success_count: number;
  failure_count: number;
  space_saved_percent: number;
  failure_rate_percent: number;
};

export async function getStorageStats(): Promise<StorageStats> {
  await verifySuperAdmin();

  const token = getGatewayToken();
  const storageGatewayUrl = process.env.STORAGE_GATEWAY_URL || "http://127.0.0.1:5004";

  const res = await fetch(`${storageGatewayUrl}/api/v1/stats`, {
    headers: {
      "X-Gateway-Token": token,
    },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch storage stats: ${res.statusText}`);
  }

  return res.json();
}

/**
 * Universal: fetch config from any gateway by its identifier key.
 * Example: getGatewayConfigByKey("payment") → calls PAYMENT_GATEWAY_URL/api/v1/config
 */
export async function getGatewayConfigByKey(gatewayKey: string): Promise<ConfigResponse> {
  await verifySuperAdmin();

  const baseUrl = GATEWAY_URL_MAP[gatewayKey];
  if (!baseUrl) {
    throw new Error(`Unknown gateway key: "${gatewayKey}". Valid keys: ${Object.keys(GATEWAY_URL_MAP).join(", ")}`);
  }

  const token = getGatewayToken();
  const res = await fetch(`${baseUrl}/api/v1/config`, {
    headers: { "X-Gateway-Token": token },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    throw new Error(`[${gatewayKey}] Failed to fetch config: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

/**
 * Universal: save config updates to any gateway by its identifier key.
 * Example: updateGatewayConfigByKey("payment", { XENDIT_API_KEY: "..." })
 */
export async function updateGatewayConfigByKey(
  gatewayKey: string,
  updates: Record<string, string>
): Promise<{ status: string; message: string; keys_updated: number }> {
  await verifySuperAdmin();

  const baseUrl = GATEWAY_URL_MAP[gatewayKey];
  if (!baseUrl) {
    throw new Error(`Unknown gateway key: "${gatewayKey}". Valid keys: ${Object.keys(GATEWAY_URL_MAP).join(", ")}`);
  }

  const token = getGatewayToken();
  const res = await fetch(`${baseUrl}/api/v1/config`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Gateway-Token": token,
    },
    body: JSON.stringify({ updates }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(errText || `[${gatewayKey}] Failed to update config: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

export type SchedulerJob = {
  id: string;
  tenantSlug: string;
  name: string;
  description: string;
  cronExpr: string;
  jobType: string;
  isActive: boolean;
  lastRunAt: string | null;
  nextRunAt: string | null;
};

export async function getSchedulerJobs(): Promise<SchedulerJob[]> {
  await verifySuperAdmin();

  const baseUrl = GATEWAY_URL_MAP["scheduler"];
  const token = getGatewayToken();
  const res = await fetch(`${baseUrl}/api/v1/scheduler/jobs`, {
    headers: { "X-Gateway-Token": token },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch scheduler jobs: ${res.statusText}`);
  }

  const payload = await res.json();
  return payload.data || [];
}

export type AuditEvent = {
  id: string;
  tenantSlug: string;
  action: string;
  target: string;
  status: string;
  userId: string;
  username: string;
  clientIp: string;
  userAgent: string;
  errorMessage: string;
  createdAt: string;
};

export async function getAuditEvents(): Promise<AuditEvent[]> {
  await verifySuperAdmin();

  const baseUrl = GATEWAY_URL_MAP["audit"];
  const token = getGatewayToken();
  const res = await fetch(`${baseUrl}/api/v1/audit/events`, {
    headers: { "X-Gateway-Token": token },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch audit events: ${res.statusText}`);
  }

  const payload = await res.json();
  return payload.data || [];
}

// ─────────────────────────────────────────────
// 2A — OLT Gateway: GET /api/v1/olt
// ─────────────────────────────────────────────

export type OLTDevice = {
  id: string;
  tenantSlug: string;
  name: string;
  host: string;
  port: number;
  vendor: string;       // zte, huawei, fiberhome
  community: string;
  createdAt: string;
  updatedAt: string;
};

export async function getOltDevices(): Promise<OLTDevice[]> {
  await verifySuperAdmin();

  const baseUrl = GATEWAY_URL_MAP["olt"];
  const token = getGatewayToken();
  const res = await fetch(`${baseUrl}/api/v1/olt`, {
    headers: { "X-Gateway-Token": token },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch OLT devices: ${res.statusText}`);
  }

  const payload = await res.json();
  // Gateway returns { data: OLTDevice[] } or OLTDevice[] directly
  return Array.isArray(payload) ? payload : (payload.data || []);
}

// ─────────────────────────────────────────────
// 2B — Export Gateway: GET /api/v1/export/jobs
// ─────────────────────────────────────────────

export type ExportJob = {
  jobId: string;
  tenantSlug: string;
  type: string;         // invoice, billing, network, inventory, tickets, customer
  status: string;       // queued, processing, done, failed
  params: Record<string, unknown>;
  downloadUrl?: string;
  errorMsg?: string;
  createdAt: string;
  updatedAt: string;
};

export async function getExportJobs(): Promise<ExportJob[]> {
  await verifySuperAdmin();

  const baseUrl = GATEWAY_URL_MAP["export"];
  const token = getGatewayToken();
  const res = await fetch(`${baseUrl}/api/v1/export/jobs`, {
    headers: { "X-Gateway-Token": token },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch export jobs: ${res.statusText}`);
  }

  const payload = await res.json();
  return Array.isArray(payload) ? payload : (payload.data || []);
}

// ─────────────────────────────────────────────
// 2C — Poller: GET /api/v1/devices/status
// ─────────────────────────────────────────────

export type PollerDeviceStatus = {
  deviceCode: string;
  host: string;
  name: string;
  status: string;           // up, down, timeout, unknown
  responseTimeMs: number;
  lastPolledAt: string;
  uptimeSeconds?: number;
};

export async function getPollerDeviceStatus(): Promise<PollerDeviceStatus[]> {
  await verifySuperAdmin();

  const baseUrl = GATEWAY_URL_MAP["poller"];
  const token = getGatewayToken();
  const res = await fetch(`${baseUrl}/api/v1/devices/status`, {
    headers: { "X-Gateway-Token": token },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch poller device status: ${res.statusText}`);
  }

  const payload = await res.json();
  return Array.isArray(payload) ? payload : (payload.data || []);
}

// ─────────────────────────────────────────────
// 2D — Notification Gateway: GET /api/v1/notification/logs
// ─────────────────────────────────────────────

export type NotificationLog = {
  id: string;
  channel: string;      // sms, email, whatsapp
  recipient: string;
  subject?: string;
  status: string;       // sent, failed
  errorMessage?: string;
  sentAt: string;
};

export async function getNotificationLogs(): Promise<NotificationLog[]> {
  await verifySuperAdmin();

  const baseUrl = GATEWAY_URL_MAP["notification"];
  const token = getGatewayToken();
  const res = await fetch(`${baseUrl}/api/v1/notification/logs`, {
    headers: { "X-Gateway-Token": token },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch notification logs: ${res.statusText}`);
  }

  const payload = await res.json();
  return Array.isArray(payload) ? payload : (payload.data || []);
}

// ─────────────────────────────────────────────
// 2E — Payment Gateway: GET /api/v1/payments/recent
// ─────────────────────────────────────────────

export type PaymentTransaction = {
  id: string;
  externalId: string;
  orgSlug: string;
  planName: string;
  amount: number;
  status: string;
  payerEmail?: string;
  createdAt: string;
  updatedAt: string;
};

export async function getRecentPayments(): Promise<PaymentTransaction[]> {
  await verifySuperAdmin();

  const session = await auth();
  const token = session?.accessToken as string | undefined;
  if (!token) {
    throw new Error("Unauthorized: Access token missing");
  }

  const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9090/api/v1";
  const res = await fetch(`${backendUrl}/payments/recent`, {
    headers: {
      "Authorization": `Bearer ${token}`,
    },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch recent payments: ${res.statusText}`);
  }

  return res.json();
}

export async function triggerPaymentReconciliation(): Promise<{ success: boolean; message: string }> {
  await verifySuperAdmin();

  const session = await auth();
  const token = session?.accessToken as string | undefined;
  if (!token) {
    throw new Error("Unauthorized: Access token missing");
  }

  const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9090/api/v1";
  const res = await fetch(`${backendUrl}/payments/reconcile`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to trigger payment reconciliation: ${res.statusText}`);
  }

  return res.json();
}

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


