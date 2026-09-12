/**
 * K2NET Floating AI Assistant — Orchestrator
 */

import { useState } from "react";
import { Sheet, SheetContent } from "@k2net/ui";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { incrementAiPromptUsage, type SuggestedPromptItem } from "@/lib/actions/gateways";
import { useAiChatStream, exportChatToMarkdown } from "@/hooks/useAiChatStream";
import { AiDrawerOnboarding } from "./ai-drawer-onboarding";
import { AiDrawerPermissions, AiDrawerSettings } from "./ai-drawer-permissions";
import { AiDrawerChat } from "./ai-drawer-chat";
import { AiFullscreenLayout } from "./ai-fullscreen-layout";
import {
  FloatingAiAssistantHeader,
  type DrawerView,
} from "./assistant/FloatingAiAssistantHeader";
import { useAssistantResize } from "./assistant/useAssistantResize";
import { useAssistantKeyboard } from "./assistant/useAssistantKeyboard";
import { useAssistantPermissions } from "./assistant/useAssistantPermissions";
import { useAssistantInit } from "./assistant/useAssistantInit";

export function FloatingAiAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [view, setView] = useState<DrawerView>("chat");
  const [input, setInput] = useState("");
  const [showTokenMenu, setShowTokenMenu] = useState(false);
  const [showHistoryInDrawer, setShowHistoryInDrawer] = useState(false);

  const { drawerWidth, isDragging, startResizing } = useAssistantResize();

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

  useAssistantKeyboard({
    isOpen,
    isFullscreen,
    messages,
    setIsOpen,
    setIsFullscreen,
    setView,
    setInput,
    setShowHistoryInDrawer,
    createNewSession,
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
    <>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent
          side="right"
          showCloseButton={false}
          style={{ width: `${drawerWidth}px`, maxWidth: "95vw" }}
          className={cn(
            "p-0 flex flex-col bg-background border-l border-border transition-[width] duration-75 select-text sm:max-w-none",
            isDragging && "transition-none select-none"
          )}
        >
          <div
            onMouseDown={startResizing}
            className={cn(
              "absolute -left-1.5 top-0 bottom-0 w-3 cursor-ew-resize group z-50 flex items-center justify-center",
              isDragging && "bg-primary/20"
            )}
          >
            <div className="w-1 h-12 rounded-full bg-border group-hover:bg-primary/70 transition-colors flex items-center justify-center">
              <GripVertical className="w-2.5 h-2.5 text-muted-foreground group-hover:text-primary opacity-60" />
            </div>
          </div>

          <FloatingAiAssistantHeader
            view={view}
            agentAuth={agentAuth}
            messages={messages}
            sessionsCount={sessions.length}
            showHistoryInDrawer={showHistoryInDrawer}
            setView={setView}
            setIsOpen={setIsOpen}
            setIsFullscreen={setIsFullscreen}
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
        </SheetContent>
      </Sheet>

      {isFullscreen && (
        <AiFullscreenLayout
          messages={messages}
          pinnedIdeas={pinnedIdeas}
          input={input}
          onInputChange={setInput}
          onSend={handleSendChat}
          onStop={stopStreaming}
          onClear={clearMessages}
          onSelectIdea={handleSelectIdea}
          onConfigurePermissions={() => {
            setIsFullscreen(false);
            setIsOpen(true);
            setShowTokenMenu(false);
            setPermSearch("");
            setView("settings");
          }}
          isStreaming={isStreaming}
          error={error}
          agentAuth={agentAuth}
          showTokenMenu={showTokenMenu}
          onToggleTokenMenu={() => setShowTokenMenu((p) => !p)}
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
          availableModels={availableModels}
          onExitFullscreen={() => {
            setIsFullscreen(false);
            setIsOpen(true);
          }}
          sessions={sessions}
          activeSessionId={activeSessionId}
          onNewChat={createNewSession}
          onLoadSession={loadSession}
          onDeleteSession={deleteSession}
        />
      )}
    </>
  );
}
