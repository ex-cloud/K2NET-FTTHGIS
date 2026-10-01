import { useState } from "react";
import { Badge, Button, Card, ActionTooltip } from "@k2net/ui";
import {
  Globe,
  ShieldCheck,
  Copy,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@k2net/i18n";
import { cn } from "@/lib/utils";
import { getDefaultTenantHost } from "@/lib/domain";
import type { EnrichedOrganization } from "../types";

interface OrgNetworkDomainTabProps {
  organization: EnrichedOrganization;
  onOpenDomainModal: () => void;
}

export function OrgNetworkDomainTab({
  organization: org,
  onOpenDomainModal,
}: OrgNetworkDomainTabProps) {
  const { t } = useTranslation();
  const [checkingDns, setCheckingDns] = useState(false);
  const [testingVpn, setTestingVpn] = useState(false);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(t("organizations.copied_to_clipboard", { label }));
  };

  const handleCheckDns = () => {
    setCheckingDns(true);
    setTimeout(() => {
      setCheckingDns(false);
      const domain = org.customDomain || getDefaultTenantHost(org.slug);
      toast.success(t("organizations.dns_check_success"), {
        description: t("organizations.dns_check_desc", { domain }),
      });
    }, 1000);
  };

  const handleTestVpn = () => {
    setTestingVpn(true);
    setTimeout(() => {
      setTestingVpn(false);
      toast.success(t("organizations.vpn_test_success"), {
        description: t("organizations.vpn_test_desc"),
      });
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* 1. Custom Domain & SSL Section */}
      <Card className="p-4 md:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" />
              <h3 className="text-xs font-bold text-foreground">
                {t("organizations.custom_domain_section_title")}
              </h3>
            </div>
            <p className="text-[11px] text-muted-foreground">
              {t("organizations.custom_domain_section_subtitle")}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <ActionTooltip label={t("organizations.check_dns_tooltip")} shortcut="R">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCheckDns}
                disabled={checkingDns}
                className="h-7 px-2.5 text-xs font-medium border-border bg-card hover:bg-muted text-foreground gap-1.5 shadow-2xs"
              >
                <RefreshCw className={cn("h-3 w-3", checkingDns && "animate-spin text-primary")} />
                <span>{checkingDns ? t("organizations.checking_dns_btn") : t("organizations.check_dns_btn")}</span>
              </Button>
            </ActionTooltip>

            <ActionTooltip label={t("organizations.configure_domain_tooltip")} shortcut="D">
              <Button
                size="sm"
                onClick={onOpenDomainModal}
                className="h-7 px-2.5 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 shadow-xs"
              >
                <Globe className="h-3.5 w-3.5" />
                <span>{t("organizations.configure_domain_btn")}</span>
              </Button>
            </ActionTooltip>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
          {/* Active Domain FQDN */}
          <div className="rounded-lg bg-background/80 border border-border/60 p-3 space-y-1">
            <span className="text-[10px] font-mono text-muted-foreground block uppercase">
              {t("organizations.active_domain_label")}
            </span>
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-foreground">
                {org.customDomain || getDefaultTenantHost(org.slug)}
              </span>
              <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary font-mono text-[9px]">
                {org.customDomain ? "CUSTOM" : "DEFAULT"}
              </Badge>
            </div>
          </div>

          {/* SSL Status */}
          <div className="rounded-lg bg-background/80 border border-border/60 p-3 space-y-1">
            <span className="text-[10px] font-mono text-muted-foreground block uppercase">
              {t("organizations.ssl_status_label")}
            </span>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                <span className="font-mono text-xs font-semibold text-foreground">
                  {t("organizations.ssl_valid")}
                </span>
              </div>
              <span className="text-[10px] font-mono text-muted-foreground">TLS 1.3</span>
            </div>
          </div>

          {/* CNAME Target */}
          <div className="rounded-lg bg-background/80 border border-border/60 p-3 space-y-1">
            <span className="text-[10px] font-mono text-muted-foreground block uppercase">
              {t("organizations.cname_target_label")}
            </span>
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-primary">cname.kdua.net</span>
              <ActionTooltip label={t("organizations.copy_cname_tooltip")}>
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
      <Card className="p-4 md:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <h3 className="text-xs font-bold text-foreground">
                {t("organizations.vpn_mesh_title")}
              </h3>
              <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary font-mono text-[9px]">
                {t("organizations.vpn_mesh_active_badge")}
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground">
              {t("organizations.vpn_mesh_subtitle")}
            </p>
          </div>

          <ActionTooltip label={t("organizations.test_handshake_tooltip")} shortcut="P">
            <Button
              variant="outline"
              size="sm"
              onClick={handleTestVpn}
              disabled={testingVpn}
              className="h-7 px-2.5 text-xs font-medium border-border bg-card hover:bg-muted text-foreground gap-1.5 shrink-0 shadow-2xs"
            >
              <RefreshCw className={cn("h-3 w-3", testingVpn && "animate-spin text-primary")} />
              <span>{t("organizations.test_handshake_btn")}</span>
            </Button>
          </ActionTooltip>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
          {/* Virtual IP */}
          <div className="rounded-lg bg-background/80 border border-border/60 p-3 space-y-1">
            <span className="text-[10px] font-mono text-muted-foreground block uppercase">
              {t("organizations.tunnel_mesh_ip")}
            </span>
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-foreground">100.110.205.109</span>
              <button
                onClick={() => handleCopy("100.110.205.109", "Mesh IP")}
                className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <Copy className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* BRAS Gateway */}
          <div className="rounded-lg bg-background/80 border border-border/60 p-3 space-y-1">
            <span className="text-[10px] font-mono text-muted-foreground block uppercase">
              {t("organizations.bras_gateway_node")}
            </span>
            <span className="font-mono text-xs font-bold text-foreground block">100.64.0.1 (MikroTik CCR)</span>
          </div>

          {/* Latency */}
          <div className="rounded-lg bg-background/80 border border-border/60 p-3 space-y-1">
            <span className="text-[10px] font-mono text-muted-foreground block uppercase">
              {t("organizations.tunnel_latency")}
            </span>
            <span className="font-mono text-xs font-bold text-primary block">14 ms (Jitter 1.2ms)</span>
          </div>

          {/* Traffic */}
          <div className="rounded-lg bg-background/80 border border-border/60 p-3 space-y-1">
            <span className="text-[10px] font-mono text-muted-foreground block uppercase">
              {t("organizations.tunnel_bandwidth")}
            </span>
            <span className="font-mono text-xs font-bold text-foreground block">42.8 Mbps RX / 18.2 Mbps TX</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
