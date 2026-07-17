"use client";

import { useEffect, useState } from "react";
import { getGatewayConfigByKey, updateGatewayConfigByKey, getSchedulerJobs, SchedulerJob } from "@/lib/actions/gateways";
import { 
  Clock, 
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

const schedulerSchema = z.object({
  DATABASE_URL: z.string().url("Format URL database tidak valid").startsWith("postgres://", "Database harus berupa URL PostgreSQL (postgres://)"),
  REDIS_ADDR: z.string().regex(/^[^:]+:\d+$/, "Format Redis Address harus host:port (contoh: redis:6379)"),
  TIMEZONE: z.string().min(1, "Timezone tidak boleh kosong"),
  MAX_CONCURRENT_JOBS: z.coerce.number().int("Max concurrent jobs harus berupa angka bulat").min(1, "Max concurrent jobs minimal 1").max(1000, "Max concurrent jobs maksimal 1000")
});

function formatRelativeTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "Belum pernah";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  
  // Jika tanggal di masa depan (nextRunAt)
  if (diffMs < 0) {
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Baru saja";
  if (diffMins < 60) return `${diffMins} menit lalu`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} jam lalu`;
  
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export default function SchedulerGatewayPage() {
  const [config, setConfig] = useState<Record<string, string>>({});
  const [censored, setCensored] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [jobs, setJobs] = useState<SchedulerJob[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const data = await getGatewayConfigByKey("scheduler");
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

  const fetchJobs = async () => {
    try {
      setJobsLoading(true);
      const data = await getSchedulerJobs();
      setJobs(data);
    } catch (err) {
      console.error("Gagal memuat job:", err);
    } finally {
      setJobsLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
    fetchJobs();
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
      "TIMEZONE",
      "MAX_CONCURRENT_JOBS"
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
      const partialSchema = schedulerSchema.partial();
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
      const res = await updateGatewayConfigByKey("scheduler", updates);
      toast.success(res.message || "Konfigurasi Scheduler berhasil disimpan!");
      
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

  // Jobs data loaded dynamically from getSchedulerJobs()

  return (
    <GatewayPageWrapper>
    <div className="flex-1 flex flex-col pt-16 px-8 bg-background h-full overflow-y-auto">
      <div className="w-full max-w-5xl mx-auto space-y-8 pb-20">
        
        <div className="flex items-center gap-4 border-b border-border pb-6">
          <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-light text-zinc-100 tracking-tight">
              Scheduler Gateway
            </h1>
            <p className="text-xs text-zinc-500">
              Konfigurasi scheduler cron worker, backup otomatis, dan sinkronisasi data background jobs.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-xs text-zinc-500">Memuat konfigurasi scheduler gateway...</p>
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
                    Koneksi database dan antrean broker Redis untuk scheduler gateway.
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
                      className="bg-zinc-950/80 border-white/10 text-xs focus:border-primary/50"
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
                      className="bg-zinc-950/80 border-white/10 text-xs focus:border-primary/50"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/60 border-border shadow-xl">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-primary" /> Worker Settings
                  </CardTitle>
                  <CardDescription className="text-[10px] text-zinc-500">
                    Konfigurasi batasan beban eksekusi job dan zona waktu server.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="TIMEZONE" className="text-xs text-zinc-400">Timezone</Label>
                    <Input
                      id="TIMEZONE"
                      type="text"
                      value={config.TIMEZONE || ""}
                      onChange={(e) => handleInputChange("TIMEZONE", e.target.value)}
                      placeholder="Asia/Jakarta"
                      className="bg-zinc-950/80 border-white/10 text-xs focus:border-primary/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="MAX_CONCURRENT_JOBS" className="text-xs text-zinc-400">Max Concurrent Jobs</Label>
                    <Input
                      id="MAX_CONCURRENT_JOBS"
                      type="number"
                      value={config.MAX_CONCURRENT_JOBS || ""}
                      onChange={(e) => handleInputChange("MAX_CONCURRENT_JOBS", e.target.value)}
                      placeholder="10"
                      className="bg-zinc-950/80 border-white/10 text-xs focus:border-primary/50"
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
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs h-9 px-5 flex items-center gap-1.5"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Save Configuration
                </Button>
              </div>

            </form>

            <div className="space-y-6">
              <Card className="bg-[#0b0b0b]/40 border-border shadow-xl">
                <CardHeader>
                  <CardTitle className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
                    Daftar Cron Job Aktif
                    {jobsLoading && <Loader2 className="w-3 h-3 animate-spin text-zinc-500" />}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {jobsLoading ? (
                    <div className="space-y-3">
                      {[1,2,3].map(i => (
                        <div key={i} className="h-8 bg-zinc-800/40 rounded animate-pulse" />
                      ))}
                    </div>
                  ) : jobs.length === 0 ? (
                    <p className="text-[10px] text-zinc-600 text-center py-4">Belum ada cron job terdaftar.</p>
                  ) : (
                    jobs.map((job) => (
                      <div key={job.id} className="border-b border-border pb-3 last:border-b-0 last:pb-0 space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-medium text-zinc-200">{job.name}</span>
                          <Badge className={`text-[9px] px-1.5 py-0.5 border ${
                            job.isActive
                              ? "bg-primary/10 text-primary border-primary/20"
                              : "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
                          }`}>
                            {job.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center text-[9px] text-zinc-500 font-mono">
                          <span>Cron: {job.cronExpr}</span>
                          <span>{formatRelativeTime(job.lastRunAt)}</span>
                        </div>
                        {job.nextRunAt && (
                          <div className="text-[9px] text-zinc-600">
                            Next: {formatRelativeTime(job.nextRunAt)}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card className="bg-[#0b0b0b]/40 border-border shadow-xl">
                <CardHeader>
                  <CardTitle className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Status Task Scheduler</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-border">
                    <span className="text-zinc-400">Daemon Worker</span>
                    <Badge className="bg-primary/10 text-primary border-primary/20 text-[9px]">Running</Badge>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-border">
                    <span className="text-zinc-400">Total Jobs Terdaftar</span>
                    <Badge className="bg-zinc-500/10 text-zinc-300 border-zinc-500/20 text-[9px]">{jobsLoading ? "..." : jobs.length}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Jobs Aktif</span>
                    <Badge className="bg-primary/10 text-primary border-primary/20 text-[9px]">
                      {jobsLoading ? "..." : jobs.filter(j => j.isActive).length}
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
