import * as React from "react";
import { useTenantAiChat } from "./ai/useTenantAiChat";
import { TenantAiFullscreenLayout } from "./ai/TenantAiFullscreenLayout";
import { TenantAiDrawerLayout } from "./ai/TenantAiDrawerLayout";

interface TenantAiAssistantProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TenantAiAssistant({ open, onOpenChange }: TenantAiAssistantProps) {
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const [sidebarSearch, setSidebarSearch] = React.useState("");
  const [showConfig, setShowConfig] = React.useState(false);
  const [selectedModel, setSelectedModel] = React.useState("gemini-2.5-flash");

  const {
    messages,
    input,
    setInput,
    isTyping,
    copiedId,
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
      if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    const handleCustomEvent = () => onOpenChange(true);

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("k2net-toggle-ai-assistant", handleCustomEvent);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("k2net-toggle-ai-assistant", handleCustomEvent);
    };
  }, [open, onOpenChange, isFullscreen]);

  const filteredSessions = React.useMemo(() => {
    return sessions.filter((s) => s.title.toLowerCase().includes(sidebarSearch.toLowerCase()));
  }, [sessions, sidebarSearch]);

  if (isFullscreen && open) {
    return (
      <TenantAiFullscreenLayout
        greeting={greeting}
        messages={messages}
        input={input}
        setInput={setInput}
        isTyping={isTyping}
        copiedId={copiedId}
        onCopy={handleCopy}
        onSend={handleSend}
        onExitFullscreen={() => setIsFullscreen(false)}
        onClose={() => {
          setIsFullscreen(false);
          onOpenChange(false);
        }}
        quickIdeas={quickIdeas}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onNewChat={handleNewChat}
        onLoadSession={handleLoadSession}
        onDeleteSession={handleDeleteSession}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        sidebarSearch={sidebarSearch}
        setSidebarSearch={setSidebarSearch}
        filteredSessions={filteredSessions}
        selectedModel={selectedModel}
        setSelectedModel={setSelectedModel}
        showConfig={showConfig}
        setShowConfig={setShowConfig}
      />
    );
  }

  return (
    <TenantAiDrawerLayout
      open={open}
      onOpenChange={onOpenChange}
      onMaximize={() => setIsFullscreen(true)}
      greeting={greeting}
      messages={messages}
      input={input}
      setInput={setInput}
      isTyping={isTyping}
      copiedId={copiedId}
      onCopy={handleCopy}
      onSend={handleSend}
      onNewChat={handleNewChat}
      quickIdeas={quickIdeas}
    />
  );
}
