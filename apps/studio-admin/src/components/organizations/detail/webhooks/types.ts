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
