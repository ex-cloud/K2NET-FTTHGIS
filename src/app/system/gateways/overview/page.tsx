"use client";

import { useEffect, useState } from "react";
import { getGatewayStatus, GatewayServiceStatus } from "@/lib/actions/gateways";
import { 
  Cpu, 
  RefreshCw, 
  Activity, 
  Zap, 
  Database, 
  HardDrive, 
  ArrowRight,
  Sparkles,
  ServerCrash
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

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
    } catch (err: any) {
      console.error(err);
      toast.error("Gagal mengambil status gateway: " + err.message);
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

  // Mock metrics based on gateway type
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
      default:
        return { throughput: "-", latency: "-", extra: "-" };
    }
  };

  return (
    <div className="flex-1 flex flex-col pt-16 px-8 bg-[#080808] h-full overflow-y-auto">
      <div className="w-full max-w-5xl mx-auto space-y-12 pb-20">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5">
                System Integration
              </Badge>
            </div>
            <h1 className="text-3xl font-light text-zinc-100 tracking-tight flex items-center gap-3">
              Gateways Control Panel <Sparkles className="w-5 h-5 text-emerald-500 animate-pulse" />
            </h1>
            <p className="text-xs text-zinc-500">
              Oversight and dynamic microservice orchestration for payment, messaging, maps, and WebP storage.
            </p>
          </div>
          
          <Button 
            onClick={() => fetchStatus(true)} 
            disabled={refreshing || loading}
            variant="outline"
            className="border-white/10 hover:border-emerald-500/30 bg-zinc-950/80 hover:bg-zinc-900 text-zinc-300 hover:text-zinc-100 text-xs gap-2 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-emerald-500" : ""}`} />
            Refresh Status
          </Button>
        </div>

        {loading ? (
          /* Loading Skeleton */
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-28 rounded-xl border border-white/5 bg-zinc-950/20 animate-pulse" />
              ))}
            </div>
            <div className="h-96 rounded-xl border border-white/5 bg-zinc-950/20 animate-pulse" />
          </div>
        ) : (
          <>
            {/* Top Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Card 1: Global Health */}
              <Card className="bg-[#0b0b0b]/60 border-white/5 backdrop-blur-md shadow-xl hover:border-emerald-500/20 transition-all group duration-300">
                <CardHeader className="pb-2">
                  <CardDescription className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">Service Health</CardDescription>
                  <CardTitle className="text-2xl font-light text-zinc-200 mt-1 flex items-baseline gap-2">
                    {activeServicesCount} <span className="text-xs text-zinc-500">/ {totalServices} Online</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${allActive ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-amber-500 animate-pulse"}`} />
                    <span className="text-[10px] text-zinc-400 font-medium">
                      {allActive ? "Semua Gateway Berjalan" : "Ada layanan terhenti"}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Card 2: Avg Latency */}
              <Card className="bg-[#0b0b0b]/60 border-white/5 backdrop-blur-md shadow-xl hover:border-emerald-500/20 transition-all group duration-300">
                <CardHeader className="pb-2">
                  <CardDescription className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">Avg Latency</CardDescription>
                  <CardTitle className="text-2xl font-light text-zinc-200 mt-1 flex items-baseline gap-2">
                    42 <span className="text-xs text-zinc-500">ms</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="flex items-center gap-1.5 text-[10px] text-emerald-400">
                    <Activity className="w-3 h-3 text-emerald-500" />
                    <span>Performa sangat stabil (Optimal)</span>
                  </div>
                </CardContent>
              </Card>

              {/* Card 3: Cache Hit Ratio */}
              <Card className="bg-[#0b0b0b]/60 border-white/5 backdrop-blur-md shadow-xl hover:border-emerald-500/20 transition-all group duration-300">
                <CardHeader className="pb-2">
                  <CardDescription className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">Cache Efficiency</CardDescription>
                  <CardTitle className="text-2xl font-light text-zinc-200 mt-1 flex items-baseline gap-2">
                    94.2 <span className="text-xs text-zinc-500">%</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
                    <Database className="w-3 h-3 text-zinc-500" />
                    <span>Geocoding Cache Redis Aktif</span>
                  </div>
                </CardContent>
              </Card>

              {/* Card 4: Compression Rate */}
              <Card className="bg-[#0b0b0b]/60 border-white/5 backdrop-blur-md shadow-xl hover:border-emerald-500/20 transition-all group duration-300">
                <CardHeader className="pb-2">
                  <CardDescription className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">Storage Optimization</CardDescription>
                  <CardTitle className="text-2xl font-light text-zinc-200 mt-1 flex items-baseline gap-2">
                    68.5 <span className="text-xs text-zinc-500">% Saved</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="flex items-center gap-1.5 text-[10px] text-emerald-400">
                    <HardDrive className="w-3 h-3 text-emerald-500" />
                    <span>Kompresi otomatis WebP</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sparkline chart visual simulation */}
            <Card className="bg-[#0b0b0b]/40 border-white/5 backdrop-blur-md p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h4 className="text-sm font-semibold text-zinc-200">Throughput & Gateway Load</h4>
                  <p className="text-[10px] text-zinc-500">Visualisasi beban request gabungan ke seluruh port gateway (5001 - 5004)</p>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500/80" />
                    <span className="text-zinc-400">Successful Hits</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-sm bg-amber-500/40" />
                    <span className="text-zinc-400">Cached / Delayed</span>
                  </div>
                </div>
              </div>
              
              {/* Synthetic CSS/SVG Graph */}
              <div className="h-28 w-full flex items-end gap-1.5 px-2 relative border-b border-white/5 pb-2">
                {/* Visualizing 24 bars for 24h load */}
                {[
                  30, 45, 35, 60, 80, 50, 40, 70, 95, 110, 
                  85, 65, 45, 55, 75, 100, 120, 105, 90, 80, 
                  95, 110, 130, 125
                ].map((val, idx) => (
                  <div key={idx} className="flex-1 flex flex-col justify-end h-full group/bar relative">
                    <div 
                      style={{ height: `${(val / 140) * 100}%` }} 
                      className="w-full bg-gradient-to-t from-emerald-500/30 to-emerald-500/70 hover:to-emerald-400 rounded-t transition-all duration-300"
                    />
                    {/* Tooltip on Hover */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-zinc-950 border border-white/10 rounded px-1.5 py-0.5 text-[9px] text-zinc-200 opacity-0 pointer-events-none group-hover/bar:opacity-100 transition-opacity whitespace-nowrap z-20 font-mono">
                      Hour {idx}: {val} reqs
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-[9px] text-zinc-500 font-mono mt-2 px-1">
                <span>24 Jam Lalu</span>
                <span>12 Jam Lalu</span>
                <span>Sekarang (Real-Time)</span>
              </div>
            </Card>

            {/* Gateway Services List */}
            <div className="space-y-4">
              <h2 className="text-lg font-light text-zinc-200 tracking-tight">Active Gateway Services</h2>
              <div className="grid grid-cols-1 gap-4">
                {services.map((svc) => {
                  const nameClean = svc.name.replace("ftth-", "").replace("-gateway", "");
                  const metrics = getServiceMetrics(svc.name);
                  
                  return (
                    <div 
                      key={svc.name} 
                      className="bg-[#0b0b0b]/60 border border-white/5 rounded-xl p-5 hover:border-white/10 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
                    >
                      {/* Name & Status */}
                      <div className="flex items-center gap-4 min-w-[250px]">
                        <div className={`w-10 h-10 rounded-lg bg-zinc-900 border border-white/5 flex items-center justify-center text-zinc-400 group`}>
                          <Cpu className={`w-5 h-5 transition-colors ${svc.active ? "text-emerald-500" : "text-zinc-600"}`} />
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-zinc-200 capitalize">{nameClean} Gateway</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-zinc-500 font-mono">Port {svc.port}</span>
                            <span className="text-zinc-700">•</span>
                            <div className="flex items-center gap-1.5">
                              <span className={`w-1.5 h-1.5 rounded-full ${svc.active ? "bg-emerald-500" : "bg-red-500"}`} />
                              <span className="text-[10px] text-zinc-400 capitalize">{svc.status}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Performance Details */}
                      <div className="grid grid-cols-3 gap-6 flex-1 max-w-md">
                        <div>
                          <p className="text-[9px] text-zinc-500 uppercase tracking-wider font-bold">Throughput</p>
                          <p className="text-xs font-mono text-zinc-300 mt-0.5">{svc.active ? metrics.throughput : "-"}</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-zinc-500 uppercase tracking-wider font-bold">Latency</p>
                          <p className="text-xs font-mono text-zinc-300 mt-0.5">{svc.active ? metrics.latency : "-"}</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-zinc-500 uppercase tracking-wider font-bold">Telemetry State</p>
                          <p className="text-xs text-zinc-400 truncate mt-0.5">{svc.active ? metrics.extra : "Offline"}</p>
                        </div>
                      </div>

                      {/* Config Button */}
                      <div className="flex items-center justify-end">
                        <Link href={`/gateways/${nameClean}`}>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-zinc-400 hover:text-emerald-500 hover:bg-emerald-500/5 group text-xs gap-1.5 transition-all"
                          >
                            Configure
                            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Troubleshooting Alert */}
            {!allActive && (
              <div className="border border-red-500/20 bg-red-500/5 rounded-xl p-4 flex items-start gap-3">
                <ServerCrash className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs font-semibold text-red-400">Troubleshooting Alert</h4>
                  <p className="text-[10px] text-zinc-400">
                    Salah satu atau lebih layanan gateway terhenti. Mohon periksa log systemd via SSH dengan perintah: <code className="bg-zinc-950 px-1 py-0.5 rounded font-mono text-red-300 text-[9px]">journalctl -u ftth-[service-name] -f</code> untuk memeriksa penyebab error.
                  </p>
                </div>
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
}
