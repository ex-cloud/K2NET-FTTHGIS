"use client";

import { useEffect, useState } from "react";
import { getGatewayConfigByKey, updateGatewayConfigByKey } from "@/lib/actions/gateways";
import { 
  Activity, 
  Save, 
  Loader2, 
  Server
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { GatewayPageWrapper } from "@/components/page-guards/gateway-page-wrapper";

export default function PollerGatewayPage() {
  const [config, setConfig] = useState<Record<string, string>>({});
  const [censored, setCensored] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleInputChange = (key: string, value: string) => {
    setConfig((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const updates: Record<string, string> = {};
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
        }
      });

      if (Object.keys(updates).length === 0) {
        toast.info("Tidak ada perubahan konfigurasi yang terdeteksi.");
        setSaving(false);
        return;
      }

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

  const mockPollerStats = [
    { id: 1, metric: "Active OLT Polls", value: "2 devices" },
    { id: 2, metric: "Last Poll Cycle Duration", value: "1.4s" },
    { id: 3, metric: "Polling Errors (24h)", value: "0" },
  ];

  return (
    <GatewayPageWrapper>
    <div className="flex-1 flex flex-col pt-16 px-8 bg-[#080808] h-full overflow-y-auto">
      <div className="w-full max-w-5xl mx-auto space-y-8 pb-20">
        
        <div className="flex items-center gap-4 border-b border-white/5 pb-6">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-light text-zinc-100 tracking-tight">
              Poller Gateway
            </h1>
            <p className="text-xs text-zinc-500">
              Konfigurasi service poller monitoring status port OLT secara real-time dan update cache status database.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
            <p className="text-xs text-zinc-500">Memuat konfigurasi poller gateway...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            <form onSubmit={handleSave} className="lg:col-span-2 space-y-6">
              
              <Card className="bg-[#0b0b0b]/60 border-white/5 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                    <Server className="w-4 h-4 text-emerald-500" /> Connection & Core Settings
                  </CardTitle>
                  <CardDescription className="text-[10px] text-zinc-500">
                    Koneksi database PostgreSQL, Redis caching, dan konfigurasi port service.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="PORT" className="text-xs text-zinc-400">Service Port</Label>
                    <Input
                      id="PORT"
                      type="text"
                      value={config.PORT || ""}
                      onChange={(e) => handleInputChange("PORT", e.target.value)}
                      placeholder="5010"
                      className="bg-zinc-950/80 border-white/10 text-xs focus:border-emerald-500/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="REDIS_ADDR" className="text-xs text-zinc-400">Redis Address</Label>
                    <Input
                      id="REDIS_ADDR"
                      type="text"
                      value={config.REDIS_ADDR || ""}
                      onChange={(e) => handleInputChange("REDIS_ADDR", e.target.value)}
                      placeholder="redis:6379"
                      className="bg-zinc-950/80 border-white/10 text-xs focus:border-emerald-500/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="DATABASE_URL" className="text-xs text-zinc-400">Database Connection URL</Label>
                    <Input
                      id="DATABASE_URL"
                      type="password"
                      value={config.DATABASE_URL || ""}
                      onChange={(e) => handleInputChange("DATABASE_URL", e.target.value)}
                      placeholder="postgres://..."
                      className="bg-zinc-950/80 border-white/10 text-xs focus:border-emerald-500/50"
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="flex items-center justify-end gap-3">
                <Button 
                  type="button" 
                  onClick={fetchConfig} 
                  variant="outline"
                  className="border-white/10 bg-transparent text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 text-xs h-9 px-4"
                >
                  Reset Form
                </Button>
                <Button 
                  type="submit" 
                  disabled={saving}
                  className="bg-emerald-500 hover:bg-emerald-600 text-black font-semibold text-xs h-9 px-5 flex items-center gap-1.5"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Save Configuration
                </Button>
              </div>

            </form>

            <div className="space-y-6">
              <Card className="bg-[#0b0b0b]/40 border-white/5 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Metrik Polling Real-Time</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {mockPollerStats.map((stat) => (
                    <div key={stat.id} className="border-b border-white/5 pb-3 last:border-b-0 last:pb-0 space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-zinc-400">{stat.metric}</span>
                        <span className="font-mono text-zinc-200 font-semibold">{stat.value}</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="bg-[#0b0b0b]/40 border-white/5 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Poller Engine Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-white/5">
                    <span className="text-zinc-400">Status Daemon</span>
                    <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[9px]">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Scheduler Hook</span>
                    <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[9px]">Connected</Badge>
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
