import { useEffect, useState } from "react";
import { getGatewayConfigByKey, updateGatewayConfigByKey, getNotificationLogs, type NotificationLog } from "@/lib/actions/gateways";
import { MessageCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { GatewayPageWrapper } from "@/components/page-guards/gateway-page-wrapper";
import { WhatsappConfigForm } from "@/components/gateways/whatsapp/WhatsappConfigForm";
import { WhatsappLogsCard } from "@/components/gateways/whatsapp/WhatsappLogsCard";
import { WhatsappMetaStatusCard } from "@/components/gateways/whatsapp/WhatsappMetaStatusCard";
import { z } from "zod";

const whatsappSchema = z.object({
  WA_API_URL: z.string().url("Format WhatsApp API URL tidak valid"),
  WA_ACCESS_TOKEN: z.string().min(10, "Access Token minimal 10 karakter"),
  WA_VERIFY_TOKEN: z.string().min(8, "Verify Token minimal 8 karakter"),
  WA_PHONE_NUMBER_ID: z.string().regex(/^\d+$/, "Phone Number ID harus berupa angka").min(10, "Phone Number ID minimal 10 digit"),
});

export default function WhatsappGatewayPage() {
  const [config, setConfig] = useState<Record<string, string>>({});
  const [censored, setCensored] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [waLogs, setWaLogs] = useState<NotificationLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const data = await getGatewayConfigByKey("whatsapp");
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

  const fetchWaLogs = async () => {
    try {
      setLogsLoading(true);
      const all = await getNotificationLogs();
      setWaLogs(all.filter((l) => l.channel === "whatsapp"));
    } catch (err) {
      console.error("Gagal memuat WhatsApp logs:", err);
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
    fetchWaLogs();
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
      "WA_API_URL",
      "WA_ACCESS_TOKEN",
      "WA_VERIFY_TOKEN",
      "WA_PHONE_NUMBER_ID",
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
      const partialSchema = whatsappSchema.partial();
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
      const res = await updateGatewayConfigByKey("whatsapp", updates);
      toast.success(res.message || "Konfigurasi WhatsApp berhasil disimpan!");
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
              <MessageCircle className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">
                WhatsApp Gateway
              </h1>
              <p className="text-xs text-muted-foreground">
                Konfigurasi Cloud API WhatsApp Business untuk pengiriman notifikasi interaktif, tagihan otomatis, dan chat template.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-xs text-muted-foreground">Memuat konfigurasi WhatsApp gateway...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <WhatsappConfigForm
                config={config}
                saving={saving}
                onInputChange={handleInputChange}
                onSave={handleSave}
                onReset={fetchConfig}
              />
              <div className="space-y-6">
                <WhatsappLogsCard logs={waLogs} loading={logsLoading} />
                <WhatsappMetaStatusCard logs={waLogs} loading={logsLoading} />
              </div>
            </div>
          )}
        </div>
      </div>
    </GatewayPageWrapper>
  );
}
