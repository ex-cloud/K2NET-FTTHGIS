import { Badge, Button, Card, Input, Label, Checkbox } from "@k2net/ui";
import { Webhook, Copy, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PingResult, WebhookSubscriptions } from "./types";

interface WebhookConfigCardProps {
  lastPingResult: PingResult | null;
  testingPing: boolean;
  onTestPing: () => void;
  webhookUrl: string;
  setWebhookUrl: (url: string) => void;
  webhookSecret: string;
  setWebhookSecret: (secret: string) => void;
  subscribedEvents: WebhookSubscriptions;
  setSubscribedEvents: React.Dispatch<React.SetStateAction<WebhookSubscriptions>>;
  onSaveWebhook: () => void;
  onCopy: (text: string, label: string) => void;
}

export function WebhookConfigCard({
  lastPingResult,
  testingPing,
  onTestPing,
  webhookUrl,
  setWebhookUrl,
  webhookSecret,
  setWebhookSecret,
  subscribedEvents,
  setSubscribedEvents,
  onSaveWebhook,
  onCopy,
}: WebhookConfigCardProps) {
  return (
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
          onClick={onTestPing}
          disabled={testingPing}
          className="h-7 px-2.5 text-xs bg-card border border-border text-foreground hover:bg-muted gap-1.5 cursor-pointer"
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
              onClick={() => onCopy(webhookSecret, "Webhook Secret")}
              className="h-9 px-2.5 border-border shrink-0 cursor-pointer"
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
          onClick={onSaveWebhook}
          className="h-8 px-3 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs cursor-pointer"
        >
          Simpan Konfigurasi Webhook
        </Button>
      </div>
    </Card>
  );
}
