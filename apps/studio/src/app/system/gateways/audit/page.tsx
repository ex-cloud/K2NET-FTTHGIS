"use client";

import { useEffect, useState } from "react";
import { getGatewayConfigByKey, updateGatewayConfigByKey, getAuditEvents, AuditEvent } from "@/lib/actions/gateways";
import { 
  FileText, 
  Save, 
  Loader2, 
  Server,
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

export default function AuditGatewayPage() {
  const [config, setConfig] = useState<Record<string, string>>({});
  const [censored, setCensored] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditEvent[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const data = await getGatewayConfigByKey("audit");
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

  const fetchAuditLogs = async () => {
    try {
      setLogsLoading(true);
      const data = await getAuditEvents();
      setAuditLogs(data.slice(0, 10));
    } catch (err) {
      console.error("Gagal memuat audit logs:", err);
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
    fetchAuditLogs();
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
        "DATABASE_URL",
        "RETENTION_DAYS"
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

      const res = await updateGatewayConfigByKey("audit", updates);
      toast.success(res.message || "Konfigurasi Audit Gateway berhasil disimpan!");
      
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

  // Audit logs loaded dynamically from getAuditEvents()

  return (
    <GatewayPageWrapper>
    <div className="flex-1 flex flex-col pt-16 px-8 bg-[#080808] h-full overflow-y-auto">
      <div className="w-full max-w-5xl mx-auto space-y-8 pb-20">
        
        <div className="flex items-center gap-4 border-b border-white/5 pb-6">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-light text-zinc-100 tracking-tight">
              Audit Gateway
            </h1>
            <p className="text-xs text-zinc-500">
              Konfigurasi pencatatan aktivitas, retensi kepatuhan log, dan perlindungan jejak audit sistem.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
            <p className="text-xs text-zinc-500">Memuat konfigurasi audit gateway...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            <form onSubmit={handleSave} className="lg:col-span-2 space-y-6">
              
              <Card className="bg-[#0b0b0b]/60 border-white/5 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                    <Server className="w-4 h-4 text-emerald-500" /> Database Connection
                  </CardTitle>
                  <CardDescription className="text-[10px] text-zinc-500">
                    Koneksi PostgreSQL database untuk penyimpanan log kepatuhan audit.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="DATABASE_URL" className="text-xs text-zinc-400">Database Connection URL</Label>
                    <Input
                      id="DATABASE_URL"
                      type="password"
                      value={config.DATABASE_URL || ""}
                      onChange={(e) => handleInputChange("DATABASE_URL", e.target.value)}
                      placeholder="postgres://..."
                      className="bg-zinc-950/80 border-white/10 text-xs focus:border-emerald-500/50"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#0b0b0b]/60 border-white/5 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-emerald-500" /> Retention & Compliance
                  </CardTitle>
                  <CardDescription className="text-[10px] text-zinc-500">
                    Aturan pembersihan otomatis dan batas waktu penyimpanan log.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="RETENTION_DAYS" className="text-xs text-zinc-400">Retention Period (Days)</Label>
                    <Input
                      id="RETENTION_DAYS"
                      type="number"
                      value={config.RETENTION_DAYS || ""}
                      onChange={(e) => handleInputChange("RETENTION_DAYS", e.target.value)}
                      placeholder="365"
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
                    Aktivitas Audit Terkini
                    {logsLoading && <Loader2 className="w-3 h-3 animate-spin text-zinc-500" />}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {logsLoading ? (
                    <div className="space-y-3">
                      {[1,2,3].map(i => (
                        <div key={i} className="h-8 bg-zinc-800/40 rounded animate-pulse" />
                      ))}
                    </div>
                  ) : auditLogs.length === 0 ? (
                    <p className="text-[10px] text-zinc-600 text-center py-4">Belum ada log audit tercatat.</p>
                  ) : (
                    auditLogs.map((log) => (
                      <div key={log.id} className="border-b border-white/5 pb-3 last:border-b-0 last:pb-0 space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-medium text-zinc-200 font-mono">{log.action}</span>
                          <Badge className={`text-[9px] px-1.5 py-0.5 border ${
                            log.status === "success"
                              ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                              : log.status === "denied"
                              ? "bg-red-500/10 text-red-500 border-red-500/20"
                              : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          }`}>
                            {log.status}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center text-[9px] text-zinc-500 font-mono">
                          <span>@{log.username || log.userId}</span>
                          <span>{formatRelativeTime(log.createdAt)}</span>
                        </div>
                        {log.target && (
                          <div className="text-[9px] text-zinc-600 truncate">Target: {log.target}</div>
                        )}
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
