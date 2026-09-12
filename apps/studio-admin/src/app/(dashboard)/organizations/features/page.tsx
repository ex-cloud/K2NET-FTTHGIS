import { TablePageSkeleton } from "@k2net/ui";
import { OrganizationPageWrapper } from "@/components/page-guards/organization-page-wrapper";
import { useFeaturesState } from "@/components/organizations/features/useFeaturesState";
import { FeaturesHeader } from "@/components/organizations/features/FeaturesHeader";
import { FeaturesKpiCards } from "@/components/organizations/features/FeaturesKpiCards";
import { FeaturesEntitlementLegend } from "@/components/organizations/features/FeaturesEntitlementLegend";
import { FeaturesTable } from "@/components/organizations/features/FeaturesTable";

export default function OrganizationFeaturesPage() {
  const {
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
  } = useFeaturesState();

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
        <FeaturesHeader
          onBulkEnableAI={handleBulkEnableEnterpriseAI}
          onRefresh={refresh}
        />

        <FeaturesKpiCards stats={stats} totalOrgs={totalOrgs} />

        <FeaturesEntitlementLegend />

        <FeaturesTable
          organizations={organizations}
          filteredOrgs={filteredOrgs}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          planFilter={planFilter}
          setPlanFilter={setPlanFilter}
          onNavigateDetail={(slug) => router.push(`/organizations/${slug}`)}
          onToggleFlag={handleToggleFlag}
          onCopy={handleCopy}
        />
      </div>
    </OrganizationPageWrapper>
  );
}
