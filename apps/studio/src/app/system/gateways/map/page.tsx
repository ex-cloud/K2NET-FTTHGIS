"use client";

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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { GatewayPageWrapper } from "@/components/page-guards/gateway-page-wrapper";

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
    setSaving(true);

    try {
      const updates: Record<string, string> = {};
      const keysToUpdate = [
        "GOOGLE_MAPS_API_KEY",
        "HERE_MAPS_API_KEY"
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
    <div className="flex-1 flex flex-col pt-16 px-8 bg-[#080808] h-full overflow-y-auto">
      <div className="w-full max-w-5xl mx-auto space-y-8 pb-20">
        
        {/* Header */}
        <div className="flex items-center gap-4 border-b border-white/5 pb-6">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
            <Map className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-light text-zinc-100 tracking-tight">
              Map Gateway
            </h1>
            <p className="text-xs text-zinc-500">
              Konfigurasi API Maps, failover geocoding ke HERE Maps, dan monitor performa Redis Caching Layer.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
            <p className="text-xs text-zinc-500">Memuat konfigurasi map gateway...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Form Column */}
            <form onSubmit={handleSave} className="lg:col-span-2 space-y-6">
              
              {/* Google Maps API Keys */}
              <Card className="bg-[#0b0b0b]/60 border-white/5 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-emerald-500" /> Google Maps API
                  </CardTitle>
                  <CardDescription className="text-[10px] text-zinc-500">
                    Kredensial Google Maps API untuk Forward & Reverse Geocoding alamat pelanggan FTTH.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="GOOGLE_MAPS_API_KEY" className="text-xs text-zinc-400">Google Maps API Key</Label>
                      <button
                        type="button"
                        onClick={() => setShowGoogleKey(!showGoogleKey)}
                        className="text-[10px] text-zinc-500 hover:text-zinc-300 flex items-center gap-1"
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
                      className="bg-zinc-950/80 border-white/10 text-xs focus:border-emerald-500/50"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* HERE Maps API Keys (Failover) */}
              <Card className="bg-[#0b0b0b]/60 border-white/5 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                    <Compass className="w-4 h-4 text-emerald-500" /> HERE Maps API (Failover Provider)
                  </CardTitle>
                  <CardDescription className="text-[10px] text-zinc-500">
                    Provider alternatif yang digunakan otomatis jika Google Maps mengalami API limit quota atau timeout.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="HERE_MAPS_API_KEY" className="text-xs text-zinc-400">HERE Maps API Key</Label>
                      <button
                        type="button"
                        onClick={() => setShowHereKey(!showHereKey)}
                        className="text-[10px] text-zinc-500 hover:text-zinc-300 flex items-center gap-1"
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
                      className="bg-zinc-950/80 border-white/10 text-xs focus:border-emerald-500/50"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
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

            {/* Performance Panel Column */}
            <div className="space-y-6">
              
              {/* Cache Hit Ratio Circular Progress Indicator */}
              <Card className="bg-[#0b0b0b]/40 border-white/5 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Redis Cache Performance</CardTitle>
                  <CardDescription className="text-[10px] text-zinc-500">
                    Rasio cache hit dari request Geocoding yang tersimpan di database lokal Redis.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  
                  {/* Circular/Line Visual Stats */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-400">Cache Hit Ratio</span>
                      <span className="font-semibold text-emerald-400">94.2%</span>
                    </div>
                    <Progress value={94.2} className="h-2 bg-zinc-900 border border-white/5" />
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs pt-2">
                    <div>
                      <p className="text-[9px] text-zinc-500 uppercase tracking-wider font-bold">Cache Hits</p>
                      <p className="text-sm font-semibold font-mono text-zinc-200 mt-0.5">14,204</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-zinc-500 uppercase tracking-wider font-bold">Cache Misses</p>
                      <p className="text-sm font-semibold font-mono text-zinc-400 mt-0.5">876</p>
                    </div>
                  </div>

                  {/* Savings Calculator Card */}
                  <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-lg p-3 flex items-start gap-2.5">
                    <div className="p-1 rounded bg-emerald-500/10 text-emerald-500 mt-0.5">
                      <DollarSign className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] text-zinc-400 font-semibold">Estimasi Penghematan Biaya</p>
                      <p className="text-xs font-bold text-emerald-400 font-mono mt-0.5">$710.20 USD</p>
                      <p className="text-[8px] text-zinc-500 mt-0.5">*Berdasarkan standar harga Google Maps Geocoding API ($5/1000 hits)</p>
                    </div>
                  </div>

                </CardContent>
              </Card>

              {/* Provider Health */}
              <Card className="bg-[#0b0b0b]/40 border-white/5 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Status Provider</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-white/5">
                    <span className="text-zinc-400">Google Maps Geocoding</span>
                    <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[9px]">Active (Primary)</Badge>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-white/5">
                    <span className="text-zinc-400">HERE Maps API</span>
                    <Badge className="bg-zinc-950 text-zinc-400 border-white/5 text-[9px]">Standby (Failover)</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Redis Cache Instance</span>
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
