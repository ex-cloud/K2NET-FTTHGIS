export type RecentTabId = "organizations" | "security" | "jobs" | "alerts" | "billing";

export interface OrganizationItem {
  id: string;
  name: string;
  slug: string;
  planTier: string;
  status: string;
  createdAt: string;
  isTrial: boolean;
}

export interface SecurityAuditItem {
  id: string;
  timestamp: string;
  rawTimestamp?: string;
  actor: string;
  rawActor?: string;
  targetTenant: string;
  tenantSlug?: string;
  action: string;
  rawAction?: string;
  severity: "CRITICAL" | "WARNING" | "INFO";
  ipAddress: string;
  details?: string;
  eventMessage?: string;
  serviceSource?: string;
  logGroup?: string;
  logType?: string;
  httpMethod?: string;
  httpStatus?: number | string;
  requestPath?: string;
  resourceType?: string;
  resourceId?: string;
  rawMetadata?: string;
  rawJsonPayload?: string;
}

export interface BackgroundJobItem {
  id: string;
  jobType: string;
  targetOrg: string;
  progressPercent: number;
  status: "RUNNING" | "COMPLETED" | "FAILED";
  duration: string;
  startedAt: string;
}

export interface SystemAlertItem {
  id: string;
  title: string;
  service: string;
  severity: "critical" | "warning" | "info";
  message: string;
  triggerTime: string;
  actionUrl: string;
  actionLabel: string;
}

export interface BillingEventItem {
  id: string;
  orgName: string;
  orgSlug: string;
  eventType: string;
  eventLabel: string; // e.g. "Paket Upgrade", "Pembayaran Xendit", "Trial Reminder", "Langganan Aktif"
  planName: string;
  amount: string;
  valueChange: string; // e.g. "STARTER → ENTERPRISE", "Invoice #INV-2026-0901", "Sisa 7 hari masa percobaan"
  status: string;
  timestamp: string;
}

export interface SummaryCounts {
  activeAlertsCount: number;
  runningJobsCount: number;
  securityWarningsCount: number;
  totalOrganizationsCount: number;
  recentBillingEventsCount: number;
}

export interface RecentOperationsData {
  organizations: OrganizationItem[];
  securityAudits: SecurityAuditItem[];
  backgroundJobs: BackgroundJobItem[];
  systemAlerts: SystemAlertItem[];
  billingEvents: BillingEventItem[];
  summaryCounts: SummaryCounts;
}
