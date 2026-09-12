import { useEffect, useState } from "react";
import { getGatewayConfigByKey, updateGatewayConfigByKey, getOltDevices, type OLTDevice } from "@/lib/actions/gateways";
import { Network, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { GatewayPageWrapper } from "@/components/page-guards/gateway-page-wrapper";
import { OltConfigForm } from "@/components/gateways/olt/OltConfigForm";
import { OltDeviceListCard } from "@/components/gateways/olt/OltDeviceListCard";
import { OltStatsCard } from "@/components/gateways/olt/OltStatsCard";
import { z } from "zod";

const oltSchema = z.object({
  DATABASE_URL: z.string().url("Format URL database tidak valid").startsWith("postgres://", "Database harus berupa URL PostgreSQL (postgres://)"),
  REDIS_ADDR: z.string().regex(/^[^:]+:\d+$/, "Format Redis Address harus host:port (contoh: redis:6379)"),
  OLT_ENCRYPTION_KEY: z.string().min(16, "Encryption Key minimal 16 karakter"),
  SNMP_TIMEOUT_SECONDS: z.coerce.number().int("SNMP Timeout harus berupa angka bulat").min(1, "SNMP Timeout minimal 1 detik").max(60, "SNMP Timeout maksimal 60 detik"),
  SSH_TIMEOUT_SECONDS: z.coerce.number().int("SSH Timeout harus berupa angka bulat").min(1, "SSH Timeout minimal 1 detik").max(60, "SSH Timeout maksimal 60 detik"),
  MAX_CONCURRENT_OLT_CONNECTIONS: z.coerce.number().int("Max concurrent connections harus berupa angka bulat").min(1, "Max concurrent connections minimal 1").max(1000, "Max concurrent connections maksimal 1000"),
});

export default function OltGatewayPage() {
  const [config, setConfig] = useState<Record<string, string>>({});
  const [censored, setCensored] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
    const validationData: Record<string, unknown> = {};
    const keysToUpdate = [
      "REDIS_ADDR",
      "DATABASE_URL",
      "OLT_ENCRYPTION_KEY",
      "SNMP_TIMEOUT_SECONDS",
      "SSH_TIMEOUT_SECONDS",
      "MAX_CONCURRENT_OLT_CONNECTIONS",
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
              <OltConfigForm
                config={config}
                saving={saving}
                onInputChange={handleInputChange}
                onSave={handleSave}
                onReset={fetchConfig}
              />
              <div className="space-y-6">
                <OltDeviceListCard devices={oltDevices} loading={devicesLoading} />
                <OltStatsCard devices={oltDevices} loading={devicesLoading} />
              </div>
            </div>
          )}
        </div>
      </div>
    </GatewayPageWrapper>
  );
}
