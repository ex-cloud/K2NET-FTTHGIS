"use client";

import { useEffect, useState } from "react";
import { getGatewayConfigByKey, updateGatewayConfigByKey, getExportJobs, ExportJob } from "@/lib/actions/gateways";
import { 
  Download, 
  Save, 
  Loader2, 
  Server,
  Lock
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@k2net/ui";
import { Button } from "@k2net/ui";
import { Input } from "@k2net/ui";
import { Label } from "@k2net/ui";
import { toast } from "sonner";
import { Badge } from "@k2net/ui";
import { GatewayPageWrapper } from "@/components/page-guards/gateway-page-wrapper";

import { z } from "zod";

const exportSchema = z.object({
  REDIS_ADDR: z.string().regex(/^[^:]+:\d+$/, "Format Redis Address harus host:port (contoh: redis:6379)"),
  DATABASE_URL: z.string().url("Format URL database tidak valid").startsWith("postgres://", "Database harus berupa URL PostgreSQL (postgres://)"),
  STORAGE_GATEWAY_URL: z.string().url("Format URL Storage Gateway tidak valid"),
  JOB_TIMEOUT_MINUTES: z.coerce.number().int("Job timeout harus berupa angka bulat").min(1, "Job timeout minimal 1 menit").max(1440, "Job timeout maksimal 1440 menit (24 jam)"),
  MAX_CONCURRENT_EXPORTS: z.coerce.number().int("Max concurrent exports harus berupa angka bulat").min(1, "Max concurrent exports minimal 1").max(100, "Max concurrent exports maksimal 100"),
  FONT_DIR: z.string().min(1, "Font directory tidak boleh kosong"),
  TEMPLATE_DIR: z.string().min(1, "Template directory tidak boleh kosong")
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

export default function ExportGatewayPage() {
  const [config, setConfig] = useState<Record<string, string>>({});
  const [censored, setCensored] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exportJobs, setExportJobs] = useState<ExportJob[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const data = await getGatewayConfigByKey("export");
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

  const fetchExportJobs = async () => {
    try {
      setJobsLoading(true);
      const data = await getExportJobs();
      setExportJobs(data);
    } catch (err) {
      console.error("Gagal memuat export jobs:", err);
    } finally {
      setJobsLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
    fetchExportJobs();
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
        validationData[k] = currentValue;
      }
    });

    if (Object.keys(updates).length === 0) {
      toast.info("Tidak ada perubahan konfigurasi yang terdeteksi.");
      return;
    }

    // Run partial validation using Zod
    try {
      const partialSchema = exportSchema.partial();
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
      const res = await updateGatewayConfigByKey("export", updates);
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

  return (
    <GatewayPageWrapper>
    <div className="flex-1 flex flex-col pt-16 px-4 md:px-8 bg-background h-full overflow-y-auto">
      <div className="w-full max-w-5xl mx-auto space-y-8 pb-20">
        
        <div className="flex items-center gap-4 border-b border-border pb-6">
          <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
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
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-xs text-zinc-500">Memuat konfigurasi export gateway...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            <form onSubmit={handleSave} className="lg:col-span-2 space-y-6">
              
              <Card className="bg-card/60 border-border shadow-xl">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                    <Server className="w-4 h-4 text-primary" /> Infrastructure Connections
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
                      className="bg-input border-border text-foreground text-xs focus:border-primary/50"
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
                      className="bg-input border-border text-foreground text-xs focus:border-primary/50"
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
                      className="bg-input border-border text-foreground text-xs focus:border-primary/50"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/60 border-border shadow-xl">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-primary" /> Export System Resources
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
                        className="bg-input border-border text-foreground text-xs focus:border-primary/50"
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
                        className="bg-input border-border text-foreground text-xs focus:border-primary/50"
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
                      className="bg-input border-border text-foreground text-xs focus:border-primary/50"
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
                  <CardTitle className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
                    Antrean Export Terkini
                    {jobsLoading && <Loader2 className="w-3 h-3 animate-spin text-zinc-500" />}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {jobsLoading ? (
                    <div className="space-y-3">
                      {[1,2,3].map(i => (
                        <div key={i} className="h-10 bg-muted/40 rounded animate-pulse" />
                      ))}
                    </div>
                  ) : exportJobs.length === 0 ? (
                    <p className="text-[10px] text-zinc-600 text-center py-4">Belum ada riwayat export.</p>
                  ) : (
                    exportJobs.map((exp) => (
                      <div key={exp.jobId} className="border-b border-border pb-3 last:border-b-0 last:pb-0 space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-medium text-zinc-200 truncate max-w-[150px] capitalize">
                            {exp.type} Export
                          </span>
                          <Badge className={`text-[9px] px-1.5 py-0.5 border ${
                            exp.status === "done"
                              ? "bg-primary/10 text-primary border-primary/20"
                              : exp.status === "failed"
                              ? "bg-red-500/10 text-red-500 border-red-500/20"
                              : exp.status === "processing"
                              ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                              : "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
                          }`}>
                            {exp.status}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center text-[9px] text-zinc-500 font-mono">
                          <span>Tenant: {exp.tenantSlug}</span>
                          <span>{formatRelativeTime(exp.createdAt)}</span>
                        </div>
                        {exp.downloadUrl && exp.status === "done" && (
                          <div className="text-[9px] text-primary truncate">
                            ↓ {exp.downloadUrl.split("/").pop()}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card className="bg-card border-border shadow-xl">
                <CardHeader>
                  <CardTitle className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Storage Integration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-border">
                    <span className="text-zinc-400">MinIO connection</span>
                    <Badge className="bg-primary/10 text-primary border-primary/20 text-[9px]">Connected</Badge>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-border">
                    <span className="text-zinc-400">Worker Status</span>
                    <Badge className="bg-primary/10 text-primary border-primary/20 text-[9px]">Ready</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Jobs Dalam Antrean</span>
                    <Badge className="bg-zinc-500/10 text-zinc-300 border-zinc-500/20 text-[9px]">
                      {jobsLoading ? "..." : exportJobs.filter(j => j.status === "queued" || j.status === "processing").length}
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
