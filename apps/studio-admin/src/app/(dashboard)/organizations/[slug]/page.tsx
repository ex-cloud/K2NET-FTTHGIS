import { DashboardPageSkeleton, Button } from "@k2net/ui";
import { ArrowLeft, Building2 } from "lucide-react";
import { Link } from "@/lib/navigation-compat";
import { OrganizationPageWrapper } from "@/components/page-guards/organization-page-wrapper";
import { OrgDetailHeader } from "@/components/organizations/detail-page/OrgDetailHeader";
import { OrgDetailTabsNav } from "@/components/organizations/detail-page/OrgDetailTabsNav";
import { OrgDetailContent } from "@/components/organizations/detail-page/OrgDetailContent";
import { OrgDetailModals } from "@/components/organizations/detail-page/OrgDetailModals";
import { useOrgDetailState } from "@/components/organizations/detail-page/useOrgDetailState";

export default function OrganizationDetailPage() {
  const state = useOrgDetailState();

  if (state.loading) {
    return <DashboardPageSkeleton />;
  }

  if (!state.org) {
    return (
      <OrganizationPageWrapper>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <Building2 className="w-12 h-12 text-muted-foreground animate-pulse" />
          <h2 className="text-xl font-semibold text-foreground">Organization Not Found</h2>
          <p className="text-sm text-muted-foreground">
            The organization with identifier &ldquo;{state.slug}&rdquo; could not be found or has been deleted.
          </p>
          <Button asChild variant="outline">
            <Link href="/organizations">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Organizations
            </Link>
          </Button>
        </div>
      </OrganizationPageWrapper>
    );
  }

  return (
    <OrganizationPageWrapper>
      <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-background">
        <OrgDetailHeader
          org={state.org}
          onExportMarkdown={state.handleExportMarkdown}
        />

        <OrgDetailTabsNav
          activeTab={state.activeTab}
          setActiveTab={state.setActiveTab}
        />

        <OrgDetailContent
          activeTab={state.activeTab}
          org={state.org}
          onImpersonate={state.handleImpersonate}
          onOpenDomainModal={() => state.setDomainModalOpen(true)}
          onOpenQuotaModal={() => state.setQuotaModalOpen(true)}
          onOpenFlagsModal={() => state.setFlagsModalOpen(true)}
          onUpdateStatus={state.handleUpdateStatus}
          onDeleteClick={() => state.setDeleteOpen(true)}
        />

        <OrgDetailModals
          org={state.org}
          domainModalOpen={state.domainModalOpen}
          setDomainModalOpen={state.setDomainModalOpen}
          quotaModalOpen={state.quotaModalOpen}
          setQuotaModalOpen={state.setQuotaModalOpen}
          flagsModalOpen={state.flagsModalOpen}
          setFlagsModalOpen={state.setFlagsModalOpen}
          impersonateModalOpen={state.impersonateModalOpen}
          setImpersonateModalOpen={state.setImpersonateModalOpen}
          deleteOpen={state.deleteOpen}
          setDeleteOpen={state.setDeleteOpen}
          refresh={state.refresh}
          updateOrganization={state.updateOrganization}
          deleteOrg={state.deleteOrg}
          accessToken={state.session?.accessToken ?? undefined}
          onDeleted={() => state.router.push("/organizations")}
        />
      </div>
    </OrganizationPageWrapper>
  );
}
