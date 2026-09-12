import { TablePageSkeleton } from "@k2net/ui";
import { OrganizationPageWrapper } from "@/components/page-guards/organization-page-wrapper";
import { TenantDomainModal } from "@/components/organizations/TenantDomainModal";
import { useDomainsState } from "@/components/organizations/domains/useDomainsState";
import { DomainsHeader } from "@/components/organizations/domains/DomainsHeader";
import { DomainsKpiCards } from "@/components/organizations/domains/DomainsKpiCards";
import { DomainsTable } from "@/components/organizations/domains/DomainsTable";
import { DnsDiagnosticsModal } from "@/components/organizations/domains/DnsDiagnosticsModal";

export default function OrganizationDomainsPage() {
  const {
    router,
    loading,
    refresh,
    searchQuery,
    setSearchQuery,
    selectedOrgForDomain,
    setSelectedOrgForDomain,
    diagnosticsOpen,
    setDiagnosticsOpen,
    diagnosingDomain,
    diagnosticsOutput,
    runningDiag,
    organizations,
    filteredOrgs,
    handleCopy,
    handleRunDiagnostics,
  } = useDomainsState();

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
        <DomainsHeader onRefresh={refresh} />

        <DomainsKpiCards
          organizations={organizations}
          onCopy={handleCopy}
        />

        <DomainsTable
          filteredOrgs={filteredOrgs}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onNavigateDetail={(slug) => router.push(`/organizations/${slug}`)}
          onRunDiagnostics={handleRunDiagnostics}
          onConfigDomain={(org) => setSelectedOrgForDomain(org)}
          onCopy={handleCopy}
        />

        {/* Modal Domain Config */}
        <TenantDomainModal
          organization={selectedOrgForDomain}
          isOpen={!!selectedOrgForDomain}
          onClose={() => setSelectedOrgForDomain(null)}
          onSaveDomain={async () => {
            refresh();
          }}
        />

        {/* DNS Diagnostics Modal */}
        <DnsDiagnosticsModal
          open={diagnosticsOpen}
          onOpenChange={setDiagnosticsOpen}
          diagnosingDomain={diagnosingDomain}
          diagnosticsOutput={diagnosticsOutput}
          runningDiag={runningDiag}
        />
      </div>
    </OrganizationPageWrapper>
  );
}
