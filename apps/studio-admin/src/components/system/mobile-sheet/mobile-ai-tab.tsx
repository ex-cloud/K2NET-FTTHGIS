import * as React from "react";
import {
  AiAssistantHeader,
  AiHistoryPanel,
  AiGreeting,
  AiQuickActions,
  AiMessageBubble,
  AiPromptInput,
  ScrollArea,
  type DrawerView,
  type QuickIdea,
} from "@k2net/ui";
import { AiDrawerOnboarding } from "@/components/ai/ai-drawer-onboarding";
import { AiDrawerPermissions, AiDrawerSettings } from "@/components/ai/ai-drawer-permissions";
import { useAiChatStream, exportChatToMarkdown } from "@/hooks/useAiChatStream";
import { useAssistantInit } from "@/components/ai/assistant/useAssistantInit";
import { useAssistantPermissions } from "@/components/ai/assistant/useAssistantPermissions";
import { incrementAiPromptUsage, sendAiFeedback } from "@/lib/actions/gateways";
import { toast } from "sonner";

interface MobileAiTabProps {
  onClose?: () => void;
}

export function MobileAiTab({ onClose }: MobileAiTabProps) {
  const [view, setView] = React.useState<DrawerView>("chat");
  const [input, setInput] = React.useState("");
  const [showHistoryInDrawer, setShowHistoryInDrawer] = React.useState(false);
  const bottomRef = React.useRef<HTMLDivElement>(null);

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
    createNewSession,
    loadSession,
    deleteSession,
  } = useAiChatStream({
    model: selectedModel,
    userScope: agentAuth?.user_scope || "PLATFORM_INTERNAL",
    accessTier: agentAuth?.access_tier || "FULL",
    grantedPermissions: agentAuth?.granted_permissions || [],
  });

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  const handleSendChat = async (textToSend?: string) => {
    const msg = textToSend || input.trim();
    if (!msg || isStreaming) return;
    setInput("");
    await sendMessage(msg);
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

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden animate-in fade-in-0 duration-200 bg-background">
      <AiAssistantHeader
        view={view}
        title="Ask AI"
        subtitle={
          view === "chat"
            ? "RAG Knowledge Base • Spasial PostGIS"
            : view === "settings"
            ? `Scope: PLATFORM_INTERNAL • ${agentAuth?.access_tier || "FULL"}`
            : "K2NET Core Platform (Root HQ)"
        }
        sessionsCount={sessions.length}
        showHistory={showHistoryInDrawer}
        showSettingsButton={true}
        showExportButton={true}
        hasMessages={messages.length > 0}
        onBack={() => setView(view === "settings" ? "chat" : "onboarding")}
        onNewChat={createNewSession}
        onToggleHistory={() => setShowHistoryInDrawer((p) => !p)}
        onToggleSettings={() => {
          setPermSearch("");
          setView(view === "settings" ? "chat" : "settings");
        }}
        onExportMarkdown={() => exportChatToMarkdown(messages)}
        onClose={() => {
          if (onClose) onClose();
        }}
      />

      {view === "onboarding" && (
        <div className="flex-1 min-h-0 overflow-y-auto">
          <AiDrawerOnboarding
            onReviewPermissions={() => {
              setPermSearch("");
              setView("permissions");
            }}
          />
        </div>
      )}

      {view === "permissions" && (
        <div className="flex-1 min-h-0 overflow-y-auto">
          <AiDrawerPermissions
            {...permSharedProps}
            saving={permSaving}
            onCancel={() => setView("onboarding")}
            onAuthorize={handleAuthorize}
          />
        </div>
      )}

      {view === "settings" && (
        <div className="flex-1 min-h-0 overflow-y-auto">
          <AiDrawerSettings
            {...permSharedProps}
            accessTier={agentAuth?.access_tier || "FULL"}
            saving={permSaving}
            revoking={permRevoking}
            onSave={handleAuthorize}
            onRevoke={handleRevoke}
          />
        </div>
      )}

      {view === "chat" && (
        <div className="relative flex-1 flex flex-col min-h-0 overflow-hidden">
          <AiHistoryPanel
            open={showHistoryInDrawer}
            onClose={() => setShowHistoryInDrawer(false)}
            sessions={sessions}
            activeSessionId={activeSessionId}
            onSelectSession={(sessionId) => {
              loadSession(sessionId);
              setShowHistoryInDrawer(false);
            }}
            onDeleteSession={deleteSession}
          />

          <ScrollArea className="flex-1 min-h-0 w-full">
            <div className="px-4 py-4 space-y-4 w-full min-w-0 max-w-full">
              {messages.length === 0 ? (
                <div className="space-y-6 py-2">
                  <AiGreeting />
                  <AiQuickActions ideas={quickIdeas} onSelect={handleSelectIdea} columns={1} />
                </div>
              ) : (
                messages.map((msg) => (
                  <AiMessageBubble
                    key={msg.id}
                    message={msg}
                    onFeedback={handleFeedback}
                  />
                ))
              )}

              {error && (
                <div className="px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive">
                  ⚠️ {error}
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          </ScrollArea>

          <AiPromptInput
            value={input}
            onChange={setInput}
            onSend={() => handleSendChat()}
            onStop={stopStreaming}
            isStreaming={isStreaming}
          />
        </div>
      )}
    </div>
  );
}
