"use client";

import { useEffect, useState } from "react";
import { getGatewayConfigByKey, updateGatewayConfigByKey, getNotificationLogs, NotificationLog } from "@/lib/actions/gateways";
import { 
  MessageCircle, 
  Save, 
  Loader2, 
  Eye,
  EyeOff,
  Lock
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { GatewayPageWrapper } from "@/components/page-guards/gateway-page-wrapper";

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

export default function WhatsappGatewayPage() {
  const [config, setConfig] = useState<Record<string, string>>({});
  const [censored, setCensored] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showVerifyToken, setShowVerifyToken] = useState(false);
  const [showAccessToken, setShowAccessToken] = useState(false);
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
      // Filter for whatsapp channel only
      setWaLogs(all.filter(l => l.channel === "whatsapp"));
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
    setSaving(true);

    try {
      const updates: Record<string, string> = {};
      const keysToUpdate = [
        "WA_API_URL",
        "WA_ACCESS_TOKEN",
        "WA_VERIFY_TOKEN",
        "WA_PHONE_NUMBER_ID"
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

      const res = await updateGatewayConfigByKey("whatsapp", updates);
      toast.success(res.message || "Konfigurasi WhatsApp berhasil disimpan!");
      
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

  // WA logs loaded dynamically from getNotificationLogs() (filtered channel=whatsapp)

  return (
    <GatewayPageWrapper>
    <div className="flex-1 flex flex-col pt-16 px-8 bg-[#080808] h-full overflow-y-auto">
      <div className="w-full max-w-5xl mx-auto space-y-8 pb-20">
        
        <div className="flex items-center gap-4 border-b border-white/5 pb-6">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
            <MessageCircle className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-light text-zinc-100 tracking-tight">
              WhatsApp Gateway
            </h1>
            <p className="text-xs text-zinc-500">
              Konfigurasi Cloud API WhatsApp Business untuk pengiriman notifikasi interaktif, tagihan otomatis, dan chat template.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
            <p className="text-xs text-zinc-500">Memuat konfigurasi WhatsApp gateway...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            <form onSubmit={handleSave} className="lg:col-span-2 space-y-6">
              
              <Card className="bg-[#0b0b0b]/60 border-white/5 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-emerald-500" /> WhatsApp Cloud API Credentials
                  </CardTitle>
                  <CardDescription className="text-[10px] text-zinc-500">
                    Kredensial resmi dari Meta Developer Console untuk modul pengiriman WhatsApp API.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="WA_API_URL" className="text-xs text-zinc-400">WhatsApp API URL Base</Label>
                    <Input
                      id="WA_API_URL"
                      type="text"
                      value={config.WA_API_URL || ""}
                      onChange={(e) => handleInputChange("WA_API_URL", e.target.value)}
                      placeholder="https://graph.facebook.com/v21.0"
                      className="bg-zinc-950/80 border-white/10 text-xs focus:border-emerald-500/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="WA_PHONE_NUMBER_ID" className="text-xs text-zinc-400">Phone Number ID</Label>
                    <Input
                      id="WA_PHONE_NUMBER_ID"
                      type="text"
                      value={config.WA_PHONE_NUMBER_ID || ""}
                      onChange={(e) => handleInputChange("WA_PHONE_NUMBER_ID", e.target.value)}
                      placeholder="e.g. 109384738291039"
                      className="bg-zinc-950/80 border-white/10 text-xs focus:border-emerald-500/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="WA_ACCESS_TOKEN" className="text-xs text-zinc-400">System User Access Token (Permanent)</Label>
                      <button
                        type="button"
                        onClick={() => setShowAccessToken(!showAccessToken)}
                        className="text-[10px] text-zinc-500 hover:text-zinc-300 flex items-center gap-1"
                      >
                        {showAccessToken ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        {showAccessToken ? "Sembunyikan" : "Tampilkan"}
                      </button>
                    </div>
                    <Input
                      id="WA_ACCESS_TOKEN"
                      type={showAccessToken ? "text" : "password"}
                      value={config.WA_ACCESS_TOKEN || ""}
                      onChange={(e) => handleInputChange("WA_ACCESS_TOKEN", e.target.value)}
                      placeholder="EAAGxxxxxxxxxxxxxxxxxxxxxxxxxxx..."
                      className="bg-zinc-950/80 border-white/10 text-xs focus:border-emerald-500/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="WA_VERIFY_TOKEN" className="text-xs text-zinc-400">Webhook Verify Token</Label>
                      <button
                        type="button"
                        onClick={() => setShowVerifyToken(!showVerifyToken)}
                        className="text-[10px] text-zinc-500 hover:text-zinc-300 flex items-center gap-1"
                      >
                        {showVerifyToken ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        {showVerifyToken ? "Sembunyikan" : "Tampilkan"}
                      </button>
                    </div>
                    <Input
                      id="WA_VERIFY_TOKEN"
                      type={showVerifyToken ? "text" : "password"}
                      value={config.WA_VERIFY_TOKEN || ""}
                      onChange={(e) => handleInputChange("WA_VERIFY_TOKEN", e.target.value)}
                      placeholder="Verify Token string..."
                      className="bg-zinc-950/80 border-white/10 text-xs focus:border-emerald-500/50"
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
                  className="bg-emerald-500 hover:bg-emerald-600 text-black font-semibold text-xs h-9 px-5 flex items-center gap-1.5"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Save Configuration
                </Button>
              </div>

            </form>

            <div className="space-y-6">
              <Card className="bg-[#0b0b0b]/40 border-white/5 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
                    Metrik Delivery WA
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
                  ) : waLogs.length === 0 ? (
                    <p className="text-[10px] text-zinc-600 text-center py-4">Belum ada log WhatsApp tersimpan.</p>
                  ) : (
                    waLogs.map((log) => (
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
                          <span className="truncate max-w-[120px]">{log.subject || "WA Notification"}</span>
                          <span>{formatRelativeTime(log.sentAt)}</span>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card className="bg-[#0b0b0b]/40 border-white/5 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Status API Meta</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-white/5">
                    <span className="text-zinc-400">Meta API Status</span>
                    <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[9px]">Normal</Badge>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-white/5">
                    <span className="text-zinc-400">Webhook Connection</span>
                    <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[9px]">Receiving Active</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">WA Terkirim (log)</span>
                    <Badge className="bg-zinc-500/10 text-zinc-300 border-zinc-500/20 text-[9px]">
                      {logsLoading ? "..." : waLogs.filter(l => l.status === "sent").length}
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
