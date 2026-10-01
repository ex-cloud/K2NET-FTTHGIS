import { httpClient } from "@/lib/httpClient";
import {
  getAuthHeaders,
  verifySuperAdmin,
} from "./common";

const getBackendBaseUrl = () => {
  return (
    (typeof window !== "undefined" && window.__K2NET_API_URL__) ||
    "/api/v1"
  );
};

// ─────────────────────────────────────────────
// Storage Gateway: GET /api/v1/storage/stats or /api/v1/stats
// ─────────────────────────────────────────────

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

  const res = await fetch(`/api/v1/stats`, {
    headers: getAuthHeaders(),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch storage stats: ${res.statusText}`);
  }

  return res.json();
}

// ─────────────────────────────────────────────
// Scheduler Gateway: GET /api/v1/scheduler/jobs
// ─────────────────────────────────────────────

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

  const res = await fetch(`/api/v1/scheduler/jobs`, {
    headers: getAuthHeaders(),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch scheduler jobs: ${res.statusText}`);
  }

  const payload = await res.json();
  return payload.data || [];
}

// ─────────────────────────────────────────────
// Audit Gateway: GET /api/v1/audit/events
// ─────────────────────────────────────────────

export type AuditEvent = {
  id: string;
  tenantSlug: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  target?: string;
  status: string;
  actorId?: string;
  actorIp?: string;
  userId?: string;
  username?: string;
  clientIp?: string;
  userAgent?: string;
  serviceSource?: string;
  errorMessage?: string;
  oldValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
  metadata?: Record<string, unknown>;
  occurredAt?: string;
  createdAt: string;
};

export type AuditQueryParams = {
  logGroup?: string;
  severity?: string;
  search?: string;
  tenantSlug?: string;
  projectId?: string;
  scope?: string;
  page?: number;
  pageSize?: number;
};

export async function getAuditEvents(params?: AuditQueryParams): Promise<AuditEvent[]> {
  await verifySuperAdmin();

  let url = `/api/v1/audit/events`;
  if (params) {
    const q = new URLSearchParams();
    if (params.logGroup) q.set("logGroup", params.logGroup);
    if (params.severity) q.set("severity", params.severity);
    if (params.search) q.set("search", params.search);
    if (params.tenantSlug) q.set("tenantSlug", params.tenantSlug);
    if (params.projectId) q.set("projectId", params.projectId);
    if (params.scope) q.set("scope", params.scope);
    if (params.page !== undefined) q.set("page", String(params.page));
    if (params.pageSize !== undefined) q.set("pageSize", String(params.pageSize));
    const qs = q.toString();
    if (qs) url += `?${qs}`;
  }

  const res = await fetch(url, {
    headers: getAuthHeaders(),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch audit events: ${res.statusText}`);
  }

  const payload = await res.json();
  return payload.data || [];
}


// ─────────────────────────────────────────────
// OLT Gateway: GET /api/v1/olt
// ─────────────────────────────────────────────

export type OLTDevice = {
  id: string;
  tenantSlug: string;
  name: string;
  host: string;
  port: number;
  vendor: string; // zte, huawei, fiberhome
  community: string;
  createdAt: string;
  updatedAt: string;
};

export async function getOltDevices(): Promise<OLTDevice[]> {
  await verifySuperAdmin();

  const res = await fetch(`/api/v1/olt`, {
    headers: getAuthHeaders(),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch OLT devices: ${res.statusText}`);
  }

  const payload = await res.json();
  return Array.isArray(payload) ? payload : payload.data || [];
}

// ─────────────────────────────────────────────
// Export Gateway: GET /api/v1/export/jobs
// ─────────────────────────────────────────────

export type ExportJob = {
  jobId: string;
  tenantSlug: string;
  type: string; // invoice, billing, network, inventory, tickets, customer
  status: string; // queued, processing, done, failed
  params: Record<string, unknown>;
  downloadUrl?: string;
  errorMsg?: string;
  createdAt: string;
  updatedAt: string;
};

export async function getExportJobs(): Promise<ExportJob[]> {
  await verifySuperAdmin();

  const res = await fetch(`/api/v1/export/jobs`, {
    headers: getAuthHeaders(),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch export jobs: ${res.statusText}`);
  }

  const payload = await res.json();
  return Array.isArray(payload) ? payload : payload.data || [];
}

// ─────────────────────────────────────────────
// Poller Gateway: GET /api/v1/devices/status
// ─────────────────────────────────────────────

export type PollerDeviceStatus = {
  deviceCode: string;
  host: string;
  name: string;
  status: string; // up, down, timeout, unknown
  responseTimeMs: number;
  lastPolledAt: string;
  uptimeSeconds?: number;
};

export async function getPollerDeviceStatus(): Promise<PollerDeviceStatus[]> {
  await verifySuperAdmin();

  const res = await fetch(`/api/v1/devices/status`, {
    headers: getAuthHeaders(),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch poller device status: ${res.statusText}`);
  }

  const payload = await res.json();
  return Array.isArray(payload) ? payload : payload.data || [];
}

// ─────────────────────────────────────────────
// Notification Gateway: GET /api/v1/notification/logs
// ─────────────────────────────────────────────

export type NotificationLog = {
  id: string;
  channel: string; // sms, email, whatsapp
  recipient: string;
  subject?: string;
  status: string; // sent, failed
  errorMessage?: string;
  sentAt: string;
};

export async function getNotificationLogs(): Promise<NotificationLog[]> {
  await verifySuperAdmin();

  const res = await fetch(`/api/v1/notification/logs`, {
    headers: getAuthHeaders(),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch notification logs: ${res.statusText}`);
  }

  const payload = await res.json();
  return Array.isArray(payload) ? payload : payload.data || [];
}

// ─────────────────────────────────────────────
// Payment Gateway: GET /api/v1/payments/recent
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

export async function getRecentPayments(token?: string): Promise<PaymentTransaction[]> {
  await verifySuperAdmin();
  const backendUrl = getBackendBaseUrl();
  const res = await httpClient(`${backendUrl}/payments/recent`, { token });

  if (!res.ok) {
    throw new Error(`Failed to fetch recent payments: ${res.statusText}`);
  }

  return res.json();
}

export async function triggerPaymentReconciliation(token?: string): Promise<{ success: boolean; message: string }> {
  await verifySuperAdmin();
  const backendUrl = getBackendBaseUrl();
  const res = await httpClient(`${backendUrl}/payments/reconcile`, {
    method: "POST",
    token,
  });

  if (!res.ok) {
    throw new Error(`Failed to trigger payment reconciliation: ${res.statusText}`);
  }

  return res.json();
}
