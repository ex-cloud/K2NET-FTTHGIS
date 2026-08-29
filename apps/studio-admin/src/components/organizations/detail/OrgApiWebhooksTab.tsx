"use client";

import { useState } from "react";
import {
  Badge,
  Button,
  Card,
  Input,
  Label,
  Checkbox,
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@k2net/ui";
import {
  Key,
  Webhook,
  Copy,
  Eye,
  EyeOff,
  RefreshCw,
  Send,
  Activity,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { EnrichedOrganization } from "../types";

interface OrgApiWebhooksTabProps {
  organization: EnrichedOrganization;
}

export function OrgApiWebhooksTab({ organization: org }: OrgApiWebhooksTabProps) {
  const [apiKey, setApiKey] = useState(`k2_live_${org.slug}_8f9a2b7c4d1e0f3a`);
  const [showKey, setShowKey] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  // Webhook Form State
  const [webhookUrl, setWebhookUrl] = useState(`https://noc.isp-${org.slug}.net/api/v1/alerts/fiber-los`);
  const [webhookSecret, setWebhookSecret] = useState(`whsec_${org.slug}_992384a1`);
  const [subscribedEvents, setSubscribedEvents] = useState({
    fiberCut: true,
    oltDown: true,
    odpFull: true,
    quotaAlert: false,
  });

  const [testingPing, setTestingPing] = useState(false);
  const [lastPingResult, setLastPingResult] = useState<{
    status: number;
    latencyMs: number;
    timestamp: string;
  } | null>(null);

  // Recent Delivery Logs
  const [deliveryLogs, setDeliveryLogs] = useState([
    {
      id: "del-1",
      event: "cable.fiber_cut",
      targetUrl: "https://noc.isp-kircon.net/api/v1/alerts/fiber-los",
      status: 200,
      latencyMs: 42,
      timestamp: "2026-08-29 05:42 WIB",
    },
    {
      id: "del-2",
      event: "device.olt_heartbeat",
      targetUrl: "https://noc.isp-kircon.net/api/v1/alerts/fiber-los",
      status: 200,
      latencyMs: 38,
      timestamp: "2026-08-29 02:15 WIB",
    },
    {
      id: "del-3",
      event: "odp.capacity_warning",
      targetUrl: "https://noc.isp-kircon.net/api/v1/alerts/fiber-los",
      status: 200,
      latencyMs: 51,
      timestamp: "2026-08-28 14:10 WIB",
    },
  ]);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} disalin ke clipboard.`);
  };

  const handleRegenerateKey = () => {
    setIsRegenerating(true);
    setTimeout(() => {
      const newKey = `k2_live_${org.slug}_${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}`;
      setApiKey(newKey);
      setIsRegenerating(false);
      toast.success("API Key baru berhasil diterbitkan di Kong Gateway.", {
        description: "Pastikan untuk memperbarui API key pada script NOC tenant.",
      });
    }, 700);
  };

  const handleSaveWebhook = () => {
    toast.success("Konfigurasi Webhook NOC berhasil disimpan.");
  };

  const handleTestPing = () => {
    setTestingPing(true);
    setTimeout(() => {
      const pingRes = {
        status: 200,
        latencyMs: Math.floor(Math.random() * 25) + 35,
        timestamp: "Baru saja",
      };
      setLastPingResult(pingRes);
      setTestingPing(false);

      setDeliveryLogs((prev) => [
        {
          id: `del-${Date.now()}`,
          event: "ping.test_event",
          targetUrl: webhookUrl,
          status: 200,
          latencyMs: pingRes.latencyMs,
          timestamp: "Baru saja",
        },
        ...prev,
      ]);

      toast.success("Test Ping berhasil! Endpoint NOC merespons HTTP 200 OK.", {
        description: `Latency respon: ${pingRes.latencyMs} ms.`,
      });
    }, 800);
  };

  return (
    <div className="space-y-6">
      {/* 1. Kong API Gateway Key Manager Card */}
      <Card className="p-5 space-y-4 bg-card border-border shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 shadow-xs">
              <Key className="h-4.5 w-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-foreground">Kong Consumer API Key</h3>
                <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary text-[9px] font-mono">
                  ACTIVE
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Kunci otentikasi REST API tenant untuk integrasi billing MikroTik, OSS, dan bot NOC.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRegenerateKey}
              disabled={isRegenerating}
              className="h-7 px-2.5 text-xs border-border gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <RefreshCw className={cn("h-3 w-3", isRegenerating && "animate-spin")} />
              <span>Regenerate Key</span>
            </Button>
          </div>
        </div>

        {/* Key Input Bar */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Input
                type={showKey ? "text" : "password"}
                value={apiKey}
                readOnly
                className="h-9 text-xs font-mono bg-background border-border text-foreground pr-10"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
            <Button
              size="sm"
              onClick={() => handleCopy(apiKey, "Kong API Key")}
              className="h-9 px-3 text-xs bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 shrink-0"
            >
              <Copy className="h-3.5 w-3.5" />
              <span>Salin Key</span>
            </Button>
          </div>

          <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
            <span className="font-mono">Header: <code>X-API-Key: {apiKey.substring(0, 12)}...</code></span>
            <span className="font-mono">Rate Limit: <strong className="text-foreground">{org.apiRateLimitMax} req/min</strong></span>
          </div>
        </div>
      </Card>

      {/* 2. NOC Alarm Webhook Configuration */}
      <Card className="p-5 space-y-4 bg-card border-border shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 shrink-0 shadow-xs">
              <Webhook className="h-4.5 w-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-foreground">NOC Real-Time Alarm Webhooks</h3>
                {lastPingResult && (
                  <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary font-mono text-[9px]">
                    Ping: {lastPingResult.status} OK ({lastPingResult.latencyMs}ms)
                  </Badge>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Kirim payload event otomatis saat terjadi alarm fiber optik atau gangguan perangkat.
              </p>
            </div>
          </div>

          <Button
            size="sm"
            onClick={handleTestPing}
            disabled={testingPing}
            className="h-7 px-2.5 text-xs bg-card border border-border text-foreground hover:bg-muted gap-1.5"
          >
            <Send className={cn("h-3 w-3 text-primary", testingPing && "animate-pulse")} />
            <span>{testingPing ? "Pinging..." : "Test Ping Webhook"}</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Target URL */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">Webhook Target Endpoint (HTTPS)</Label>
            <Input
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://noc.isp.net/webhook"
              className="h-9 text-xs font-mono bg-background border-border text-foreground"
            />
          </div>

          {/* Secret Signing Token */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">HMAC Secret Signing Token</Label>
            <div className="flex gap-2">
              <Input
                value={webhookSecret}
                onChange={(e) => setWebhookSecret(e.target.value)}
                className="h-9 text-xs font-mono bg-background border-border text-foreground"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleCopy(webhookSecret, "Webhook Secret")}
                className="h-9 px-2.5 border-border shrink-0"
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Subscribed Events Grid */}
        <div className="space-y-2 pt-2 border-t border-border/50">
          <Label className="text-xs font-semibold text-foreground">Langganan Event Alarm (Event Subscriptions)</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-background/50 border border-border/60">
              <Checkbox
                id="evt-fiber-cut"
                checked={subscribedEvents.fiberCut}
                onCheckedChange={(c) => setSubscribedEvents((prev) => ({ ...prev, fiberCut: !!c }))}
              />
              <div>
                <Label htmlFor="evt-fiber-cut" className="text-xs font-semibold text-foreground cursor-pointer block">
                  cable.fiber_cut (LOS / Putus Jalur)
                </Label>
                <span className="text-[10px] text-muted-foreground block">
                  Trigger seketika saat kabel feeder atau distribusi terindikasi putus.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-background/50 border border-border/60">
              <Checkbox
                id="evt-olt-down"
                checked={subscribedEvents.oltDown}
                onCheckedChange={(c) => setSubscribedEvents((prev) => ({ ...prev, oltDown: !!c }))}
              />
              <div>
                <Label htmlFor="evt-olt-down" className="text-xs font-semibold text-foreground cursor-pointer block">
                  device.olt_down (OLT Unreachable)
                </Label>
                <span className="text-[10px] text-muted-foreground block">
                  Trigger jika poller daemon gagal melakukan SNMP polling 3 siklus berturut-turut.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-background/50 border border-border/60">
              <Checkbox
                id="evt-odp-full"
                checked={subscribedEvents.odpFull}
                onCheckedChange={(c) => setSubscribedEvents((prev) => ({ ...prev, odpFull: !!c }))}
              />
              <div>
                <Label htmlFor="evt-odp-full" className="text-xs font-semibold text-foreground cursor-pointer block">
                  odp.capacity_full (Port ODP 100%)
                </Label>
                <span className="text-[10px] text-muted-foreground block">
                  Trigger saat seluruh port splitter pada suatu ODP telah teralokasikan.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-background/50 border border-border/60">
              <Checkbox
                id="evt-quota-alert"
                checked={subscribedEvents.quotaAlert}
                onCheckedChange={(c) => setSubscribedEvents((prev) => ({ ...prev, quotaAlert: !!c }))}
              />
              <div>
                <Label htmlFor="evt-quota-alert" className="text-xs font-semibold text-foreground cursor-pointer block">
                  tenant.quota_warning (Batas Kuota 90%)
                </Label>
                <span className="text-[10px] text-muted-foreground block">
                  Peringatan otomatis jika penyimpanan MinIO atau batas OLT mencapai 90%.
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button
            size="sm"
            onClick={handleSaveWebhook}
            className="h-8 px-3 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs"
          >
            Simpan Konfigurasi Webhook
          </Button>
        </div>
      </Card>

      {/* 3. Recent Deliveries Table */}
      <div className="rounded-xl border border-border/80 bg-card/60 backdrop-blur-md overflow-hidden shadow-xs space-y-0">
        <div className="p-3.5 border-b border-border/80 bg-muted/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider font-mono">
              Recent Webhook Delivery Logs ({deliveryLogs.length})
            </h4>
          </div>
          <Badge variant="outline" className="border-border text-[9px] font-mono">
            AUTO-RETRY ACTIVE
          </Badge>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-xs font-semibold text-foreground">Waktu</TableHead>
              <TableHead className="text-xs font-semibold text-foreground">Event Name</TableHead>
              <TableHead className="text-xs font-semibold text-foreground">Target URL</TableHead>
              <TableHead className="text-xs font-semibold text-foreground">HTTP Status</TableHead>
              <TableHead className="text-xs font-semibold text-foreground">Latency</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {deliveryLogs.map((log) => (
              <TableRow key={log.id} className="border-border hover:bg-muted/30 transition-colors">
                <TableCell className="font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                  {log.timestamp}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="border-border font-mono text-[9px]">
                    {log.event}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-xs text-foreground truncate max-w-xs">
                  {log.targetUrl}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={cn(
                      "font-mono text-[9px]",
                      log.status === 200 ? "border-primary/30 bg-primary/10 text-primary" : "border-destructive/30 bg-destructive/10 text-destructive"
                    )}
                  >
                    {log.status} OK
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {log.latencyMs} ms
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
