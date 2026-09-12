import { useState, useRef, useCallback } from "react";
import type { KnowledgeScope } from "../types";

export function useAiSopGenerator(
  manualTitle: string,
  manualCategory: string,
  manualScope: KnowledgeScope,
  setManualContent: (c: string) => void,
  manualSubmitting: boolean
) {
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiGeneratedChars, setAiGeneratedChars] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const generateWithAi = useCallback(async () => {
    if (!manualTitle.trim()) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setAiGenerating(true);
    setAiGeneratedChars(0);
    setManualContent("");

    try {
      const res = await fetch("/api/ai/generate-sop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: manualTitle.trim(),
          category: manualCategory,
          scope: manualScope,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("Response body tidak tersedia");

      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (!raw || raw === "[DONE]") continue;

          try {
            const parsed = JSON.parse(raw);
            if (parsed.token) {
              accumulated += parsed.token;
              const headerIdx = accumulated.indexOf("# ");
              const displayContent = headerIdx > 0 ? accumulated.slice(headerIdx) : accumulated;
              setManualContent(displayContent);
              setAiGeneratedChars(displayContent.length);
            }
          } catch {
            // ignore malformed SSE lines
          }
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== "AbortError") {
        setManualContent(
          `> ⚠️ **Gagal generate konten AI**\n>\n> ${err.message}\n\nSilakan periksa koneksi ke layanan AI gateway atau tulis manual.`
        );
      }
    } finally {
      setAiGenerating(false);
      abortControllerRef.current = null;
    }
  }, [manualTitle, manualCategory, manualScope, setManualContent]);

  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setAiGenerating(false);
  }, []);

  const canGenerateAi = manualTitle.trim().length >= 5 && !aiGenerating && !manualSubmitting;

  return {
    aiGenerating,
    aiGeneratedChars,
    generateWithAi,
    stopGeneration,
    canGenerateAi,
  };
}
