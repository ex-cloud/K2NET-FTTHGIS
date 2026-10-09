import * as React from "react";
import {
  KeyRound,
  Cpu,
  Check,
  Copy,
  Upload,
  ShieldCheck,
  Loader2,
  Terminal,
  AlertTriangle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Badge,
} from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";

export interface ActivateLicensePayload {
  licenseKey: string;
  machineFingerprint?: string;
}

export interface ActivateOfflinePayload {
  certificateContent: string;
  machineFingerprint?: string;
}

interface ActivateLicenseKeyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onActivate: (payload: ActivateLicensePayload) => Promise<unknown>;
  onActivateOffline?: (payload: ActivateOfflinePayload) => Promise<unknown>;
  isActivating: boolean;
}

export function ActivateLicenseKeyModal({
  open,
  onOpenChange,
  onActivate,
  onActivateOffline,
  isActivating,
}: ActivateLicenseKeyModalProps) {
  const { t } = useTranslation();
  const [tab, setTab] = React.useState<"online" | "airgap">("online");
  const [offlineMethod, setOfflineMethod] = React.useState<"key" | "cert">("key");

  const [licenseKey, setLicenseKey] = React.useState("");
  const [machineFingerprint, setMachineFingerprint] = React.useState("");
  const [certificateContent, setCertificateContent] = React.useState("");
  const [copiedCli, setCopiedCli] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    if (open) {
      setLicenseKey("");
      setMachineFingerprint("");
      setCertificateContent("");
      setError(null);
      setCopiedCli(false);
      setTab("online");
      setOfflineMethod("key");
    }
  }, [open]);

  const handleCopyCliCommand = () => {
    const cmd = "printf \"%s:%s\" \"$(cat /etc/machine-id 2>/dev/null || cat /var/lib/dbus/machine-id)\" \"$(cat /sys/class/net/$(ip route show default 2>/dev/null | awk '{print $5}')/address 2>/dev/null)\" | sha256sum | awk '{print $1}'";
    navigator.clipboard.writeText(cmd);
    setCopiedCli(true);
    setTimeout(() => setCopiedCli(false), 2000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setCertificateContent(content);
        if (error) setError(null);
      }
    };
    reader.readAsText(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      if (tab === "online") {
        const trimmedKey = licenseKey.trim();
        if (!trimmedKey) {
          setError(t("license.tenant.err_license_key_required"));
          return;
        }
        await onActivate({
          licenseKey: trimmedKey,
          machineFingerprint: machineFingerprint.trim() || undefined,
        });
        onOpenChange(false);
      } else {
        // Air-Gapped / Offline Tab
        const trimmedFingerprint = machineFingerprint.trim();

        if (offlineMethod === "cert") {
          const trimmedCert = certificateContent.trim();
          if (!trimmedCert) {
            setError(t("license.tenant.err_cert_file_required"));
            return;
          }
          if (onActivateOffline) {
            await onActivateOffline({
              certificateContent: trimmedCert,
              machineFingerprint: trimmedFingerprint || undefined,
            });
            onOpenChange(false);
          } else {
            setError(t("license.tenant.err_offline_not_supported"));
          }
        } else {
          // Offline by Key
          const trimmedKey = licenseKey.trim();
          if (!trimmedKey) {
            setError(t("license.tenant.err_license_key_required"));
            return;
          }
          await onActivate({
            licenseKey: trimmedKey,
            machineFingerprint: trimmedFingerprint || undefined,
          });
          onOpenChange(false);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("license.tenant.activation_failed");
      setError(msg);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-card border-border/80 p-0 overflow-hidden">
        <form onSubmit={handleSubmit} className="flex flex-col">
          {/* Header */}
          <DialogHeader className="p-5 pb-3 border-b border-border/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/80 bg-muted/30 text-foreground">
                  {tab === "airgap" ? (
                    <Cpu className="h-4 w-4 text-primary" />
                  ) : (
                    <KeyRound className="h-4 w-4 text-primary" />
                  )}
                </div>
                <div>
                  <DialogTitle className="text-base font-bold text-foreground tracking-tight">
                    {t("license.tenant.activate_license_title")}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                    {t("license.tenant.activate_license_desc")}
                  </DialogDescription>
                </div>
              </div>
              <Badge className="border-border bg-muted/30 text-[10px] text-muted-foreground font-mono">
                ED25519 / HMAC
              </Badge>
            </div>

            {/* Segmented Tab Switcher */}
            <div className="mt-4 flex rounded-lg border border-border/80 bg-muted/20 p-1 gap-1">
              <button
                type="button"
                onClick={() => {
                  setTab("online");
                  setError(null);
                }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                  tab === "online"
                    ? "bg-card text-foreground shadow-xs border border-border/60 font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <KeyRound className="h-3.5 w-3.5" />
                <span>{t("license.tenant.tab_online_activation")}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setTab("airgap");
                  setError(null);
                }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                  tab === "airgap"
                    ? "bg-card text-foreground shadow-xs border border-border/60 font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Cpu className="h-3.5 w-3.5" />
                <span>{t("license.tenant.tab_airgapped_activation")}</span>
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              </button>
            </div>
          </DialogHeader>

          {/* Form Body */}
          <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
            {tab === "online" ? (
              // Online Activation Form
              <div className="space-y-3.5">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">
                    {t("license.tenant.enter_license_key_label")}
                  </label>
                  <textarea
                    value={licenseKey}
                    onChange={(e) => {
                      setLicenseKey(e.target.value);
                      if (error) setError(null);
                    }}
                    rows={3}
                    placeholder="K2NET-PRO-9F4D2A1C-7B8E..."
                    className="w-full rounded-md border border-border/80 bg-background px-3 py-2 text-xs font-mono text-foreground placeholder:text-muted-foreground/50 focus:border-foreground focus:outline-hidden resize-none"
                    autoFocus
                  />
                  <p className="text-[11px] text-muted-foreground">
                    {t("license.tenant.activate_key_hint")}
                  </p>
                </div>
              </div>
            ) : (
              // Air-Gapped / Offline Tab
              <div className="space-y-4">
                {/* Air-Gapped Guidance Alert */}
                <div className="rounded-lg border border-border/80 bg-muted/15 p-3 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                    <Terminal className="h-3.5 w-3.5 text-primary" />
                    <span>{t("license.tenant.airgap_guide_title")}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {t("license.tenant.airgap_guide_desc")}
                  </p>

                  <div className="space-y-1 pt-1">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                      {t("license.tenant.cli_command_label")}
                    </span>
                    <div className="flex items-center justify-between rounded-md border border-border/80 bg-background px-2.5 py-1.5 font-mono text-xs text-foreground">
                      <code className="text-[11px] truncate select-all">
                        {`printf "%s:%s" "$(cat /etc/machine-id 2>/dev/null || cat /var/lib/dbus/machine-id)" "$(cat /sys/class/net/$(ip route show default 2>/dev/null | awk '{print \\$5}')/address 2>/dev/null)" | sha256sum | awk '{print \\$1}'`}
                      </code>
                      <Button
                        type="button"
                        variant="ghost"
                        size="xs"
                        onClick={handleCopyCliCommand}
                        className="h-6 px-2 text-[11px] gap-1 shrink-0 ml-2 cursor-pointer"
                      >
                        {copiedCli ? (
                          <>
                            <Check className="h-3 w-3 text-primary" />
                            <span>{t("license.tenant.cli_copied")}</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>{t("license.tenant.cli_copy_btn")}</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Input Hardware Fingerprint SHA-256 */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                      <Cpu className="h-3.5 w-3.5 text-primary" />
                      <span>{t("license.tenant.hardware_fingerprint_label")}</span>
                    </label>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      SHA-256 (64 hex)
                    </span>
                  </div>
                  <input
                    type="text"
                    value={machineFingerprint}
                    onChange={(e) => {
                      setMachineFingerprint(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder={t("license.tenant.hardware_fingerprint_placeholder")}
                    className="w-full rounded-md border border-border/80 bg-background px-3 py-1.5 text-xs font-mono text-foreground placeholder:text-muted-foreground/50 focus:border-foreground focus:outline-hidden"
                  />
                </div>

                {/* Switcher Mode: Key vs Cert */}
                <div className="space-y-2 pt-1 border-t border-border/50">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-foreground">
                      {t("license.tenant.offline_activation_method")}
                    </label>
                    <div className="flex rounded-md border border-border/80 bg-muted/20 p-0.5">
                      <button
                        type="button"
                        onClick={() => setOfflineMethod("key")}
                        className={`px-2 py-0.5 text-[11px] font-medium rounded transition-all cursor-pointer ${
                          offlineMethod === "key"
                            ? "bg-card text-foreground shadow-xs font-semibold"
                            : "text-muted-foreground"
                        }`}
                      >
                        {t("license.tenant.method_license_key")}
                      </button>
                      <button
                        type="button"
                        onClick={() => setOfflineMethod("cert")}
                        className={`px-2 py-0.5 text-[11px] font-medium rounded transition-all cursor-pointer ${
                          offlineMethod === "cert"
                            ? "bg-card text-foreground shadow-xs font-semibold"
                            : "text-muted-foreground"
                        }`}
                      >
                        {t("license.tenant.method_certificate_file")}
                      </button>
                    </div>
                  </div>

                  {offlineMethod === "key" ? (
                    <div className="space-y-1.5">
                      <textarea
                        value={licenseKey}
                        onChange={(e) => {
                          setLicenseKey(e.target.value);
                          if (error) setError(null);
                        }}
                        rows={2}
                        placeholder="K2NET-ENTERPRISE-A1B2C3D4-5E6F..."
                        className="w-full rounded-md border border-border/80 bg-background px-3 py-2 text-xs font-mono text-foreground placeholder:text-muted-foreground/50 focus:border-foreground focus:outline-hidden resize-none"
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-muted-foreground">
                          {t("license.tenant.cert_file_label")}
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="xs"
                          onClick={() => fileInputRef.current?.click()}
                          className="h-6 px-2 text-[11px] gap-1 cursor-pointer"
                        >
                          <Upload className="h-3 w-3" />
                          <span>{t("license.tenant.upload_cert_btn")}</span>
                        </Button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".lic,.txt"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </div>
                      <textarea
                        value={certificateContent}
                        onChange={(e) => {
                          setCertificateContent(e.target.value);
                          if (error) setError(null);
                        }}
                        rows={4}
                        placeholder={t("license.tenant.cert_file_placeholder")}
                        className="w-full rounded-md border border-border/80 bg-background px-3 py-2 text-[11px] font-mono text-foreground placeholder:text-muted-foreground/50 focus:border-foreground focus:outline-hidden resize-none leading-relaxed"
                      />
                    </div>
                  )}

                  <div className="flex items-start gap-1.5 text-[11px] text-amber-500/90 pt-1">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    <p className="leading-tight">
                      {t("license.tenant.airgap_mismatch_warning")}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="rounded-md border border-rose-500/30 bg-rose-500/10 p-2.5 text-xs text-rose-500 font-mono">
                {error}
              </div>
            )}
          </div>

          {/* Footer */}
          <DialogFooter className="flex items-center justify-end gap-2 p-4 border-t border-border/60 bg-muted/10">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isActivating}
              className="h-7 px-2.5 text-xs font-medium rounded-md border-border/80 cursor-pointer"
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={
                isActivating ||
                (tab === "online" && !licenseKey.trim()) ||
                (tab === "airgap" && offlineMethod === "key" && !licenseKey.trim()) ||
                (tab === "airgap" && offlineMethod === "cert" && !certificateContent.trim())
              }
              className="h-7 px-2.5 text-xs font-medium gap-1.5 rounded-md shadow-xs bg-foreground text-background hover:bg-foreground/90 cursor-pointer"
            >
              {isActivating ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>{t("license.tenant.activating")}</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>{t("license.tenant.verify_activate_cta")}</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
