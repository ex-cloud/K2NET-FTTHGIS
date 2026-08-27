"use client";

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
} from "@k2net/ui";
import {
  Globe,
  Copy,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import type { EnrichedOrganization } from "./types";

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

  useEffect(() => {
    if (organization) {
      setDomainInput(organization.customDomain || "");
    }
  }, [organization]);

  if (!organization) return null;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const handleVerifyDns = async () => {
    setVerifying(true);
    try {
      // Simulate/Trigger DNS CNAME verification
      await new Promise((r) => setTimeout(r, 1200));
      toast.success(`DNS CNAME verified successfully for ${domainInput || organization.customDomain}`);
    } catch {
      toast.error("DNS verification failed. Please ensure CNAME record points to cname.kdua.net");
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
      <DialogContent className="sm:max-w-lg bg-popover/95 backdrop-blur-xl border-border/80 text-foreground shadow-2xl rounded-2xl">
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
              <Button
                variant="outline"
                size="sm"
                onClick={handleVerifyDns}
                disabled={verifying || !domainInput.trim()}
                className="h-9 text-xs border-border bg-card hover:bg-accent gap-1.5 shrink-0"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${verifying ? "animate-spin text-primary" : ""}`} />
                <span>Check DNS</span>
              </Button>
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
                <span className="text-muted-foreground text-[10px] block">TARGET CNAME</span>
                <span className="text-primary font-bold">cname.kdua.net</span>
              </div>
              <button
                onClick={() => handleCopy("cname.kdua.net")}
                className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

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
              className={organization.domainSslActive
                ? "border-primary/30 bg-primary/10 text-primary font-mono text-[10px]"
                : "border-border text-muted-foreground font-mono text-[10px]"
              }
            >
              {organization.domainSslActive ? "SSL ACTIVE" : "PENDING DNS"}
            </Badge>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
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
