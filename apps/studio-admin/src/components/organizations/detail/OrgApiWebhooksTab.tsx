import type { EnrichedOrganization } from "../types";
import { useOrgWebhooksState } from "./webhooks/useOrgWebhooksState";
import { ApiKeyCard } from "./webhooks/ApiKeyCard";
import { WebhookConfigCard } from "./webhooks/WebhookConfigCard";
import { WebhookLogsTable } from "./webhooks/WebhookLogsTable";
import { ShowOnceSecretModal } from "./webhooks/ShowOnceSecretModal";
import { Card } from "@k2net/ui";

export type { WebhookDeliveryLog, WebhookSubscriptions, PingResult } from "./webhooks/types";

interface OrgApiWebhooksTabProps {
  organization: EnrichedOrganization;
}

export function OrgApiWebhooksTab({ organization: org }: OrgApiWebhooksTabProps) {
  const {
    loading,
    apiKeyOverview,
    showKey,
    setShowKey,
    isRegenerating,
    newGeneratedKey,
    isKeyModalOpen,
    setIsKeyModalOpen,
    webhookUrl,
    setWebhookUrl,
    webhookSecretMasked,
    hasSecret,
    isRollingSecret,
    newRolledSecret,
    isSecretModalOpen,
    setIsSecretModalOpen,
    subscribedEvents,
    setSubscribedEvents,
    isDirty,
    isSavingWebhook,
    testingPing,
    lastPingResult,
    deliveryLogs,
    handleCopy,
    handleRegenerateKey,
    handleSaveWebhook,
    handleRollSecret,
    handleTestPing,
  } = useOrgWebhooksState(org);

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="p-5 h-36 bg-card border-border animate-pulse" />
        <Card className="p-5 h-64 bg-card border-border animate-pulse" />
        <Card className="p-5 h-48 bg-card border-border animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Kong API Gateway Key Manager Card */}
      <ApiKeyCard
        apiKeyOverview={apiKeyOverview}
        showKey={showKey}
        setShowKey={setShowKey}
        isRegenerating={isRegenerating}
        apiRateLimitMax={org.apiRateLimitMax || 5000}
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
        webhookSecretMasked={webhookSecretMasked}
        hasSecret={hasSecret}
        isRollingSecret={isRollingSecret}
        onRollSecret={handleRollSecret}
        subscribedEvents={subscribedEvents}
        setSubscribedEvents={setSubscribedEvents}
        isDirty={isDirty}
        isSaving={isSavingWebhook}
        onSaveWebhook={handleSaveWebhook}
        onCopy={handleCopy}
      />

      {/* 3. Recent Deliveries Table */}
      <WebhookLogsTable deliveryLogs={deliveryLogs} />

      {/* 4. Show-Once Modal for Regenerated API Key */}
      <ShowOnceSecretModal
        isOpen={isKeyModalOpen}
        onClose={() => setIsKeyModalOpen(false)}
        title="Kong API Key Baru Diterbitkan"
        type="api-key"
        secretValue={newGeneratedKey}
        orgSlug={org.slug}
      />

      {/* 5. Show-Once Modal for Rolled HMAC Webhook Secret */}
      <ShowOnceSecretModal
        isOpen={isSecretModalOpen}
        onClose={() => setIsSecretModalOpen(false)}
        title="HMAC Webhook Secret Baru Dibuat"
        type="webhook-secret"
        secretValue={newRolledSecret}
        orgSlug={org.slug}
      />
    </div>
  );
}
