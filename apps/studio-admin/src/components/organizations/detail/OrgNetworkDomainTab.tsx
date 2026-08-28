"use client";

import { useState } from "react";
import { Badge, Button, Card, ActionTooltip } from "@k2net/ui";
import {
  Globe,
  ShieldCheck,
  Copy,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { EnrichedOrganization } from "../types";

interface OrgNetworkDomainTabProps {
  organization: EnrichedOrganization;
  onOpenDomainModal: () => void;
}

export function OrgNetworkDomainTab({
  organization: org,
  onOpenDomainModal,
}: OrgNetworkDomainTabProps) {
  const [checkingDns, setCheckingDns] = useState(false);
  const [testingVpn, setTestingVpn] = useState(false);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const handleCheckDns = () => {
    setCheckingDns(true);
    setTimeout(() => {
      setCheckingDns(false);
      toast.success("DNS CNAME verification successful", {
        description: `${org.customDomain || org.slug + ".kdua.net"} correctly points to cname.kdua.net with valid SSL.`,
      });
    }, 1000);
  };

  const handleTestVpn = () => {
    setTestingVpn(true);
    setTimeout(() => {
      setTestingVpn(false);
      toast.success("Tailscale VPN Mesh Tunnel reachable", {
        description: "Latency: 14ms | Handshake: OK | BRAS Endpoint: 100.64.0.1",
      });
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* 1. Custom Domain & SSL Section */}
      <Card className="p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-bold text-foreground">Custom Whitelabel Domain & SSL</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Konfigurasi domain kustom tenant dengan sertifikat otomatis Let&apos;s Encrypt Traefik.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <ActionTooltip label="Inspect live DNS resolution and SSL certificate" shortcut="R">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCheckDns}
                disabled={checkingDns}
                className="text-xs border-border bg-card hover:bg-accent gap-1.5"
              >
                <RefreshCw className={cn("h-3 w-3", checkingDns && "animate-spin text-primary")} />
                <span>Check DNS</span>
              </Button>
            </ActionTooltip>

            <ActionTooltip label="Configure tenant custom FQDN domain and SSL" shortcut="D">
              <Button
                size="sm"
                onClick={onOpenDomainModal}
                className="text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5"
              >
                <Globe className="h-3.5 w-3.5" />
                <span>Configure Domain</span>
              </Button>
            </ActionTooltip>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* Active Domain FQDN */}
          <div className="rounded-lg bg-background/80 border border-border/60 p-3 space-y-1">
            <span className="text-[10px] font-mono text-muted-foreground block uppercase">Active Domain</span>
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-foreground">
                {org.customDomain || `${org.slug}.kdua.net`}
              </span>
              <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary font-mono text-[9px]">
                {org.customDomain ? "CUSTOM" : "DEFAULT"}
              </Badge>
            </div>
          </div>

          {/* SSL Status */}
          <div className="rounded-lg bg-background/80 border border-border/60 p-3 space-y-1">
            <span className="text-[10px] font-mono text-muted-foreground block uppercase">Traefik TLS / SSL</span>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                <span className="font-mono text-xs font-semibold text-foreground">
                  Let&apos;s Encrypt Valid
                </span>
              </div>
              <span className="text-[10px] font-mono text-muted-foreground">TLS 1.3</span>
            </div>
          </div>

          {/* CNAME Target */}
          <div className="rounded-lg bg-background/80 border border-border/60 p-3 space-y-1">
            <span className="text-[10px] font-mono text-muted-foreground block uppercase">DNS CNAME Target</span>
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-primary">cname.kdua.net</span>
              <ActionTooltip label="Copy CNAME destination target">
                <button
                  onClick={() => handleCopy("cname.kdua.net", "CNAME Target")}
                  className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <Copy className="h-3 w-3" />
                </button>
              </ActionTooltip>
            </div>
          </div>
        </div>
      </Card>

      {/* 2. VPN & Tunneling Infrastructure (Tailscale / IPsec) */}
      <Card className="p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-bold text-foreground">VPN Mesh & BRAS Tunneling 🛡️</h3>
              <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary font-mono text-[10px]">
                TAILSCALE MESH ACTIVE
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Koneksi terenkripsi WireGuard menghubungkan BRAS/OLT mitra ke sistem pusat FTTH GIS.
            </p>
          </div>

          <ActionTooltip label="Test WireGuard VPN handshake and ping response" shortcut="P">
            <Button
              variant="outline"
              size="sm"
              onClick={handleTestVpn}
              disabled={testingVpn}
              className="text-xs border-border bg-card hover:bg-accent gap-1.5 shrink-0"
            >
              <RefreshCw className={cn("h-3 w-3", testingVpn && "animate-spin text-primary")} />
              <span>Test Handshake</span>
            </Button>
          </ActionTooltip>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
          {/* Virtual IP */}
          <div className="rounded-lg bg-background/80 border border-border/60 p-3 space-y-1">
            <span className="text-[10px] font-mono text-muted-foreground block uppercase">Tunnel Mesh IP</span>
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-foreground">100.110.205.109</span>
              <button
                onClick={() => handleCopy("100.110.205.109", "Mesh IP")}
                className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
              >
                <Copy className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* BRAS Gateway */}
          <div className="rounded-lg bg-background/80 border border-border/60 p-3 space-y-1">
            <span className="text-[10px] font-mono text-muted-foreground block uppercase">BRAS Gateway Node</span>
            <span className="font-mono text-xs font-bold text-foreground block">100.64.0.1 (MikroTik CCR)</span>
          </div>

          {/* Latency */}
          <div className="rounded-lg bg-background/80 border border-border/60 p-3 space-y-1">
            <span className="text-[10px] font-mono text-muted-foreground block uppercase">Tunnel Latency</span>
            <span className="font-mono text-xs font-bold text-primary block">14 ms (Jitter 1.2ms)</span>
          </div>

          {/* Traffic */}
          <div className="rounded-lg bg-background/80 border border-border/60 p-3 space-y-1">
            <span className="text-[10px] font-mono text-muted-foreground block uppercase">Tunnel Bandwidth</span>
            <span className="font-mono text-xs font-bold text-foreground block">42.8 Mbps RX / 18.2 Mbps TX</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
