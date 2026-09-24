/**
 * K2NET Floating AI Assistant — Orchestrator
 */

import { useState } from "react";
import {
  AiAssistantDrawer,
  AiAssistantFullscreen,
  type DrawerView,
  type QuickIdea,
} from "@k2net/ui";
import { incrementAiPromptUsage, sendAiFeedback } from "@/lib/actions/gateways";
import { useAiChatStream, exportChatToMarkdown } from "@/hooks/useAiChatStream";
import { AiDrawerOnboarding } from "./ai-drawer-onboarding";
import { AiDrawerPermissions, AiDrawerSettings } from "./ai-drawer-permissions";
import { FullscreenRightPanel } from "./assistant/FullscreenRightPanel";
import { useAssistantKeyboard } from "./assistant/useAssistantKeyboard";
import { useAssistantPermissions } from "./assistant/useAssistantPermissions";
import { useAssistantInit } from "./assistant/useAssistantInit";
import { useFullscreenPermissions } from "./assistant/useFullscreenPermissions";
import { toast } from "sonner";

export function FloatingAiAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [view, setView] = useState<DrawerView>("chat");
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [rightPanelView, setRightPanelView] = useState<"summary" | "permissions">("summary");

  const {
    selectedModel,
    setSelectedModel,
    availableModels,
    pinnedIdeas,
    agentAuth,
    setAgentAuth,
  } = useAssistantInit(setView);

  const {
    permSharedProps,
    permSaving,
    permRevoking,
    setPermSearch,
    handleAuthorize,
    handleRevoke,
  } = useAssistantPermissions(view, agentAuth, setAgentAuth, setView);

  const {
    permCatalog,
    permLoading,
    permSaving: fsPermSaving,
    permRevoking: fsPermRevoking,
    permTier,
    setPermTier,
    permSelected,
    setPermSelected,
    permSearch: fsPermSearch,
    setPermSearch: setFsPermSearch,
    permExpandedDomains,
    setPermExpandedDomains,
    handleSavePermissions,
    handleRevokePermissions,
  } = useFullscreenPermissions(rightPanelOpen, rightPanelView, setRightPanelView, agentAuth);

  const {
    messages,
    isStreaming,
    error,
    sessions,
    activeSessionId,
    sendMessage,
    stopStreaming,
    createNewSession,
    loadSession,
    deleteSession,
  } = useAiChatStream({
    model: selectedModel,
    userScope: agentAuth?.user_scope || "PLATFORM_INTERNAL",
    accessTier: agentAuth?.access_tier || "FULL",
    grantedPermissions: agentAuth?.granted_permissions || [],
  });

  useAssistantKeyboard({
    isOpen,
    isFullscreen,
    messages,
    setIsOpen,
    setIsFullscreen,
    setView,
    setInput: () => {},
    setShowHistoryInDrawer: () => {},
    createNewSession,
  });

  const handleSendChat = async (text?: string) => {
    if (!text?.trim() || isStreaming) return;
    await sendMessage(text.trim());
  };

  const handleSelectIdea = (idea: QuickIdea) => {
    handleSendChat(idea.prompt);
    if (idea.id && !idea.id.startsWith("fb-")) incrementAiPromptUsage(idea.id);
  };

  const handleFeedback = async (messageId: string, feedbackType: "like" | "dislike") => {
    if (feedbackType === "like") toast.success("Terima kasih atas tanggapan positif Anda!");
    else toast.success("Tanggapan dicatat untuk peningkatan kualitas model.");
    try {
      const targetMsg = messages.find((m) => m.id === messageId);
      await sendAiFeedback({
        messageId,
        responseText: targetMsg?.content || "",
        feedbackType,
      });
    } catch (e) {
      console.warn("Feedback recording failed:", e);
    }
  };

  const quickIdeas: QuickIdea[] = pinnedIdeas.map((idea) => ({
    id: idea.id,
    title: idea.title,
    prompt: idea.prompt,
    desc: idea.description || idea.prompt,
    icon: idea.icon,
  }));

  const activeModelLabel =
    availableModels.find((m) => m.value === selectedModel)?.label || "Gemini 2.5 Flash";

  if (isFullscreen) {
    return (
      <AiAssistantFullscreen
        open={isFullscreen}
        title="Ask AI"
        subtitle="RAG Knowledge Base • Spasial PostGIS"
        messages={messages}
        sessions={sessions}
        activeSessionId={activeSessionId}
        quickIdeas={quickIdeas}
        isStreaming={isStreaming}
        error={error}
        selectedModel={selectedModel}
        onModelChange={setSelectedModel}
        availableModels={availableModels}
        showSettingsButton={true}
        showExportButton={true}
        onSend={handleSendChat}
        onStop={stopStreaming}
        onNewChat={createNewSession}
        onSelectSession={loadSession}
        onDeleteSession={deleteSession}
        onSelectIdea={handleSelectIdea}
        onFeedback={handleFeedback}
        onExportMarkdown={() => exportChatToMarkdown(messages)}
        onExitFullscreen={() => setIsFullscreen(false)}
        rightPanelOpen={rightPanelOpen}
        onToggleRightPanel={() => {
          setRightPanelOpen((p) => !p);
          setRightPanelView("summary");
        }}
        rightPanelContent={
          <FullscreenRightPanel
            rightPanelOpen={rightPanelOpen}
            setRightPanelOpen={setRightPanelOpen}
            rightPanelView={rightPanelView}
            setRightPanelView={setRightPanelView}
            agentAuth={agentAuth}
            activeModelLabel={activeModelLabel}
            permCatalog={permCatalog}
            permLoading={permLoading}
            permSaving={fsPermSaving}
            permRevoking={fsPermRevoking}
            permTier={permTier}
            setPermTier={setPermTier}
            permSelected={permSelected}
            setPermSelected={setPermSelected}
            permSearch={fsPermSearch}
            setPermSearch={setFsPermSearch}
            permExpandedDomains={permExpandedDomains}
            setPermExpandedDomains={setPermExpandedDomains}
            onSavePermissions={handleSavePermissions}
            onRevokePermissions={handleRevokePermissions}
          />
        }
      />
    );
  }

  const customViewContent = (
    <>
      {view === "onboarding" && (
        <AiDrawerOnboarding
          onReviewPermissions={() => {
            setPermSearch("");
            setView("permissions");
          }}
        />
      )}

      {view === "permissions" && (
        <AiDrawerPermissions
          {...permSharedProps}
          saving={permSaving}
          onCancel={() => setView("onboarding")}
          onAuthorize={handleAuthorize}
        />
      )}

      {view === "settings" && (
        <AiDrawerSettings
          {...permSharedProps}
          accessTier={agentAuth?.access_tier || "FULL"}
          saving={permSaving}
          revoking={permRevoking}
          onSave={handleAuthorize}
          onRevoke={handleRevoke}
        />
      )}
    </>
  );

  return (
    <AiAssistantDrawer
      open={isOpen}
      onOpenChange={setIsOpen}
      title="Ask AI"
      subtitle={
        view === "chat"
          ? "RAG Knowledge Base • Spasial PostGIS"
          : view === "settings"
          ? `Scope: PLATFORM_INTERNAL • ${agentAuth?.access_tier || "FULL"}`
          : "K2NET Core Platform (Root HQ)"
      }
      messages={messages}
      sessions={sessions}
      activeSessionId={activeSessionId}
      quickIdeas={quickIdeas}
      isStreaming={isStreaming}
      error={error}
      showSettingsButton={true}
      showExportButton={true}
      customView={view}
      customViewContent={customViewContent}
      onBack={() => setView(view === "settings" ? "chat" : "onboarding")}
      onSend={handleSendChat}
      onStop={stopStreaming}
      onNewChat={createNewSession}
      onSelectSession={loadSession}
      onDeleteSession={deleteSession}
      onSelectIdea={handleSelectIdea}
      onFeedback={handleFeedback}
      onToggleSettings={() => {
        setPermSearch("");
        setView(view === "settings" ? "chat" : "settings");
      }}
      onExportMarkdown={() => exportChatToMarkdown(messages)}
      onMaximize={() => {
        setIsOpen(false);
        setIsFullscreen(true);
      }}
    />
  );
}
