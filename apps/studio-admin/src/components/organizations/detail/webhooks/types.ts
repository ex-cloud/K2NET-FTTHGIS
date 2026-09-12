export interface WebhookDeliveryLog {
  id: string;
  event: string;
  targetUrl: string;
  status: number;
  latencyMs: number;
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
  timestamp: string;
}
