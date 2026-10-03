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
  category?: string;
  logType?: string;
  serviceSource?: string;
  startDate?: string;
  endDate?: string;
  cursor?: string;
  includeBenchmark?: boolean;
  page?: number;
  pageSize?: number;
};

export type PaginatedAuditEventsResponse = {
  data: AuditEvent[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasMore?: boolean;
  nextCursor?: string | null;
};

function buildAuditSearchParams(params?: AuditQueryParams): string {
  if (!params) return "";
  const q = new URLSearchParams();
  const stringFields: Array<[string, string | undefined]> = [
    ["logGroup", params.logGroup],
    ["severity", params.severity],
    ["search", params.search],
    ["tenantSlug", params.tenantSlug],
    ["projectId", params.projectId],
    ["scope", params.scope],
    ["category", params.category],
    ["logType", params.logType],
    ["serviceSource", params.serviceSource],
    ["startDate", params.startDate],
    ["endDate", params.endDate],
    ["cursor", params.cursor],
  ];

  for (const [key, val] of stringFields) {
    if (val) q.set(key, val);
  }

  if (params.includeBenchmark !== undefined) q.set("includeBenchmark", String(params.includeBenchmark));
  if (params.page !== undefined) q.set("page", String(params.page));
  if (params.pageSize !== undefined) q.set("pageSize", String(params.pageSize));

  const qs = q.toString();
  return qs ? `?${qs}` : "";
}

export async function getAuditEvents(params?: AuditQueryParams): Promise<AuditEvent[]> {
  const result = await getAuditEventsPaginated(params);
  return result.data || [];
}

export async function getAuditEventsPaginated(params?: AuditQueryParams): Promise<PaginatedAuditEventsResponse> {
  await verifySuperAdmin();

  const url = `/api/v1/audit/events${buildAuditSearchParams(params)}`;
  const res = await fetch(url, {
    headers: getAuthHeaders(),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch audit events: ${res.statusText}`);
  }

  const payload = await res.json();
  return {
    data: payload.data || [],
    totalCount: payload.totalCount ?? (payload.data?.length || 0),
    page: payload.page ?? 1,
    pageSize: payload.pageSize ?? 50,
    totalPages: payload.totalPages ?? 1,
    hasMore: Boolean(payload.hasMore),
    nextCursor: payload.nextCursor || null,
  };
}

export type AuditArchiveMeta = {
  partition: string;
  parentTable: string;
  archivedAt: string;
  totalRows: number;
  fileSizeBytes: number;
  sha256Checksum: string;
  archiveFileName: string;
  s3Path: string;
  wormRetentionDays: number;
  status: string;
  startDate?: string;
  endDate?: string;
};

export type ArchiveSummary = {
  totalArchives: number;
  totalArchivedRows: number;
  totalSizeBytes: number;
  totalSizeFormatted: string;
  oldestArchive: string;
  newestArchive: string;
  wormComplianceStatus: string;
  retentionPolicy: string;
};

export type AuditArchivesResponse = {
  data: AuditArchiveMeta[];
  summary: ArchiveSummary;
};

export async function getAuditArchives(params?: {
  table?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}): Promise<AuditArchivesResponse> {
  await verifySuperAdmin();

  const q = new URLSearchParams();
  if (params?.table) q.set("table", params.table);
  if (params?.startDate) q.set("startDate", params.startDate);
  if (params?.endDate) q.set("endDate", params.endDate);
  if (params?.search) q.set("search", params.search);

  const qs = q.toString();
  const url = `/api/v1/audit/archives${qs ? `?${qs}` : ""}`;

  const res = await fetch(url, {
    headers: getAuthHeaders(),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch audit archives: ${res.statusText}`);
  }

  const payload = await res.json();
  return {
    data: payload.data || [],
    summary: payload.summary || {
      totalArchives: 0,
      totalArchivedRows: 0,
      totalSizeBytes: 0,
      totalSizeFormatted: "0 B",
      oldestArchive: "-",
      newestArchive: "-",
      wormComplianceStatus: "COMPLIANT_LOCKED",
      retentionPolicy: "1095 Days (3 Years)",
    },
  };
}

// ─────────────────────────────────────────────
// Incident Alerting & Webhooks (P.11)
// ─────────────────────────────────────────────

export type AlertConfig = {
  enabled: boolean;
  webhookUrl: string;
  webhookType: "generic" | "slack" | "discord" | "telegram";
  secretKey: string;
  notificationGatewayUrl: string;
  enableEmail: boolean;
  alertEmail: string;
  enableWhatsApp: boolean;
  alertPhone: string;
  cooldownSeconds: number;
  minSeverity: "CRITICAL" | "ERROR";
  highRiskActions: string[];
};

export type AlertTestResult = {
  success: boolean;
  channel: string;
  target: string;
  responseCode: number;
  responseStatus: string;
  latencyMs: number;
  error?: string;
};

export async function getAlertConfig(): Promise<AlertConfig | null> {
  await verifySuperAdmin();
  const res = await fetch("/api/v1/audit/alerts/config", {
    headers: getAuthHeaders(),
    cache: "no-store",
  });
  if (!res.ok) {
    return null;
  }
  const payload = await res.json();
  return payload.data || null;
}

export async function updateAlertConfig(
  cfg: Partial<AlertConfig>
): Promise<{ success: boolean; data?: AlertConfig; message?: string }> {
  await verifySuperAdmin();
  const res = await fetch("/api/v1/audit/alerts/config", {
    method: "PUT",
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(cfg),
  });
  return res.json();
}

export async function testAlertWebhook(payload: {
  targetType: string;
  targetUrl: string;
  secretKey?: string;
}): Promise<AlertTestResult> {
  await verifySuperAdmin();
  const res = await fetch("/api/v1/audit/alerts/test", {
    method: "POST",
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  return data.data || data;
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
