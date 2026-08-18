"use client";

/**
 * K2NET AI Chat Stream Hook
 * Mengelola koneksi SSE ke /api/v1/ai/chat/stream via Kong API Gateway.
 * Features: streaming token rendering, optimistic updates, abort, retry, session history.
 */

import { useState, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: DocumentSource[];
  isStreaming?: boolean;
  tokensUsed?: number;
  latencyMs?: number;
}

export interface DocumentSource {
  document_id: string;
  title: string;
  category: string;
  chunk_index: number;
  similarity_score: number;
  content_preview: string;
}

interface UseAiChatStreamOptions {
  sessionId?: string | null;
  scope?: string;
  model?: string;
}

const AI_GATEWAY_URL = "/api/v1/ai/chat/stream";

export function useAiChatStream(options: UseAiChatStreamOptions = {}) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  /** Buat ID unik untuk message */
  const createId = () => `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  /** Kirim pesan dan mulai streaming */
  const sendMessage = useCallback(
    async (userMessage: string) => {
      if (!userMessage.trim() || isStreaming) return;
      const token = (session as any)?.accessToken;
      if (!token) {
        setError("Sesi tidak valid. Silakan login ulang.");
        return;
      }

      setError(null);

      // Tambahkan pesan user ke UI secara optimistik
      const userMsgId = createId();
      const assistantMsgId = createId();

      setMessages((prev) => [
        ...prev,
        { id: userMsgId, role: "user", content: userMessage },
        { id: assistantMsgId, role: "assistant", content: "", isStreaming: true },
      ]);

      // Batasi riwayat ke 10 pesan terakhir untuk efisiensi token
      const historyForPayload = messages.slice(-10).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      // Buat AbortController baru
      const controller = new AbortController();
      abortControllerRef.current = controller;
      setIsStreaming(true);

      try {
        const response = await fetch(AI_GATEWAY_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            session_id: options.sessionId || null,
            message: userMessage,
            scope: options.scope || "GENERAL",
            model: options.model || "",
            history: historyForPayload,
          }),
          signal: controller.signal,
        });

        if (!response.ok || !response.body) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        // ── Baca SSE stream ────────────────────────────────────────────────
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulatedContent = "";
        let pendingSources: DocumentSource[] = [];

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          const text = decoder.decode(value, { stream: true });
          const lines = text.split("\n");

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const jsonStr = line.slice(6).trim();
            if (!jsonStr) continue;

            try {
              const event = JSON.parse(jsonStr);

              if (event.type === "sources") {
                pendingSources = event.sources || [];
              } else if (event.type === "token") {
                accumulatedContent += event.content;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsgId
                      ? { ...m, content: accumulatedContent, sources: pendingSources }
                      : m
                  )
                );
              } else if (event.type === "usage") {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsgId
                      ? {
                          ...m,
                          isStreaming: false,
                          tokensUsed: event.tokens,
                          latencyMs: event.latency_ms,
                        }
                      : m
                  )
                );
              } else if (event.type === "error") {
                throw new Error(event.message);
              } else if (event.type === "done") {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsgId ? { ...m, isStreaming: false } : m
                  )
                );
              }
            } catch {
              // Skip malformed JSON lines
            }
          }
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") return; // User cancelled

        const errorMsg =
          err instanceof Error ? err.message : "Terjadi kesalahan koneksi.";
        setError(errorMsg);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  content: `❌ Gagal mendapatkan respons: ${errorMsg}`,
                  isStreaming: false,
                }
              : m
          )
        );
      } finally {
        setIsStreaming(false);
        abortControllerRef.current = null;
      }
    },
    [isStreaming, messages, session, options]
  );

  /** Hentikan streaming yang sedang berjalan */
  const stopStreaming = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsStreaming(false);
    setMessages((prev) =>
      prev.map((m) => (m.isStreaming ? { ...m, isStreaming: false } : m))
    );
  }, []);

  /** Hapus semua pesan */
  const clearMessages = useCallback(() => {
    stopStreaming();
    setMessages([]);
    setError(null);
  }, [stopStreaming]);

  return {
    messages,
    isStreaming,
    error,
    sendMessage,
    stopStreaming,
    clearMessages,
  };
}
