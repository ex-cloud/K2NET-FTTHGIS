import * as React from "react";
import { Sparkles, Plus, History } from "lucide-react";
import { Badge } from "@k2net/ui";
import { cn } from "@/lib/utils";
import { AiDrawerChat } from "@/components/ai/ai-drawer-chat";
import { useAiChatStream } from "@/hooks/useAiChatStream";
import { useAssistantInit } from "@/components/ai/assistant/useAssistantInit";
import { incrementAiPromptUsage, type SuggestedPromptItem } from "@/lib/actions/gateways";

import type { DrawerView } from "@/components/ai/assistant/FloatingAiAssistantHeader";

export function MobileAiTab() {
  const [, setView] = React.useState<DrawerView>("chat");
  const [input, setInput] = React.useState("");
  const [showHistory, setShowHistory] = React.useState(false);

  const {
    selectedModel,
    pinnedIdeas,
    agentAuth,
  } = useAssistantInit(setView);

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
      {/* Sub-header for Mobile AI with K2NET identity & quick session control */}
      <div className="flex items-center justify-between px-3.5 py-2 border-b border-border/70 bg-muted/20 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="size-6 rounded-md bg-gradient-to-br from-primary via-primary/90 to-primary/70 flex items-center justify-center text-primary-foreground shadow-xs shrink-0">
            <Sparkles className="size-3.5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-foreground">K2NET Ask AI</span>
              <Badge variant="outline" className="text-[9px] px-1 py-0 border-primary/40 text-primary bg-primary/10 font-mono">
                RAG LIVE
              </Badge>
            </div>
            <p className="text-[10px] text-muted-foreground truncate">160+ Dokumen FTTH • Spasial PostGIS</p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={createNewSession}
            className="flex items-center gap-1 h-6 px-2 rounded-md bg-card hover:bg-muted text-foreground text-[11px] font-medium border border-border/70 cursor-pointer"
          >
            <Plus className="size-3 text-primary" />
            <span>New</span>
          </button>

          <button
            type="button"
            onClick={() => setShowHistory((p) => !p)}
            className={cn(
              "size-6 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground cursor-pointer relative",
              showHistory && "text-primary bg-primary/10 border border-primary/20"
            )}
            title="Riwayat Percakapan"
          >
            <History className="size-3.5" />
            {sessions.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-primary" />
            )}
          </button>
        </div>
      </div>

      {/* Embedded Real AiDrawerChat component */}
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
        showHistory={showHistory}
        onToggleHistory={() => setShowHistory((p) => !p)}
      />
    </div>
  );
}
