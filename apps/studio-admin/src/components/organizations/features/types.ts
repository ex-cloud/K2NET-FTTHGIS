import type { OrganizationFeatureFlags } from "../types";

export interface AdoptionStats {
  gisCore: number;
  oltPoller: number;
  whatsapp: number;
  aiCopilot: number;
}

export type FeatureFlagKey = keyof OrganizationFeatureFlags;
