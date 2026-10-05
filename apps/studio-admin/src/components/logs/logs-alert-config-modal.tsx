import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Badge,
  Button,
  Checkbox,
  cn,
} from "@k2net/ui";
import {
  BellRing,
  Send,
  Check,
  AlertTriangle,
  Loader2,
  Lock,
  Eye,
  EyeOff,
  Radio,
  Clock,
  Mail,
  MessageSquare,
  Globe,
  Sliders,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import {
  getAlertConfig,
  updateAlertConfig,
  testAlertWebhook,
  type AlertConfig,
  type AlertTestResult,
} from "@/lib/actions/gateways/services";

export interface LogsAlertConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DEFAULT_CONFIG: AlertConfig = {
  enabled: true,
  webhookUrl: "",
  webhookType: "generic",
  secretKey: "",
  notificationGatewayUrl: "http://notification-gateway:5001",
  enableEmail: false,
  alertEmail: "soc-admin@k2net.id",
  enableWhatsApp: false,
  alertPhone: "",
  cooldownSeconds: 30,
  minSeverity: "CRITICAL",
  highRiskActions: [
    "impersonation.stepup_failed",
    "impersonation.unauthorized_attempt",
    "impersonation.force_revoked",
    "auth.tamper_detected",
    "system.security.tamper_detected",
    "tenant.suspend",
    "security.pii_violation",
    "auth.brute_force",
    "system.config.critical_mutation",
    "backup.destructive_purge",
  ],
};

function WebhookReceiverSection({
  config,
  setConfig,
  showSecret,
  setShowSecret,
  testing,
  testResult,
  onTestAlert,
}: {
  config: AlertConfig;
  setConfig: React.Dispatch<React.SetStateAction<AlertConfig>>;
  showSecret: boolean;
  setShowSecret: React.Dispatch<React.SetStateAction<boolean>>;
  testing: boolean;
  testResult: AlertTestResult | null;
  onTestAlert: () => void;
}) {
  return (
    <div className="p-4 rounded-xl border border-border bg-muted/10 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-semibold text-foreground">
          <Globe className="w-4 h-4 text-primary" />
          <span>Primary Webhook Receiver</span>
        </div>
        <Badge variant="outline" className="text-[10px] font-mono">
          HTTP POST + HMAC SHA-256
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-[11px] font-medium text-muted-foreground mb-1">
            Webhook Platform
          </label>
          <select
            value={config.webhookType}
            onChange={(e) =>
              setConfig({
                ...config,
                webhookType: e.target.value as AlertConfig["webhookType"],
              })
            }
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary font-mono cursor-pointer"
          >
            <option value="generic">Generic JSON Webhook</option>
            <option value="slack">Slack Incoming Webhook</option>
            <option value="discord">Discord Webhook</option>
            <option value="telegram">Telegram Bot</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-[11px] font-medium text-muted-foreground mb-1">
            Webhook Endpoint URL
          </label>
          <input
            type="url"
            placeholder="https://hooks.slack.com/services/... or https://api.soc.company.com/webhook"
            value={config.webhookUrl}
            onChange={(e) => setConfig({ ...config, webhookUrl: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary font-mono"
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
            <Lock className="w-3 h-3 text-muted-foreground" />
            <span>HMAC-SHA256 Secret Signing Key (Optional)</span>
          </label>
          <button
            type="button"
            onClick={() => setShowSecret(!showSecret)}
            className="text-[10px] text-primary hover:underline flex items-center gap-1 cursor-pointer"
          >
            {showSecret ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            <span>{showSecret ? "Hide Secret" : "Reveal Secret"}</span>
          </button>
        </div>
        <input
          type={showSecret ? "text" : "password"}
          placeholder="Enter secret token for header X-Audit-Signature: sha256=..."
          value={config.secretKey}
          onChange={(e) => setConfig({ ...config, secretKey: e.target.value })}
          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary font-mono"
        />
      </div>

      <div className="pt-2 border-t border-border/50 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onTestAlert}
            disabled={testing || !config.webhookUrl}
            className="h-7 text-xs font-semibold gap-1.5 cursor-pointer"
          >
            {testing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Dispatching Ping...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Send Test Alert Ping</span>
              </>
            )}
          </Button>
        </div>

        {testResult && (
          <div className="flex items-center gap-2 text-xs font-mono">
            {testResult.success ? (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-primary/10 text-primary font-semibold text-[11px]">
                <Check className="w-3 h-3" />
                <span>{testResult.responseCode} DELIVERED ({testResult.latencyMs}ms)</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-destructive/10 text-destructive font-semibold text-[11px]">
                <AlertTriangle className="w-3 h-3" />
                <span>FAILED: {testResult.error || testResult.responseStatus} ({testResult.latencyMs}ms)</span>
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ThresholdCooldownSection({
  config,
  setConfig,
}: {
  config: AlertConfig;
  setConfig: React.Dispatch<React.SetStateAction<AlertConfig>>;
}) {
  return (
    <div className="p-4 rounded-xl border border-border bg-muted/10 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-semibold text-foreground">
          <Sliders className="w-4 h-4 text-primary" />
          <span>Threshold & Anti-Storm Cooldown</span>
        </div>
        <Badge variant="outline" className="text-[10px] font-mono">
          Rate Limiter
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-[11px] font-medium text-muted-foreground mb-1.5">
            Minimum Severity Trigger
          </label>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs cursor-pointer flex-1">
              <input
                type="radio"
                name="minSeverity"
                checked={config.minSeverity === "CRITICAL"}
                onChange={() => setConfig({ ...config, minSeverity: "CRITICAL" })}
                className="accent-primary"
              />
              <span className="font-semibold text-destructive">CRITICAL Only</span>
            </label>
            <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs cursor-pointer flex-1">
              <input
                type="radio"
                name="minSeverity"
                checked={config.minSeverity === "ERROR"}
                onChange={() => setConfig({ ...config, minSeverity: "ERROR" })}
                className="accent-primary"
              />
              <span className="font-semibold text-foreground">CRITICAL + ERROR</span>
            </label>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
              <Clock className="w-3 h-3" />
              <span>Sliding-Window Cooldown</span>
            </label>
            <span className="font-mono text-xs font-bold text-primary">
              {config.cooldownSeconds} seconds
            </span>
          </div>
          <div className="flex items-center gap-2">
            {[10, 30, 60, 120, 300].map((sec) => (
              <button
                key={sec}
                type="button"
                onClick={() => setConfig({ ...config, cooldownSeconds: sec })}
                className={cn(
                  "flex-1 py-1.5 rounded-lg border text-xs font-mono font-medium transition-colors cursor-pointer",
                  config.cooldownSeconds === sec
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-border hover:text-foreground"
                )}
              >
                {sec}s
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function NotificationGatewaySection({
  config,
  setConfig,
}: {
  config: AlertConfig;
  setConfig: React.Dispatch<React.SetStateAction<AlertConfig>>;
}) {
  return (
    <div className="p-4 rounded-xl border border-border bg-muted/10 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-semibold text-foreground">
          <Radio className="w-4 h-4 text-primary" />
          <span>Notification Gateway Channels (:5001)</span>
        </div>
        <Badge variant="outline" className="text-[10px] font-mono">
          Inter-Service
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-3 rounded-lg border border-border bg-background space-y-2">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 font-semibold text-foreground cursor-pointer select-none">
              <Checkbox
                checked={config.enableEmail}
                onCheckedChange={(checked) => setConfig({ ...config, enableEmail: !!checked })}
                className="size-3.5 rounded-[3px]"
              />
              <Mail className="w-3.5 h-3.5 text-primary" />
              <span>Emergency Email Alerts</span>
            </label>
          </div>
          <input
            type="email"
            placeholder="soc-admin@k2net.id"
            value={config.alertEmail}
            disabled={!config.enableEmail}
            onChange={(e) => setConfig({ ...config, alertEmail: e.target.value })}
            className="w-full px-2.5 py-1.5 rounded border border-border bg-muted/20 text-foreground text-xs font-mono disabled:opacity-50"
          />
        </div>

        <div className="p-3 rounded-lg border border-border bg-background space-y-2">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 font-semibold text-foreground cursor-pointer select-none">
              <Checkbox
                checked={config.enableWhatsApp}
                onCheckedChange={(checked) => setConfig({ ...config, enableWhatsApp: !!checked })}
                className="size-3.5 rounded-[3px]"
              />
              <MessageSquare className="w-3.5 h-3.5 text-primary" />
              <span>WhatsApp Incident Alerts</span>
            </label>
          </div>
          <input
            type="tel"
            placeholder="+6281234567890"
            value={config.alertPhone}
            disabled={!config.enableWhatsApp}
            onChange={(e) => setConfig({ ...config, alertPhone: e.target.value })}
            className="w-full px-2.5 py-1.5 rounded border border-border bg-muted/20 text-foreground text-xs font-mono disabled:opacity-50"
          />
        </div>
      </div>
    </div>
  );
}

export function LogsAlertConfigModal({
  open,
  onOpenChange,
}: LogsAlertConfigModalProps) {
  const [config, setConfig] = React.useState<AlertConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [testing, setTesting] = React.useState(false);
  const [testResult, setTestResult] = React.useState<AlertTestResult | null>(null);
  const [showSecret, setShowSecret] = React.useState(false);

  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAlertConfig();
      if (res) {
        setConfig(res);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load alert config";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (open) {
      loadData();
      setTestResult(null);
    }
  }, [open, loadData]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await updateAlertConfig(config);
      if (res.success) {
        toast.success(res.message || "Alert configuration updated successfully.");
        onOpenChange(false);
      } else {
        toast.error("Failed to update alert configuration.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save alert config";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleTestAlert = async () => {
    if (!config.webhookUrl.trim()) {
      toast.error("Please enter a Webhook URL before testing.");
      return;
    }

    setTesting(true);
    setTestResult(null);
    try {
      const res = await testAlertWebhook({
        targetType: config.webhookType,
        targetUrl: config.webhookUrl.trim(),
        secretKey: config.secretKey.trim() || undefined,
      });
      setTestResult(res);
      if (res.success) {
        toast.success(`Test ping delivered successfully in ${res.latencyMs}ms.`);
      } else {
        toast.error(`Test ping failed: ${res.error || res.responseStatus}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Test ping error";
      toast.error(msg);
      setTestResult({
        success: false,
        channel: config.webhookType,
        target: config.webhookUrl,
        responseCode: 500,
        responseStatus: "CLIENT_ERROR",
        latencyMs: 0,
        error: msg,
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[82vh] overflow-y-auto bg-card text-card-foreground border-border shadow-2xl p-0 custom-scrollbar-thin font-sans rounded-xl">
        <div className="px-5 py-3.5 border-b border-border bg-muted/30">
          <DialogHeader className="gap-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-destructive/10 text-destructive border border-destructive/20 shrink-0">
                  <BellRing className="w-4 h-4" />
                </div>
                <div>
                  <DialogTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                    <span>Incident Alerting & Webhook Engine</span>
                    <Badge variant="outline" className="text-[9px] font-mono border-primary/30 text-primary py-0 px-1.5 h-4">
                      Active
                    </Badge>
                  </DialogTitle>
                  <DialogDescription className="text-[11px] text-muted-foreground mt-0.5">
                    Real-time incident dispatching with anti-storm cooldown and multi-channel alerting.
                  </DialogDescription>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 text-xs font-semibold text-foreground cursor-pointer select-none">
                  <Checkbox
                    checked={config.enabled}
                    onCheckedChange={(checked) => setConfig({ ...config, enabled: !!checked })}
                    className="size-3.5 rounded-[3px]"
                  />
                  <span className={cn("text-[11px]", config.enabled ? "text-primary" : "text-muted-foreground")}>
                    {config.enabled ? "Engine Active" : "Engine Paused"}
                  </span>
                </label>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="p-4 space-y-3.5 text-xs">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2.5 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <p className="font-mono text-xs">Loading incident alerting configuration...</p>
            </div>
          ) : (
            <>
              <WebhookReceiverSection
                config={config}
                setConfig={setConfig}
                showSecret={showSecret}
                setShowSecret={setShowSecret}
                testing={testing}
                testResult={testResult}
                onTestAlert={handleTestAlert}
              />

              <ThresholdCooldownSection config={config} setConfig={setConfig} />

              <NotificationGatewaySection config={config} setConfig={setConfig} />

              <div className="p-3 rounded-lg border border-border bg-muted/10 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-semibold text-foreground text-[11px]">
                    <ShieldAlert className="w-3.5 h-3.5 text-destructive" />
                    <span>Protected High-Risk Security Actions ({config.highRiskActions.length})</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1">
                  {config.highRiskActions.map((action) => (
                    <Badge
                      key={action}
                      variant="outline"
                      className="px-1.5 py-0 text-[9px] font-mono border-border bg-background text-foreground h-4"
                    >
                      {action}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="p-4 border-t border-border bg-muted/30 flex items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setConfig(DEFAULT_CONFIG)}
            className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
          >
            Reset Defaults
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              disabled={saving || loading}
              className="text-xs font-semibold gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
            >
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Configuration</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
