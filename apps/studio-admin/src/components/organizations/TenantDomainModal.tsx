import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Input,
  Label,
  Badge,
  ActionTooltip,
} from "@k2net/ui";
import {
  Globe,
  Copy,
  RefreshCw,
  ShieldCheck,
  Terminal,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { EnrichedOrganization } from "./types";

interface TenantDomainModalProps {
  organization: EnrichedOrganization | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveDomain: (orgId: string, domain: string) => Promise<void>;
}

interface DnsDiagnosticResult {
  success: boolean;
  domain: string;
  cname: string | null;
  isCnameMatched: boolean;
  ip: string | null;
  latencyMs: number;
  status: "OK" | "MISMATCH" | "ERROR";
  sslReady: boolean;
  logs: string[];
  timestamp: string;
}

export function TenantDomainModal({
  organization,
  isOpen,
  onClose,
  onSaveDomain,
}: TenantDomainModalProps) {
  const [domainInput, setDomainInput] = useState(organization?.customDomain || "");
  const [verifying, setVerifying] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dnsResult, setDnsResult] = useState<DnsDiagnosticResult | null>(null);

  useEffect(() => {
    if (organization) {
      setDomainInput(organization.customDomain || "");
      setDnsResult(null);
    }
  }, [organization]);

  if (!organization) return null;

  const handleCopy = (text: string, label = "Copied to clipboard") => {
    navigator.clipboard.writeText(text);
    toast.success(label);
  };

  const handleVerifyDns = async () => {
    const targetDomain = domainInput.trim() || organization.customDomain;
    if (!targetDomain) return;

    setVerifying(true);
    try {
      const res = await fetch(`/api/v1/observability/dns-check?domain=${encodeURIComponent(targetDomain)}`);
      const data: DnsDiagnosticResult = await res.json();
      setDnsResult(data);

      if (data.isCnameMatched || data.status === "OK") {
        toast.success(`DNS CNAME verified successfully for ${targetDomain}`, {
          description: `Resolved to cname.kdua.net (${data.latencyMs}ms RTT)`,
        });
      } else if (data.status === "MISMATCH") {
        toast.warning(`CNAME points to different host or direct A record`, {
          description: `Found: ${data.cname || data.ip || "None"}. Expected: cname.kdua.net`,
        });
      } else {
        toast.error("DNS verification query failed", {
          description: "Domain could not be resolved from platform DNS.",
        });
      }
    } catch {
      toast.error("DNS verification request failed");
    } finally {
      setVerifying(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSaveDomain(organization.id, domainInput.trim());
      toast.success("Custom domain configuration saved");
      onClose();
    } catch {
      toast.error("Failed to save custom domain");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl bg-popover/95 backdrop-blur-xl border-border/80 text-foreground shadow-2xl rounded-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary font-mono text-xs uppercase tracking-wider font-bold">
            <Globe className="h-4 w-4" />
            <span>Custom Domain & SSL Routing</span>
          </div>
          <DialogTitle className="text-lg font-bold text-foreground">
            {organization.name}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Configure white-label custom domain with automated Let&apos;s Encrypt SSL certificate.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Domain Input */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">
              Custom Domain (FQDN)
            </Label>
            <div className="flex gap-2">
              <Input
                placeholder="e.g. gis.nusantara.net"
                value={domainInput}
                onChange={(e) => setDomainInput(e.target.value)}
                className="h-9 text-xs bg-card border-border text-foreground font-mono"
              />
              <ActionTooltip label="Run live DNS Dig & SSL diagnostic resolution" shortcut="R">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleVerifyDns}
                  disabled={verifying || !domainInput.trim()}
                  className="h-9 text-xs border-border bg-card hover:bg-accent gap-1.5 shrink-0"
                >
                  <RefreshCw className={cn("h-3.5 w-3.5", verifying && "animate-spin text-primary")} />
                  <span>Check DNS</span>
                </Button>
              </ActionTooltip>
            </div>
          </div>

          {/* DNS Configuration Instructions */}
          <div className="rounded-xl border border-border/80 bg-card/60 p-3.5 space-y-2.5 text-xs">
            <span className="font-semibold text-foreground block">
              DNS Configuration Instructions
            </span>
            <p className="text-muted-foreground text-[11px] leading-relaxed">
              Create a DNS <strong className="text-foreground font-mono">CNAME</strong> record on your domain registrar pointing to K2NET Edge Router:
            </p>

            <div className="flex items-center justify-between rounded-lg bg-background/80 border border-border/60 p-2.5 font-mono text-[11px]">
              <div className="space-y-0.5">
                <span className="text-muted-foreground text-[10px] block font-mono">TARGET CNAME</span>
                <span className="text-primary font-bold">cname.kdua.net</span>
              </div>
              <ActionTooltip label="Copy target CNAME">
                <button
                  onClick={() => handleCopy("cname.kdua.net", "CNAME target copied")}
                  className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </ActionTooltip>
            </div>
          </div>

          {/* Live Diagnostic Visual Terminal (if verified) */}
          {dnsResult && (
            <div className="rounded-xl border border-border/80 bg-background/90 p-3 space-y-2 font-mono text-[11px] animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center justify-between border-b border-border/60 pb-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <Terminal className="h-3.5 w-3.5 text-primary" />
                  <span>Live DNS Dig Console</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Clock className="h-2.5 w-2.5" />
                    <span>{dnsResult.latencyMs}ms</span>
                  </span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[9px] font-mono",
                      dnsResult.status === "OK"
                        ? "border-primary/30 bg-primary/10 text-primary"
                        : dnsResult.status === "MISMATCH"
                        ? "border-amber-500/30 bg-amber-500/10 text-amber-500"
                        : "border-destructive/30 bg-destructive/10 text-destructive"
                    )}
                  >
                    {dnsResult.status}
                  </Badge>
                </div>
              </div>

              <div className="bg-muted/40 rounded-lg p-2.5 max-h-36 overflow-y-auto space-y-1 custom-scrollbar text-[10px] leading-relaxed">
                {dnsResult.logs.map((log, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      log.includes("[MATCH-SUCCESS]")
                        ? "text-primary font-bold"
                        : log.includes("[ERROR]") || log.includes("[DIAGNOSTIC-FAIL]")
                        ? "text-destructive font-semibold"
                        : log.includes("[MATCH-WARNING]")
                        ? "text-amber-500"
                        : "text-muted-foreground"
                    )}
                  >
                    {log}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SSL Status Card */}
          <div className="flex items-center justify-between rounded-xl border border-border/80 bg-card/60 p-3.5">
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <span className="text-xs font-semibold text-foreground block">
                  Let&apos;s Encrypt Auto-SSL
                </span>
                <span className="text-[10px] text-muted-foreground">
                  Managed automatically via Traefik Edge Router
                </span>
              </div>
            </div>
            <Badge
              variant="outline"
              className={organization.domainSslActive || dnsResult?.isCnameMatched
                ? "border-primary/30 bg-primary/10 text-primary font-mono text-[10px] gap-1"
                : "border-border text-muted-foreground font-mono text-[10px]"
              }
            >
              {organization.domainSslActive || dnsResult?.isCnameMatched ? (
                <>
                  <CheckCircle2 className="h-3 w-3 text-primary" />
                  <span>SSL ACTIVE</span>
                </>
              ) : (
                "PENDING DNS"
              )}
            </Badge>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border/50">
          <Button variant="outline" size="sm" onClick={onClose} className="h-8 text-xs border-border">
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="h-8 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {saving ? "Saving..." : "Save Configuration"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

