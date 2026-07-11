"use client";

import { useEffect, useState } from "react";
import { getGatewayConfigByKey, updateGatewayConfigByKey, getNotificationLogs, NotificationLog } from "@/lib/actions/gateways";
import { 
  MessageSquare, 
  Save, 
  Loader2, 
  Eye,
  EyeOff,
  Server,
  Lock,
  MessageCircle
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { GatewayPageWrapper } from "@/components/page-guards/gateway-page-wrapper";

import { z } from "zod";

const notificationSchema = z.object({
  GATEWAY_TOKEN: z.string().min(16, "Gateway Token minimal 16 karakter"),
  REDIS_ADDR: z.string().regex(/^[^:]+:\d+$/, "Format Redis Address harus host:port (contoh: redis:6379)"),
  TWILIO_ACCOUNT_SID: z.string().startsWith("AC", "Twilio Account SID harus diawali dengan 'AC'").length(34, "Account SID harus tepat 34 karakter"),
  TWILIO_AUTH_TOKEN: z.string().min(16, "Twilio Auth Token minimal 16 karakter"),
  TWILIO_FROM_NUMBER: z.string().min(3, "Twilio Sender ID / Number minimal 3 karakter")
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

export default function NotificationGatewayPage() {
  const [config, setConfig] = useState<Record<string, string>>({});
  const [censored, setCensored] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAuthToken, setShowAuthToken] = useState(false);
  const [showTwilioToken, setShowTwilioToken] = useState(false);
  const [notifLogs, setNotifLogs] = useState<NotificationLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const data = await getGatewayConfigByKey("notification");
      if (data.status === "ok") {
        const flatConfig: Record<string, string> = {};
        const flatCensored: Record<string, string> = {};
        
        // Flatten section data
        Object.values(data.sections).forEach((entries) => {
          entries.forEach((e) => {
            flatConfig[e.key] = e.censored; // Initialize UI with censored value
            flatCensored[e.key] = e.censored; // Keep reference of censored values
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

  const fetchNotifLogs = async () => {
    try {
      setLogsLoading(true);
      const data = await getNotificationLogs();
      setNotifLogs(data);
    } catch (err) {
      console.error("Gagal memuat notification logs:", err);
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
    fetchNotifLogs();
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
      "GATEWAY_TOKEN",
      "REDIS_ADDR",
      "TWILIO_ACCOUNT_SID",
      "TWILIO_AUTH_TOKEN",
      "TWILIO_FROM_NUMBER"
    ];

    keysToUpdate.forEach(k => {
      const currentValue = config[k] || "";
      const censoredValue = censored[k] || "";
      
      // If user deleted the value, send empty string.
      // If value has changed and doesn't contain bullet points (censored symbols), send it.
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
      const partialSchema = notificationSchema.partial();
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
      const res = await updateGatewayConfigByKey("notification", updates);
      toast.success(res.message || "Konfigurasi berhasil disimpan! Layanan sedang memuat ulang...");
      
      // Reload config after short delay to get new censored placeholders
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

  // Notification logs loaded dynamically from getNotificationLogs()

  return (
    <GatewayPageWrapper>
    <div className="flex-1 flex flex-col pt-16 px-8 bg-[#080808] h-full overflow-y-auto">
      <div className="w-full max-w-5xl mx-auto space-y-8 pb-20">
        
        {/* Header */}
        <div className="flex items-center gap-4 border-b border-white/5 pb-6">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-light text-zinc-100 tracking-tight">
              Notification Gateway
            </h1>
            <p className="text-xs text-zinc-500">
              Konfigurasi broker pengiriman pesan WhatsApp dan SMS menggunakan provider Twilio.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
            <p className="text-xs text-zinc-500">Memuat konfigurasi notification gateway...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Form Column */}
            <form onSubmit={handleSave} className="lg:col-span-2 space-y-6">
              
              {/* Internal Auth Details */}
              <Card className="bg-[#0b0b0b]/60 border-white/5 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-emerald-500" /> Keamanan & Akses Internal
                  </CardTitle>
                  <CardDescription className="text-[10px] text-zinc-500">
                    Token static yang digunakan untuk autentikasi komunikasi antar microservice.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="GATEWAY_TOKEN" className="text-xs text-zinc-400">Gateway Static Token</Label>
                      <button
                        type="button"
                        onClick={() => setShowAuthToken(!showAuthToken)}
                        className="text-[10px] text-zinc-500 hover:text-zinc-300 flex items-center gap-1"
                      >
                        {showAuthToken ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        {showAuthToken ? "Sembunyikan" : "Tampilkan"}
                      </button>
                    </div>
                    <Input
                      id="GATEWAY_TOKEN"
                      type={showAuthToken ? "text" : "password"}
                      value={config.GATEWAY_TOKEN || ""}
                      onChange={(e) => handleInputChange("GATEWAY_TOKEN", e.target.value)}
                      placeholder="Masukkan Token Baru..."
                      className="bg-zinc-950/80 border-white/10 text-xs focus:border-emerald-500/50"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Redis Connection Details */}
              <Card className="bg-[#0b0b0b]/60 border-white/5 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                    <Server className="w-4 h-4 text-emerald-500" /> Broker Antrean (Redis)
                  </CardTitle>
                  <CardDescription className="text-[10px] text-zinc-500">
                    Alamat koneksi Redis untuk asynq queue worker pengiriman WhatsApp/SMS.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="REDIS_ADDR" className="text-xs text-zinc-400">Redis Connection Host</Label>
                    <Input
                      id="REDIS_ADDR"
                      type="text"
                      value={config.REDIS_ADDR || ""}
                      onChange={(e) => handleInputChange("REDIS_ADDR", e.target.value)}
                      placeholder="127.0.0.1:6379"
                      className="bg-zinc-950/80 border-white/10 text-xs focus:border-emerald-500/50"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Twilio Credentials */}
              <Card className="bg-[#0b0b0b]/60 border-white/5 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-emerald-500" /> Twilio Provider Credentials
                  </CardTitle>
                  <CardDescription className="text-[10px] text-zinc-500">
                    Kredensial akun Twilio Anda untuk mengaktifkan modul SMS & WhatsApp Business API.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="TWILIO_ACCOUNT_SID" className="text-xs text-zinc-400">Twilio Account SID</Label>
                    <Input
                      id="TWILIO_ACCOUNT_SID"
                      type="text"
                      value={config.TWILIO_ACCOUNT_SID || ""}
                      onChange={(e) => handleInputChange("TWILIO_ACCOUNT_SID", e.target.value)}
                      placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      className="bg-zinc-950/80 border-white/10 text-xs focus:border-emerald-500/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="TWILIO_AUTH_TOKEN" className="text-xs text-zinc-400">Twilio Auth Token</Label>
                      <button
                        type="button"
                        onClick={() => setShowTwilioToken(!showTwilioToken)}
                        className="text-[10px] text-zinc-500 hover:text-zinc-300 flex items-center gap-1"
                      >
                        {showTwilioToken ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        {showTwilioToken ? "Sembunyikan" : "Tampilkan"}
                      </button>
                    </div>
                    <Input
                      id="TWILIO_AUTH_TOKEN"
                      type={showTwilioToken ? "text" : "password"}
                      value={config.TWILIO_AUTH_TOKEN || ""}
                      onChange={(e) => handleInputChange("TWILIO_AUTH_TOKEN", e.target.value)}
                      placeholder="Auth Token Baru..."
                      className="bg-zinc-950/80 border-white/10 text-xs focus:border-emerald-500/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="TWILIO_FROM_NUMBER" className="text-xs text-zinc-400">Twilio From Number (WhatsApp/SMS Sender ID)</Label>
                    <Input
                      id="TWILIO_FROM_NUMBER"
                      type="text"
                      value={config.TWILIO_FROM_NUMBER || ""}
                      onChange={(e) => handleInputChange("TWILIO_FROM_NUMBER", e.target.value)}
                      placeholder="whatsapp:+14155238886"
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

            {/* Live Logs / Info Column */}
            <div className="space-y-6">
              <Card className="bg-[#0b0b0b]/40 border-white/5 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
                    Antrean Pesan Terakhir
                    {logsLoading && <Loader2 className="w-3 h-3 animate-spin text-zinc-500" />}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {logsLoading ? (
                    <div className="space-y-3">
                      {[1,2,3].map(i => (
                        <div key={i} className="h-10 bg-zinc-800/40 rounded animate-pulse" />
                      ))}
                    </div>
                  ) : notifLogs.length === 0 ? (
                    <p className="text-[10px] text-zinc-600 text-center py-4">Belum ada log pengiriman tersimpan.</p>
                  ) : (
                    notifLogs.map((log) => (
                      <div key={log.id} className="border-b border-white/5 pb-3 last:border-b-0 last:pb-0 space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-medium text-zinc-200 truncate max-w-[140px]">{log.recipient}</span>
                          <Badge className={`text-[9px] px-1.5 py-0.5 border ${
                            log.status === "sent"
                              ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                              : "bg-red-500/10 text-red-500 border-red-500/20"
                          }`}>
                            {log.status}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center text-[9px] text-zinc-500 font-mono">
                          <span className="capitalize">{log.channel} • {log.id.slice(0, 8)}</span>
                          <span>{formatRelativeTime(log.sentAt)}</span>
                        </div>
                        {log.errorMessage && (
                          <p className="text-[9px] text-red-400 mt-1 truncate">{log.errorMessage}</p>
                        )}
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card className="bg-[#0b0b0b]/40 border-white/5 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Statistik Pengiriman</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-white/5">
                    <span className="text-zinc-400">Total Dikirim</span>
                    <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[9px]">
                      {logsLoading ? "..." : notifLogs.filter(l => l.status === "sent").length}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Total Gagal</span>
                    <Badge className={`text-[9px] ${
                      !logsLoading && notifLogs.filter(l => l.status === "failed").length > 0
                        ? "bg-red-500/10 text-red-500 border-red-500/20"
                        : "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
                    }`}>
                      {logsLoading ? "..." : notifLogs.filter(l => l.status === "failed").length}
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
