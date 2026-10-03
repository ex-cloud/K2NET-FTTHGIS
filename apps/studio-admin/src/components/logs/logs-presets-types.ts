import type { AdvancedFilter } from "./logs-filter-context";

export type PresetColorTag = "red" | "amber" | "emerald" | "blue" | "purple" | "neutral";

export interface InvestigationPreset {
  id: string;
  name: string;
  description: string;
  colorTag: PresetColorTag;
  isSystem?: boolean;
  createdAt: string;
  filters: {
    timeRange: string;
    selectedTypes: Record<string, boolean>;
    selectedLevels: Record<string, boolean>;
    selectedSeverities: Record<string, boolean>;
    scopeFilter: string;
    projectFilter: string;
    tenantFilter: string;
    searchQuery: string;
    advancedFilters: AdvancedFilter[];
    includeBenchmark: boolean;
  };
}

export const SYSTEM_PRESETS: InvestigationPreset[] = [
  {
    id: "sys-critical-breaches",
    name: "🔴 Critical Security Breaches",
    description: "Audit events with CRITICAL severity & high-risk security actions across all tenants",
    colorTag: "red",
    isSystem: true,
    createdAt: "2026-10-01T00:00:00Z",
    filters: {
      timeRange: "24h",
      selectedTypes: {},
      selectedLevels: {},
      selectedSeverities: { CRITICAL: true },
      scopeFilter: "ALL",
      projectFilter: "",
      tenantFilter: "",
      searchQuery: "",
      advancedFilters: [],
      includeBenchmark: false,
    },
  },
  {
    id: "sys-impersonation-sessions",
    name: "🎭 Impersonation Sessions",
    description: "Forensic audit trail of Super Admin cross-tenant impersonation sessions",
    colorTag: "purple",
    isSystem: true,
    createdAt: "2026-10-01T00:00:00Z",
    filters: {
      timeRange: "7d",
      selectedTypes: {},
      selectedLevels: {},
      selectedSeverities: {},
      scopeFilter: "ALL",
      projectFilter: "",
      tenantFilter: "",
      searchQuery: "impersonation",
      advancedFilters: [],
      includeBenchmark: false,
    },
  },
  {
    id: "sys-edge-api-errors",
    name: "🌐 Edge Gateway 5xx Failures",
    description: "Kong API Gateway & Traefik edge reverse proxy 5xx HTTP error events",
    colorTag: "amber",
    isSystem: true,
    createdAt: "2026-10-01T00:00:00Z",
    filters: {
      timeRange: "1h",
      selectedTypes: { edge: true, traefik: true },
      selectedLevels: { error: true },
      selectedSeverities: { ERROR: true, CRITICAL: true },
      scopeFilter: "ALL",
      projectFilter: "",
      tenantFilter: "",
      searchQuery: "",
      advancedFilters: [],
      includeBenchmark: false,
    },
  },
  {
    id: "sys-database-mutations",
    name: "💾 DB Schema & Core Mutations",
    description: "PostgreSQL schema updates, system settings mutations, and DB transactions",
    colorTag: "blue",
    isSystem: true,
    createdAt: "2026-10-01T00:00:00Z",
    filters: {
      timeRange: "24h",
      selectedTypes: { postgres: true, backend: true },
      selectedLevels: {},
      selectedSeverities: {},
      scopeFilter: "SYSTEM",
      projectFilter: "",
      tenantFilter: "system",
      searchQuery: "",
      advancedFilters: [],
      includeBenchmark: false,
    },
  },
  {
    id: "sys-gis-telemetry-load",
    name: "⚡ GIS Vector Tiles & OLT Load",
    description: "Martin Tile Server, MapLibre geocoding, and OLT telemetry streaming logs",
    colorTag: "emerald",
    isSystem: true,
    createdAt: "2026-10-01T00:00:00Z",
    filters: {
      timeRange: "1h",
      selectedTypes: { martin: true, map: true, olt: true, poller: true },
      selectedLevels: {},
      selectedSeverities: {},
      scopeFilter: "ALL",
      projectFilter: "",
      tenantFilter: "",
      searchQuery: "",
      advancedFilters: [],
      includeBenchmark: false,
    },
  },
];

export const PRESET_STORAGE_KEY = "k2net_logs_investigation_presets_v1";

export function loadSavedPresets(): InvestigationPreset[] {
  if (typeof window === "undefined") return SYSTEM_PRESETS;
  try {
    const raw = localStorage.getItem(PRESET_STORAGE_KEY);
    if (!raw) return SYSTEM_PRESETS;
    const custom: InvestigationPreset[] = JSON.parse(raw);
    return [...SYSTEM_PRESETS, ...custom];
  } catch {
    return SYSTEM_PRESETS;
  }
}

export function saveCustomPresets(customPresets: InvestigationPreset[]): void {
  if (typeof window === "undefined") return;
  try {
    const onlyCustom = customPresets.filter((p) => !p.isSystem);
    localStorage.setItem(PRESET_STORAGE_KEY, JSON.stringify(onlyCustom));
  } catch {
    // LocalStorage quota or error ignored
  }
}
