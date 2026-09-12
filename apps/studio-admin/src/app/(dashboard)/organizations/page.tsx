import * as React from "react";
import { OrganizationPageWrapper } from "@/components/page-guards/organization-page-wrapper";
import { OrganizationKpiStrip } from "@/components/organizations/OrganizationKpiStrip";
import { OrganizationToolbar } from "@/components/organizations/OrganizationToolbar";
import { OrganizationBulkActionBar } from "@/components/organizations/OrganizationBulkActionBar";
import { OrganizationStatsHeader } from "@/components/organizations/OrganizationStatsHeader";
import { ActiveImpersonationBanner } from "@/components/organizations/ActiveImpersonationBanner";
import { OrganizationsDataView } from "@/components/organizations/OrganizationsDataView";
import { OrganizationsModals } from "@/components/organizations/OrganizationsModals";
import { useOrganizationsDirectory } from "@/components/organizations/useOrganizationsDirectory";

export default function AdminOrganizationsPage() {
  const dir = useOrganizationsDirectory();

  return (
    <OrganizationPageWrapper>
      <div className="relative flex flex-col w-full h-full bg-background pt-6 pb-0 gap-5 overflow-hidden">
        <OrganizationStatsHeader organizations={dir.enrichedOrganizations} />

        {!dir.compactView && (
          <div className="px-4 md:px-6 shrink-0 animate-in fade-in-50 duration-150">
            <OrganizationKpiStrip organizations={dir.enrichedOrganizations} compactView={false} />
          </div>
        )}

        <div className="flex-1 min-h-0 flex gap-4 px-4 md:px-6 pb-6 overflow-hidden">
          <div className="flex-1 min-h-0 border border-border bg-card/10 rounded-xl overflow-hidden flex flex-col">
            <OrganizationToolbar
              searchQuery={dir.searchQuery}
              setSearchQuery={dir.setSearchQuery}
              statusFilter={dir.activeStatusFilter}
              setStatusFilter={dir.setStatusFilter}
              planFilter={dir.planFilter}
              setPlanFilter={dir.setPlanFilter}
              viewMode={dir.viewMode}
              setViewMode={dir.setViewMode}
              compactView={dir.compactView}
              setCompactView={dir.setCompactView}
              loading={dir.isLoading}
              onRefresh={dir.refetch}
              onNewOrganization={() => dir.setWizardOpen(true)}
              onImportBackup={() => dir.setIsImportModalOpen(true)}
            />

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <ActiveImpersonationBanner
                activeSession={dir.activeSession}
                terminating={dir.terminating}
                onReopenPortal={dir.reopenTenantPortal}
                onStopSession={() => dir.stopActiveSession()}
              />

              <OrganizationsDataView
                isLoading={dir.isLoading}
                viewMode={dir.viewMode}
                filteredOrganizations={dir.filteredOrganizations}
                selectedIds={dir.selectedIds}
                activeSession={dir.activeSession}
                onToggleSelect={dir.handleToggleSelect}
                onToggleSelectAll={dir.handleToggleSelectAll}
                onImpersonate={(org) => dir.setActiveImpersonateOrg(org)}
                onStopImpersonation={() => dir.stopActiveSession()}
                onReopenPortal={dir.reopenTenantPortal}
                onOpenDomainModal={(org) => dir.setActiveDomainOrg(org)}
                onOpenQuotaModal={(org) => dir.setActiveQuotaOrg(org)}
                onOpenFlagsModal={(org) => dir.setActiveFlagsOrg(org)}
                onExtendTrial={dir.handleExtendTrial}
                onUpdateStatus={dir.handleUpdateStatus}
                onDelete={(org) => dir.setOrgToDelete(org)}
              />
            </div>
          </div>
        </div>

        <OrganizationBulkActionBar
          selectedCount={dir.selectedIds.length}
          onClearSelection={() => dir.setSelectedIds([])}
          onBulkSuspend={dir.handleBulkSuspend}
          onBulkResume={dir.handleBulkResume}
          onBulkBroadcast={dir.handleBulkBroadcast}
          onBulkExport={dir.handleBulkExport}
          onBulkBackupJson={dir.handleBulkBackupJson}
        />

        <OrganizationsModals
          activeDomainOrg={dir.activeDomainOrg}
          setActiveDomainOrg={dir.setActiveDomainOrg}
          activeQuotaOrg={dir.activeQuotaOrg}
          setActiveQuotaOrg={dir.setActiveQuotaOrg}
          activeFlagsOrg={dir.activeFlagsOrg}
          setActiveFlagsOrg={dir.setActiveFlagsOrg}
          activeImpersonateOrg={dir.activeImpersonateOrg}
          setActiveImpersonateOrg={dir.setActiveImpersonateOrg}
          wizardOpen={dir.wizardOpen}
          setWizardOpen={dir.setWizardOpen}
          orgToDelete={dir.orgToDelete}
          setOrgToDelete={dir.setOrgToDelete}
          isImportModalOpen={dir.isImportModalOpen}
          setIsImportModalOpen={dir.setIsImportModalOpen}
          refetch={dir.refetch}
          updateOrganization={dir.updateOrganization}
          deleteOrg={dir.deleteOrg}
          accessToken={dir.session?.accessToken ?? undefined}
        />
      </div>
    </OrganizationPageWrapper>
  );
}
