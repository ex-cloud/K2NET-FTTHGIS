

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
  MessageCircle,
  Sparkles,
  Copy
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Input, Label, Badge, ActionTooltip, UniversalContextMenu, ContextMenuGroupConfig } from "@k2net/ui";
import { toast } from "sonner";
import { GatewayPageWrapper } from "@/components/page-guards/gateway-page-wrapper";
import { PermissionGuard } from "@/hooks/use-permissions";

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

  const getNotifContextMenuGroups = (log: NotificationLog): ContextMenuGroupConfig[] => [
    {
      items: [
        {
          label: "Tanya AI Status Notifikasi",
          icon: Sparkles,
          shortcut: "Ctrl+J",
          onClick: () => {
            window.dispatchEvent(
              new CustomEvent("k2net-ai-prompt-input", {
                detail: {
                  prompt: `Analisa log pengiriman notifikasi ke ${log.recipient} via channel ${log.channel}. Status: ${log.status}. ${log.errorMessage ? `Error: ${log.errorMessage}` : "Pengiriman berhasil."}`,
                },
              })
            );
            window.dispatchEvent(new CustomEvent("k2net-toggle-ai-assistant"));
          },
        },
      ],
    },
    {
      items: [
        {
          label: "Salin Nomor Tujuan",
          icon: Copy,
          shortcut: "Ctrl+C",
          onClick: () => {
            navigator.clipboard.writeText(log.recipient);
            toast.success(`Nomor ${log.recipient} disalin!`);
          },
        },
        {
          label: "Salin ID Pengiriman",
          icon: MessageSquare,
          shortcut: "Alt+C",
          onClick: () => {
            navigator.clipboard.writeText(log.id);
            toast.success(`ID log ${log.id} disalin!`);
          },
        },
      ],
    },
  ];

  return (
    <GatewayPageWrapper>
    <div className="flex-1 flex flex-col pt-16 px-4 md:px-8 bg-background h-full overflow-y-auto">
      <div className="w-full max-w-5xl mx-auto space-y-8 pb-20">
        
        {/* Header */}
        <div className="flex items-center gap-4 border-b border-border pb-6">
          <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              Notification Gateway
            </h1>
            <p className="text-xs text-muted-foreground">
              Konfigurasi broker pengiriman pesan WhatsApp dan SMS menggunakan provider Twilio.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-xs text-muted-foreground">Memuat konfigurasi notification gateway...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Form Column */}
            <form onSubmit={handleSave} className="lg:col-span-2 space-y-6">
              
              {/* Internal Auth Details */}
              <Card glowingEffect className="bg-card/60 border-border shadow-xl">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Lock className="w-4 h-4 text-primary" /> Keamanan & Akses Internal
                  </CardTitle>
                  <CardDescription className="text-[10px] text-muted-foreground">
                    Token static yang digunakan untuk autentikasi komunikasi antar microservice.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="GATEWAY_TOKEN" className="text-xs text-muted-foreground">Gateway Static Token</Label>
                      <button
                        type="button"
                        onClick={() => setShowAuthToken(!showAuthToken)}
                        className="text-[10px] text-muted-foreground hover:text-muted-foreground flex items-center gap-1"
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
                      className="bg-input border-border text-foreground text-xs focus:border-primary/50"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Redis Connection Details */}
              <Card glowingEffect className="bg-card/60 border-border shadow-xl">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Server className="w-4 h-4 text-primary" /> Broker Antrean (Redis)
                  </CardTitle>
                  <CardDescription className="text-[10px] text-muted-foreground">
                    Alamat koneksi Redis untuk asynq queue worker pengiriman WhatsApp/SMS.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="REDIS_ADDR" className="text-xs text-muted-foreground">Redis Connection Host</Label>
                    <Input
                      id="REDIS_ADDR"
                      type="text"
                      value={config.REDIS_ADDR || ""}
                      onChange={(e) => handleInputChange("REDIS_ADDR", e.target.value)}
                      placeholder="127.0.0.1:6379"
                      className="bg-input border-border text-foreground text-xs focus:border-primary/50"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Twilio Credentials */}
              <Card glowingEffect className="bg-card/60 border-border shadow-xl">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-primary" /> Twilio Provider Credentials
                  </CardTitle>
                  <CardDescription className="text-[10px] text-muted-foreground">
                    Kredensial akun Twilio Anda untuk mengaktifkan modul SMS & WhatsApp Business API.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="TWILIO_ACCOUNT_SID" className="text-xs text-muted-foreground">Twilio Account SID</Label>
                    <Input
                      id="TWILIO_ACCOUNT_SID"
                      type="text"
                      value={config.TWILIO_ACCOUNT_SID || ""}
                      onChange={(e) => handleInputChange("TWILIO_ACCOUNT_SID", e.target.value)}
                      placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      className="bg-input border-border text-foreground text-xs focus:border-primary/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="TWILIO_AUTH_TOKEN" className="text-xs text-muted-foreground">Twilio Auth Token</Label>
                      <button
                        type="button"
                        onClick={() => setShowTwilioToken(!showTwilioToken)}
                        className="text-[10px] text-muted-foreground hover:text-muted-foreground flex items-center gap-1"
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
                      className="bg-input border-border text-foreground text-xs focus:border-primary/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="TWILIO_FROM_NUMBER" className="text-xs text-muted-foreground">Twilio From Number (WhatsApp/SMS Sender ID)</Label>
                    <Input
                      id="TWILIO_FROM_NUMBER"
                      type="text"
                      value={config.TWILIO_FROM_NUMBER || ""}
                      onChange={(e) => handleInputChange("TWILIO_FROM_NUMBER", e.target.value)}
                      placeholder="whatsapp:+14155238886"
                      className="bg-input border-border text-foreground text-xs focus:border-primary/50"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3">
                <ActionTooltip label="Kembalikan Nilai Form" shortcut="Alt+R">
                  <Button 
                    type="button" 
                    onClick={fetchConfig} 
                    variant="outline"
                    className="border-border bg-transparent text-muted-foreground hover:text-foreground hover:bg-accent text-xs h-9 px-4"
                  >
                    Reset Form
                  </Button>
                </ActionTooltip>
                <PermissionGuard permission="system.gateway.manage">
                  <ActionTooltip label="Simpan Konfigurasi Notification Gateway" shortcut="Ctrl+S">
                    <Button 
                      type="submit" 
                      disabled={saving}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs h-9 px-5 flex items-center gap-1.5"
                    >
                      {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      Save Configuration
                    </Button>
                  </ActionTooltip>
                </PermissionGuard>
              </div>

            </form>

            {/* Live Logs / Info Column */}
            <div className="space-y-6">
              <Card glowingEffect className="bg-card border-border shadow-xl">
                <CardHeader>
                  <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                    Antrean Pesan Terakhir
                    {logsLoading && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {logsLoading ? (
                    <div className="space-y-3">
                      {[1,2,3].map(i => (
                        <div key={i} className="h-10 bg-muted/40 rounded animate-pulse" />
                      ))}
                    </div>
                  ) : notifLogs.length === 0 ? (
                    <p className="text-[10px] text-muted-foreground/60 text-center py-4">Belum ada log pengiriman tersimpan.</p>
                  ) : (
                    notifLogs.map((log) => (
                      <UniversalContextMenu key={log.id} groups={getNotifContextMenuGroups(log)}>
                        <div className="border-b border-border pb-3 last:border-b-0 last:pb-0 space-y-1 cursor-context-menu hover:bg-muted/10 p-1.5 rounded transition-colors">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-medium text-foreground truncate max-w-[140px]">{log.recipient}</span>
                            <Badge className={`text-[9px] px-1.5 py-0.5 border ${
                              log.status === "sent"
                                ? "bg-primary/10 text-primary border-primary/20"
                                : "bg-rose-500/10 text-rose-500 border-rose-500/20"
                            }`}>
                              {log.status}
                            </Badge>
                          </div>
                          <div className="flex justify-between items-center text-[9px] text-muted-foreground font-mono">
                            <span className="capitalize">{log.channel} • {log.id.slice(0, 8)}</span>
                            <span>{formatRelativeTime(log.sentAt)}</span>
                          </div>
                          {log.errorMessage && (
                            <p className="text-[9px] text-rose-400 mt-1 truncate">{log.errorMessage}</p>
                          )}
                        </div>
                      </UniversalContextMenu>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card glowingEffect className="bg-card border-border shadow-xl">
                <CardHeader>
                  <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Statistik Pengiriman</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-border">
                    <span className="text-muted-foreground">Total Dikirim</span>
                    <Badge className="bg-primary/10 text-primary border-primary/20 text-[9px]">
                      {logsLoading ? "..." : notifLogs.filter(l => l.status === "sent").length}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Total Gagal</span>
                    <Badge className={`text-[9px] ${
                      !logsLoading && notifLogs.filter(l => l.status === "failed").length > 0
                        ? "bg-rose-500/10 text-rose-500 border-rose-500/20"
                        : "bg-muted/10 text-muted-foreground border-border"
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
