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
  EyeOff,
  Sparkles,
  Copy
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Input, Label, Badge, ActionTooltip, UniversalContextMenu, ContextMenuGroupConfig } from "@k2net/ui";
import { toast } from "sonner";
import { GatewayPageWrapper } from "@/components/page-guards/gateway-page-wrapper";
import { z } from "zod";

const oltSchema = z.object({
  DATABASE_URL: z.string().url("Format URL database tidak valid").startsWith("postgres://", "Database harus berupa URL PostgreSQL (postgres://)"),
  REDIS_ADDR: z.string().regex(/^[^:]+:\d+$/, "Format Redis Address harus host:port (contoh: redis:6379)"),
  OLT_ENCRYPTION_KEY: z.string().min(16, "Encryption Key minimal 16 karakter"),
  SNMP_TIMEOUT_SECONDS: z.coerce.number().int("SNMP Timeout harus berupa angka bulat").min(1, "SNMP Timeout minimal 1 detik").max(60, "SNMP Timeout maksimal 60 detik"),
  SSH_TIMEOUT_SECONDS: z.coerce.number().int("SSH Timeout harus berupa angka bulat").min(1, "SSH Timeout minimal 1 detik").max(60, "SSH Timeout maksimal 60 detik"),
  MAX_CONCURRENT_OLT_CONNECTIONS: z.coerce.number().int("Max concurrent connections harus berupa angka bulat").min(1, "Max concurrent connections minimal 1").max(1000, "Max concurrent connections maksimal 1000")
});

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

    const updates: Record<string, string> = {};
    const validationData: Record<string, any> = {};
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
        validationData[k] = currentValue;
      }
    });

    if (Object.keys(updates).length === 0) {
      toast.info("Tidak ada perubahan konfigurasi yang terdeteksi.");
      return;
    }

    // Run partial validation using Zod
    try {
      const partialSchema = oltSchema.partial();
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

  const getOltContextMenuGroups = (dev: OLTDevice): ContextMenuGroupConfig[] => [
    {
      items: [
        {
          label: "Tanya AI Status Perangkat",
          icon: Sparkles,
          shortcut: "Ctrl+J",
          onClick: () => {
            window.dispatchEvent(
              new CustomEvent("k2net-ai-prompt-input", {
                detail: {
                  prompt: `Analisa perangkat OLT ${dev.name || dev.host} vendor ${dev.vendor} IP ${dev.host}:${dev.port || 161}. Berikan diagnosa konektivitas perangkat.`,
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
          label: "Salin IP/Host OLT",
          icon: Copy,
          shortcut: "Ctrl+C",
          onClick: () => {
            navigator.clipboard.writeText(dev.host);
            toast.success(`Host ${dev.host} disalin!`);
          },
        },
      ],
    },
  ];

  return (
    <GatewayPageWrapper>
    <div className="flex-1 flex flex-col pt-16 px-4 md:px-8 bg-background h-full overflow-y-auto">
      <div className="w-full max-w-5xl mx-auto space-y-8 pb-20">
        
        <div className="flex items-center gap-4 border-b border-border pb-6">
          <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <Network className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              OLT Gateway
            </h1>
            <p className="text-xs text-muted-foreground">
              Konfigurasi koneksi SSH/SNMP, dekripsi kredensial perangkat OLT GPON, dan batas konkurensi query polling.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-xs text-muted-foreground">Memuat konfigurasi OLT gateway...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            <form onSubmit={handleSave} className="lg:col-span-2 space-y-6">
              
              <Card glowingEffect className="bg-card/60 border-border shadow-xl">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Server className="w-4 h-4 text-primary" /> Infrastructure Connections
                  </CardTitle>
                  <CardDescription className="text-[10px] text-muted-foreground">
                    Koneksi database PostgreSQL dan Redis Queue untuk komunikasi OLT device workers.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
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

              <Card glowingEffect className="bg-card/60 border-border shadow-xl">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Lock className="w-4 h-4 text-primary" /> Keamanan & Batas Koneksi OLT
                  </CardTitle>
                  <CardDescription className="text-[10px] text-muted-foreground">
                    Kunci enkripsi AES-256 untuk kredensial OLT serta batasan waktu koneksi SNMP/SSH.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="OLT_ENCRYPTION_KEY" className="text-xs text-muted-foreground">OLT Encryption Master Key</Label>
                      <button
                        type="button"
                        onClick={() => setShowOltKey(!showOltKey)}
                        className="text-[10px] text-muted-foreground hover:text-muted-foreground flex items-center gap-1"
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
                      placeholder="Master Key Baru..."
                      className="bg-input border-border text-foreground text-xs focus:border-primary/50"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="SNMP_TIMEOUT_SECONDS" className="text-xs text-muted-foreground">SNMP Timeout (Seconds)</Label>
                      <Input
                        id="SNMP_TIMEOUT_SECONDS"
                        type="number"
                        value={config.SNMP_TIMEOUT_SECONDS || ""}
                        onChange={(e) => handleInputChange("SNMP_TIMEOUT_SECONDS", e.target.value)}
                        placeholder="5"
                        className="bg-input border-border text-foreground text-xs focus:border-primary/50"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="SSH_TIMEOUT_SECONDS" className="text-xs text-muted-foreground">SSH Timeout (Seconds)</Label>
                      <Input
                        id="SSH_TIMEOUT_SECONDS"
                        type="number"
                        value={config.SSH_TIMEOUT_SECONDS || ""}
                        onChange={(e) => handleInputChange("SSH_TIMEOUT_SECONDS", e.target.value)}
                        placeholder="10"
                        className="bg-input border-border text-foreground text-xs focus:border-primary/50"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="MAX_CONCURRENT_OLT_CONNECTIONS" className="text-xs text-muted-foreground">Max Concurrent Connections</Label>
                    <Input
                      id="MAX_CONCURRENT_OLT_CONNECTIONS"
                      type="number"
                      value={config.MAX_CONCURRENT_OLT_CONNECTIONS || ""}
                      onChange={(e) => handleInputChange("MAX_CONCURRENT_OLT_CONNECTIONS", e.target.value)}
                      placeholder="50"
                      className="bg-input border-border text-foreground text-xs focus:border-primary/50"
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="flex items-center justify-end gap-3">
                <ActionTooltip label="Kembalikan Nilai Form" shortcut="Alt+R">
                  <Button 
                    type="button" 
                    onClick={fetchConfig} 
                    variant="outline"
                    className="border-border bg-transparent text-muted-foreground hover:text-foreground hover:bg-accent text-xs h-9 px-4"
                  >
                    Reset Form
                  </Button>
                </ActionTooltip>
                <ActionTooltip label="Simpan Konfigurasi OLT Gateway" shortcut="Ctrl+S">
                  <Button 
                    type="submit" 
                    disabled={saving}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs h-9 px-5 flex items-center gap-1.5"
                  >
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    Save Configuration
                  </Button>
                </ActionTooltip>
              </div>

            </form>

            <div className="space-y-6">
              <Card glowingEffect className="bg-card border-border shadow-xl">
                <CardHeader>
                  <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                    OLT Node State
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
                  ) : oltDevices.length === 0 ? (
                    <p className="text-[10px] text-muted-foreground/60 text-center py-4">Belum ada perangkat OLT terdaftar.</p>
                  ) : (
                    oltDevices.map((dev) => (
                      <UniversalContextMenu key={dev.id} groups={getOltContextMenuGroups(dev)}>
                        <div className="border-b border-border pb-3 last:border-b-0 last:pb-0 space-y-1 cursor-context-menu hover:bg-muted/10 p-1.5 rounded transition-colors">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-medium text-foreground">{dev.name || dev.host}</span>
                            <Badge className="bg-muted/10 text-muted-foreground border-border text-[9px] px-1.5 py-0.5 border capitalize">
                              {dev.vendor}
                            </Badge>
                          </div>
                          <div className="flex justify-between items-center text-[9px] text-muted-foreground font-mono">
                            <span>{dev.host}:{dev.port || 161}</span>
                            <span className="text-muted-foreground/60">{new Date(dev.updatedAt).toLocaleDateString("id-ID")}</span>
                          </div>
                        </div>
                      </UniversalContextMenu>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card glowingEffect className="bg-card border-border shadow-xl">
                <CardHeader>
                  <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Statistik Perangkat</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-border">
                    <span className="text-muted-foreground">Total OLT Terdaftar</span>
                    <Badge className="bg-muted/10 text-muted-foreground border-border text-[9px]">
                      {devicesLoading ? "..." : oltDevices.length}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Vendor Unik</span>
                    <Badge className="bg-sky-500/10 text-sky-400 border-sky-500/20 text-[9px]">
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
