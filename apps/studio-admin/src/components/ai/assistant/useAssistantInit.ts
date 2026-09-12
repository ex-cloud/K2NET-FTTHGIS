import { useState, useEffect, useCallback } from "react";
import {
  fetchActiveChatModels,
  type SuggestedPromptItem,
  fetchAgentAuthorization,
  type AgentAuthorizationData,
} from "@/lib/actions/gateways";
import type { DrawerView } from "./FloatingAiAssistantHeader";

export const DEFAULT_MODELS = [
  { value: "gemini-3.7-flash", label: "Gemini 3.7 Flash", badge: "Google" },
  { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash", badge: "Google" },
  { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro (2M)", badge: "Google" },
  { value: "gemini-2.0-flash-thinking-exp", label: "Gemini Thinking", badge: "Reasoning" },
  { value: "deep-research-preview-04-2026", label: "Gemini Deep Research", badge: "Agent" },
  { value: "gpt-4o-mini", label: "GPT-4o Mini", badge: "OpenAI" },
  { value: "gpt-4o", label: "GPT-4o", badge: "OpenAI" },
  { value: "deepseek-chat", label: "DeepSeek V3", badge: "DeepSeek" },
  { value: "deepseek-reasoner", label: "DeepSeek R1", badge: "DeepSeek" },
  { value: "llama3.2", label: "Local Ollama (Llama 3)", badge: "Local" },
  { value: "deepseek-r1:7b", label: "Local DeepSeek-R1", badge: "Local" },
];

export const FALLBACK_PINNED: SuggestedPromptItem[] = [
  {
    id: "fb-1",
    icon: "Zap",
    title: "Diagnosa OLT & Redaman Optik",
    description: "Troubleshooting OLT ZTE C320/Huawei, LOS & redaman nominal",
    prompt:
      "Bagaimana cara troubleshooting OLT ZTE C320 jika port PON statusnya LOS dan berapa standar redaman optik nominalnya?",
    category: "OLT_TROUBLESHOOTING",
    target_role: "ALL",
    is_pinned: true,
    is_active: true,
    is_trending: false,
    usage_count: 42,
  },
  {
    id: "fb-2",
    icon: "MapPin",
    title: "Analisis Jaringan Spasial GIS",
    description: "PostGIS SRID 4326, kapasitas splitter 1:8 / 1:16",
    prompt:
      "Jelaskan arsitektur database spasial PostGIS SRID 4326 dan standar penempatan ODP pada jaringan distribusi FTTH.",
    category: "GIS_SPATIAL",
    target_role: "ALL",
    is_pinned: true,
    is_active: true,
    is_trending: false,
    usage_count: 38,
  },
  {
    id: "fb-3",
    icon: "Activity",
    title: "Health Check 12 Microservices",
    description: "Status poller, kong, postgres, keycloak, minio, audit",
    prompt: "Jelaskan port map dan arsitektur 12 microservices gateway internal K2NET.",
    category: "DEVOPS_INFRA",
    target_role: "SUPER_ADMIN",
    is_pinned: true,
    is_active: true,
    is_trending: false,
    usage_count: 29,
  },
];

export function useAssistantInit(setView: (v: DrawerView) => void) {
  const [selectedModel, setSelectedModel] = useState("gemini-2.5-flash");
  const [availableModels, setAvailableModels] = useState(DEFAULT_MODELS);
  const [pinnedIdeas, setPinnedIdeas] = useState<SuggestedPromptItem[]>([]);
  const [agentAuth, setAgentAuth] = useState<AgentAuthorizationData | null>(null);

  const loadPinnedIdeas = useCallback(async () => {
    try {
      const { fetchAiPromptIdeas } = await import("@/lib/actions/gateways");
      const all = await fetchAiPromptIdeas();
      const seen = new Set<string>();
      setPinnedIdeas(
        all.filter(
          (p) =>
            p.is_pinned &&
            !seen.has(p.title.toLowerCase().trim()) &&
            seen.add(p.title.toLowerCase().trim()) !== undefined
        )
      );
    } catch {
      setPinnedIdeas(FALLBACK_PINNED);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [activeRes, authRes] = await Promise.allSettled([
          fetchActiveChatModels(),
          fetchAgentAuthorization("PLATFORM_INTERNAL"),
        ]);
        if (activeRes.status === "fulfilled" && activeRes.value?.models?.length > 0) {
          setAvailableModels(
            activeRes.value.models.map((m) => ({
              value: m.id.replace("models/", ""),
              label: m.name,
              badge:
                m.badge ||
                (m.category.includes("Gemini")
                  ? "Google"
                  : m.category.includes("OpenAI")
                  ? "OpenAI"
                  : m.category.includes("DeepSeek")
                  ? "DeepSeek"
                  : "Local"),
            }))
          );
        }
        if (activeRes.status === "fulfilled" && activeRes.value?.default_model) {
          setSelectedModel(activeRes.value.default_model);
        }
        if (authRes.status === "fulfilled" && authRes.value) {
          setAgentAuth(authRes.value);
          if (!authRes.value.is_authorized) setView("onboarding");
        }
      } catch {
        /* silent */
      }
    })();
    loadPinnedIdeas();
  }, [loadPinnedIdeas, setView]);

  useEffect(() => {
    const onVis = () => {
      if (!document.hidden) loadPinnedIdeas();
    };
    const onPinned = () => loadPinnedIdeas();
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("k2net-prompt-pinned", onPinned);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("k2net-prompt-pinned", onPinned);
    };
  }, [loadPinnedIdeas]);

  return {
    selectedModel,
    setSelectedModel,
    availableModels,
    pinnedIdeas,
    agentAuth,
    setAgentAuth,
  };
}
