"use client";

import { useEffect, useState } from "react";
import { getGatewayConfigByKey, updateGatewayConfigByKey, getOltDevices, OLTDevice } from "@/lib/actions/gateways";
import { 
  Network, 
  Save, 
  Loader2, 
  Server,
  Lock,
  Eye,
  EyeOff
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { GatewayPageWrapper } from "@/components/page-guards/gateway-page-wrapper";

export default function OltGatewayPage() {
  const [config, setConfig] = useState<Record<string, string>>({});
  const [censored, setCensored] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showOltKey, setShowOltKey] = useState(false);
  const [oltDevices, setOltDevices] = useState<OLTDevice[]>([]);
  const [devicesLoading, setDevicesLoading] = useState(true);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const data = await getGatewayConfigByKey("olt");
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
    fetchOltDevices();
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
        "REDIS_ADDR",
        "DATABASE_URL",
        "OLT_ENCRYPTION_KEY",
        "SNMP_TIMEOUT_SECONDS",
        "SSH_TIMEOUT_SECONDS",
        "MAX_CONCURRENT_OLT_CONNECTIONS"
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

      const res = await updateGatewayConfigByKey("olt", updates);
      toast.success(res.message || "Konfigurasi OLT Gateway berhasil disimpan!");
      
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

  const fetchOltDevices = async () => {
    try {
      setDevicesLoading(true);
      const data = await getOltDevices();
      setOltDevices(data);

    } catch (err) {
      console.error("Gagal memuat OLT devices:", err);
    } finally {
      setDevicesLoading(false);
    }
  };

  // OLT devices loaded dynamically from getOltDevices()

  return (
    <GatewayPageWrapper>
    <div className="flex-1 flex flex-col pt-16 px-8 bg-[#080808] h-full overflow-y-auto">
      <div className="w-full max-w-5xl mx-auto space-y-8 pb-20">
        
        <div className="flex items-center gap-4 border-b border-white/5 pb-6">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
            <Network className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-light text-zinc-100 tracking-tight">
              OLT Gateway
            </h1>
            <p className="text-xs text-zinc-500">
              Konfigurasi koneksi SSH/SNMP, dekripsi kredensial perangkat OLT GPON, dan batas konkurensi query polling.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
            <p className="text-xs text-zinc-500">Memuat konfigurasi OLT gateway...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            <form onSubmit={handleSave} className="lg:col-span-2 space-y-6">
              
              <Card className="bg-[#0b0b0b]/60 border-white/5 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                    <Server className="w-4 h-4 text-emerald-500" /> Infrastructure Connections
                  </CardTitle>
                  <CardDescription className="text-[10px] text-zinc-500">
                    Koneksi database PostgreSQL dan broker Redis OLT polling worker.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
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
                      type="text"
                      value={config.DATABASE_URL || ""}
                      onChange={(e) => handleInputChange("DATABASE_URL", e.target.value)}
                      placeholder="postgres://..."
                      className="bg-zinc-950/80 border-white/10 text-xs focus:border-emerald-500/50"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#0b0b0b]/60 border-white/5 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-emerald-500" /> Security & Performance Settings
                  </CardTitle>
                  <CardDescription className="text-[10px] text-zinc-500">
                    Key enkripsi data kredensial perangkat OLT dan limitasi konkurensi hardware polling.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="OLT_ENCRYPTION_KEY" className="text-xs text-zinc-400">OLT credentials encryption key (AES-256)</Label>
                      <button
                        type="button"
                        onClick={() => setShowOltKey(!showOltKey)}
                        className="text-[10px] text-zinc-500 hover:text-zinc-300 flex items-center gap-1"
                      >
                        {showOltKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        {showOltKey ? "Sembunyikan" : "Tampilkan"}
                      </button>
                    </div>
                    <Input
                      id="OLT_ENCRYPTION_KEY"
                      type={showOltKey ? "text" : "password"}
                      value={config.OLT_ENCRYPTION_KEY || ""}
                      onChange={(e) => handleInputChange("OLT_ENCRYPTION_KEY", e.target.value)}
                      placeholder="AES-256 hex key..."
                      className="bg-zinc-950/80 border-white/10 text-xs focus:border-emerald-500/50"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="SNMP_TIMEOUT_SECONDS" className="text-xs text-zinc-400">SNMP Timeout (s)</Label>
                      <Input
                        id="SNMP_TIMEOUT_SECONDS"
                        type="number"
                        value={config.SNMP_TIMEOUT_SECONDS || ""}
                        onChange={(e) => handleInputChange("SNMP_TIMEOUT_SECONDS", e.target.value)}
                        placeholder="5"
                        className="bg-zinc-950/80 border-white/10 text-xs focus:border-emerald-500/50"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="SSH_TIMEOUT_SECONDS" className="text-xs text-zinc-400">SSH Timeout (s)</Label>
                      <Input
                        id="SSH_TIMEOUT_SECONDS"
                        type="number"
                        value={config.SSH_TIMEOUT_SECONDS || ""}
                        onChange={(e) => handleInputChange("SSH_TIMEOUT_SECONDS", e.target.value)}
                        placeholder="10"
                        className="bg-zinc-950/80 border-white/10 text-xs focus:border-emerald-500/50"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="MAX_CONCURRENT_OLT_CONNECTIONS" className="text-xs text-zinc-400">Max Concurrent</Label>
                      <Input
                        id="MAX_CONCURRENT_OLT_CONNECTIONS"
                        type="number"
                        value={config.MAX_CONCURRENT_OLT_CONNECTIONS || ""}
                        onChange={(e) => handleInputChange("MAX_CONCURRENT_OLT_CONNECTIONS", e.target.value)}
                        placeholder="20"
                        className="bg-zinc-950/80 border-white/10 text-xs focus:border-emerald-500/50"
                      />
                    </div>
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
                  <CardTitle className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
                    OLT Node State
                    {devicesLoading && <Loader2 className="w-3 h-3 animate-spin text-zinc-500" />}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {devicesLoading ? (
                    <div className="space-y-3">
                      {[1,2,3].map(i => (
                        <div key={i} className="h-10 bg-zinc-800/40 rounded animate-pulse" />
                      ))}
                    </div>
                  ) : oltDevices.length === 0 ? (
                    <p className="text-[10px] text-zinc-600 text-center py-4">Belum ada perangkat OLT terdaftar.</p>
                  ) : (
                    oltDevices.map((dev) => (
                      <div key={dev.id} className="border-b border-white/5 pb-3 last:border-b-0 last:pb-0 space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-medium text-zinc-200">{dev.name || dev.host}</span>
                          <Badge className="bg-zinc-500/10 text-zinc-400 border-zinc-500/20 text-[9px] px-1.5 py-0.5 border capitalize">
                            {dev.vendor}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center text-[9px] text-zinc-500 font-mono">
                          <span>{dev.host}:{dev.port || 161}</span>
                          <span className="text-zinc-600">{new Date(dev.updatedAt).toLocaleDateString("id-ID")}</span>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card className="bg-[#0b0b0b]/40 border-white/5 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Statistik Perangkat</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-white/5">
                    <span className="text-zinc-400">Total OLT Terdaftar</span>
                    <Badge className="bg-zinc-500/10 text-zinc-300 border-zinc-500/20 text-[9px]">
                      {devicesLoading ? "..." : oltDevices.length}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Vendor Unik</span>
                    <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[9px]">
                      {devicesLoading ? "..." : new Set(oltDevices.map(d => d.vendor)).size}
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
