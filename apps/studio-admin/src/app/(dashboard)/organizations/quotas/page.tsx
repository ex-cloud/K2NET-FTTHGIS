import { TablePageSkeleton } from "@k2net/ui";
import { OrganizationPageWrapper } from "@/components/page-guards/organization-page-wrapper";
import { TenantQuotaModal } from "@/components/organizations/TenantQuotaModal";
import { useQuotasState } from "@/components/organizations/quotas/useQuotasState";
import { QuotasHeader } from "@/components/organizations/quotas/QuotasHeader";
import { QuotasKpiCards } from "@/components/organizations/quotas/QuotasKpiCards";
import { QuotasTable } from "@/components/organizations/quotas/QuotasTable";

export default function OrganizationQuotasPage() {
  const {
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
  } = useQuotasState();

  if (loading) {
    return (
      <OrganizationPageWrapper>
        <TablePageSkeleton />
      </OrganizationPageWrapper>
    );
  }

  return (
    <OrganizationPageWrapper>
      <div className="relative flex flex-col w-full h-full bg-background pt-6 pb-0 gap-5 overflow-hidden">
        <QuotasHeader onRefresh={refresh} />

        <QuotasKpiCards
          totalUsedOlts={totalUsedOlts}
          totalMaxOlts={totalMaxOlts}
          totalUsedOdps={totalUsedOdps}
          totalMaxOdps={totalMaxOdps}
          totalStorageGb={totalStorageGb}
          totalMaxStorageGb={totalMaxStorageGb}
        />

        <QuotasTable
          organizations={organizations}
          filteredOrgs={filteredOrgs}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          planFilter={planFilter}
          setPlanFilter={setPlanFilter}
          onNavigateDetail={(slug) => router.push(`/organizations/${slug}`)}
          onAdjustQuotas={(org) => setSelectedOrgForQuota(org)}
          onCopy={handleCopy}
        />

        {/* Quota Modal */}
        <TenantQuotaModal
          organization={selectedOrgForQuota}
          isOpen={!!selectedOrgForQuota}
          onClose={() => setSelectedOrgForQuota(null)}
          onSaveQuotas={handleSaveQuotas}
        />
      </div>
    </OrganizationPageWrapper>
  );
}
