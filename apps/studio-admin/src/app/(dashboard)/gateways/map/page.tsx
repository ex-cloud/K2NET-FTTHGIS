

import { useEffect, useState } from "react";
import { getGatewayConfigByKey, updateGatewayConfigByKey } from "@/lib/actions/gateways";
import { 
  Map, 
  Save, 
  Loader2, 
  Eye,
  EyeOff,
  Globe,
  Compass,
  DollarSign
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Input, Label, Badge, Progress, ActionTooltip } from "@k2net/ui";
import { toast } from "sonner";
import { GatewayPageWrapper } from "@/components/page-guards/gateway-page-wrapper";
import { PermissionGuard } from "@/hooks/use-permissions";

import { z } from "zod";

const mapSchema = z.object({
  GOOGLE_MAPS_API_KEY: z.string().min(10, "Google Maps API Key minimal 10 karakter"),
  HERE_MAPS_API_KEY: z.string().min(10, "HERE Maps API Key minimal 10 karakter")
});

export default function MapGatewayPage() {
  const [config, setConfig] = useState<Record<string, string>>({});
  const [censored, setCensored] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showGoogleKey, setShowGoogleKey] = useState(false);
  const [showHereKey, setShowHereKey] = useState(false);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const data = await getGatewayConfigByKey("map");
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

    const updates: Record<string, string> = {};
    const validationData: Record<string, any> = {};
    const keysToUpdate = [
      "GOOGLE_MAPS_API_KEY",
      "HERE_MAPS_API_KEY"
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
      const partialSchema = mapSchema.partial();
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
      const res = await updateGatewayConfigByKey("map", updates);
      toast.success(res.message || "Konfigurasi peta berhasil disimpan!");
      
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

  return (
    <GatewayPageWrapper>
    <div className="flex-1 flex flex-col pt-16 px-4 md:px-8 bg-background h-full overflow-y-auto">
      <div className="w-full max-w-5xl mx-auto space-y-8 pb-20">
        
        {/* Header */}
        <div className="flex items-center gap-4 border-b border-border pb-6">
          <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <Map className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              Map Gateway
            </h1>
            <p className="text-xs text-muted-foreground">
              Konfigurasi API Maps, failover geocoding ke HERE Maps, dan monitor performa Redis Caching Layer.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-xs text-muted-foreground">Memuat konfigurasi map gateway...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Form Column */}
            <form onSubmit={handleSave} className="lg:col-span-2 space-y-6">
              
              {/* Google Maps API Keys */}
              <Card glowingEffect className="bg-card/60 border-border shadow-xl">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Globe className="w-4 h-4 text-primary" /> Google Maps API
                  </CardTitle>
                  <CardDescription className="text-[10px] text-muted-foreground">
                    Kredensial Google Maps API untuk Forward & Reverse Geocoding alamat pelanggan FTTH.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="GOOGLE_MAPS_API_KEY" className="text-xs text-muted-foreground">Google Maps API Key</Label>
                      <button
                        type="button"
                        onClick={() => setShowGoogleKey(!showGoogleKey)}
                        className="text-[10px] text-muted-foreground hover:text-muted-foreground flex items-center gap-1"
                      >
                        {showGoogleKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        {showGoogleKey ? "Sembunyikan" : "Tampilkan"}
                      </button>
                    </div>
                    <Input
                      id="GOOGLE_MAPS_API_KEY"
                      type={showGoogleKey ? "text" : "password"}
                      value={config.GOOGLE_MAPS_API_KEY || ""}
                      onChange={(e) => handleInputChange("GOOGLE_MAPS_API_KEY", e.target.value)}
                      placeholder="AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      className="bg-input border-border text-foreground text-xs focus:border-primary/50"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* HERE Maps API Keys (Failover) */}
              <Card glowingEffect className="bg-card/60 border-border shadow-xl">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Compass className="w-4 h-4 text-primary" /> HERE Maps API (Failover Provider)
                  </CardTitle>
                  <CardDescription className="text-[10px] text-muted-foreground">
                    Provider alternatif yang digunakan otomatis jika Google Maps mengalami API limit quota atau timeout.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="HERE_MAPS_API_KEY" className="text-xs text-muted-foreground">HERE Maps API Key</Label>
                      <button
                        type="button"
                        onClick={() => setShowHereKey(!showHereKey)}
                        className="text-[10px] text-muted-foreground hover:text-muted-foreground flex items-center gap-1"
                      >
                        {showHereKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        {showHereKey ? "Sembunyikan" : "Tampilkan"}
                      </button>
                    </div>
                    <Input
                      id="HERE_MAPS_API_KEY"
                      type={showHereKey ? "text" : "password"}
                      value={config.HERE_MAPS_API_KEY || ""}
                      onChange={(e) => handleInputChange("HERE_MAPS_API_KEY", e.target.value)}
                      placeholder="HERE API Key..."
                      className="bg-input border-border text-foreground text-xs focus:border-primary/50"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
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
                <PermissionGuard permission="system.gateway.manage">
                  <ActionTooltip label="Simpan Konfigurasi Map Gateway" shortcut="Ctrl+S">
                    <Button 
                      type="submit" 
                      disabled={saving}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs h-9 px-5 flex items-center gap-1.5"
                    >
                      {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      Save Configuration
                    </Button>
                  </ActionTooltip>
                </PermissionGuard>
              </div>

            </form>

            {/* Performance Panel Column */}
            <div className="space-y-6">
              
              {/* Cache Hit Ratio Circular Progress Indicator */}
              <Card glowingEffect className="bg-card border-border shadow-xl">
                <CardHeader>
                  <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Redis Cache Performance</CardTitle>
                  <CardDescription className="text-[10px] text-muted-foreground">
                    Rasio cache hit dari request Geocoding yang tersimpan di database lokal Redis.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  
                  {/* Circular/Line Visual Stats */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Cache Hit Ratio</span>
                      <span className="font-semibold text-primary">94.2%</span>
                    </div>
                    <Progress value={94.2} className="h-2 bg-muted border border-border" />
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs pt-2">
                    <div>
                      <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-bold">Cache Hits</p>
                      <p className="text-sm font-semibold font-mono text-foreground mt-0.5">14,204</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-bold">Cache Misses</p>
                      <p className="text-sm font-semibold font-mono text-muted-foreground mt-0.5">876</p>
                    </div>
                  </div>

                  {/* Savings Calculator Card */}
                  <div className="bg-primary/5 border border-primary/10 rounded-lg p-3 flex items-start gap-2.5">
                    <div className="p-1 rounded bg-primary/10 text-primary mt-0.5">
                      <DollarSign className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground font-semibold">Estimasi Penghematan Biaya</p>
                      <p className="text-xs font-bold text-primary font-mono mt-0.5">$710.20 USD</p>
                      <p className="text-[8px] text-muted-foreground mt-0.5">*Berdasarkan standar harga Google Maps Geocoding API ($5/1000 hits)</p>
                    </div>
                  </div>

                </CardContent>
              </Card>

              {/* Provider Health */}
              <Card glowingEffect className="bg-card border-border shadow-xl">
                <CardHeader>
                  <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status Provider</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-border">
                    <span className="text-muted-foreground">Google Maps Geocoding</span>
                    <Badge className="bg-primary/10 text-primary border-primary/20 text-[9px]">Active (Primary)</Badge>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-border">
                    <span className="text-muted-foreground">HERE Maps API</span>
                    <Badge className="bg-background text-muted-foreground border-border text-[9px]">Standby (Failover)</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Redis Cache Instance</span>
                    <Badge className="bg-primary/10 text-primary border-primary/20 text-[9px]">Connected</Badge>
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
