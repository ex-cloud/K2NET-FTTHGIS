import * as React from "react";
import { AiAssistantDrawer, AiAssistantFullscreen } from "@k2net/ui";
import { useTenantAiChat } from "./ai/useTenantAiChat";

interface TenantAiAssistantProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TenantAiAssistant({ open, onOpenChange }: TenantAiAssistantProps) {
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [selectedModel, setSelectedModel] = React.useState("gemini-2.5-flash");

  const {
    messages,
    isTyping,
    greeting,
    quickIdeas,
    sessions,
    activeSessionId,
    handleSend,
    handleCopy,
    handleNewChat,
    handleLoadSession,
    handleDeleteSession,
  } = useTenantAiChat();

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "j") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };

    const handleCustomEvent = () => onOpenChange(true);

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("k2net-toggle-ai-assistant", handleCustomEvent);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("k2net-toggle-ai-assistant", handleCustomEvent);
    };
  }, [open, onOpenChange]);

  const availableModels = [
    { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash", badge: "Default" },
    { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro", badge: "Deep Analysis" },
  ];

  if (isFullscreen && open) {
    return (
      <AiAssistantFullscreen
        open={open}
        title="Ask AI"
        subtitle="RAG Knowledge Base • Spasial PostGIS"
        greeting={greeting}
        messages={messages}
        isStreaming={isTyping}
        sessions={sessions}
        activeSessionId={activeSessionId}
        quickIdeas={quickIdeas}
        selectedModel={selectedModel}
        onModelChange={setSelectedModel}
        availableModels={availableModels}
        onSend={handleSend}
        onNewChat={handleNewChat}
        onSelectSession={handleLoadSession}
        onDeleteSession={handleDeleteSession}
        onCopyMessage={handleCopy}
        onExitFullscreen={() => setIsFullscreen(false)}
      />
    );
  }

  return (
    <AiAssistantDrawer
      open={open}
      onOpenChange={onOpenChange}
      title="Ask AI"
      subtitle="RAG Knowledge Base • Spasial PostGIS"
      greeting={greeting}
      messages={messages}
      isStreaming={isTyping}
      sessions={sessions}
      activeSessionId={activeSessionId}
      quickIdeas={quickIdeas}
      onSend={handleSend}
      onNewChat={handleNewChat}
      onSelectSession={handleLoadSession}
      onDeleteSession={handleDeleteSession}
      onCopyMessage={handleCopy}
      onMaximize={() => setIsFullscreen(true)}
    />
  );
}
