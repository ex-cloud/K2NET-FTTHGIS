import { useEffect, useState } from "react";
import { getGatewayConfigByKey, updateGatewayConfigByKey, getRecentPayments, triggerPaymentReconciliation, type PaymentTransaction } from "@/lib/actions/gateways";
import { CreditCard, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { GatewayPageWrapper } from "@/components/page-guards/gateway-page-wrapper";
import { PaymentConfigForm } from "@/components/gateways/payment/PaymentConfigForm";
import { PaymentReconciliationCard } from "@/components/gateways/payment/PaymentReconciliationCard";
import { PaymentTransactionsCard } from "@/components/gateways/payment/PaymentTransactionsCard";
import { z } from "zod";

const paymentSchema = z.object({
  XENDIT_API_KEY: z.string().startsWith("xnd_", "API Key Xendit harus diawali dengan 'xnd_'").min(16, "Xendit API Key minimal 16 karakter"),
  XENDIT_WEBHOOK_KEY: z.string().min(16, "Xendit Webhook Key minimal 16 karakter"),
  CORE_API_URL: z.string().url("Format URL Core API tidak valid"),
});

export default function PaymentGatewayPage() {
  const [config, setConfig] = useState<Record<string, string>>({});
  const [censored, setCensored] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reconciling, setReconciling] = useState(false);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [txLoading, setTxLoading] = useState(true);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const data = await getGatewayConfigByKey("payment");
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

  const fetchTransactions = async () => {
    try {
      setTxLoading(true);
      const data = await getRecentPayments();
      setTransactions(data);
    } catch (err) {
      console.error("Gagal memuat transaksi:", err);
    } finally {
      setTxLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
    fetchTransactions();
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
      "XENDIT_API_KEY",
      "XENDIT_WEBHOOK_KEY",
      "CORE_API_URL",
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
      const partialSchema = paymentSchema.partial();
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
      const res = await updateGatewayConfigByKey("payment", updates);
      toast.success(res.message || "Konfigurasi payment berhasil disimpan!");
      setTimeout(fetchConfig, 3000);
    } catch (err) {
      console.error(err);
      toast.error("Gagal menyimpan konfigurasi: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSaving(false);
    }
  };

  const handleReconciliation = async () => {
    try {
      setReconciling(true);
      const res = await triggerPaymentReconciliation();
      if (res.success) {
        toast.success(res.message || "Sinkronisasi rekonsiliasi manual selesai!");
        await fetchTransactions();
      } else {
        toast.error("Gagal melakukan rekonsiliasi");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error rekonsiliasi: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setReconciling(false);
    }
  };

  return (
    <GatewayPageWrapper>
      <div className="flex-1 flex flex-col pt-16 px-4 md:px-8 bg-background h-full overflow-y-auto">
        <div className="w-full max-w-5xl mx-auto space-y-8 pb-20">
          <div className="flex items-center gap-4 border-b border-border pb-6">
            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">
                Payment Gateway
              </h1>
              <p className="text-xs text-muted-foreground">
                Urus integrasi pembayaran, kunci API Xendit, token webhook, serta sinkronisasi penagihan invoice.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-xs text-muted-foreground">Memuat konfigurasi payment gateway...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <PaymentConfigForm
                config={config}
                saving={saving}
                onInputChange={handleInputChange}
                onSave={handleSave}
                onReset={fetchConfig}
              />
              <div className="space-y-6">
                <PaymentReconciliationCard
                  reconciling={reconciling}
                  onReconciliation={handleReconciliation}
                />
                <PaymentTransactionsCard
                  transactions={transactions}
                  loading={txLoading}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </GatewayPageWrapper>
  );
}
