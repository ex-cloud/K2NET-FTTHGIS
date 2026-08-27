"use client";

import { useState, useMemo } from "react";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  Badge,
  Button,
  Input,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  PageLayout,
  TablePageSkeleton,
  ActionTooltip,
} from "@k2net/ui";
import {
  ShieldCheck,
  Radio,
  Search,
  RefreshCw,
  Copy,
  Activity,
  Network,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import { useOrganizations, type Organization } from "@/hooks/useOrganizations";
import { OrganizationPageWrapper } from "@/components/page-guards/organization-page-wrapper";
import { cn } from "@/lib/utils";

interface VpnTunnel {
  orgId: string;
  orgName: string;
  orgSlug: string;
  protocol: "Tailscale Mesh" | "WireGuard Site-to-Site" | "IPsec IKEv2";
  virtualIp: string;
  brasGateway: string;
  lastHandshake: string;
  latencyMs: number;
  throughputRx: string;
  throughputTx: string;
  status: "CONNECTED" | "DEGRADED" | "DOWN";
  advertisedSubnets: string[];
}

export default function OrganizationVpnPage() {
  const { organizations: rawOrgs, loading, refresh } = useOrganizations();

  const [searchQuery, setSearchQuery] = useState("");
  const [testingTunnelId, setTestingTunnelId] = useState<string | null>(null);
  const [selectedTunnelForSubnet, setSelectedTunnelForSubnet] = useState<VpnTunnel | null>(null);

  // Mock VPN tunnels tied to organizations
  const tunnels: VpnTunnel[] = useMemo(() => {
    return (rawOrgs || []).map((org: Organization, idx: number) => {
      const isDefault = org.slug === "default" || idx === 0;
      return {
        orgId: org.id || `org-${org.slug}`,
        orgName: org.name || org.slug,
        orgSlug: org.slug,
        protocol: isDefault ? "Tailscale Mesh" : "WireGuard Site-to-Site",
        virtualIp: isDefault ? "100.110.205.109" : `100.64.0.${10 + idx}`,
        brasGateway: isDefault ? "100.64.0.1 (MikroTik CCR2004)" : `10.250.0.1 (Huawei NE20E)`,
        lastHandshake: `${(idx + 1) * 4}s ago`,
        latencyMs: 12 + idx * 3,
        throughputRx: `${(42.8 + idx * 10).toFixed(1)} Mbps`,
        throughputTx: `${(18.2 + idx * 4).toFixed(1)} Mbps`,
        status: "CONNECTED",
        advertisedSubnets: [
          `10.200.${10 + idx}.0/24 (OLT Management LAN)`,
          `10.100.${idx}.0/24 (NOC Monitoring Gateway)`,
          `172.16.${idx}.0/24 (BRAS PPPoE Radius Subnet)`,
        ],
      };
    });
  }, [rawOrgs]);

  const filteredTunnels = useMemo(() => {
    return tunnels.filter((t) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          t.orgName.toLowerCase().includes(q) ||
          t.orgSlug.toLowerCase().includes(q) ||
          t.virtualIp.includes(q) ||
          t.brasGateway.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [tunnels, searchQuery]);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const handlePingTest = (tunnel: VpnTunnel) => {
    setTestingTunnelId(tunnel.orgId);
    setTimeout(() => {
      setTestingTunnelId(null);
      toast.success(`Tunnel ping passed for ${tunnel.orgName}`, {
        description: `Virtual IP: ${tunnel.virtualIp} | Latency: ${tunnel.latencyMs}ms | Jitter: 0.8ms | Packet Loss: 0%`,
      });
    }, 1000);
  };

  const handleDownloadConf = (tunnel: VpnTunnel) => {
    toast.success(`WireGuard config downloaded for ${tunnel.orgName}`, {
      description: `wg0-${tunnel.orgSlug}.conf generated with preshared keys.`,
    });
  };

  if (loading) {
    return (
      <OrganizationPageWrapper>
        <TablePageSkeleton />
      </OrganizationPageWrapper>
    );
  }

  return (
    <OrganizationPageWrapper>
      <PageLayout className="p-0 flex flex-col h-full overflow-hidden bg-background">
        {/* ── 1. Top Header Title Bar ─────────────────────────────── */}
        <div className="py-4 px-6 border-b border-border/60 shrink-0 bg-background flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <ShieldCheck className="h-3.5 w-3.5" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <span>Tenant Mesh VPN & BRAS Tunneling Operations 🛡️</span>
              </h1>
            </div>
            <p className="text-xs text-muted-foreground">
              Encrypted WireGuard and Tailscale mesh connections connecting ISP partner OLT nodes to FTTH GIS poller gateways.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                refresh();
                toast.success("VPN tunnel states refreshed");
              }}
              className="text-xs border-border bg-card hover:bg-accent text-muted-foreground gap-1.5"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Refresh</span>
            </Button>
          </div>
        </div>

        {/* ── 2. Top Mesh Health Strip ────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 px-6 py-4 border-b border-border/60 bg-muted/10 shrink-0">
          <div className="rounded-xl border border-border/80 bg-card/60 p-3.5 flex items-center justify-between shadow-xs">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-foreground/75 dark:text-muted-foreground uppercase tracking-widest font-mono">
                Tailscale Host Daemon
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-bold font-mono text-foreground">
                  100.110.205.109
                </span>
                <span className="text-[11px] text-primary font-mono font-semibold">ONLINE</span>
              </div>
            </div>
            <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>

          <div className="rounded-xl border border-border/80 bg-card/60 p-3.5 flex items-center justify-between shadow-xs">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-foreground/75 dark:text-muted-foreground uppercase tracking-widest font-mono">
                Active Tenant Tunnels
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-bold font-mono text-foreground">
                  {tunnels.length} / {tunnels.length}
                </span>
                <span className="text-[11px] text-primary font-mono font-semibold">100% Up</span>
              </div>
            </div>
            <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Network className="h-4 w-4" />
            </div>
          </div>

          <div className="rounded-xl border border-border/80 bg-card/60 p-3.5 flex items-center justify-between shadow-xs">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-foreground/75 dark:text-muted-foreground uppercase tracking-widest font-mono">
                Avg RTT Latency
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-bold font-mono text-primary">
                  14.2 ms
                </span>
                <span className="text-[11px] text-muted-foreground font-mono">Jitter 0.8ms</span>
              </div>
            </div>
            <div className="h-8 w-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
              <Activity className="h-4 w-4" />
            </div>
          </div>

          <div className="rounded-xl border border-border/80 bg-card/60 p-3.5 flex items-center justify-between shadow-xs">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-foreground/75 dark:text-muted-foreground uppercase tracking-widest font-mono">
                Telemetry Throughput
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-bold font-mono text-foreground">
                  61.0 Mbps
                </span>
                <span className="text-[11px] text-muted-foreground font-mono">RX + TX</span>
              </div>
            </div>
            <div className="h-8 w-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500">
              <Radio className="h-4 w-4" />
            </div>
          </div>
        </div>

        {/* ── 3. Filter Toolbar ───────────────────────────────────── */}
        <div className="p-4 px-6 border-b border-border/60 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search by tenant name, virtual IP, or gateway..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-xs bg-card border-border text-foreground font-mono"
            />
          </div>

          <span className="text-xs font-mono text-muted-foreground">
            Showing {filteredTunnels.length} active tunnels
          </span>
        </div>

        {/* ── 4. Tunnels Telemetry Table ──────────────────────────── */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          <div className="rounded-xl border border-border/80 bg-card/60 backdrop-blur-md overflow-hidden shadow-xs">
            <Table>
              <TableHeader className="bg-muted/40 border-b border-border/80">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider pl-6 min-w-[200px]">
                    Organization
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider w-[140px]">
                    Protocol
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider min-w-[150px]">
                    Virtual Mesh IP
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider min-w-[180px]">
                    BRAS Endpoint Node
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider w-[110px]">
                    Latency
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider w-[130px]">
                    Throughput
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider w-[110px]">
                    Status
                  </TableHead>
                  <TableHead className="text-right pr-6 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider w-[180px]">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredTunnels.map((t) => (
                  <TableRow key={t.orgId} className="border-b border-border/50 text-xs hover:bg-muted/30">
                    {/* Organization */}
                    <TableCell className="pl-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-secondary/80 border border-border flex items-center justify-center text-foreground font-bold font-mono text-xs shrink-0 shadow-2xs">
                          {t.orgName.charAt(0).toUpperCase()}
                        </div>
                        <div className="space-y-0.5">
                          <span className="font-semibold text-foreground block">
                            {t.orgName}
                          </span>
                          <span className="text-[10px] font-mono text-muted-foreground">
                            {t.orgSlug}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    {/* Protocol */}
                    <TableCell className="py-3.5">
                      <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary font-mono text-[9px]">
                        {t.protocol}
                      </Badge>
                    </TableCell>

                    {/* Virtual IP */}
                    <TableCell className="py-3.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-foreground">
                          {t.virtualIp}
                        </span>
                        <button
                          onClick={() => handleCopy(t.virtualIp, "Virtual IP")}
                          className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                    </TableCell>

                    {/* BRAS Endpoint */}
                    <TableCell className="py-3.5 font-mono text-[11px] text-muted-foreground">
                      {t.brasGateway}
                    </TableCell>

                    {/* Latency */}
                    <TableCell className="py-3.5 font-mono text-[11px] font-semibold text-primary">
                      {t.latencyMs} ms
                    </TableCell>

                    {/* Throughput */}
                    <TableCell className="py-3.5 font-mono text-[10px] text-muted-foreground space-y-0.5">
                      <div>↓ {t.throughputRx}</div>
                      <div>↑ {t.throughputTx}</div>
                    </TableCell>

                    {/* Status */}
                    <TableCell className="py-3.5">
                      <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary font-mono text-[10px] gap-1 px-2 py-0.5 shadow-2xs">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                        <span>{t.status}</span>
                      </Badge>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="py-3.5 pr-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <ActionTooltip label="Test WireGuard handshake latency">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePingTest(t)}
                            disabled={testingTunnelId === t.orgId}
                            className="h-7 text-xs border-border bg-card hover:bg-accent text-foreground gap-1 px-2 font-mono"
                          >
                            <RefreshCw className={cn("h-3 w-3", testingTunnelId === t.orgId && "animate-spin text-primary")} />
                            <span>Ping</span>
                          </Button>
                        </ActionTooltip>

                        <ActionTooltip label="View advertised LAN subnets">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedTunnelForSubnet(t)}
                            className="h-7 text-xs border-border bg-card hover:bg-accent text-foreground gap-1 px-2 font-semibold"
                          >
                            <Network className="h-3 w-3 text-primary" />
                            <span>Routes</span>
                          </Button>
                        </ActionTooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Subnet Routes Modal */}
        <Dialog open={!!selectedTunnelForSubnet} onOpenChange={(open) => !open && setSelectedTunnelForSubnet(null)}>
          <DialogContent className="bg-popover/95 backdrop-blur-xl border-border sm:max-w-[480px] p-0 overflow-hidden shadow-2xl text-foreground rounded-2xl">
            <DialogHeader className="p-6 pb-2 text-foreground">
              <DialogTitle className="text-base font-bold flex items-center gap-2 font-mono">
                <Network className="w-4 h-4 text-primary" />
                <span>Advertised Subnet Routes: {selectedTunnelForSubnet?.orgName}</span>
              </DialogTitle>
            </DialogHeader>

            <div className="p-6 space-y-3">
              <p className="text-xs text-muted-foreground">
                Subnet lokal yang di-routing secara otomatis melalui mesh VPN tunnel ke gateway poller:
              </p>
              <div className="space-y-2">
                {selectedTunnelForSubnet?.advertisedSubnets.map((sub, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-card border border-border font-mono text-xs"
                  >
                    <span className="font-bold text-foreground">{sub}</span>
                    <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary text-[9px]">
                      ROUTED
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 border-t border-border bg-muted/20 flex justify-between items-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => selectedTunnelForSubnet && handleDownloadConf(selectedTunnelForSubnet)}
                className="text-xs gap-1.5 font-mono"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download .conf</span>
              </Button>
              <Button size="sm" onClick={() => setSelectedTunnelForSubnet(null)} className="text-xs">
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </PageLayout>
    </OrganizationPageWrapper>
  );
}
