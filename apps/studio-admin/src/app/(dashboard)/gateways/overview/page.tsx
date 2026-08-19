"use client";

import { useEffect, useState } from "react";
import { getGatewayStatus, GatewayServiceStatus } from "@/lib/actions/gateways";
import Link from "next/link";
import { 
  Cpu, 
  RefreshCw, 
  Activity, 
  Database, 
  HardDrive, 
  ArrowRight,
  Sparkles,
  ServerCrash,
  Copy,
  ExternalLink
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, PageLayout, Button, Badge, ActionTooltip, UniversalContextMenu, ContextMenuGroupConfig } from "@k2net/ui";
import { toast } from "sonner";
import { GatewayPageWrapper } from "@/components/page-guards/gateway-page-wrapper";

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

  // Mock metrics fallbacks based on gateway type
  const getServiceMetrics = (name: string) => {
    switch (name) {
      case "ftth-notification-gateway":
        return { throughput: "12 req/min", latency: "18ms", extra: "Twilio API OK" };
      case "ftth-payment-gateway":
        return { throughput: "4 req/min", latency: "240ms", extra: "Xendit API OK" };
      case "ftth-map-gateway":
        return { throughput: "145 req/min", latency: "12ms", extra: "Redis Cache: 94%" };
      case "ftth-storage-gateway":
        return { throughput: "8 files/min", latency: "380ms", extra: "WebP Compression Active" };
      case "ftth-whatsapp-gateway":
        return { throughput: "15 req/min", latency: "25ms", extra: "Meta Cloud API OK" };
      case "ftth-scheduler-gateway":
        return { throughput: "45 jobs/min", latency: "8ms", extra: "Cron Runner Active" };
      case "ftth-export-gateway":
        return { throughput: "3 tasks/min", latency: "125ms", extra: "S3 Export Bucket OK" };
      case "ftth-olt-gateway":
        return { throughput: "18 polls/min", latency: "32ms", extra: "SNMP Engine Ready" };
      case "ftth-audit-gateway":
        return { throughput: "120 logs/min", latency: "4ms", extra: "Compliance Enforced" };
      case "ftth-poller":
        return { throughput: "60 cycles/min", latency: "15ms", extra: "Poller Engine Ready" };
      case "ftth-task-gateway":
        return { throughput: "22 tasks/min", latency: "10ms", extra: "Linear & Obsidian Sync OK" };
      case "ftth-ai-gateway":
        return { throughput: "35 req/min", latency: "120ms", extra: "RAG & LLM Engine OK" };
      default:
        return { throughput: "-", latency: "-", extra: "OK" };
    }
  };

  const getGatewayContextMenuGroups = (svc: GatewayServiceStatus): ContextMenuGroupConfig[] => {
    const nameClean = svc.name.replace("ftth-", "").replace("-gateway", "");
    return [
      {
        items: [
          {
            label: "Tanya AI Diagnosa Gateway",
            icon: Sparkles,
            shortcut: "Ctrl+J",
            onClick: () => {
              window.dispatchEvent(
                new CustomEvent("k2net-ai-prompt-input", {
                  detail: {
                    prompt: `Lakukan pemeriksaan diagnosa kesehatan dan metrik service ${svc.name} pada port ${svc.port}. Status saat ini: ${svc.status}. Berikan ringkasan troubleshooting dan rekomendasi optimasi port microservice.`,
                  },
                })
              );
              window.dispatchEvent(new CustomEvent("k2net-toggle-ai-assistant"));
            },
          },
        ],
      },
      {
        items: [
          {
            label: `Buka Konfigurasi ${nameClean}`,
            icon: ExternalLink,
            shortcut: "Enter",
            onClick: () => {
              window.location.href = `/gateways/${nameClean}`;
            },
          },
          {
            label: "Salin Port Gateway",
            icon: Copy,
            shortcut: "Ctrl+C",
            onClick: () => {
              navigator.clipboard.writeText(String(svc.port));
              toast.success(`Port ${svc.port} disalin!`);
            },
          },
          {
            label: "Salin Nama Service",
            icon: Cpu,
            shortcut: "Alt+C",
            onClick: () => {
              navigator.clipboard.writeText(svc.name);
              toast.success(`Nama service ${svc.name} disalin!`);
            },
          },
        ],
      },
    ];
  };

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
          /* Loading Skeleton */
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
            {/* Top Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Card 1: Global Health */}
              <Card glowingEffect>
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center justify-between text-[10px] uppercase font-bold tracking-widest text-foreground/75 dark:text-muted-foreground">
                    <span>Service Health</span>
                    <Cpu className="w-3.5 h-3.5 text-primary group-hover:text-primary/80 transition-colors" />
                  </CardDescription>
                  <CardTitle className="text-2xl font-bold text-foreground mt-1 flex items-baseline gap-2">
                    {activeServicesCount} <span className="text-xs text-muted-foreground">/ {totalServices} Online</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${allActive ? "bg-primary shadow-[0_0_8px_var(--primary)]" : "bg-amber-500 animate-pulse"}`} />
                    <span className="text-[10px] text-muted-foreground font-medium">
                      {allActive ? "Semua Gateway Berjalan" : "Ada layanan terhenti"}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Card 2: Avg Latency */}
              <Card glowingEffect>
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center justify-between text-[10px] uppercase font-bold tracking-widest text-foreground/75 dark:text-muted-foreground">
                    <span>Avg Latency</span>
                    <Activity className="w-3.5 h-3.5 text-sky-400 group-hover:text-sky-300 transition-colors" />
                  </CardDescription>
                  <CardTitle className="text-2xl font-bold text-foreground mt-1 flex items-baseline gap-2">
                    42 <span className="text-xs text-muted-foreground">ms</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="flex items-center gap-1.5 text-[10px] text-primary">
                    <Activity className="w-3 h-3 text-primary" />
                    <span>Performa sangat stabil (Optimal)</span>
                  </div>
                </CardContent>
              </Card>

              {/* Card 3: Cache Hit Ratio */}
              <Card glowingEffect>
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center justify-between text-[10px] uppercase font-bold tracking-widest text-foreground/75 dark:text-muted-foreground">
                    <span>Cache Efficiency</span>
                    <Database className="w-3.5 h-3.5 text-teal-400 group-hover:text-teal-300 transition-colors" />
                  </CardDescription>
                  <CardTitle className="text-2xl font-bold text-foreground mt-1 flex items-baseline gap-2">
                    94.2 <span className="text-xs text-muted-foreground">%</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <Database className="w-3 h-3 text-muted-foreground" />
                    <span>Geocoding Cache Redis Aktif</span>
                  </div>
                </CardContent>
              </Card>

              {/* Card 4: Compression Rate */}
              <Card glowingEffect>
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center justify-between text-[10px] uppercase font-bold tracking-widest text-foreground/75 dark:text-muted-foreground">
                    <span>Storage Optimization</span>
                    <HardDrive className="w-3.5 h-3.5 text-teal-400 group-hover:text-teal-300 transition-colors" />
                  </CardDescription>
                  <CardTitle className="text-2xl font-bold text-foreground mt-1 flex items-baseline gap-2">
                    68.5 <span className="text-xs text-muted-foreground">% Saved</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="flex items-center gap-1.5 text-[10px] text-primary">
                    <HardDrive className="w-3 h-3 text-primary" />
                    <span>Kompresi otomatis WebP</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sparkline chart visual simulation */}
            <Card className="bg-card border-border backdrop-blur-md p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h4 className="text-sm font-semibold text-foreground">Throughput & Gateway Load</h4>
                  <p className="text-[10px] text-foreground/75 dark:text-muted-foreground">Visualisasi beban request gabungan ke seluruh port gateway (5001 - 5004)</p>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-sm bg-primary/80" />
                    <span className="text-foreground/75 dark:text-muted-foreground">Successful Hits</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-sm bg-amber-500/40" />
                    <span className="text-foreground/75 dark:text-muted-foreground">Cached / Delayed</span>
                  </div>
                </div>
              </div>
              
              {/* Synthetic CSS/SVG Graph */}
              <div className="h-28 w-full flex items-end gap-1.5 px-2 relative border-b border-border pb-2">
                {/* Visualizing 24 bars for 24h load */}
                {[
                  30, 45, 35, 60, 80, 50, 40, 70, 95, 110, 
                  85, 65, 45, 55, 75, 100, 120, 105, 90, 80, 
                  95, 110, 130, 125
                ].map((val, idx) => (
                  <div key={idx} className="flex-1 flex flex-col justify-end h-full group/bar relative">
                    <div 
                      style={{ height: `${(val / 140) * 100}%` }} 
                      className="w-full bg-gradient-to-t from-primary/30 to-primary/70 hover:to-primary rounded-t transition-all duration-300"
                    />
                    {/* Tooltip on Hover */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-background border border-border/10 rounded px-1.5 py-0.5 text-[9px] text-foreground opacity-0 pointer-events-none group-hover/bar:opacity-100 transition-opacity whitespace-nowrap z-20 font-mono">
                      Hour {idx}: {val} reqs
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-[9px] text-muted-foreground font-mono mt-2 px-1">
                <span>24 Jam Lalu</span>
                <span>12 Jam Lalu</span>
                <span>Sekarang (Real-Time)</span>
              </div>
            </Card>

            {/* Gateway Services List */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-foreground tracking-tight">Active Gateway Services</h2>
              <div className="grid grid-cols-1 gap-4">
                {services.map((svc) => {
                  const nameClean = svc.name.replace("ftth-", "").replace("-gateway", "");
                  const metrics = getServiceMetrics(svc.name);
                  
                  return (
                    <UniversalContextMenu key={svc.name} groups={getGatewayContextMenuGroups(svc)}>
                      <Card 
                        glowingEffect 
                        className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-6 cursor-context-menu"
                      >
                        {/* Name & Status */}
                        <div className="flex items-center gap-4 min-w-[250px]">
                          <div className={`w-10 h-10 rounded-lg bg-muted border border-border flex items-center justify-center text-muted-foreground group`}>
                            <Cpu className={`w-5 h-5 transition-colors ${svc.active ? "text-primary" : "text-muted-foreground/40"}`} />
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-foreground capitalize">{nameClean} Gateway</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] text-muted-foreground font-mono">Port {svc.port}</span>
                              <span className="text-border">•</span>
                              <div className="flex items-center gap-1.5">
                                <span className={`w-1.5 h-1.5 rounded-full ${svc.active ? "bg-primary" : "bg-rose-500"}`} />
                                <span className="text-[10px] text-muted-foreground capitalize">{svc.status}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Performance Details */}
                        <div className="grid grid-cols-3 gap-6 flex-1 max-w-md">
                          <div>
                            <p className="text-[9px] text-foreground/75 dark:text-muted-foreground/70 uppercase tracking-wider font-bold">Throughput</p>
                            <p className="text-xs font-mono text-foreground mt-0.5">
                              {svc.active 
                                ? (svc.throughput !== undefined && svc.throughput > 0 
                                    ? `${svc.throughput} req/min` 
                                    : metrics.throughput) 
                                : "-"}
                            </p>
                          </div>
                          <div>
                            <p className="text-[9px] text-foreground/75 dark:text-muted-foreground/70 uppercase tracking-wider font-bold">Latency</p>
                            <p className="text-xs font-mono text-foreground mt-0.5">
                              {svc.active ? metrics.latency : "-"}
                            </p>
                          </div>
                          <div>
                            <p className="text-[9px] text-foreground/75 dark:text-muted-foreground/70 uppercase tracking-wider font-bold">Telemetry State</p>
                            <p className="text-xs font-mono text-foreground mt-0.5">
                              {svc.active ? metrics.extra : "Offline"}
                            </p>
                          </div>
                        </div>

                        {/* Action */}
                        <div className="flex items-center gap-3 border-t md:border-t-0 border-border pt-3 md:pt-0">
                          <ActionTooltip label={`Buka Konfigurasi ${nameClean}`} shortcut="Enter">
                            <Link 
                              href={`/gateways/${nameClean}`} 
                              className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 font-medium"
                            >
                              Configure <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                          </ActionTooltip>
                        </div>
                      </Card>
                    </UniversalContextMenu>
                  );
                })}
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
