"use client";

import { useEffect, useState } from "react";
import { getGatewayConfig, updateGatewayConfig } from "@/lib/actions/gateways";
import { 
  Download, 
  Save, 
  Loader2, 
  Server,
  Lock
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { GatewayPageWrapper } from "@/components/page-guards/gateway-page-wrapper";

export default function ExportGatewayPage() {
  const [config, setConfig] = useState<Record<string, string>>({});
  const [censored, setCensored] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const data = await getGatewayConfig();
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
        "REDIS_ADDR",
        "DATABASE_URL",
        "STORAGE_GATEWAY_URL",
        "JOB_TIMEOUT_MINUTES",
        "MAX_CONCURRENT_EXPORTS",
        "FONT_DIR",
        "TEMPLATE_DIR"
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

      const res = await updateGatewayConfig(updates);
      toast.success(res.message || "Konfigurasi Export Gateway berhasil disimpan!");
      
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

  const mockExports = [
    { id: 1, name: "Laporan_Jaringan_ODP_Garut.xlsx", size: "4.2 MB", status: "Completed", time: "5 mnt lalu" },
    { id: 2, name: "Tagihan_Tenant_Telkom_Juni.pdf", size: "1.8 MB", status: "Completed", time: "25 mnt lalu" },
    { id: 3, name: "Peta_FTTH_SaaS_Backup.zip", size: "82.4 MB", status: "Processing", time: "1 mnt lalu" },
  ];

  return (
    <GatewayPageWrapper>
    <div className="flex-1 flex flex-col pt-16 px-8 bg-[#080808] h-full overflow-y-auto">
      <div className="w-full max-w-5xl mx-auto space-y-8 pb-20">
        
        <div className="flex items-center gap-4 border-b border-white/5 pb-6">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
            <Download className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-light text-zinc-100 tracking-tight">
              Export Gateway
            </h1>
            <p className="text-xs text-zinc-500">
              Konfigurasi generator laporan PDF/Excel, backup peta jaringan, font custom, dan media templates.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
            <p className="text-xs text-zinc-500">Memuat konfigurasi export gateway...</p>
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
                    Koneksi database PostgreSQL, Redis Queue, dan Storage Gateway S3.
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
                      type="password"
                      value={config.DATABASE_URL || ""}
                      onChange={(e) => handleInputChange("DATABASE_URL", e.target.value)}
                      placeholder="postgres://..."
                      className="bg-zinc-950/80 border-white/10 text-xs focus:border-emerald-500/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="STORAGE_GATEWAY_URL" className="text-xs text-zinc-400">Storage Gateway API URL</Label>
                    <Input
                      id="STORAGE_GATEWAY_URL"
                      type="text"
                      value={config.STORAGE_GATEWAY_URL || ""}
                      onChange={(e) => handleInputChange("STORAGE_GATEWAY_URL", e.target.value)}
                      placeholder="http://ftth-storage-gateway:5004"
                      className="bg-zinc-950/80 border-white/10 text-xs focus:border-emerald-500/50"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#0b0b0b]/60 border-white/5 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-emerald-500" /> Export System Resources
                  </CardTitle>
                  <CardDescription className="text-[10px] text-zinc-500">
                    Konfigurasi batasan proses pembuatan file Excel/PDF dan direktori template.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="JOB_TIMEOUT_MINUTES" className="text-xs text-zinc-400">Job Timeout (Minutes)</Label>
                      <Input
                        id="JOB_TIMEOUT_MINUTES"
                        type="number"
                        value={config.JOB_TIMEOUT_MINUTES || ""}
                        onChange={(e) => handleInputChange("JOB_TIMEOUT_MINUTES", e.target.value)}
                        placeholder="10"
                        className="bg-zinc-950/80 border-white/10 text-xs focus:border-emerald-500/50"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="MAX_CONCURRENT_EXPORTS" className="text-xs text-zinc-400">Max Concurrent Exports</Label>
                      <Input
                        id="MAX_CONCURRENT_EXPORTS"
                        type="number"
                        value={config.MAX_CONCURRENT_EXPORTS || ""}
                        onChange={(e) => handleInputChange("MAX_CONCURRENT_EXPORTS", e.target.value)}
                        placeholder="5"
                        className="bg-zinc-950/80 border-white/10 text-xs focus:border-emerald-500/50"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="FONT_DIR" className="text-xs text-zinc-400">System Fonts Directory</Label>
                    <Input
                      id="FONT_DIR"
                      type="text"
                      value={config.FONT_DIR || ""}
                      onChange={(e) => handleInputChange("FONT_DIR", e.target.value)}
                      placeholder="/usr/share/fonts"
                      className="bg-zinc-950/80 border-white/10 text-xs focus:border-emerald-500/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="TEMPLATE_DIR" className="text-xs text-zinc-400">HTML Templates Directory</Label>
                    <Input
                      id="TEMPLATE_DIR"
                      type="text"
                      value={config.TEMPLATE_DIR || ""}
                      onChange={(e) => handleInputChange("TEMPLATE_DIR", e.target.value)}
                      placeholder="/app/templates"
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
                  <CardTitle className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Antrean Export Terkini</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {mockExports.map((exp) => (
                    <div key={exp.id} className="border-b border-white/5 pb-3 last:border-b-0 last:pb-0 space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-medium text-zinc-200 truncate max-w-[150px]">{exp.name}</span>
                        <Badge className={`text-[9px] px-1.5 py-0.5 border ${
                          exp.status === "Completed"
                            ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                            : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                        }`}>
                          {exp.status}
                        </Badge>
                      </div>
                      
                      <div className="flex justify-between items-center text-[9px] text-zinc-500 font-mono">
                        <span>Ukuran: {exp.size}</span>
                        <span>{exp.time}</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="bg-[#0b0b0b]/40 border-white/5 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Storage Integration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-white/5">
                    <span className="text-zinc-400">MinIO connection</span>
                    <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[9px]">Connected</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Worker Status</span>
                    <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[9px]">Ready</Badge>
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
