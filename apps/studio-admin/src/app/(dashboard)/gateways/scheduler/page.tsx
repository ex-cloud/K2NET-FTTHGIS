import { useEffect, useState } from "react";
import { getGatewayConfigByKey, updateGatewayConfigByKey, getSchedulerJobs, type SchedulerJob } from "@/lib/actions/gateways";
import { Clock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { GatewayPageWrapper } from "@/components/page-guards/gateway-page-wrapper";
import { SchedulerConfigForm } from "@/components/gateways/scheduler/SchedulerConfigForm";
import { SchedulerJobsListCard } from "@/components/gateways/scheduler/SchedulerJobsListCard";
import { SchedulerDaemonStatusCard } from "@/components/gateways/scheduler/SchedulerDaemonStatusCard";
import { z } from "zod";

const schedulerSchema = z.object({
  DATABASE_URL: z.string().url("Format URL database tidak valid").startsWith("postgres://", "Database harus berupa URL PostgreSQL (postgres://)"),
  REDIS_ADDR: z.string().regex(/^[^:]+:\d+$/, "Format Redis Address harus host:port (contoh: redis:6379)"),
  TIMEZONE: z.string().min(1, "Timezone tidak boleh kosong"),
  MAX_CONCURRENT_JOBS: z.coerce.number().int("Max concurrent jobs harus berupa angka bulat").min(1, "Max concurrent jobs minimal 1").max(1000, "Max concurrent jobs maksimal 1000"),
});

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
    const validationData: Record<string, unknown> = {};
    const keysToUpdate = [
      "REDIS_ADDR",
      "DATABASE_URL",
      "TIMEZONE",
      "MAX_CONCURRENT_JOBS",
    ];

    keysToUpdate.forEach((k) => {
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
      setTimeout(fetchConfig, 3000);
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
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">
                Scheduler Gateway
              </h1>
              <p className="text-xs text-muted-foreground">
                Konfigurasi scheduler cron worker, backup otomatis, dan sinkronisasi data background jobs.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-xs text-muted-foreground">Memuat konfigurasi scheduler gateway...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <SchedulerConfigForm
                config={config}
                saving={saving}
                onInputChange={handleInputChange}
                onSave={handleSave}
                onReset={fetchConfig}
              />
              <div className="space-y-6">
                <SchedulerJobsListCard jobs={jobs} loading={jobsLoading} />
                <SchedulerDaemonStatusCard jobs={jobs} loading={jobsLoading} />
              </div>
            </div>
          )}
        </div>
      </div>
    </GatewayPageWrapper>
  );
}
