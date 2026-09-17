import * as React from "react";
import { useRouter } from "@/lib/navigation-compat";
import { AiDrawerChat } from "@/components/ai/ai-drawer-chat";
import { AiDrawerOnboarding } from "@/components/ai/ai-drawer-onboarding";
import { AiDrawerPermissions, AiDrawerSettings } from "@/components/ai/ai-drawer-permissions";
import { useAiChatStream, exportChatToMarkdown } from "@/hooks/useAiChatStream";
import { useAssistantInit } from "@/components/ai/assistant/useAssistantInit";
import { useAssistantPermissions } from "@/components/ai/assistant/useAssistantPermissions";
import {
  FloatingAiAssistantHeader,
  type DrawerView,
} from "@/components/ai/assistant/FloatingAiAssistantHeader";
import { incrementAiPromptUsage, type SuggestedPromptItem } from "@/lib/actions/gateways";

interface MobileAiTabProps {
  onClose?: () => void;
}

export function MobileAiTab({ onClose }: MobileAiTabProps) {
  const router = useRouter();
  const [view, setView] = React.useState<DrawerView>("chat");
  const [input, setInput] = React.useState("");
  const [, setShowTokenMenu] = React.useState(false);
  const [showHistoryInDrawer, setShowHistoryInDrawer] = React.useState(false);

  const {
    selectedModel,
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
    messages,
    isStreaming,
    error,
    sessions,
    activeSessionId,
    sendMessage,
    stopStreaming,
    clearMessages,
    createNewSession,
    loadSession,
    deleteSession,
  } = useAiChatStream({
    model: selectedModel,
    userScope: agentAuth?.user_scope || "PLATFORM_INTERNAL",
    accessTier: agentAuth?.access_tier || "FULL",
    grantedPermissions: agentAuth?.granted_permissions || [],
  });

  const handleSendChat = async () => {
    const msg = input.trim();
    if (!msg || isStreaming) return;
    setInput("");
    await sendMessage(msg);
  };

  const handleSelectIdea = (idea: SuggestedPromptItem) => {
    setInput(idea.prompt);
    if (idea.id && !idea.id.startsWith("fb-")) incrementAiPromptUsage(idea.id);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden animate-in fade-in-0 duration-200">
      <FloatingAiAssistantHeader
        view={view}
        agentAuth={agentAuth}
        messages={messages}
        sessionsCount={sessions.length}
        showHistoryInDrawer={showHistoryInDrawer}
        setView={setView}
        setIsOpen={() => {
          if (onClose) onClose();
        }}
        setIsFullscreen={() => {
          router.push("/ai");
        }}
        setShowHistoryInDrawer={setShowHistoryInDrawer}
        setShowTokenMenu={setShowTokenMenu}
        setPermSearch={setPermSearch}
        createNewSession={createNewSession}
        exportChatToMarkdown={exportChatToMarkdown}
      />

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

      {view === "chat" && (
        <AiDrawerChat
          messages={messages}
          pinnedIdeas={pinnedIdeas}
          input={input}
          onInputChange={setInput}
          onSend={handleSendChat}
          onStop={stopStreaming}
          onClear={clearMessages}
          onSelectIdea={handleSelectIdea}
          isStreaming={isStreaming}
          error={error}
          sessions={sessions}
          activeSessionId={activeSessionId}
          onNewChat={createNewSession}
          onLoadSession={loadSession}
          onDeleteSession={deleteSession}
          showHistory={showHistoryInDrawer}
          onToggleHistory={() => setShowHistoryInDrawer((p) => !p)}
        />
      )}
    </div>
  );
}
