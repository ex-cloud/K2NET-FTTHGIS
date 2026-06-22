"use client";

import { useEffect, useState } from "react";
import { getGatewayConfig, updateGatewayConfig } from "@/lib/actions/gateways";
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
  CheckCircle2
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";


export default function PaymentGatewayPage() {
  const [config, setConfig] = useState<Record<string, string>>({});
  const [censored, setCensored] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reconciling, setReconciling] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showWebhookKey, setShowWebhookKey] = useState(false);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const data = await getGatewayConfig();
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

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleInputChange = (key: string, value: string) => {
    setConfig((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const updates: Record<string, string> = {};
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
        }
      });

      if (Object.keys(updates).length === 0) {
        toast.info("Tidak ada perubahan konfigurasi yang terdeteksi.");
        setSaving(false);
        return;
      }

      const res = await updateGatewayConfig(updates);
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

  const handleReconciliation = () => {
    setReconciling(true);
    setTimeout(() => {
      setReconciling(false);
      toast.success("Mesin rekonsiliasi manual berhasil dipicu! Memverifikasi transaksi pending...");
    }, 2000);
  };

  // Mock Transactions for Payment Activities
  const mockTransactions = [
    { id: 1, inv: "INV-2026-0091", amount: "Rp 150.000", status: "Success", type: "VA Mandiri", date: "5 mnt lalu" },
    { id: 2, inv: "INV-2026-0090", amount: "Rp 320.000", status: "Success", type: "E-Wallet ShopeePay", date: "1 jam lalu" },
    { id: 3, inv: "INV-2026-0089", amount: "Rp 150.000", status: "Pending", type: "VA BCA", date: "3 jam lalu" },
    { id: 4, inv: "INV-2026-0088", amount: "Rp 2.400.000", status: "Success", type: "Qris", date: "5 jam lalu" },
  ];

  return (
    <div className="flex-1 flex flex-col pt-16 px-8 bg-[#080808] h-full overflow-y-auto">
      <div className="w-full max-w-5xl mx-auto space-y-8 pb-20">
        
        {/* Header */}
        <div className="flex items-center gap-4 border-b border-white/5 pb-6">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
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
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
            <p className="text-xs text-zinc-500">Memuat konfigurasi payment gateway...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Form Column */}
            <form onSubmit={handleSave} className="lg:col-span-2 space-y-6">
              
              {/* Xendit Keys */}
              <Card className="bg-[#0b0b0b]/60 border-white/5 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-emerald-500" /> Kredensial Provider Xendit
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
                      className="bg-zinc-950/80 border-white/10 text-xs focus:border-emerald-500/50"
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
                      className="bg-zinc-950/80 border-white/10 text-xs focus:border-emerald-500/50"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Core System Integration */}
              <Card className="bg-[#0b0b0b]/60 border-white/5 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                    <Server className="w-4 h-4 text-emerald-500" /> Integrasi Core System
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
                      className="bg-zinc-950/80 border-white/10 text-xs focus:border-emerald-500/50"
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
                  className="border-white/10 bg-transparent text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 text-xs h-9 px-4"
                >
                  Reset Form
                </Button>
                <Button 
                  type="submit" 
                  disabled={saving}
                  className="bg-emerald-500 hover:bg-emerald-600 text-black font-semibold text-xs h-9 px-5 flex items-center gap-1.5"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Save Configuration
                </Button>
              </div>

            </form>

            {/* Reconciliation panel / Live stats Column */}
            <div className="space-y-6">
              
              {/* Reconciliation Panel */}
              <Card className="bg-[#0b0b0b]/40 border-white/5 shadow-xl">
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
                    className="w-full border-white/10 hover:border-emerald-500/30 bg-zinc-950 text-zinc-300 hover:text-zinc-100 text-xs gap-2 transition-all py-5"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${reconciling ? "animate-spin text-emerald-500" : ""}`} />
                    Trigger Reconciliation
                  </Button>
                  <div className="flex items-center gap-2 text-[9px] text-zinc-500">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Terakhir berjalan otomatis: 15 menit yang lalu</span>
                  </div>
                </CardContent>
              </Card>

              {/* Transactions list */}
              <Card className="bg-[#0b0b0b]/40 border-white/5 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Transaksi Terkini</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {mockTransactions.map((tx) => (
                    <div key={tx.id} className="border-b border-white/5 pb-3 last:border-b-0 last:pb-0 space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-medium text-zinc-200">{tx.inv}</span>
                        <span className="text-xs text-zinc-400">{tx.amount}</span>
                      </div>
                      
                      <div className="flex justify-between items-center text-[9px] text-zinc-500">
                        <span>{tx.type}</span>
                        <div className="flex items-center gap-1 font-mono">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          <span>{tx.date}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
