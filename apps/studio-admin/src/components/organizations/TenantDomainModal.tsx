import * as React from "react";
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
  RefreshCw,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { EnrichedOrganization } from "./types";
import { DnsDiagnosticConsole, type DnsDiagnosticResult } from "./domain/DnsDiagnosticConsole";
import { DnsInstructionsCard } from "./domain/DnsInstructionsCard";

interface TenantDomainModalProps {
  organization: EnrichedOrganization | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveDomain: (orgId: string, domain: string) => Promise<void>;
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

          <DnsInstructionsCard onCopy={handleCopy} />

          {dnsResult && <DnsDiagnosticConsole dnsResult={dnsResult} />}

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
              className={
                organization.domainSslActive || dnsResult?.isCnameMatched
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
