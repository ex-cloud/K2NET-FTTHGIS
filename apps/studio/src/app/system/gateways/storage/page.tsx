"use client";

import { useEffect, useState } from "react";
import { getGatewayConfigByKey, updateGatewayConfigByKey, getStorageStats, StorageStats } from "@/lib/actions/gateways";
import { 
  Database, 
  Save, 
  Loader2, 
  Eye,
  EyeOff,
  Cloud,
  HardDrive,
  Cpu,
  Lock,
  RefreshCw,
  FileCheck2,
  AlertTriangle
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { GatewayPageWrapper } from "@/components/page-guards/gateway-page-wrapper";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatCount(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return count.toString();
}

import { z } from "zod";

const storageSchema = z.object({
  AWS_REGION: z.string().min(2, "AWS Region minimal 2 karakter"),
  AWS_ENDPOINT: z.string().url("Format AWS Endpoint tidak valid"),
  AWS_ACCESS_KEY_ID: z.string().min(8, "AWS Access Key minimal 8 karakter"),
  AWS_SECRET_ACCESS_KEY: z.string().min(8, "AWS Secret Key minimal 8 karakter"),
  AWS_BUCKET_NAME: z.string().min(3, "Bucket Name minimal 3 karakter")
});

export default function StorageGatewayPage() {
  const [config, setConfig] = useState<Record<string, string>>({});
  const [censored, setCensored] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAccessKey, setShowAccessKey] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const data = await getGatewayConfigByKey("storage");
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

  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      setStatsError(null);
      const data = await getStorageStats();
      setStats(data);
    } catch (err) {
      console.error(err);
      setStatsError(err instanceof Error ? err.message : String(err));
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
    fetchStats();
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
      "AWS_REGION",
      "AWS_ENDPOINT",
      "AWS_ACCESS_KEY_ID",
      "AWS_SECRET_ACCESS_KEY",
      "AWS_BUCKET_NAME"
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
      const partialSchema = storageSchema.partial();
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
      const res = await updateGatewayConfigByKey("storage", updates);
      toast.success(res.message || "Konfigurasi storage berhasil disimpan!");
      
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
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-light text-zinc-100 tracking-tight">
              Storage Gateway
            </h1>
            <p className="text-xs text-zinc-500">
              Urus bucket penyimpanan (S3/Cloudflare R2), kunci enkripsi, dan kompresi WebP otomatis untuk menghemat ruang penyimpanan.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
            <p className="text-xs text-zinc-500">Memuat konfigurasi storage gateway...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Form Column */}
            <form onSubmit={handleSave} className="lg:col-span-2 space-y-6">
              
              {/* S3/R2 Bucket Connection Details */}
              <Card className="bg-[#0b0b0b]/60 border-white/5 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                    <Cloud className="w-4 h-4 text-emerald-500" /> Koneksi Bucket S3 / Cloudflare R2
                  </CardTitle>
                  <CardDescription className="text-[10px] text-zinc-500">
                    Konfigurasi parameter region, custom API endpoint, dan nama bucket untuk menyimpan berkas media.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="AWS_REGION" className="text-xs text-zinc-400">AWS / R2 Region</Label>
                      <Input
                        id="AWS_REGION"
                        type="text"
                        value={config.AWS_REGION || ""}
                        onChange={(e) => handleInputChange("AWS_REGION", e.target.value)}
                        placeholder="auto / ap-southeast-1"
                        className="bg-zinc-950/80 border-white/10 text-xs focus:border-emerald-500/50"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="AWS_BUCKET_NAME" className="text-xs text-zinc-400">Bucket Name</Label>
                      <Input
                        id="AWS_BUCKET_NAME"
                        type="text"
                        value={config.AWS_BUCKET_NAME || ""}
                        onChange={(e) => handleInputChange("AWS_BUCKET_NAME", e.target.value)}
                        placeholder="my-bucket-name"
                        className="bg-zinc-950/80 border-white/10 text-xs focus:border-emerald-500/50"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="AWS_ENDPOINT" className="text-xs text-zinc-400">Custom S3 Endpoint (Cloudflare R2/MinIO URL)</Label>
                    <Input
                      id="AWS_ENDPOINT"
                      type="text"
                      value={config.AWS_ENDPOINT || ""}
                      onChange={(e) => handleInputChange("AWS_ENDPOINT", e.target.value)}
                      placeholder="https://<account-id>.r2.cloudflarestorage.com"
                      className="bg-zinc-950/80 border-white/10 text-xs focus:border-emerald-500/50"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* AWS / R2 Credentials */}
              <Card className="bg-[#0b0b0b]/60 border-white/5 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-emerald-500" /> AWS Credentials / Access Keys
                  </CardTitle>
                  <CardDescription className="text-[10px] text-zinc-500">
                    Kunci akses aman yang digunakan untuk memberikan otorisasi penulisan/pengunggahan file ke bucket S3.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="AWS_ACCESS_KEY_ID" className="text-xs text-zinc-400">Access Key ID</Label>
                      <button
                        type="button"
                        onClick={() => setShowAccessKey(!showAccessKey)}
                        className="text-[10px] text-zinc-500 hover:text-zinc-300 flex items-center gap-1"
                      >
                        {showAccessKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        {showAccessKey ? "Sembunyikan" : "Tampilkan"}
                      </button>
                    </div>
                    <Input
                      id="AWS_ACCESS_KEY_ID"
                      type={showAccessKey ? "text" : "password"}
                      value={config.AWS_ACCESS_KEY_ID || ""}
                      onChange={(e) => handleInputChange("AWS_ACCESS_KEY_ID", e.target.value)}
                      placeholder="Access Key ID Baru..."
                      className="bg-zinc-950/80 border-white/10 text-xs focus:border-emerald-500/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="AWS_SECRET_ACCESS_KEY" className="text-xs text-zinc-400">Secret Access Key</Label>
                      <button
                        type="button"
                        onClick={() => setShowSecretKey(!showSecretKey)}
                        className="text-[10px] text-zinc-500 hover:text-zinc-300 flex items-center gap-1"
                      >
                        {showSecretKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        {showSecretKey ? "Sembunyikan" : "Tampilkan"}
                      </button>
                    </div>
                    <Input
                      id="AWS_SECRET_ACCESS_KEY"
                      type={showSecretKey ? "text" : "password"}
                      value={config.AWS_SECRET_ACCESS_KEY || ""}
                      onChange={(e) => handleInputChange("AWS_SECRET_ACCESS_KEY", e.target.value)}
                      placeholder="Secret Access Key Baru..."
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

            {/* Stats Panel Column */}
            <div className="space-y-6">
              
              {/* Storage Space Saved Card - Real Data */}
              <Card className="bg-[#0b0b0b]/40 border-white/5 shadow-xl">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">WebP Image Optimizer</CardTitle>
                    <button
                      type="button"
                      onClick={fetchStats}
                      disabled={statsLoading}
                      className="text-zinc-600 hover:text-zinc-400 transition-colors"
                      title="Refresh statistik"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${statsLoading ? "animate-spin" : ""}`} />
                    </button>
                  </div>
                  <CardDescription className="text-[10px] text-zinc-500">
                    Layanan pemrosesan gambar mendeteksi tipe mime gambar secara otomatis, melakukan kompresi ke format WebP.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">

                  {statsError ? (
                    <div className="flex items-start gap-2 text-[10px] text-amber-500/80 bg-amber-500/5 border border-amber-500/10 rounded-lg p-3">
                      <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      <span>Gagal memuat statistik: {statsError}</span>
                    </div>
                  ) : statsLoading ? (
                    <div className="flex flex-col items-center py-6 gap-2">
                      <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" />
                      <p className="text-[10px] text-zinc-600">Memuat statistik...</p>
                    </div>
                  ) : stats ? (
                    <>
                      {/* Space saved visual progress */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-zinc-400">Ruang Penyimpanan Dihemat</span>
                          <span className="font-semibold text-emerald-400">
                            {stats.space_saved_percent.toFixed(1)}% Saved
                          </span>
                        </div>
                        <Progress value={Math.max(0, Math.min(100, stats.space_saved_percent))} className="h-2 bg-zinc-900 border border-white/5" />
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-xs pt-2">
                        <div>
                          <p className="text-[9px] text-zinc-500 uppercase tracking-wider font-bold">Total File Diproses</p>
                          <p className="text-sm font-semibold font-mono text-zinc-200 mt-0.5 flex items-center gap-1">
                            <FileCheck2 className="w-3.5 h-3.5 text-emerald-500" />
                            {formatCount(stats.total_files)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[9px] text-zinc-500 uppercase tracking-wider font-bold">Tingkat Kegagalan</p>
                          <p className={`text-sm font-semibold font-mono mt-0.5 ${stats.failure_rate_percent > 1 ? "text-red-400" : "text-emerald-400"}`}>
                            {stats.failure_rate_percent.toFixed(2)}%
                          </p>
                        </div>
                      </div>

                      {/* Byte savings comparison card */}
                      <div className="bg-[#0b0b0b] border border-white/5 rounded-lg p-3.5 space-y-3">
                        <div className="flex justify-between text-xs border-b border-white/5 pb-2">
                          <span className="text-zinc-500 flex items-center gap-1.5"><HardDrive className="w-3.5 h-3.5" /> Ukuran Asli:</span>
                          <span className="font-mono text-zinc-300">{formatBytes(stats.total_original_size)}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-zinc-500 flex items-center gap-1.5"><Cpu className="w-3.5 h-3.5 text-emerald-500" /> Hasil WebP:</span>
                          <span className="font-mono text-emerald-400 font-bold">{formatBytes(stats.total_compressed_size)}</span>
                        </div>
                      </div>
                    </>
                  ) : null}

                </CardContent>
              </Card>

              {/* Bucket details */}
              <Card className="bg-[#0b0b0b]/40 border-white/5 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Informasi Layanan</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-white/5">
                    <span className="text-zinc-400">Library Kompresi</span>
                    <Badge className="bg-zinc-900 text-zinc-300 border-white/5 text-[9px]">chai2010/webp</Badge>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-white/5">
                    <span className="text-zinc-400">Format Output</span>
                    <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[9px]">WebP Only</Badge>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-white/5">
                    <span className="text-zinc-400">Batas Gambar</span>
                    <Badge className="bg-zinc-950 text-zinc-400 border-white/5 text-[9px]">Max 10 MB</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Batas Non-Gambar</span>
                    <Badge className="bg-zinc-950 text-zinc-400 border-white/5 text-[9px]">Max 150 MB</Badge>
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
