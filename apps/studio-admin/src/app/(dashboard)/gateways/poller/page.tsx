"use client";

import { useEffect, useState } from "react";
import { getGatewayConfigByKey, updateGatewayConfigByKey, getPollerDeviceStatus, PollerDeviceStatus } from "@/lib/actions/gateways";
import { 
  Activity, 
  Save, 
  Loader2, 
  Server
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@k2net/ui";
import { Button } from "@k2net/ui";
import { Input } from "@k2net/ui";
import { Label } from "@k2net/ui";
import { toast } from "sonner";
import { Badge } from "@k2net/ui";
import { GatewayPageWrapper } from "@/components/page-guards/gateway-page-wrapper";

import { z } from "zod";

const pollerSchema = z.object({
  PORT: z.coerce.number().int("Port harus berupa angka bulat").min(1, "Minimal port 1").max(65535, "Maksimal port 65535"),
  REDIS_ADDR: z.string().regex(/^[^:]+:\d+$/, "Format Redis Address harus host:port (contoh: redis:6379)"),
  DATABASE_URL: z.string().url("Format URL database tidak valid").startsWith("postgres://", "Database harus berupa URL PostgreSQL (postgres://)")
});

function formatRelativeTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Baru saja";
  if (diffMins < 60) return `${diffMins} mnt lalu`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} jam lalu`;
  return date.toLocaleDateString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function PollerGatewayPage() {
  const [config, setConfig] = useState<Record<string, string>>({});
  const [censored, setCensored] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pollerDevices, setPollerDevices] = useState<PollerDeviceStatus[]>([]);
  const [devicesLoading, setDevicesLoading] = useState(true);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const data = await getGatewayConfigByKey("poller");
      if (data.status === "ok") {
        const flatConfig: Record<string, string> = {};
        const flatCensored: Record<string, string> = {};
        
        Object.values(data.sections).forEach((entries) => {
          entries.forEach((e) => {
            flatConfig[e.key] = e.censored;
            flatCensored[e.key] = e.censored;
          });
        });
        
        setConfig(flatConfig);
        setCensored(flatCensored);
      }
    } catch (err) {
      console.error(err);
      toast.error("Gagal memuat konfigurasi: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  const fetchPollerDevices = async () => {
    try {
      setDevicesLoading(true);
      const data = await getPollerDeviceStatus();
      setPollerDevices(data);
    } catch (err) {
      console.error("Gagal memuat poller device status:", err);
    } finally {
      setDevicesLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
    fetchPollerDevices();
  }, []);

  const handleInputChange = (key: string, value: string) => {
    setConfig((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const updates: Record<string, string> = {};
    const validationData: Record<string, any> = {};
    const keysToUpdate = [
      "PORT",
      "REDIS_ADDR",
      "DATABASE_URL"
    ];

    keysToUpdate.forEach(k => {
      const currentValue = config[k] || "";
      const censoredValue = censored[k] || "";
      
      if (currentValue !== censoredValue && !currentValue.includes("••")) {
        updates[k] = currentValue;
        validationData[k] = currentValue;
      }
    });

    if (Object.keys(updates).length === 0) {
      toast.info("Tidak ada perubahan konfigurasi yang terdeteksi.");
      return;
    }

    // Run partial validation using Zod
    try {
      const partialSchema = pollerSchema.partial();
      partialSchema.parse(validationData);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(`Validasi Gagal: ${err.issues[0].message}`);
      } else {
        toast.error("Terjadi kesalahan validasi.");
      }
      return;
    }

    setSaving(true);
    try {
      const res = await updateGatewayConfigByKey("poller", updates);
      toast.success(res.message || "Konfigurasi Poller Gateway berhasil disimpan!");
      
      setTimeout(() => {
        fetchConfig();
      }, 3000);

    } catch (err) {
      console.error(err);
      toast.error("Gagal menyimpan konfigurasi: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSaving(false);
    }
  };

  // Poller devices loaded dynamically from getPollerDeviceStatus()

  return (
    <GatewayPageWrapper>
    <div className="flex-1 flex flex-col pt-16 px-4 md:px-8 bg-background h-full overflow-y-auto">
      <div className="w-full max-w-5xl mx-auto space-y-8 pb-20">
        
        <div className="flex items-center gap-4 border-b border-border pb-6">
          <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-light text-foreground tracking-tight">
              Poller Gateway
            </h1>
            <p className="text-xs text-muted-foreground">
              Konfigurasi service poller monitoring status port OLT secara real-time dan update cache status database.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-xs text-muted-foreground">Memuat konfigurasi poller gateway...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            <form onSubmit={handleSave} className="lg:col-span-2 space-y-6">
              
              <Card className="bg-card/60 border-border shadow-xl">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Server className="w-4 h-4 text-primary" /> Connection & Core Settings
                  </CardTitle>
                  <CardDescription className="text-[10px] text-muted-foreground">
                    Koneksi database PostgreSQL, Redis caching, dan konfigurasi port service.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="PORT" className="text-xs text-muted-foreground">Service Port</Label>
                    <Input
                      id="PORT"
                      type="text"
                      value={config.PORT || ""}
                      onChange={(e) => handleInputChange("PORT", e.target.value)}
                      placeholder="5010"
                      className="bg-input border-border text-foreground text-xs focus:border-primary/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="REDIS_ADDR" className="text-xs text-muted-foreground">Redis Address</Label>
                    <Input
                      id="REDIS_ADDR"
                      type="text"
                      value={config.REDIS_ADDR || ""}
                      onChange={(e) => handleInputChange("REDIS_ADDR", e.target.value)}
                      placeholder="redis:6379"
                      className="bg-input border-border text-foreground text-xs focus:border-primary/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="DATABASE_URL" className="text-xs text-muted-foreground">Database Connection URL</Label>
                    <Input
                      id="DATABASE_URL"
                      type="text"
                      value={config.DATABASE_URL || ""}
                      onChange={(e) => handleInputChange("DATABASE_URL", e.target.value)}
                      placeholder="postgres://..."
                      className="bg-input border-border text-foreground text-xs focus:border-primary/50"
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="flex items-center justify-end gap-3">
                <Button 
                  type="button" 
                  onClick={fetchConfig} 
                  variant="outline"
                  className="border-border bg-transparent text-muted-foreground hover:text-foreground hover:bg-accent text-xs h-9 px-4"
                >
                  Reset Form
                </Button>
                <Button 
                  type="submit" 
                  disabled={saving}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs h-9 px-5 flex items-center gap-1.5"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Save Configuration
                </Button>
              </div>

            </form>

            <div className="space-y-6">
              <Card className="bg-card border-border shadow-xl">
                <CardHeader>
                  <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                    Device Status Live
                    {devicesLoading && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {devicesLoading ? (
                    <div className="space-y-3">
                      {[1,2,3].map(i => (
                        <div key={i} className="h-10 bg-muted/40 rounded animate-pulse" />
                      ))}
                    </div>
                  ) : pollerDevices.length === 0 ? (
                    <p className="text-[10px] text-muted-foreground/60 text-center py-4">Belum ada device status tercatat.</p>
                  ) : (
                    pollerDevices.map((dev) => (
                      <div key={dev.deviceCode} className="border-b border-border pb-3 last:border-b-0 last:pb-0 space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-medium text-foreground">{dev.name || dev.host}</span>
                          <Badge className={`text-[9px] px-1.5 py-0.5 border ${
                            dev.status === "up"
                              ? "bg-primary/10 text-primary border-primary/20"
                              : dev.status === "down"
                              ? "bg-red-500/10 text-red-500 border-red-500/20"
                              : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          }`}>
                            {dev.status}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center text-[9px] text-muted-foreground font-mono">
                          <span>{dev.host} · {dev.responseTimeMs}ms</span>
                          <span>{formatRelativeTime(dev.lastPolledAt)}</span>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card className="bg-card border-border shadow-xl">
                <CardHeader>
                  <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Poller Engine Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-border">
                    <span className="text-muted-foreground">Active Devices</span>
                    <Badge className="bg-primary/10 text-primary border-primary/20 text-[9px]">
                      {devicesLoading ? "..." : pollerDevices.filter(d => d.status === "up").length}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-border">
                    <span className="text-muted-foreground">Down Devices</span>
                    <Badge className={`text-[9px] ${
                      !devicesLoading && pollerDevices.filter(d => d.status === "down").length > 0
                        ? "bg-red-500/10 text-red-500 border-red-500/20"
                        : "bg-muted/10 text-muted-foreground border-border"
                    }`}>
                      {devicesLoading ? "..." : pollerDevices.filter(d => d.status === "down").length}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Avg Response</span>
                    <Badge className="bg-muted/10 text-muted-foreground border-border text-[9px]">
                      {devicesLoading || pollerDevices.length === 0 ? "..." :
                        `${Math.round(pollerDevices.reduce((s, d) => s + d.responseTimeMs, 0) / pollerDevices.length)}ms`}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

          </div>
        )}

      </div>
    </div>
    </GatewayPageWrapper>
  );
}
