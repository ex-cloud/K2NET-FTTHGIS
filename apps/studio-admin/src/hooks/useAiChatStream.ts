"use client";

/**
 * K2NET AI Chat Stream Hook
 * Mengelola koneksi SSE ke /api/v1/ai/chat/stream via Kong API Gateway.
 * Features: multi-session history management (New Chat preserves past chats),
 * streaming token rendering, thinking/chain-of-thought parsing,
 * Redis Semantic Cache badge, localStorage session persistence, Markdown export.
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";

export const SESSIONS_STORAGE_KEY = "k2net_ai_chat_sessions";
export const ACTIVE_SESSION_ID_KEY = "k2net_ai_active_session_id";
export const LEGACY_STORAGE_KEY = "k2net_ai_chat_session";

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

export interface StoredChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
  model?: string;
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

  // ── Multi-Session History State ───────────────────────────────────────────
  const [sessions, setSessions] = useState<StoredChatSession[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem(SESSIONS_STORAGE_KEY);
      if (stored) {
        const parsed: StoredChatSession[] = JSON.parse(stored);
        return Array.isArray(parsed) ? parsed : [];
      }
      // Migration from legacy storage key if exists
      const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (legacy) {
        const legacyMsgs: ChatMessage[] = JSON.parse(legacy);
        if (legacyMsgs.length > 0) {
          const firstUserMsg = legacyMsgs.find((m) => m.role === "user")?.content || "Previous Chat";
          const migratedSession: StoredChatSession = {
            id: `sess-${Date.now()}`,
            title: firstUserMsg.slice(0, 45),
            messages: legacyMsgs.map((m) => ({ ...m, isStreaming: false, isThinking: false })),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify([migratedSession]));
          return [migratedSession];
        }
      }
    } catch {
      // ignore
    }
    return [];
  });

  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    if (typeof window === "undefined") return `sess-${Date.now()}`;
    try {
      const savedActive = localStorage.getItem(ACTIVE_SESSION_ID_KEY);
      if (savedActive) return savedActive;
      const storedSessions = localStorage.getItem(SESSIONS_STORAGE_KEY);
      if (storedSessions) {
        const parsed: StoredChatSession[] = JSON.parse(storedSessions);
        if (parsed.length > 0) return parsed[0].id;
      }
    } catch {}
    const newId = `sess-${Date.now()}`;
    try { localStorage.setItem(ACTIVE_SESSION_ID_KEY, newId); } catch {}
    return newId;
  });

  // ── Load active session messages ─────────────────────────────────────────
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem(SESSIONS_STORAGE_KEY);
      if (stored) {
        const parsed: StoredChatSession[] = JSON.parse(stored);
        const active = parsed.find((s) => s.id === activeSessionId) || parsed[0];
        if (active) {
          return active.messages.map((m) => ({ ...m, isStreaming: false, isThinking: false }));
        }
      }
    } catch {}
    return [];
  });

  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // ── Sync messages to active session in localStorage ──────────────────────
  useEffect(() => {
    if (messages.length === 0) return;
    try {
      const finishedMessages = messages.filter((m) => !m.isStreaming && !m.isThinking);
      if (finishedMessages.length === 0) return;

      const firstUserMsg = messages.find((m) => m.role === "user")?.content || "New Chat";
      const title = firstUserMsg.slice(0, 45).trim() || "New Chat";
      const now = new Date().toISOString();

      setSessions((prev) => {
        const idx = prev.findIndex((s) => s.id === activeSessionId);
        let updated: StoredChatSession[];
        if (idx >= 0) {
          updated = [...prev];
          updated[idx] = {
            ...updated[idx],
            title: updated[idx].title && updated[idx].title !== "New Chat" ? updated[idx].title : title,
            messages: finishedMessages,
            updatedAt: now,
          };
        } else {
          updated = [
            {
              id: activeSessionId,
              title,
              messages: finishedMessages,
              createdAt: now,
              updatedAt: now,
              model: options.model,
            },
            ...prev,
          ];
        }
        try {
          localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(updated.slice(0, 50)));
        } catch {}
        return updated;
      });
    } catch {}
  }, [messages, activeSessionId, options.model]);

  /** Create unique message ID */
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
            session_id: activeSessionId,
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
    [isStreaming, messages, options.model, options.scope, activeSessionId, session]
  );

  /** Batalkan streaming yang sedang berjalan */
  const stopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsStreaming(false);
    }
  }, []);

  /** Mulai sesi chat baru (+ New chat) tanpa menghapus histori sebelumnya */
  const createNewSession = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsStreaming(false);
    }
    const newSessionId = `sess-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setActiveSessionId(newSessionId);
    setMessages([]);
    setError(null);
    try {
      localStorage.setItem(ACTIVE_SESSION_ID_KEY, newSessionId);
    } catch {}
  }, []);

  /** Muat sesi percakapan dari daftar riwayat */
  const loadSession = useCallback((sessionId: string) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsStreaming(false);
    }
    const target = sessions.find((s) => s.id === sessionId);
    if (target) {
      setActiveSessionId(sessionId);
      setMessages(target.messages.map((m) => ({ ...m, isStreaming: false, isThinking: false })));
      setError(null);
      try {
        localStorage.setItem(ACTIVE_SESSION_ID_KEY, sessionId);
      } catch {}
    }
  }, [sessions]);

  /** Hapus satu sesi tertentu dari riwayat */
  const deleteSession = useCallback((sessionId: string) => {
    setSessions((prev) => {
      const updated = prev.filter((s) => s.id !== sessionId);
      try {
        localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
    if (sessionId === activeSessionId) {
      createNewSession();
    }
  }, [activeSessionId, createNewSession]);

  /** Hapus seluruh pesan di sesi aktif saat ini */
  const clearMessages = useCallback(() => {
    createNewSession();
  }, [createNewSession]);

  return {
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
  };
}
