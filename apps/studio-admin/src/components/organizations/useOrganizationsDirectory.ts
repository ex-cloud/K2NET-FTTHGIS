import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import { useSearchParams } from "@/lib/navigation-compat";
import { useOrganizations, type Organization } from "@/hooks/useOrganizations";
import { useSession } from "@/lib/auth-compat";
import { useActiveImpersonation } from "@/hooks/useActiveImpersonation";
import {
  type EnrichedOrganization,
  type OrganizationStatus,
  enrichOrganization,
} from "./types";
import { useOrganizationBulkActions } from "./useOrganizationBulkActions";
import { useOrganizationsHotkeys } from "./useOrganizationsHotkeys";

export type ViewMode = "grid" | "list" | "table";

export function useOrganizationsDirectory() {
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  const {
    organizations: rawOrgs,
    allStats = {},
    loading: isLoading,
    refresh: refetch,
    updateOrganization,
    deleteOrg,
  } = useOrganizations();

  const {
    activeSession,
    terminating,
    stopActiveSession,
    reopenTenantPortal,
  } = useActiveImpersonation();

  const statusParam = searchParams.get("status") || "ALL";

  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>(statusParam);
  const [planFilter, setPlanFilter] = useState<string>("ALL");
  const [compactView, setCompactView] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const activeStatusFilter = statusParam !== "ALL" ? statusParam : statusFilter;
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modal target states
  const [activeDomainOrg, setActiveDomainOrg] = useState<EnrichedOrganization | null>(null);
  const [activeQuotaOrg, setActiveQuotaOrg] = useState<EnrichedOrganization | null>(null);
  const [activeFlagsOrg, setActiveFlagsOrg] = useState<EnrichedOrganization | null>(null);
  const [activeImpersonateOrg, setActiveImpersonateOrg] = useState<EnrichedOrganization | null>(null);
  const [orgToDelete, setOrgToDelete] = useState<EnrichedOrganization | null>(null);

  useEffect(() => {
    setStatusFilter(statusParam);
  }, [statusParam]);

  const enrichedOrganizations: EnrichedOrganization[] = useMemo(() => {
    return (rawOrgs || []).map((org: Organization) => {
      const stats = allStats[org.slug] || allStats[org.id || ""] || {};
      return enrichOrganization(org, stats);
    });
  }, [rawOrgs, allStats]);

  useEffect(() => {
    const pendingStr = sessionStorage.getItem("pending_impersonate");
    if (pendingStr && enrichedOrganizations && enrichedOrganizations.length > 0) {
      try {
        const pending = JSON.parse(pendingStr);
        const org = enrichedOrganizations.find(
          (o) => o.id === pending.orgId || o.slug === pending.orgSlug || o.slug === pending.orgId
        );
        if (org) {
          setActiveImpersonateOrg(org);
        }
      } catch (e) {
        console.error("Failed to parse pending impersonate", e);
      }
    }
  }, [enrichedOrganizations]);

  const filteredOrganizations = useMemo(() => {
    return enrichedOrganizations.filter((org) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = org.name.toLowerCase().includes(q);
        const matchesSlug = org.slug.toLowerCase().includes(q);
        const matchesPic = org.picName?.toLowerCase().includes(q) || false;
        if (!matchesName && !matchesSlug && !matchesPic) return false;
      }

      if (activeStatusFilter !== "ALL") {
        if (activeStatusFilter === "SUSPENDED") {
          if (org.status !== "SUSPENDED" && org.status !== "OVERDUE" && org.status !== "TRIAL_EXPIRED") {
            return false;
          }
        } else if (org.status !== activeStatusFilter) {
          return false;
        }
      }

      if (planFilter !== "ALL" && org.planTier !== planFilter) {
        return false;
      }

      return true;
    });
  }, [enrichedOrganizations, searchQuery, activeStatusFilter, planFilter]);

  useOrganizationsHotkeys({
    refetch,
    setCompactView,
    setWizardOpen,
    setViewMode,
    setSelectedIds,
  });

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.length === filteredOrganizations.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredOrganizations.map((o) => o.id));
    }
  };

  const handleExtendTrial = (org: EnrichedOrganization) => {
    toast.success(`Trial extended by +14 days for ${org.name}`, {
      description: `New expiration: ${new Date(Date.now() + 14 * 86400000).toLocaleDateString()}`,
    });
  };

  const handleUpdateStatus = async (org: EnrichedOrganization, newStatus: OrganizationStatus) => {
    if (updateOrganization) {
      await updateOrganization({
        slug: org.slug,
        org: { status: newStatus },
      });
    }
    refetch();
  };

  const {
    handleBulkSuspend,
    handleBulkResume,
    handleBulkBroadcast,
    handleBulkExport,
    handleBulkBackupJson,
  } = useOrganizationBulkActions(
    enrichedOrganizations,
    selectedIds,
    setSelectedIds,
    refetch,
    updateOrganization,
    session
  );

  return {
    session,
    isLoading,
    refetch,
    updateOrganization,
    deleteOrg,
    activeSession,
    terminating,
    stopActiveSession,
    reopenTenantPortal,
    viewMode,
    setViewMode,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    activeStatusFilter,
    planFilter,
    setPlanFilter,
    compactView,
    setCompactView,
    wizardOpen,
    setWizardOpen,
    isImportModalOpen,
    setIsImportModalOpen,
    selectedIds,
    setSelectedIds,
    activeDomainOrg,
    setActiveDomainOrg,
    activeQuotaOrg,
    setActiveQuotaOrg,
    activeFlagsOrg,
    setActiveFlagsOrg,
    activeImpersonateOrg,
    setActiveImpersonateOrg,
    orgToDelete,
    setOrgToDelete,
    enrichedOrganizations,
    filteredOrganizations,
    handleToggleSelect,
    handleToggleSelectAll,
    handleExtendTrial,
    handleUpdateStatus,
    handleBulkSuspend,
    handleBulkResume,
    handleBulkBroadcast,
    handleBulkExport,
    handleBulkBackupJson,
  };
}
