import { useEffect, useState } from "react";
import { getGatewayConfigByKey, updateGatewayConfigByKey, getStorageStats, type StorageStats } from "@/lib/actions/gateways";
import { Database, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { GatewayPageWrapper } from "@/components/page-guards/gateway-page-wrapper";
import { StorageConfigForm } from "@/components/gateways/storage/StorageConfigForm";
import { StorageWebPOptimizerCard } from "@/components/gateways/storage/StorageWebPOptimizerCard";
import { StorageInfoCard } from "@/components/gateways/storage/StorageInfoCard";
import { z } from "zod";

const storageSchema = z.object({
  AWS_REGION: z.string().min(2, "AWS Region minimal 2 karakter"),
  AWS_ENDPOINT: z.string().url("Format AWS Endpoint tidak valid"),
  AWS_ACCESS_KEY_ID: z.string().min(8, "AWS Access Key minimal 8 karakter"),
  AWS_SECRET_ACCESS_KEY: z.string().min(8, "AWS Secret Key minimal 8 karakter"),
  AWS_BUCKET_NAME: z.string().min(3, "Bucket Name minimal 3 karakter"),
});

export default function StorageGatewayPage() {
  const [config, setConfig] = useState<Record<string, string>>({});
  const [censored, setCensored] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
    const validationData: Record<string, unknown> = {};
    const keysToUpdate = [
      "AWS_REGION",
      "AWS_ENDPOINT",
      "AWS_ACCESS_KEY_ID",
      "AWS_SECRET_ACCESS_KEY",
      "AWS_BUCKET_NAME",
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
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">
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
              <StorageConfigForm
                config={config}
                saving={saving}
                onInputChange={handleInputChange}
                onSave={handleSave}
                onReset={fetchConfig}
              />
              <div className="space-y-6">
                <StorageWebPOptimizerCard
                  stats={stats}
                  loading={statsLoading}
                  error={statsError}
                  onRefresh={fetchStats}
                />
                <StorageInfoCard />
              </div>
            </div>
          )}
        </div>
      </div>
    </GatewayPageWrapper>
  );
}
