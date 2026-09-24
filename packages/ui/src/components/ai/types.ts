import * as React from "react";

export type MessageRole = "user" | "assistant" | "ai" | "system";

export interface DocumentSource {
  id?: string;
  title?: string;
  doc_name?: string;
  file_name?: string;
  similarity?: number;
  score?: number;
  snippet?: string;
  url?: string;
  [key: string]: any;
}

export interface ChatMessage {
  id: string;
  role?: MessageRole;
  sender?: "user" | "ai" | "assistant";
  text?: string;
  content?: string;
  timestamp?: string;
  isStreaming?: boolean;
  thought?: string;
  isThinking?: boolean;
  thinkingStage?: string;
  sources?: Array<string | DocumentSource>;
  latencyMs?: number;
  [key: string]: any;
}

export interface StoredChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt?: string;
  messages: ChatMessage[];
  [key: string]: any;
}

export interface QuickIdea {
  id: string;
  title: string;
  prompt: string;
  desc?: string;
  description?: string;
  icon?: string | React.ComponentType<{ className?: string }>;
  tag?: string;
  category?: string;
}

export type DrawerView = "chat" | "history" | "settings" | "permissions" | "onboarding";
