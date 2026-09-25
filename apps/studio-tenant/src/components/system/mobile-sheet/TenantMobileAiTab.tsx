import * as React from "react";
import {
  AiAssistantHeader,
  AiGreeting,
  AiQuickActions,
  AiMessageBubble,
  AiPromptInput,
  ScrollArea,
  type QuickIdea,
} from "@k2net/ui";
import { useTenantAiChat } from "../../ai/useTenantAiChat";

interface TenantMobileAiTabProps {
  onClose?: () => void;
}

export function TenantMobileAiTab({ onClose }: TenantMobileAiTabProps) {
  const [input, setInput] = React.useState("");
  const bottomRef = React.useRef<HTMLDivElement>(null);

  const {
    messages,
    isTyping,
    quickIdeas,
    handleSend,
    handleNewChat,
    handleCopy,
  } = useTenantAiChat();

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSendChat = (textToSend?: string) => {
    const msg = textToSend || input.trim();
    if (!msg || isTyping) return;
    setInput("");
    handleSend(msg);
  };

  const handleSelectIdea = (idea: QuickIdea) => {
    handleSendChat(idea.prompt);
  };

  const formattedIdeas: QuickIdea[] = quickIdeas.map((idea) => ({
    id: idea.id,
    title: idea.title,
    prompt: idea.prompt,
    desc: idea.desc || idea.prompt,
    icon: idea.icon,
  }));

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden animate-in fade-in-0 duration-200 bg-background">
      <AiAssistantHeader
        view="chat"
        title="Ask AI"
        subtitle="RAG Knowledge Base • Spasial PostGIS"
        showHistory={false}
        showSettingsButton={false}
        showExportButton={false}
        hasMessages={messages.length > 0}
        onNewChat={handleNewChat}
        onClose={() => {
          if (onClose) onClose();
        }}
      />

      <div className="relative flex-1 flex flex-col min-h-0 overflow-hidden">
        <ScrollArea className="flex-1 min-h-0 w-full">
          <div className="px-4 py-4 space-y-4 w-full min-w-0 max-w-full">
            {messages.length === 0 ? (
              <div className="space-y-6 py-2">
                <AiGreeting />
                <AiQuickActions ideas={formattedIdeas} onSelect={handleSelectIdea} columns={1} />
              </div>
            ) : (
              messages.map((msg) => {
                const uiMsg = {
                  id: msg.id,
                  role: (msg.sender === "user" ? "user" : "assistant") as "user" | "assistant",
                  content: msg.text,
                  createdAt: new Date(),
                };

                return (
                  <AiMessageBubble
                    key={msg.id}
                    message={uiMsg}
                    onCopy={() => handleCopy(msg.id, msg.text)}
                  />
                );
              })
            )}

            <div ref={bottomRef} />
          </div>
        </ScrollArea>

        <AiPromptInput
          value={input}
          onChange={setInput}
          onSend={() => handleSendChat()}
          isStreaming={isTyping}
        />
      </div>
    </div>
  );
}
