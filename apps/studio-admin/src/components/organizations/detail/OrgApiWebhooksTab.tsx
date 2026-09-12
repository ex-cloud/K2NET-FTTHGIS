import type { EnrichedOrganization } from "../types";
import { useOrgWebhooksState } from "./webhooks/useOrgWebhooksState";
import { ApiKeyCard } from "./webhooks/ApiKeyCard";
import { WebhookConfigCard } from "./webhooks/WebhookConfigCard";
import { WebhookLogsTable } from "./webhooks/WebhookLogsTable";

export type { WebhookDeliveryLog, WebhookSubscriptions, PingResult } from "./webhooks/types";

interface OrgApiWebhooksTabProps {
  organization: EnrichedOrganization;
}

export function OrgApiWebhooksTab({ organization: org }: OrgApiWebhooksTabProps) {
  const {
    apiKey,
    showKey,
    setShowKey,
    isRegenerating,
    webhookUrl,
    setWebhookUrl,
    webhookSecret,
    setWebhookSecret,
    subscribedEvents,
    setSubscribedEvents,
    testingPing,
    lastPingResult,
    deliveryLogs,
    handleCopy,
    handleRegenerateKey,
    handleSaveWebhook,
    handleTestPing,
  } = useOrgWebhooksState(org);

  return (
    <div className="space-y-6">
      {/* 1. Kong API Gateway Key Manager Card */}
      <ApiKeyCard
        apiKey={apiKey}
        showKey={showKey}
        setShowKey={setShowKey}
        isRegenerating={isRegenerating}
        apiRateLimitMax={org.apiRateLimitMax}
        onRegenerateKey={handleRegenerateKey}
        onCopy={handleCopy}
      />

      {/* 2. NOC Alarm Webhook Configuration */}
      <WebhookConfigCard
        lastPingResult={lastPingResult}
        testingPing={testingPing}
        onTestPing={handleTestPing}
        webhookUrl={webhookUrl}
        setWebhookUrl={setWebhookUrl}
        webhookSecret={webhookSecret}
        setWebhookSecret={setWebhookSecret}
        subscribedEvents={subscribedEvents}
        setSubscribedEvents={setSubscribedEvents}
        onSaveWebhook={handleSaveWebhook}
        onCopy={handleCopy}
      />

      {/* 3. Recent Deliveries Table */}
      <WebhookLogsTable deliveryLogs={deliveryLogs} />
    </div>
  );
}
