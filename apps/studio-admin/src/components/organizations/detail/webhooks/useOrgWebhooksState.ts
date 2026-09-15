import { useCallback } from "react";
import { toast } from "sonner";
import type { EnrichedOrganization } from "../../types";
import { useOrgApiKey } from "./useOrgApiKey";
import { useOrgPrimaryWebhook } from "./useOrgPrimaryWebhook";
import { useOrgScopedTokens } from "./useOrgScopedTokens";
import { useOrgEndpoints } from "./useOrgEndpoints";
import { useOrgSimulatorAndDlq } from "./useOrgSimulatorAndDlq";

export function useOrgWebhooksState(org: EnrichedOrganization) {
  const orgIdentifier = org.slug || org.id;

  // 1. Kong Consumer API Key State
  const keyState = useOrgApiKey(orgIdentifier);

  // 2. Primary Webhook Config & Logs State
  const webhookState = useOrgPrimaryWebhook(orgIdentifier);

  // 3. Scoped API Tokens State
  const tokensState = useOrgScopedTokens(orgIdentifier);

  // 4. Multi-Endpoint Router State
  const endpointsState = useOrgEndpoints(orgIdentifier, (secret) => {
    webhookState.setNewRolledSecret(secret);
    webhookState.setIsSecretModalOpen(true);
  });

  // 5. Schemas, Simulator, DLQ, and Analytics
  const simulatorAndDlqState = useOrgSimulatorAndDlq(orgIdentifier);

  // Copy helper
  const handleCopy = useCallback((text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(`${label} disalin ke clipboard.`);
  }, []);

  const loading = keyState.loadingKey || webhookState.loadingConfig;

  const refreshData = useCallback(async () => {
    await Promise.all([
      keyState.fetchApiKey(),
      webhookState.fetchConfigAndLogs(),
      tokensState.fetchScopedTokens(),
      endpointsState.fetchEndpoints(),
    ]);
  }, [keyState, webhookState, tokensState, endpointsState]);

  return {
    loading,
    // Base Key & Webhooks
    apiKeyOverview: keyState.apiKeyOverview,
    showKey: keyState.showKey,
    setShowKey: keyState.setShowKey,
    isRegenerating: keyState.isRegenerating,
    newGeneratedKey: keyState.newGeneratedKey,
    isKeyModalOpen: keyState.isKeyModalOpen,
    setIsKeyModalOpen: keyState.setIsKeyModalOpen,
    handleRegenerateKey: keyState.handleRegenerateKey,

    webhookUrl: webhookState.webhookUrl,
    setWebhookUrl: webhookState.setWebhookUrl,
    webhookSecretMasked: webhookState.webhookSecretMasked,
    hasSecret: webhookState.hasSecret,
    isRollingSecret: webhookState.isRollingSecret,
    newRolledSecret: webhookState.newRolledSecret,
    isSecretModalOpen: webhookState.isSecretModalOpen,
    setIsSecretModalOpen: webhookState.setIsSecretModalOpen,
    subscribedEvents: webhookState.subscribedEvents,
    setSubscribedEvents: webhookState.setSubscribedEvents,
    isDirty: webhookState.isDirty,
    isSavingWebhook: webhookState.isSavingWebhook,
    testingPing: webhookState.testingPing,
    lastPingResult: webhookState.lastPingResult,
    deliveryLogs: webhookState.deliveryLogs,
    handleSaveWebhook: webhookState.handleSaveWebhook,
    handleRollSecret: webhookState.handleRollSecret,
    handleTestPing: webhookState.handleTestPing,
    handleCopy,
    refreshData,

    // Phase 3 Features
    scopedTokens: tokensState.scopedTokens,
    loadingTokens: tokensState.loadingTokens,
    newGeneratedToken: tokensState.newGeneratedToken,
    isTokenModalOpen: tokensState.isTokenModalOpen,
    setIsTokenModalOpen: tokensState.setIsTokenModalOpen,
    handleCreateScopedToken: tokensState.handleCreateScopedToken,
    handleRevokeScopedToken: tokensState.handleRevokeScopedToken,

    webhookEndpoints: endpointsState.webhookEndpoints,
    loadingEndpoints: endpointsState.loadingEndpoints,
    handleCreateEndpoint: endpointsState.handleCreateEndpoint,
    handleUpdateEndpoint: endpointsState.handleUpdateEndpoint,
    handleDeleteEndpoint: endpointsState.handleDeleteEndpoint,
    handleRollEndpointSecret: endpointsState.handleRollEndpointSecret,
    handleTestPingEndpoint: endpointsState.handleTestPingEndpoint,

    eventSchemas: simulatorAndDlqState.eventSchemas,
    loadingSchemas: simulatorAndDlqState.loadingSchemas,
    handleSimulateEvent: simulatorAndDlqState.handleSimulateEvent,

    dlqLogs: simulatorAndDlqState.dlqLogs,
    loadingDlq: simulatorAndDlqState.loadingDlq,
    handleReplayWebhook: simulatorAndDlqState.handleReplayWebhook,
    refreshDlq: simulatorAndDlqState.refreshDlq,

    apiAnalytics: simulatorAndDlqState.apiAnalytics,
    loadingAnalytics: simulatorAndDlqState.loadingAnalytics,
    refreshAnalytics: simulatorAndDlqState.refreshAnalytics,
  };
}
