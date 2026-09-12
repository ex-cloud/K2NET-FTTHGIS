import { TablePageSkeleton } from "@k2net/ui";
import { OrganizationPageWrapper } from "@/components/page-guards/organization-page-wrapper";
import { useVpnState } from "@/components/organizations/vpn/useVpnState";
import { VpnHeader } from "@/components/organizations/vpn/VpnHeader";
import { VpnKpiCards } from "@/components/organizations/vpn/VpnKpiCards";
import { VpnTable } from "@/components/organizations/vpn/VpnTable";
import { VpnSubnetRoutesModal } from "@/components/organizations/vpn/VpnSubnetRoutesModal";

export default function OrganizationVpnPage() {
  const {
    router,
    loading,
    refresh,
    searchQuery,
    setSearchQuery,
    selectedTunnelForSubnet,
    setSelectedTunnelForSubnet,
    testingTunnelId,
    tunnels,
    filteredTunnels,
    handleCopy,
    handlePingTest,
    handleDownloadConf,
  } = useVpnState();

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
        <VpnHeader onRefresh={refresh} />

        <VpnKpiCards tunnels={tunnels} />

        <VpnTable
          filteredTunnels={filteredTunnels}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          testingTunnelId={testingTunnelId}
          onNavigateNetwork={(slug) => router.push(`/organizations/${slug}?tab=network`)}
          onPingTest={handlePingTest}
          onSelectSubnet={(tunnel) => setSelectedTunnelForSubnet(tunnel)}
          onDownloadConf={handleDownloadConf}
          onCopy={handleCopy}
        />

        <VpnSubnetRoutesModal
          selectedTunnel={selectedTunnelForSubnet}
          onClose={() => setSelectedTunnelForSubnet(null)}
          onDownloadConf={handleDownloadConf}
        />
      </div>
    </OrganizationPageWrapper>
  );
}
