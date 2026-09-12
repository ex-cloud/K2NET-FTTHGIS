import { useState, useMemo, useEffect } from "react";
import { useRouter } from "@/lib/navigation-compat";
import { toast } from "sonner";
import { useOrganizations, type Organization } from "@/hooks/useOrganizations";
import {
  type EnrichedOrganization,
  type OrganizationFeatureFlags,
  enrichOrganization,
} from "../types";
import type { FeatureFlagKey, AdoptionStats } from "./types";

export function useFeaturesState() {
  const router = useRouter();
  const {
    organizations: rawOrgs,
    allStats = {},
    loading,
    refresh,
    updateFeatureFlags,
  } = useOrganizations();

  const [searchQuery, setSearchQuery] = useState("");
  const [planFilter, setPlanFilter] = useState("ALL");
  const [flagsState, setFlagsState] = useState<Record<string, OrganizationFeatureFlags>>({});

  const organizations: EnrichedOrganization[] = useMemo(() => {
    return (rawOrgs || []).map((o: Organization) => {
      const stats = allStats[o.slug] || allStats[o.id || ""] || {};
      const base = enrichOrganization(o, stats);
      const customFlags = flagsState[o.slug] || flagsState[o.id || ""] || base.featureFlags;
      return {
        ...base,
        featureFlags: customFlags,
      };
    });
  }, [rawOrgs, flagsState, allStats]);

  const filteredOrgs = useMemo(() => {
    return organizations.filter((org) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!org.name.toLowerCase().includes(q) && !org.slug.toLowerCase().includes(q)) {
          return false;
        }
      }
      if (planFilter !== "ALL" && org.planTier !== planFilter) {
        return false;
      }
      return true;
    });
  }, [organizations, searchQuery, planFilter]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        refresh();
        toast.success("Entitlements refreshed from backend");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [refresh]);

  const handleToggleFlag = async (slug: string, orgName: string, flagKey: FeatureFlagKey) => {
    const currentOrg = organizations.find((o) => o.slug === slug);
    const currentFlags = currentOrg?.featureFlags || {
      gisCore: true,
      oltPoller: false,
      whatsappEngine: false,
      aiCopilot: false,
      sandboxMode: false,
    };
    const updatedFlags = { ...currentFlags, [flagKey]: !currentFlags[flagKey] };

    setFlagsState((prev) => ({ ...prev, [slug]: updatedFlags }));

    try {
      await updateFeatureFlags({ slug, flags: updatedFlags });
      toast.success(`${flagKey} ${updatedFlags[flagKey] ? "diaktifkan" : "dinonaktifkan"} untuk ${orgName}`);
    } catch (err) {
      toast.error(`Gagal menyimpan fitur: ${err instanceof Error ? err.message : "Kesalahan server"}`);
      refresh();
    }
  };

  const handleBulkEnableEnterpriseAI = async () => {
    const enterpriseOrgs = organizations.filter((o) => o.planTier === "Enterprise");
    if (enterpriseOrgs.length === 0) {
      toast.info("Tidak ada organisasi dengan paket Enterprise saat ini.");
      return;
    }

    try {
      for (const org of enterpriseOrgs) {
        const updated = { ...org.featureFlags, aiCopilot: true };
        setFlagsState((prev) => ({ ...prev, [org.slug]: updated }));
        await updateFeatureFlags({ slug: org.slug, flags: updated });
      }
      toast.success("AI Fiber Copilot berhasil diaktifkan untuk seluruh tenant Enterprise");
    } catch {
      toast.error("Gagal mengaktifkan AI Copilot secara massal");
      refresh();
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} disalin ke clipboard`);
  };

  const totalOrgs = organizations.length || 1;
  const stats: AdoptionStats = useMemo(() => {
    return {
      gisCore: organizations.filter((o) => o.featureFlags.gisCore).length,
      oltPoller: organizations.filter((o) => o.featureFlags.oltPoller).length,
      whatsapp: organizations.filter((o) => o.featureFlags.whatsappEngine).length,
      aiCopilot: organizations.filter((o) => o.featureFlags.aiCopilot).length,
    };
  }, [organizations]);

  return {
    router,
    loading,
    refresh,
    searchQuery,
    setSearchQuery,
    planFilter,
    setPlanFilter,
    organizations,
    filteredOrgs,
    totalOrgs,
    stats,
    handleToggleFlag,
    handleBulkEnableEnterpriseAI,
    handleCopy,
  };
}
