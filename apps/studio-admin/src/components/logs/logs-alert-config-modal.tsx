import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Badge,
  Button,
  Checkbox,
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
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
  ChevronDown,
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
    <div className="p-3.5 rounded-lg border border-border/60 bg-muted/10 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-semibold text-foreground text-xs">
          <Globe className="w-3.5 h-3.5 text-muted-foreground" />
          <span>Primary Webhook Receiver</span>
        </div>
        <Badge variant="outline" className="text-[10px] font-mono border-border bg-muted/40 text-muted-foreground">
          HTTP POST + HMAC SHA-256
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
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
            className="w-full px-2.5 py-1.5 rounded-md border border-border bg-card text-foreground text-xs focus:outline-none focus:border-border font-mono cursor-pointer"
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
            className="w-full px-2.5 py-1.5 rounded-md border border-border bg-card text-foreground text-xs focus:outline-none focus:border-border font-mono placeholder:text-muted-foreground/50"
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
            className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer transition-colors"
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
          className="w-full px-2.5 py-1.5 rounded-md border border-border bg-card text-foreground text-xs focus:outline-none focus:border-border font-mono placeholder:text-muted-foreground/50"
        />
      </div>

      <div className="pt-2 border-t border-border/40 flex flex-wrap items-center justify-between gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onTestAlert}
          disabled={testing || !config.webhookUrl}
          className="h-7 text-xs font-medium gap-1.5 cursor-pointer border-border bg-card hover:bg-muted font-sans"
        >
          {testing ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
              <span>Dispatching Ping...</span>
            </>
          ) : (
            <>
              <Send className="w-3 h-3 text-muted-foreground" />
              <span>Send Test Alert Ping</span>
            </>
          )}
        </Button>

        {testResult && (
          <div className="flex items-center gap-2 text-xs font-mono">
            {testResult.success ? (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-muted/40 border border-border text-foreground font-medium text-[11px]">
                <Check className="w-3 h-3 text-primary" />
                <span>{testResult.responseCode} DELIVERED ({testResult.latencyMs}ms)</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-destructive/10 border border-destructive/20 text-destructive font-medium text-[11px]">
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
    <div className="p-3.5 rounded-lg border border-border/60 bg-muted/10 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-semibold text-foreground text-xs">
          <Sliders className="w-3.5 h-3.5 text-muted-foreground" />
          <span>Threshold & Anti-Storm Cooldown</span>
        </div>
        <Badge variant="outline" className="text-[10px] font-mono border-border bg-muted/40 text-muted-foreground">
          Rate Limiter
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-medium text-muted-foreground mb-1">
            Minimum Severity Trigger
          </label>
          <div className="flex items-center p-0.5 bg-muted/40 rounded-lg border border-border/60">
            <button
              type="button"
              onClick={() => setConfig({ ...config, minSeverity: "CRITICAL" })}
              className={cn(
                "flex-1 py-1 px-2 rounded-md text-xs font-medium transition-colors cursor-pointer select-none",
                config.minSeverity === "CRITICAL"
                  ? "bg-card text-foreground font-semibold shadow-2xs border border-border/60"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              CRITICAL Only
            </button>
            <button
              type="button"
              onClick={() => setConfig({ ...config, minSeverity: "ERROR" })}
              className={cn(
                "flex-1 py-1 px-2 rounded-md text-xs font-medium transition-colors cursor-pointer select-none",
                config.minSeverity === "ERROR"
                  ? "bg-card text-foreground font-semibold shadow-2xs border border-border/60"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              CRITICAL + ERROR
            </button>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-muted-foreground" />
              <span>Sliding-Window Cooldown</span>
            </label>
            <span className="font-mono text-xs font-semibold text-foreground">
              {config.cooldownSeconds}s
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {[10, 30, 60, 120, 300].map((sec) => (
              <button
                key={sec}
                type="button"
                onClick={() => setConfig({ ...config, cooldownSeconds: sec })}
                className={cn(
                  "flex-1 py-1 rounded-md border text-xs font-mono transition-colors cursor-pointer text-center",
                  config.cooldownSeconds === sec
                    ? "bg-foreground text-background border-foreground font-semibold shadow-xs"
                    : "bg-card text-muted-foreground border-border/60 hover:text-foreground hover:bg-muted"
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
    <div className="p-3.5 rounded-lg border border-border/60 bg-muted/10 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-semibold text-foreground text-xs">
          <Radio className="w-3.5 h-3.5 text-muted-foreground" />
          <span>Notification Channels</span>
        </div>
        <Badge variant="outline" className="text-[10px] font-mono border-border bg-muted/40 text-muted-foreground">
          Gateway :5001
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="p-2.5 rounded-lg border border-border/60 bg-card space-y-1.5">
          <label className="flex items-center gap-2 text-xs font-medium text-foreground cursor-pointer select-none">
            <Checkbox
              checked={config.enableEmail}
              onCheckedChange={(checked) => setConfig({ ...config, enableEmail: !!checked })}
              className="size-3.5 rounded-[3px]"
            />
            <Mail className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Emergency Email Alerts</span>
          </label>
          <input
            type="email"
            placeholder="soc-admin@k2net.id"
            value={config.alertEmail}
            disabled={!config.enableEmail}
            onChange={(e) => setConfig({ ...config, alertEmail: e.target.value })}
            className="w-full px-2 py-1 rounded border border-border bg-muted/20 text-foreground text-xs font-mono disabled:opacity-40"
          />
        </div>

        <div className="p-2.5 rounded-lg border border-border/60 bg-card space-y-1.5">
          <label className="flex items-center gap-2 text-xs font-medium text-foreground cursor-pointer select-none">
            <Checkbox
              checked={config.enableWhatsApp}
              onCheckedChange={(checked) => setConfig({ ...config, enableWhatsApp: !!checked })}
              className="size-3.5 rounded-[3px]"
            />
            <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
            <span>WhatsApp Incident Alerts</span>
          </label>
          <input
            type="tel"
            placeholder="+6281234567890"
            value={config.alertPhone}
            disabled={!config.enableWhatsApp}
            onChange={(e) => setConfig({ ...config, alertPhone: e.target.value })}
            className="w-full px-2 py-1 rounded border border-border bg-muted/20 text-foreground text-xs font-mono disabled:opacity-40"
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
  const [config, setConfig] = useState<AlertConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<AlertTestResult | null>(null);
  const [showSecret, setShowSecret] = useState(false);
  const [actionsExpanded, setActionsExpanded] = useState(false);

  const loadData = useCallback(async () => {
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

  useEffect(() => {
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
      <DialogContent className="max-w-2xl max-h-[82vh] overflow-y-auto bg-card text-card-foreground border-border shadow-xl p-0 custom-scrollbar-thin font-sans rounded-xl">
        <div className="px-5 py-3.5 border-groove-b bg-muted/20">
          <DialogHeader className="gap-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-muted/40 text-muted-foreground border border-border/60 shrink-0">
                  <BellRing className="w-4 h-4" />
                </div>
                <div>
                  <DialogTitle className="text-xs font-bold text-foreground flex items-center gap-2">
                    <span>Incident Alerting & Webhook Engine</span>
                    <Badge variant="outline" className="text-[9px] font-mono border-border bg-muted/40 text-muted-foreground py-0 px-1.5 h-4">
                      {config.enabled ? "ACTIVE" : "PAUSED"}
                    </Badge>
                  </DialogTitle>
                  <DialogDescription className="text-[11px] text-muted-foreground mt-0.5">
                    Real-time incident dispatching with anti-storm cooldown and multi-channel alerting.
                  </DialogDescription>
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs font-medium text-foreground cursor-pointer select-none">
                <Checkbox
                  checked={config.enabled}
                  onCheckedChange={(checked) => setConfig({ ...config, enabled: !!checked })}
                  className="size-3.5 rounded-[3px]"
                />
                <span className="text-[11px] text-muted-foreground">
                  {config.enabled ? "Engine Active" : "Engine Paused"}
                </span>
              </label>
            </div>
          </DialogHeader>
        </div>

        <div className="p-4 space-y-3 text-xs">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin text-foreground" />
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

              {/* Collapsible High-Risk Security Actions */}
              <Collapsible
                open={actionsExpanded}
                onOpenChange={setActionsExpanded}
                className="p-3 rounded-lg border border-border/60 bg-muted/10 space-y-2"
              >
                <CollapsibleTrigger asChild>
                  <button
                    type="button"
                    className="w-full flex items-center justify-between text-left cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-1.5 font-semibold text-foreground text-[11px]">
                      <ShieldAlert className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>Protected High-Risk Security Actions ({config.highRiskActions.length})</span>
                    </div>
                    <ChevronDown
                      className={cn(
                        "w-3.5 h-3.5 text-muted-foreground transition-transform",
                        actionsExpanded && "rotate-180"
                      )}
                    />
                  </button>
                </CollapsibleTrigger>

                <CollapsibleContent className="pt-2 border-t border-border/40">
                  <div className="flex flex-wrap gap-1">
                    {config.highRiskActions.map((action) => (
                      <Badge
                        key={action}
                        variant="outline"
                        className="px-1.5 py-0 text-[9px] font-mono border-border bg-card text-muted-foreground h-4"
                      >
                        {action}
                      </Badge>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 border-groove-t bg-muted/20 flex items-center justify-between">
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
              className="text-xs h-7.5 px-3 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              disabled={saving || loading}
              className="text-xs h-7.5 px-3 font-semibold gap-1.5 cursor-pointer bg-foreground text-background hover:bg-foreground/90 border border-foreground shadow-xs disabled:opacity-40 font-sans"
            >
              {saving ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="w-3 h-3" />
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
