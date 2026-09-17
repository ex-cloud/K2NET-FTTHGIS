import { Badge, Button, Card, Input, Label, ActionTooltip } from "@k2net/ui";
import { Webhook, Copy, Send, RefreshCw, Lock, Save, ShieldCheck, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/hooks/use-permissions";
import type { PingResult, WebhookSubscriptions } from "./types";
import { WebhookEventCheckboxes } from "./WebhookEventCheckboxes";

interface WebhookConfigCardProps {
  lastPingResult: PingResult | null;
  testingPing: boolean;
  onTestPing: () => void;
  webhookUrl: string;
  setWebhookUrl: (url: string) => void;
  webhookSecretMasked: string | null;
  hasSecret: boolean;
  isRollingSecret: boolean;
  onRollSecret: () => void;
  subscribedEvents: WebhookSubscriptions;
  setSubscribedEvents: React.Dispatch<React.SetStateAction<WebhookSubscriptions>>;
  isDirty: boolean;
  isSaving: boolean;
  onSaveWebhook: () => void;
  onCopy: (text: string, label: string) => void;
}

export function WebhookConfigCard({
  lastPingResult,
  testingPing,
  onTestPing,
  webhookUrl,
  setWebhookUrl,
  webhookSecretMasked,
  hasSecret,
  isRollingSecret,
  onRollSecret,
  subscribedEvents,
  setSubscribedEvents,
  isDirty,
  isSaving,
  onSaveWebhook,
  onCopy,
}: WebhookConfigCardProps) {
  const { canAccess } = usePermissions();
  const canManage = canAccess("system.organizations.webhooks.manage");

  const secretDisplay = webhookSecretMasked || (hasSecret ? "whsec_••••••••••••••••" : "Belum dibuat (Klik Roll Secret)");

  return (
    <Card className="p-5 space-y-4 bg-card border-border shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 shadow-xs">
            <Webhook className="h-4.5 w-4.5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xs font-bold text-foreground">NOC Real-Time Alarm Webhooks</h3>
              <Badge variant="outline" className="border-border text-muted-foreground text-[9px] font-mono gap-1">
                <ShieldCheck className="h-2.5 w-2.5 text-primary" />
                SSRF L2 PINNED
              </Badge>
              {lastPingResult && (
                <Badge
                  variant="outline"
                  className={cn(
                    "font-mono text-[9px]",
                    lastPingResult.success
                      ? "border-primary/30 bg-primary/10 text-primary"
                      : "border-destructive/30 bg-destructive/10 text-destructive"
                  )}
                >
                  Ping: {lastPingResult.status} ({lastPingResult.latencyMs}ms)
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
          disabled={testingPing || !webhookUrl.trim()}
          className="h-7 px-2.5 text-xs bg-card border border-border text-foreground hover:bg-muted gap-1.5 cursor-pointer disabled:opacity-50"
        >
          <Send className={cn("h-3 w-3 text-primary", testingPing && "animate-pulse")} />
          <span>{testingPing ? "Pinging..." : "Test Ping Webhook"}</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        {/* Target URL */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-foreground flex items-center justify-between">
            <span>Webhook Target Endpoint (HTTPS)</span>
            <Badge variant="outline" className="text-[9px] font-mono border-primary/30 bg-primary/10 text-primary">
              SSRF L2 GUARDED (HTTPS ONLY)
            </Badge>
          </Label>
          <Input
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            disabled={!canManage}
            placeholder="https://noc.isp.net/webhook"
            className="h-8 text-xs font-mono bg-background border-border text-foreground disabled:opacity-60 rounded-md"
          />
        </div>

        {/* Secret Signing Token */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-foreground flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Lock className="h-3 w-3 text-primary" />
              <span>HMAC Secret Signing Token</span>
            </span>
            <Badge variant="outline" className="text-[9px] font-mono border-border text-muted-foreground">
              AES-256 ENCRYPTED
            </Badge>
          </Label>
          <div className="flex gap-2">
            <Input
              value={secretDisplay}
              readOnly
              className="h-8 text-xs font-mono bg-background border-border text-foreground select-all rounded-md"
            />
            {hasSecret && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onCopy(secretDisplay, "Webhook Secret")}
                className="h-8 px-2.5 border-border shrink-0 cursor-pointer rounded-md"
                title="Salin Masked Secret"
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
            )}
            {canManage ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onRollSecret}
                disabled={isRollingSecret}
                className="h-8 px-2.5 border-border gap-1 shrink-0 text-xs cursor-pointer rounded-md"
                title="Buat Secret HMAC Baru"
              >
                <RefreshCw className={cn("h-3 w-3", isRollingSecret && "animate-spin")} />
                <span>Roll Secret</span>
              </Button>
            ) : (
              <ActionTooltip label="Akses Read-Only: Memerlukan izin system.organizations.webhooks.manage">
                <span className="inline-block">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled
                    className="h-8 px-2.5 border-border gap-1 shrink-0 text-xs opacity-50 cursor-not-allowed rounded-md"
                  >
                    <ShieldAlert className="h-3 w-3" />
                    <span>Roll Secret</span>
                  </Button>
                </span>
              </ActionTooltip>
            )}
          </div>
        </div>
      </div>

      {/* Subscribed Events Grid */}
      <div className="space-y-2 pt-2 border-t border-border/50">
        <Label className="text-xs font-semibold text-foreground">Langganan Event Alarm (Event Subscriptions)</Label>
        <WebhookEventCheckboxes
          subscribedEvents={subscribedEvents}
          setSubscribedEvents={setSubscribedEvents}
        />
      </div>

      <div className="flex items-center justify-between pt-2">
        <span className="text-[11px] text-muted-foreground">
          {isDirty ? (
            <span className="text-amber-500 font-medium">Ada perubahan yang belum disimpan.</span>
          ) : (
            <span>Konfigurasi webhook telah tersimpan.</span>
          )}
        </span>
        {canManage ? (
          <Button
            size="sm"
            onClick={onSaveWebhook}
            disabled={!isDirty || isSaving}
            className="h-8 px-3 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs cursor-pointer gap-1.5 disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" />
            <span>{isSaving ? "Menyimpan..." : "Simpan Konfigurasi Webhook"}</span>
          </Button>
        ) : (
          <ActionTooltip label="Akses Read-Only: Memerlukan izin system.organizations.webhooks.manage">
            <span className="inline-block">
              <Button
                size="sm"
                disabled
                className="h-8 px-3 text-xs font-medium bg-muted text-muted-foreground opacity-50 cursor-not-allowed gap-1.5"
              >
                <ShieldAlert className="h-3.5 w-3.5" />
                <span>Read-Only Mode</span>
              </Button>
            </span>
          </ActionTooltip>
        )}
      </div>
    </Card>
  );
}
