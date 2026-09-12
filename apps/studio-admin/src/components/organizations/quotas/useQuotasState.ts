import { useState, useMemo, useEffect } from "react";
import { useRouter } from "@/lib/navigation-compat";
import { toast } from "sonner";
import { useOrganizations, type Organization } from "@/hooks/useOrganizations";
import {
  type EnrichedOrganization,
  toBackendPlanName,
  enrichOrganization,
} from "../types";

export function useQuotasState() {
  const router = useRouter();
  const {
    organizations: rawOrgs,
    allStats = {},
    loading,
    refresh,
    updateOrganization,
  } = useOrganizations();

  const [searchQuery, setSearchQuery] = useState("");
  const [planFilter, setPlanFilter] = useState("ALL");
  const [selectedOrgForQuota, setSelectedOrgForQuota] = useState<EnrichedOrganization | null>(null);

  const organizations: EnrichedOrganization[] = useMemo(() => {
    return (rawOrgs || []).map((org: Organization) => {
      const stats = allStats[org.slug] || allStats[org.id || ""] || {};
      return enrichOrganization(org, stats);
    });
  }, [rawOrgs, allStats]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        refresh();
        toast.success("Hardware quotas refreshed");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [refresh]);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

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

  const totalMaxOlts = organizations.reduce((acc, o) => acc + o.maxOlts, 0) || 1;
  const totalUsedOlts = organizations.reduce((acc, o) => acc + o.usedOlts, 0);
  const totalMaxOdps = organizations.reduce((acc, o) => acc + o.maxOdps, 0) || 1;
  const totalUsedOdps = organizations.reduce((acc, o) => acc + o.usedOdps, 0);
  const totalMaxStorageGb = organizations.reduce((acc, o) => acc + o.maxStorageGb, 0) || 1;
  const totalStorageGb = Math.round(organizations.reduce((acc, o) => acc + o.usedStorageGb, 0) * 10) / 10;

  const handleSaveQuotas = async (
    _orgId: string,
    quotas: { maxOlts?: number; maxOdps?: number; planTier?: string }
  ) => {
    if (selectedOrgForQuota && updateOrganization) {
      await updateOrganization({
        slug: selectedOrgForQuota.slug,
        org: {
          subscriptionPlan: {
            name: toBackendPlanName(quotas.planTier || selectedOrgForQuota.planTier),
            maxProjects: quotas.maxOlts,
            maxOdps: quotas.maxOdps,
          },
        },
      });
      refresh();
    }
  };

  return {
    router,
    loading,
    refresh,
    searchQuery,
    setSearchQuery,
    planFilter,
    setPlanFilter,
    selectedOrgForQuota,
    setSelectedOrgForQuota,
    organizations,
    filteredOrgs,
    totalMaxOlts,
    totalUsedOlts,
    totalMaxOdps,
    totalUsedOdps,
    totalMaxStorageGb,
    totalStorageGb,
    handleCopy,
    handleSaveQuotas,
  };
}
