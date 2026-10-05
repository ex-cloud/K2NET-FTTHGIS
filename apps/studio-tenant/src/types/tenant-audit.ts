/**
 * FTTH GIS Tenant Dual-Layer Audit Log Data Types
 * Supports both Organization Scope (/settings/audit-logs) and Project Scope (/project/:projectId/settings/audit-logs)
 */

export type TenantAuditScope = "ORGANIZATION" | "PROJECT" | "SYSTEM";

export type TenantAuditSeverity = "INFO" | "WARN" | "ERROR" | "CRITICAL";

export type TenantAuditCategory =
  | "NETWORK"
  | "IAM"
  | "TASK"
  | "SETTINGS"
  | "SECURITY"
  | "BILLING"
  | "OPERATIONS"
  | string;

export interface TenantAuditEvent {
  id: string;
  tenantSlug: string;
  actorId: string;
  actorEmail?: string;
  actorRole?: string;
  actorIp?: string;
  action: string;
  resourceType: string;
  resourceId: string;
  scope: TenantAuditScope;
  category: TenantAuditCategory;
  severity: TenantAuditSeverity;
  projectId?: string;
  projectName?: string;
  oldValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  occurredAt: string;
}

export interface ActorActivityDto {
  actorId: string;
  actorEmail?: string;
  eventCount: number;
}

export interface DailyActivityTrendDto {
  date: string; // YYYY-MM-DD
  count: number;
}

export interface TenantAuditStats {
  totalEvents24h: number;
  totalEvents7d: number;
  totalWarnErrors24h: number;
  eventsByCategory: Record<string, number>;
  eventsByAction: Record<string, number>;
  eventsBySeverity: Record<string, number>;
  topActors: ActorActivityDto[];
  dailyTrend: DailyActivityTrendDto[];
}

export interface TenantAuditDateRange {
  from: Date;
  to: Date;
}

export interface TenantAuditFilterState {
  search: string;
  category: string;
  severity: string;
  action: string;
  actorId: string;
  scope?: TenantAuditScope;
  dateRange: TenantAuditDateRange;
  page: number;
  pageSize: number;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}
