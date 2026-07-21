"use client";

import { useEffect, useState } from "react";
import { getGatewayConfigByKey, updateGatewayConfigByKey, getRecentPayments, triggerPaymentReconciliation, PaymentTransaction } from "@/lib/actions/gateways";
import { 
  CreditCard, 
  Save, 
  Loader2, 
  Eye,
  EyeOff,
  Server,
  Lock,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@k2net/ui";
import { Button } from "@k2net/ui";
import { Input } from "@k2net/ui";
import { Label } from "@k2net/ui";
import { toast } from "sonner";
import { Badge } from "@k2net/ui";
import { GatewayPageWrapper } from "@/components/page-guards/gateway-page-wrapper";
import { z } from "zod";

const paymentSchema = z.object({
  XENDIT_API_KEY: z.string().startsWith("xnd_", "API Key Xendit harus diawali dengan 'xnd_'").min(16, "Xendit API Key minimal 16 karakter"),
  XENDIT_WEBHOOK_KEY: z.string().min(16, "Xendit Webhook Key minimal 16 karakter"),
  CORE_API_URL: z.string().url("Format URL Core API tidak valid")
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

export default function PaymentGatewayPage() {
  const [config, setConfig] = useState<Record<string, string>>({});
  const [censored, setCensored] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reconciling, setReconciling] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showWebhookKey, setShowWebhookKey] = useState(false);
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
    const validationData: Record<string, any> = {};
    const keysToUpdate = [
      "XENDIT_API_KEY",
      "XENDIT_WEBHOOK_KEY",
      "CORE_API_URL"
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

  // Live transactions loaded from database


  return (
    <GatewayPageWrapper>
    <div className="flex-1 flex flex-col pt-16 px-4 md:px-8 bg-background h-full overflow-y-auto">
      <div className="w-full max-w-5xl mx-auto space-y-8 pb-20">
        
        {/* Header */}
        <div className="flex items-center gap-4 border-b border-border pb-6">
          <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-light text-zinc-100 tracking-tight">
              Payment Gateway
            </h1>
            <p className="text-xs text-zinc-500">
              Urus integrasi pembayaran, kunci API Xendit, token webhook, serta sinkronisasi penagihan invoice.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-xs text-zinc-500">Memuat konfigurasi payment gateway...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Form Column */}
            <form onSubmit={handleSave} className="lg:col-span-2 space-y-6">
              
              {/* Xendit Keys */}
              <Card className="bg-card/60 border-border shadow-xl">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-primary" /> Kredensial Provider Xendit
                  </CardTitle>
                  <CardDescription className="text-[10px] text-zinc-500">
                    Kredensial API Key dan Token Webhook dari Dashboard Xendit untuk memvalidasi callback pembayaran.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="XENDIT_API_KEY" className="text-xs text-zinc-400">Xendit Secret API Key</Label>
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="text-[10px] text-zinc-500 hover:text-zinc-300 flex items-center gap-1"
                      >
                        {showApiKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        {showApiKey ? "Sembunyikan" : "Tampilkan"}
                      </button>
                    </div>
                    <Input
                      id="XENDIT_API_KEY"
                      type={showApiKey ? "text" : "password"}
                      value={config.XENDIT_API_KEY || ""}
                      onChange={(e) => handleInputChange("XENDIT_API_KEY", e.target.value)}
                      placeholder="xnd_development_xxxxxxxxxxxxxxxxxxxxxx"
                      className="bg-input border-border text-foreground text-xs focus:border-primary/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="XENDIT_WEBHOOK_KEY" className="text-xs text-zinc-400">Xendit Webhook Verification Key</Label>
                      <button
                        type="button"
                        onClick={() => setShowWebhookKey(!showWebhookKey)}
                        className="text-[10px] text-zinc-500 hover:text-zinc-300 flex items-center gap-1"
                      >
                        {showWebhookKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        {showWebhookKey ? "Sembunyikan" : "Tampilkan"}
                      </button>
                    </div>
                    <Input
                      id="XENDIT_WEBHOOK_KEY"
                      type={showWebhookKey ? "text" : "password"}
                      value={config.XENDIT_WEBHOOK_KEY || ""}
                      onChange={(e) => handleInputChange("XENDIT_WEBHOOK_KEY", e.target.value)}
                      placeholder="Webhook Verification Token..."
                      className="bg-input border-border text-foreground text-xs focus:border-primary/50"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Core System Integration */}
              <Card className="bg-card/60 border-border shadow-xl">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                    <Server className="w-4 h-4 text-primary" /> Integrasi Core System
                  </CardTitle>
                  <CardDescription className="text-[10px] text-zinc-500">
                    Endpoint API Core System (Spring Boot) yang digunakan untuk sinkronisasi status tagihan setelah pembayaran sukses.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="CORE_API_URL" className="text-xs text-zinc-400">Core System Base URL</Label>
                    <Input
                      id="CORE_API_URL"
                      type="text"
                      value={config.CORE_API_URL || ""}
                      onChange={(e) => handleInputChange("CORE_API_URL", e.target.value)}
                      placeholder="http://127.0.0.1:9090"
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

            {/* Reconciliation panel / Live stats Column */}
            <div className="space-y-6">
              
              {/* Reconciliation Panel */}
              <Card className="bg-card border-border shadow-xl">
                <CardHeader>
                  <CardTitle className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Rekonsiliasi Manual</CardTitle>
                  <CardDescription className="text-[10px] text-zinc-500">
                    Picunya peninjauan status manual ke API Xendit jika webhook tertunda atau terlewat.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    type="button"
                    onClick={handleReconciliation}
                    disabled={reconciling}
                    variant="outline"
                    className="w-full border-white/10 hover:border-primary/30 bg-zinc-950 text-zinc-300 hover:text-zinc-100 text-xs gap-2 transition-all py-5"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${reconciling ? "animate-spin text-primary" : ""}`} />
                    Trigger Reconciliation
                  </Button>
                  <div className="flex items-center gap-2 text-[9px] text-zinc-500">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Terakhir berjalan otomatis: 15 menit yang lalu</span>
                  </div>
                </CardContent>
              </Card>

              {/* Transactions list */}
              <Card className="bg-card border-border shadow-xl">
                <CardHeader>
                  <CardTitle className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
                    Transaksi Terkini
                    {txLoading && <Loader2 className="w-3 h-3 animate-spin text-zinc-500" />}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {txLoading ? (
                    <div className="space-y-3">
                      {[1,2,3].map(i => (
                        <div key={i} className="h-10 bg-muted/40 rounded animate-pulse" />
                      ))}
                    </div>
                  ) : transactions.length === 0 ? (
                    <p className="text-[10px] text-zinc-600 text-center py-4">Belum ada riwayat transaksi.</p>
                  ) : (
                    transactions.map((tx) => (
                      <div key={tx.id} className="border-b border-border pb-3 last:border-b-0 last:pb-0 space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-medium text-zinc-200 truncate max-w-[140px] font-mono">
                            {tx.externalId.split(":").pop()?.slice(0, 12)}
                          </span>
                          <span className="text-xs text-zinc-400 font-mono">
                            Rp {tx.amount.toLocaleString("id-ID")}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center text-[9px] text-zinc-500">
                          <span>Org: {tx.orgSlug} ({tx.planName})</span>
                          <div className="flex items-center gap-1.5">
                            <Badge className={`text-[8px] px-1 py-0 border ${
                              tx.status === "PAID" || tx.status === "SUCCESS"
                                ? "bg-primary/10 text-primary border-primary/20"
                                : tx.status === "PENDING"
                                ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                : "bg-red-500/10 text-red-500 border-red-500/20"
                            }`}>
                              {tx.status}
                            </Badge>
                            <span>{formatRelativeTime(tx.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
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
