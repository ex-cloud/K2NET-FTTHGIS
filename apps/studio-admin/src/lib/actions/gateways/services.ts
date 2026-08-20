"use server";

import { auth } from "@/auth";
import {
  getGatewayToken,
  verifySuperAdmin,
  GATEWAY_URL_MAP,
} from "./common";

// ─────────────────────────────────────────────
// Storage Gateway: GET /api/v1/stats
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

// ─────────────────────────────────────────────
// Audit Gateway: GET /api/v1/audit/events
// ─────────────────────────────────────────────

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
      Authorization: `Bearer ${token}`,
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
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to trigger payment reconciliation: ${res.statusText}`);
  }

  return res.json();
}
