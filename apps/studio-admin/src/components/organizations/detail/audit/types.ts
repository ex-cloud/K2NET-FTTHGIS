export type AuditSeverity = "INFO" | "WARN" | "CRITICAL";

export interface TenantAuditEvent {
  id: string;
  timestamp: string;
  actorUsername: string;
  actorEmail: string;
  ipAddress: string;
  action: string;
  category: "AUTH" | "GIS_TOPOLOGY" | "CONFIG" | "SECURITY";
  targetEntity: string;
  targetId: string;
  severity: AuditSeverity;
  status: "SUCCESS" | "FAILED";
  details: string;
  beforeState?: Record<string, unknown>;
  afterState?: Record<string, unknown>;
}

export interface RawTenantAuditEvent {
  id?: string;
  action?: string;
  resourceType?: string;
  resourceId?: string;
  actorId?: string;
  actorEmail?: string;
  actorIp?: string;
  clientIp?: string;
  occurredAt?: string;
  timestamp?: string;
  createdAt?: string;
  oldValueJson?: string;
  newValueJson?: string;
  metadataJson?: string;
  [key: string]: unknown;
}
