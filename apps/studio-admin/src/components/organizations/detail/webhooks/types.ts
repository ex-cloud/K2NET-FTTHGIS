export interface WebhookDeliveryLog {
  id: string;
  event: string;
  targetUrl: string;
  status: number;
  latencyMs: number;
  responseBody?: string;
  errorMessage?: string;
  timestamp: string;
}

export interface WebhookSubscriptions {
  fiberCut: boolean;
  oltDown: boolean;
  odpFull: boolean;
  quotaAlert: boolean;
}

export interface PingResult {
  status: number;
  latencyMs: number;
  success: boolean;
  errorMessage?: string;
  timestamp: string;
}

export interface ApiKeyOverview {
  apiKeyPrefix: string;
  apiKeyLast4: string;
  maskedApiKey: string;
  rateLimitPerMinute: number;
  hasActiveKey: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WebhookConfigData {
  webhookUrl: string | null;
  webhookSecretMasked: string | null;
  hasSecret: boolean;
  isActive: boolean;
  subscribedEvents: WebhookSubscriptions;
  updatedAt: string;
}

// --- Phase 3 Advanced Types ---

export interface ScopedToken {
  id: string;
  name: string;
  tokenPrefix: string;
  tokenLast4: string;
  scopes: string[];
  expiresAt: string | null;
  lastUsedAt: string | null;
  createdAt: string;
  isRevoked: boolean;
  revoked?: boolean;
}

export interface ScopedTokenCreateResponse {
  id: string;
  name: string;
  token: string;
  tokenPrefix: string;
  tokenLast4: string;
  scopes: string[];
  expiresAt: string | null;
  createdAt: string;
}

export interface WebhookEndpoint {
  id: string;
  name: string;
  targetUrl: string;
  description: string | null;
  subscribedEvents: WebhookSubscriptions;
  secretMasked: string | null;
  hasSecret: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EventSchema {
  eventType: string;
  displayName: string;
  description: string;
  category: string;
  samplePayloadJson: string;
}

export interface SimulateEventResponse {
  endpointId: string;
  endpointName: string;
  targetUrl: string;
  httpStatus: number;
  latencyMs: number;
  success: boolean;
  errorMessage: string | null;
  dispatchedAt: string;
}

export interface DeadLetterLog {
  id: string;
  endpointId: string | null;
  endpointName: string | null;
  eventType: string;
  targetUrl: string;
  payloadJson: string | null;
  httpStatus: number | null;
  responseBody: string | null;
  errorMessage: string | null;
  retryCount: number;
  maxRetries: number;
  nextRetryAt: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface DailyVolumeStat {
  date: string;
  requests: number;
  errors: number;
}

export interface StatusCodeBreakdown {
  status2xx: number;
  status4xx: number;
  status5xx: number;
}

export interface ApiAnalytics {
  totalRequests24h: number;
  successRatePercent: number;
  p95LatencyMs: number;
  errorCount24h: number;
  rateLimitQuotaUsedPercent: number;
  dailyTimeseries: DailyVolumeStat[];
  statusBreakdown: StatusCodeBreakdown;
}
