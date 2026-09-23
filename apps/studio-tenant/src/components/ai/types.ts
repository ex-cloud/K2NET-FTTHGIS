import type * as React from "react";

export interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

export interface QuickIdea {
  id: string;
  title: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  prompt: string;
}
