"use client";

/**
 * K2NET AI Chat Stream Hook
 * Mengelola koneksi SSE ke /api/v1/ai/chat/stream via Kong API Gateway.
 * Features: streaming token rendering, thinking/chain-of-thought parsing,
 * Redis Semantic Cache badge, localStorage session persistence, Markdown export.
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";

const STORAGE_KEY = "k2net_ai_chat_session";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  thought?: string;
  thinkingStage?: string;
  isThinking?: boolean;
  cacheHit?: boolean;
  sources?: DocumentSource[];
  isStreaming?: boolean;
  tokensUsed?: number;
  latencyMs?: number;
}

/** Ekspor seluruh percakapan sebagai file Markdown untuk SOP Ticket */
export function exportChatToMarkdown(messages: ChatMessage[]): void {
  const lines: string[] = [
    "# 📋 K2NET FTTH AI Diagnostic Report",
    `> Diekspor pada: ${new Date().toLocaleString("id-ID")}`,
    "",
  ];
  messages.forEach((m) => {
    if (m.role === "user") {
      lines.push(`## 🧑‍💻 Pertanyaan Teknisi`);
      lines.push(m.content);
      lines.push("");
    } else if (m.content) {
      const badge = m.cacheHit ? " ⚡ *[Redis Cache]*" : "";
      lines.push(`## 🤖 Jawaban AI${badge}`);
      if (m.thought) {
        lines.push("<details><summary>Proses Penalaran (Chain of Thought)</summary>\n");
        lines.push(m.thought);
        lines.push("\n</details>\n");
      }
      lines.push(m.content);
      if (m.sources?.length) {
        lines.push("");
        lines.push("**📄 Sumber Referensi:**");
        m.sources.forEach((s, i) => lines.push(`${i + 1}. ${s.title} (${s.category}, sim=${(s.similarity_score * 100).toFixed(0)}%)`));
      }
      if (m.latencyMs) lines.push(`\n*Waktu respons: ${m.latencyMs}ms*`);
      lines.push("");
    }
  });
  const blob = new Blob([lines.join("\n")], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `k2net-diagnosa-${new Date().toISOString().slice(0, 10)}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

export interface DocumentSource {
  document_id: string;
  title: string;
  category: string;
  chunk_index: number;
  similarity_score: number;
  content_preview: string;
}

export interface UseAiChatStreamOptions {
  sessionId?: string | null;
  scope?: string;
  model?: string;
  userScope?: string;
  accessTier?: string;
  grantedPermissions?: string[];
}

const AI_GATEWAY_URL = "/api/v1/ai/chat/stream";

export function useAiChatStream(options: UseAiChatStreamOptions = {}) {
  const { data: session } = useSession();

  // ── Load dari localStorage saat pertama mount ─────────────────────────────
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];
      const parsed: ChatMessage[] = JSON.parse(stored);
      // Bersihkan state streaming yang tersimpan (tidak valid saat reload)
      return parsed.map((m) => ({ ...m, isStreaming: false, isThinking: false }));
    } catch {
      return [];
    }
  });

  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // ── Simpan ke localStorage setiap kali messages berubah ──────────────────
  useEffect(() => {
    if (messages.length === 0) return;
    try {
      // Simpan hanya pesan yang sudah selesai (bukan sedang streaming)
      const toStore = messages.filter((m) => !m.isStreaming && !m.isThinking);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore.slice(-40)));
    } catch {
      // Abaikan jika storage penuh
    }
  }, [messages]);

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
        { 
          id: assistantMsgId, 
          role: "assistant", 
          content: "", 
          isStreaming: true, 
          isThinking: true, 
          thinkingStage: "Memindai basis pengetahuan pgvector..." 
        },
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
            user_scope: options.userScope || "PLATFORM_INTERNAL",
            access_tier: options.accessTier || "FULL",
            granted_permissions: options.grantedPermissions || [],
          }),
          signal: controller.signal,
        });

        if (!response.ok || !response.body) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        // ── Baca SSE stream ────────────────────────────────────────────────
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulatedRaw = "";
        let currentStage = "Memindai basis pengetahuan pgvector...";
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

              if (event.type === "status") {
                currentStage = event.message || "Memproses...";
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsgId
                      ? { ...m, thinkingStage: currentStage, isThinking: true }
                      : m
                  )
                );
              } else if (event.type === "sources") {
                pendingSources = event.sources || [];
                if (event.message) currentStage = event.message;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsgId
                      ? { ...m, sources: pendingSources, thinkingStage: currentStage }
                      : m
                  )
                );
              } else if (event.type === "token") {
                accumulatedRaw += event.content;

                // Parse <think>...</think> reasoning tags if present
                let thoughtText = "";
                let answerText = accumulatedRaw;

                if (accumulatedRaw.includes("<think>")) {
                  if (accumulatedRaw.includes("</think>")) {
                    const parts = accumulatedRaw.split("</think>");
                    thoughtText = parts[0].replace("<think>", "").trim();
                    answerText = parts.slice(1).join("</think>").trim();
                  } else {
                    thoughtText = accumulatedRaw.replace("<think>", "").trim();
                    answerText = "";
                  }
                }

                const isStillThinking = answerText.length === 0;

                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsgId
                      ? {
                          ...m,
                          content: answerText,
                          thought: thoughtText || undefined,
                          isThinking: isStillThinking,
                          thinkingStage: isStillThinking ? currentStage : undefined,
                          sources: pendingSources,
                        }
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
                          isThinking: false,
                          cacheHit: event.cache_hit === true,
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
                    m.id === assistantMsgId ? { ...m, isStreaming: false, isThinking: false } : m
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
                  content: `[Error] ${errorMsg}`,
                  isStreaming: false,
                  isThinking: false,
                }
              : m
          )
        );
      } finally {
        setIsStreaming(false);
        abortControllerRef.current = null;
      }
    },
    [isStreaming, messages, options.model, options.scope, options.sessionId, session]
  );

  /** Batalkan streaming yang sedang berjalan */
  const stopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsStreaming(false);
    }
  }, []);

  /** Hapus seluruh riwayat chat sesi ini (termasuk localStorage) */
  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  return {
    messages,
    isStreaming,
    error,
    sendMessage,
    stopStreaming,
    clearMessages,
  };
}
