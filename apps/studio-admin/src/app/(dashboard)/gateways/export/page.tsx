import { useEffect, useState } from "react";
import { getGatewayConfigByKey, updateGatewayConfigByKey, getExportJobs, type ExportJob } from "@/lib/actions/gateways";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { GatewayPageWrapper } from "@/components/page-guards/gateway-page-wrapper";
import { ExportConfigForm } from "@/components/gateways/export/ExportConfigForm";
import { ExportQueueCard } from "@/components/gateways/export/ExportQueueCard";
import { ExportStorageIntegrationCard } from "@/components/gateways/export/ExportStorageIntegrationCard";
import { z } from "zod";

const exportSchema = z.object({
  REDIS_ADDR: z.string().regex(/^[^:]+:\d+$/, "Format Redis Address harus host:port (contoh: redis:6379)"),
  DATABASE_URL: z.string().url("Format URL database tidak valid").startsWith("postgres://", "Database harus berupa URL PostgreSQL (postgres://)"),
  STORAGE_GATEWAY_URL: z.string().url("Format URL Storage Gateway tidak valid"),
  JOB_TIMEOUT_MINUTES: z.coerce.number().int("Job timeout harus berupa angka bulat").min(1, "Job timeout minimal 1 menit").max(1440, "Job timeout maksimal 1440 menit (24 jam)"),
  MAX_CONCURRENT_EXPORTS: z.coerce.number().int("Max concurrent exports harus berupa angka bulat").min(1, "Max concurrent exports minimal 1").max(100, "Max concurrent exports maksimal 100"),
  FONT_DIR: z.string().min(1, "Font directory tidak boleh kosong"),
  TEMPLATE_DIR: z.string().min(1, "Template directory tidak boleh kosong"),
});

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
    const validationData: Record<string, unknown> = {};
    const keysToUpdate = [
      "REDIS_ADDR",
      "DATABASE_URL",
      "STORAGE_GATEWAY_URL",
      "JOB_TIMEOUT_MINUTES",
      "MAX_CONCURRENT_EXPORTS",
      "FONT_DIR",
      "TEMPLATE_DIR",
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
              <Download className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">
                Export Gateway
              </h1>
              <p className="text-xs text-muted-foreground">
                Konfigurasi generator laporan PDF/Excel, backup peta jaringan, font custom, dan media templates.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-xs text-muted-foreground">Memuat konfigurasi export gateway...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <ExportConfigForm
                config={config}
                saving={saving}
                onInputChange={handleInputChange}
                onSave={handleSave}
                onReset={fetchConfig}
              />
              <div className="space-y-6">
                <ExportQueueCard jobs={exportJobs} loading={jobsLoading} />
                <ExportStorageIntegrationCard jobs={exportJobs} loading={jobsLoading} />
              </div>
            </div>
          )}
        </div>
      </div>
    </GatewayPageWrapper>
  );
}
