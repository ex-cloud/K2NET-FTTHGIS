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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@k2net/ui";
import { Button } from "@k2net/ui";
import { Input } from "@k2net/ui";
import { Label } from "@k2net/ui";
import { toast } from "sonner";
import { Badge } from "@k2net/ui";
import { Progress } from "@k2net/ui";
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
    <div className="flex-1 flex flex-col pt-16 px-4 md:px-8 bg-background h-full overflow-y-auto">
      <div className="w-full max-w-5xl mx-auto space-y-8 pb-20">
        
        {/* Header */}
        <div className="flex items-center gap-4 border-b border-border pb-6">
          <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-light text-foreground tracking-tight">
              Storage Gateway
            </h1>
            <p className="text-xs text-muted-foreground">
              Urus bucket penyimpanan (S3/Cloudflare R2), kunci enkripsi, dan kompresi WebP otomatis untuk menghemat ruang penyimpanan.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-xs text-muted-foreground">Memuat konfigurasi storage gateway...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Form Column */}
            <form onSubmit={handleSave} className="lg:col-span-2 space-y-6">
              
              {/* S3/R2 Bucket Connection Details */}
              <Card className="bg-card/60 border-border shadow-xl">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Cloud className="w-4 h-4 text-primary" /> Koneksi Bucket S3 / Cloudflare R2
                  </CardTitle>
                  <CardDescription className="text-[10px] text-muted-foreground">
                    Konfigurasi parameter region, custom API endpoint, dan nama bucket untuk menyimpan berkas media.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="AWS_REGION" className="text-xs text-muted-foreground">AWS / R2 Region</Label>
                      <Input
                        id="AWS_REGION"
                        type="text"
                        value={config.AWS_REGION || ""}
                        onChange={(e) => handleInputChange("AWS_REGION", e.target.value)}
                        placeholder="auto / ap-southeast-1"
                        className="bg-input border-border text-foreground text-xs focus:border-primary/50"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="AWS_BUCKET_NAME" className="text-xs text-muted-foreground">Bucket Name</Label>
                      <Input
                        id="AWS_BUCKET_NAME"
                        type="text"
                        value={config.AWS_BUCKET_NAME || ""}
                        onChange={(e) => handleInputChange("AWS_BUCKET_NAME", e.target.value)}
                        placeholder="my-bucket-name"
                        className="bg-input border-border text-foreground text-xs focus:border-primary/50"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="AWS_ENDPOINT" className="text-xs text-muted-foreground">Custom S3 Endpoint (Cloudflare R2/MinIO URL)</Label>
                    <Input
                      id="AWS_ENDPOINT"
                      type="text"
                      value={config.AWS_ENDPOINT || ""}
                      onChange={(e) => handleInputChange("AWS_ENDPOINT", e.target.value)}
                      placeholder="https://<account-id>.r2.cloudflarestorage.com"
                      className="bg-input border-border text-foreground text-xs focus:border-primary/50"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* AWS / R2 Credentials */}
              <Card className="bg-card/60 border-border shadow-xl">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Lock className="w-4 h-4 text-primary" /> AWS Credentials / Access Keys
                  </CardTitle>
                  <CardDescription className="text-[10px] text-muted-foreground">
                    Kunci akses aman yang digunakan untuk memberikan otorisasi penulisan/pengunggahan file ke bucket S3.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="AWS_ACCESS_KEY_ID" className="text-xs text-muted-foreground">Access Key ID</Label>
                      <button
                        type="button"
                        onClick={() => setShowAccessKey(!showAccessKey)}
                        className="text-[10px] text-muted-foreground hover:text-muted-foreground flex items-center gap-1"
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
                      className="bg-input border-border text-foreground text-xs focus:border-primary/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="AWS_SECRET_ACCESS_KEY" className="text-xs text-muted-foreground">Secret Access Key</Label>
                      <button
                        type="button"
                        onClick={() => setShowSecretKey(!showSecretKey)}
                        className="text-[10px] text-muted-foreground hover:text-muted-foreground flex items-center gap-1"
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
                      className="bg-input border-border text-foreground text-xs focus:border-primary/50"
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

            {/* Stats Panel Column */}
            <div className="space-y-6">
              
              {/* Storage Space Saved Card - Real Data */}
              <Card className="bg-card border-border shadow-xl">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">WebP Image Optimizer</CardTitle>
                    <button
                      type="button"
                      onClick={fetchStats}
                      disabled={statsLoading}
                      className="text-muted-foreground/60 hover:text-muted-foreground transition-colors"
                      title="Refresh statistik"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${statsLoading ? "animate-spin" : ""}`} />
                    </button>
                  </div>
                  <CardDescription className="text-[10px] text-muted-foreground">
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
                      <Loader2 className="w-5 h-5 text-primary animate-spin" />
                      <p className="text-[10px] text-muted-foreground/60">Memuat statistik...</p>
                    </div>
                  ) : stats ? (
                    <>
                      {/* Space saved visual progress */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Ruang Penyimpanan Dihemat</span>
                          <span className="font-semibold text-primary">
                            {stats.space_saved_percent.toFixed(1)}% Saved
                          </span>
                        </div>
                        <Progress value={Math.max(0, Math.min(100, stats.space_saved_percent))} className="h-2 bg-muted border border-border" />
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-xs pt-2">
                        <div>
                          <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-bold">Total File Diproses</p>
                          <p className="text-sm font-semibold font-mono text-foreground mt-0.5 flex items-center gap-1">
                            <FileCheck2 className="w-3.5 h-3.5 text-primary" />
                            {formatCount(stats.total_files)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-bold">Tingkat Kegagalan</p>
                          <p className={`text-sm font-semibold font-mono mt-0.5 ${stats.failure_rate_percent > 1 ? "text-red-400" : "text-primary"}`}>
                            {stats.failure_rate_percent.toFixed(2)}%
                          </p>
                        </div>
                      </div>

                      {/* Byte savings comparison card */}
                      <div className="bg-muted/50 border border-border rounded-lg p-3.5 space-y-3">
                        <div className="flex justify-between text-xs border-b border-border pb-2">
                          <span className="text-muted-foreground flex items-center gap-1.5"><HardDrive className="w-3.5 h-3.5" /> Ukuran Asli:</span>
                          <span className="font-mono text-muted-foreground">{formatBytes(stats.total_original_size)}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground flex items-center gap-1.5"><Cpu className="w-3.5 h-3.5 text-primary" /> Hasil WebP:</span>
                          <span className="font-mono text-primary font-bold">{formatBytes(stats.total_compressed_size)}</span>
                        </div>
                      </div>
                    </>
                  ) : null}

                </CardContent>
              </Card>

              {/* Bucket details */}
              <Card className="bg-card border-border shadow-xl">
                <CardHeader>
                  <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Informasi Layanan</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-border">
                    <span className="text-muted-foreground">Library Kompresi</span>
                    <Badge className="bg-muted text-muted-foreground border-border text-[9px]">chai2010/webp</Badge>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-border">
                    <span className="text-muted-foreground">Format Output</span>
                    <Badge className="bg-primary/10 text-primary border-primary/20 text-[9px]">WebP Only</Badge>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-border">
                    <span className="text-muted-foreground">Batas Gambar</span>
                    <Badge className="bg-background text-muted-foreground border-border text-[9px]">Max 10 MB</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Batas Non-Gambar</span>
                    <Badge className="bg-background text-muted-foreground border-border text-[9px]">Max 150 MB</Badge>
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
