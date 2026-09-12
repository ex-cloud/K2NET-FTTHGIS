import { useEffect } from "react";
import { toast } from "sonner";
import { exportChatToMarkdown, type ChatMessage as Message } from "@/hooks/useAiChatStream";
import type { DrawerView } from "./FloatingAiAssistantHeader";

interface UseAssistantKeyboardProps {
  isOpen: boolean;
  isFullscreen: boolean;
  messages: Message[];
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsFullscreen: React.Dispatch<React.SetStateAction<boolean>>;
  setView: React.Dispatch<React.SetStateAction<DrawerView>>;
  setInput: (s: string) => void;
  setShowHistoryInDrawer: React.Dispatch<React.SetStateAction<boolean>>;
  createNewSession: () => void;
}

export function useAssistantKeyboard({
  isOpen,
  isFullscreen,
  messages,
  setIsOpen,
  setIsFullscreen,
  setView,
  setInput,
  setShowHistoryInDrawer,
  createNewSession,
}: UseAssistantKeyboardProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Toggle AI Assistant Open/Close: Ctrl+J / Cmd+J
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "j") {
        e.preventDefault();
        setIsOpen((p) => !p);
        return;
      }

      // Close on Escape
      if (e.key === "Escape") {
        if (isFullscreen) {
          e.preventDefault();
          setIsFullscreen(false);
          setIsOpen(true);
          return;
        }
        if (isOpen) {
          e.preventDefault();
          setIsOpen(false);
          return;
        }
      }

      // Active only when Assistant is open (Drawer or Fullscreen)
      if (isOpen || isFullscreen) {
        // Alt+N / Option+N: New Chat Session
        if (e.altKey && e.key.toLowerCase() === "n") {
          e.preventDefault();
          createNewSession();
          toast.success("Sesi percakapan baru dimulai");
          return;
        }

        // Alt+H / Option+H: Toggle History Panel (Drawer only)
        if (e.altKey && e.key.toLowerCase() === "h") {
          e.preventDefault();
          if (isOpen) {
            setShowHistoryInDrawer((p) => !p);
          }
          return;
        }

        // Alt+P / Option+P: Settings & Permissions
        if (e.altKey && e.key.toLowerCase() === "p") {
          e.preventDefault();
          if (isOpen) {
            setView((v) => (v === "settings" ? "chat" : "settings"));
          }
          return;
        }

        // Ctrl+E / Cmd+E: Export Markdown
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "e") {
          if (messages.length > 0) {
            e.preventDefault();
            exportChatToMarkdown(messages);
          }
          return;
        }

        // Alt+F / Option+F: Toggle Fullscreen Mode
        if (e.altKey && e.key.toLowerCase() === "f") {
          e.preventDefault();
          if (isFullscreen) {
            setIsFullscreen(false);
            setIsOpen(true);
          } else {
            setIsOpen(false);
            setIsFullscreen(true);
          }
          return;
        }
      }
    };

    const onToggle = () => setIsOpen((p) => !p);
    const onPrompt = (e: Event) => {
      const ce = e as CustomEvent<{ prompt: string }>;
      if (ce.detail?.prompt) {
        setInput(ce.detail.prompt);
        setIsOpen(true);
        setView("chat");
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("k2net-toggle-ai-assistant", onToggle);
    window.addEventListener("k2net-ai-prompt-input", onPrompt);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("k2net-toggle-ai-assistant", onToggle);
      window.removeEventListener("k2net-ai-prompt-input", onPrompt);
    };
  }, [
    isOpen,
    isFullscreen,
    messages,
    createNewSession,
    setIsOpen,
    setIsFullscreen,
    setView,
    setInput,
    setShowHistoryInDrawer,
  ]);
}
