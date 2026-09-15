import { useState } from "react";
import type { EnrichedOrganization } from "../types";
import { useOrgWebhooksState } from "./webhooks/useOrgWebhooksState";
import { ApiKeyCard } from "./webhooks/ApiKeyCard";
import { ScopedTokensCard } from "./webhooks/ScopedTokensCard";
import { WebhookConfigCard } from "./webhooks/WebhookConfigCard";
import { MultiEndpointCard } from "./webhooks/MultiEndpointCard";
import { PayloadSimulatorCard } from "./webhooks/PayloadSimulatorCard";
import { DeadLetterQueueTable } from "./webhooks/DeadLetterQueueTable";
import { WebhookLogsTable } from "./webhooks/WebhookLogsTable";
import { ApiAnalyticsCard } from "./webhooks/ApiAnalyticsCard";
import { ShowOnceSecretModal } from "./webhooks/ShowOnceSecretModal";
import { Card } from "@k2net/ui";
import {
  Key,
  Webhook,
  FlaskConical,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type {
  WebhookDeliveryLog,
  WebhookSubscriptions,
  PingResult,
  ScopedToken,
  WebhookEndpoint,
  EventSchema,
  DeadLetterLog,
  ApiAnalytics,
} from "./webhooks/types";

interface OrgApiWebhooksTabProps {
  organization: EnrichedOrganization;
}

type SubSection = "all" | "api-keys" | "webhooks" | "developer-tools";

export function OrgApiWebhooksTab({ organization: org }: OrgApiWebhooksTabProps) {
  const [activeSection, setActiveSection] = useState<SubSection>("all");

  const state = useOrgWebhooksState(org);

  if (state.loading) {
    return (
      <div className="space-y-6">
        <Card className="p-5 h-36 bg-card border-border animate-pulse" />
        <Card className="p-5 h-64 bg-card border-border animate-pulse" />
        <Card className="p-5 h-48 bg-card border-border animate-pulse" />
      </div>
    );
  }

  const showApiKeys = activeSection === "all" || activeSection === "api-keys";
  const showWebhooks = activeSection === "all" || activeSection === "webhooks";
  const showDevTools = activeSection === "all" || activeSection === "developer-tools";

  return (
    <div className="space-y-6">
      {/* Top Segmented Navigation Pills */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-background/80 border border-border overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveSection("all")}
          className={cn(
            "px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap",
            activeSection === "all"
              ? "bg-card text-foreground shadow-xs border border-border"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Layers className="h-3.5 w-3.5" />
          <span>Semua Modul</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection("api-keys")}
          className={cn(
            "px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap",
            activeSection === "api-keys"
              ? "bg-card text-foreground shadow-xs border border-border"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Key className="h-3.5 w-3.5 text-primary" />
          <span>API Keys & Scoped Tokens</span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-muted text-muted-foreground">
            {state.scopedTokens.length + (state.apiKeyOverview?.hasActiveKey ? 1 : 0)}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection("webhooks")}
          className={cn(
            "px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap",
            activeSection === "webhooks"
              ? "bg-card text-foreground shadow-xs border border-border"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Webhook className="h-3.5 w-3.5 text-primary" />
          <span>Webhooks & Multi-Endpoint</span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-muted text-muted-foreground">
            {state.webhookEndpoints.length + (state.webhookUrl ? 1 : 0)}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection("developer-tools")}
          className={cn(
            "px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap",
            activeSection === "developer-tools"
              ? "bg-card text-foreground shadow-xs border border-border"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <FlaskConical className="h-3.5 w-3.5 text-primary" />
          <span>Simulator & DLQ Retry</span>
          {state.dlqLogs.length > 0 && (
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-destructive/15 text-destructive font-bold">
              {state.dlqLogs.length} DLQ
            </span>
          )}
        </button>
      </div>

      {/* 1. API Usage & Latency Telemetry */}
      {showApiKeys && (
        <ApiAnalyticsCard
          analytics={state.apiAnalytics}
          loadingAnalytics={state.loadingAnalytics}
          timeRange={state.timeRange}
          onTimeRangeChange={state.setTimeRange}
          onRefreshAnalytics={state.refreshAnalytics}
        />
      )}

      {/* 2. Kong Consumer API Key Card */}
      {showApiKeys && (
        <ApiKeyCard
          apiKeyOverview={state.apiKeyOverview}
          showKey={state.showKey}
          setShowKey={state.setShowKey}
          isRegenerating={state.isRegenerating}
          apiRateLimitMax={org.apiRateLimitMax || 5000}
          onRegenerateKey={state.handleRegenerateKey}
          onCopy={state.handleCopy}
        />
      )}

      {/* 3. Granular Scoped Personal Access Tokens Card */}
      {showApiKeys && (
        <ScopedTokensCard
          tokens={state.scopedTokens}
          loadingTokens={state.loadingTokens}
          onCreateToken={state.handleCreateScopedToken}
          onRevokeToken={state.handleRevokeScopedToken}
        />
      )}

      {/* 4. Primary NOC Alarm Webhook Configuration Card */}
      {showWebhooks && (
        <WebhookConfigCard
          lastPingResult={state.lastPingResult}
          testingPing={state.testingPing}
          onTestPing={state.handleTestPing}
          webhookUrl={state.webhookUrl}
          setWebhookUrl={state.setWebhookUrl}
          webhookSecretMasked={state.webhookSecretMasked}
          hasSecret={state.hasSecret}
          isRollingSecret={state.isRollingSecret}
          onRollSecret={state.handleRollSecret}
          subscribedEvents={state.subscribedEvents}
          setSubscribedEvents={state.setSubscribedEvents}
          isDirty={state.isDirty}
          isSaving={state.isSavingWebhook}
          onSaveWebhook={state.handleSaveWebhook}
          onCopy={state.handleCopy}
        />
      )}

      {/* 5. Multi-Endpoint Webhook Router Card */}
      {showWebhooks && (
        <MultiEndpointCard
          endpoints={state.webhookEndpoints}
          loadingEndpoints={state.loadingEndpoints}
          onCreateEndpoint={state.handleCreateEndpoint}
          onUpdateEndpoint={state.handleUpdateEndpoint}
          onDeleteEndpoint={state.handleDeleteEndpoint}
          onRollEndpointSecret={state.handleRollEndpointSecret}
          onTestPingEndpoint={state.handleTestPingEndpoint}
          onCopy={state.handleCopy}
        />
      )}

      {/* 6. Recent Deliveries Logs Table */}
      {showWebhooks && (
        <WebhookLogsTable deliveryLogs={state.deliveryLogs} />
      )}

      {/* 7. Interactive Payload Simulator & Playground */}
      {showDevTools && (
        <PayloadSimulatorCard
          eventSchemas={state.eventSchemas}
          endpoints={state.webhookEndpoints}
          loadingSchemas={state.loadingSchemas}
          onSimulateEvent={state.handleSimulateEvent}
          onCopy={state.handleCopy}
        />
      )}

      {/* 8. Dead Letter Queue & Retry Engine Table */}
      {showDevTools && (
        <DeadLetterQueueTable
          dlqLogs={state.dlqLogs}
          loadingDlq={state.loadingDlq}
          onReplayWebhook={state.handleReplayWebhook}
          onRefreshDlq={state.refreshDlq}
        />
      )}

      {/* Modals: Show-Once Modal for Regenerated Kong API Key */}
      <ShowOnceSecretModal
        isOpen={state.isKeyModalOpen}
        onClose={() => state.setIsKeyModalOpen(false)}
        title="Kong API Key Baru Diterbitkan"
        type="api-key"
        secretValue={state.newGeneratedKey}
        orgSlug={org.slug}
      />

      {/* Modals: Show-Once Modal for Rolled HMAC Webhook Secret */}
      <ShowOnceSecretModal
        isOpen={state.isSecretModalOpen}
        onClose={() => state.setIsSecretModalOpen(false)}
        title="HMAC Webhook Secret Baru Dibuat"
        type="webhook-secret"
        secretValue={state.newRolledSecret}
        orgSlug={org.slug}
      />

      {/* Modals: Show-Once Modal for Generated Scoped API Token */}
      <ShowOnceSecretModal
        isOpen={state.isTokenModalOpen}
        onClose={() => state.setIsTokenModalOpen(false)}
        title="Scoped API Token Baru Diterbitkan"
        type="api-key"
        secretValue={state.newGeneratedToken}
        orgSlug={org.slug}
      />
    </div>
  );
}
