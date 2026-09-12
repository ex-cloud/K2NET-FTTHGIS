import { useEffect, useState } from "react";
import { getGatewayStatus, type GatewayServiceStatus } from "@/lib/actions/gateways";
import { RefreshCw, Sparkles, ServerCrash } from "lucide-react";
import { PageLayout, Button, Badge, ActionTooltip } from "@k2net/ui";
import { toast } from "sonner";
import { GatewayPageWrapper } from "@/components/page-guards/gateway-page-wrapper";
import { GatewayOverviewKpiCards } from "@/components/gateways/overview/GatewayOverviewKpiCards";
import { GatewayThroughputChart } from "@/components/gateways/overview/GatewayThroughputChart";
import { GatewayServiceCard } from "@/components/gateways/overview/GatewayServiceCard";

export default function GatewaysOverviewPage() {
  const [services, setServices] = useState<GatewayServiceStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStatus = async (showToast = false) => {
    try {
      if (showToast) setRefreshing(true);
      const data = await getGatewayStatus();
      if (data.status === "ok") {
        setServices(data.services);
        if (showToast) {
          toast.success("Status gateway berhasil diperbarui!");
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Gagal mengambil status gateway: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const totalServices = services.length;
  const activeServicesCount = services.filter(s => s.active).length;
  const allActive = activeServicesCount === totalServices && totalServices > 0;

  return (
    <GatewayPageWrapper>
      <PageLayout>
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5">
                System Integration
              </Badge>
            </div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight flex items-center gap-3">
              Gateways Control Panel <Sparkles className="w-5 h-5 text-primary animate-pulse" />
            </h1>
            <p className="text-xs text-foreground/75 dark:text-muted-foreground">
              Oversight and dynamic microservice orchestration for payment, messaging, maps, and WebP storage.
            </p>
          </div>
          
          <ActionTooltip label="Muat Ulang Status Gateway" shortcut="R">
            <Button 
              onClick={() => fetchStatus(true)} 
              disabled={refreshing || loading}
              variant="outline"
              className="border-border/10 hover:border-primary/30 bg-background/80 hover:bg-muted text-muted-foreground hover:text-foreground text-xs gap-2 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-primary" : ""}`} />
              Refresh Status
            </Button>
          </ActionTooltip>
        </div>

        {loading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-28 rounded-xl border border-border bg-background/20 animate-pulse" />
              ))}
            </div>
            <div className="h-96 rounded-xl border border-border bg-background/20 animate-pulse" />
          </div>
        ) : (
          <>
            <GatewayOverviewKpiCards
              activeServicesCount={activeServicesCount}
              totalServices={totalServices}
              allActive={allActive}
            />

            <GatewayThroughputChart />

            {/* Gateway Services List */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-foreground tracking-tight">Active Gateway Services</h2>
              <div className="grid grid-cols-1 gap-4">
                {services.map((svc) => (
                  <GatewayServiceCard key={svc.name} service={svc} />
                ))}
              </div>
            </div>
            
            {/* Troubleshooting Alert */}
            {!allActive && (
              <div className="border border-rose-500/20 bg-rose-500/5 rounded-xl p-4 flex items-start gap-3">
                <ServerCrash className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs font-semibold text-rose-400">Troubleshooting Alert</h4>
                  <p className="text-[10px] text-foreground/75 dark:text-muted-foreground/80">
                    Salah satu atau lebih layanan gateway terhenti. Mohon periksa log systemd via SSH dengan perintah: <code className="bg-background px-1 py-0.5 rounded font-mono text-rose-300 text-[9px]">journalctl -u ftth-[service-name] -f</code> untuk memeriksa penyebab error.
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </PageLayout>
    </GatewayPageWrapper>
  );
}
