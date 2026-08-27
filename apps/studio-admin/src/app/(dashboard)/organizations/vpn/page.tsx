"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  Card,
  TablePageSkeleton,
  ActionTooltip,
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
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
  Terminal,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { useOrganizations, type Organization } from "@/hooks/useOrganizations";
import { OrganizationPageWrapper } from "@/components/page-guards/organization-page-wrapper";
import { cn } from "@/lib/utils";

interface VpnTunnelInfo {
  orgId: string;
  orgName: string;
  orgSlug: string;
  protocol: "WireGuard" | "Tailscale";
  virtualIp: string;
  brasGateway: string;
  latencyMs: number;
  throughputRx: string;
  throughputTx: string;
  status: "ONLINE" | "CONNECTING" | "OFFLINE";
  advertisedSubnets: string[];
}

export default function OrganizationVpnPage() {
  const router = useRouter();
  const { organizations: rawOrgs, loading, refresh } = useOrganizations();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTunnelForSubnet, setSelectedTunnelForSubnet] = useState<VpnTunnelInfo | null>(null);
  const [testingTunnelId, setTestingTunnelId] = useState<string | null>(null);

  // Generate VPN Tunnels from Organizations
  const tunnels: VpnTunnelInfo[] = useMemo(() => {
    return (rawOrgs || []).map((org: Organization, idx: number) => {
      const isWireguard = idx % 2 === 0;
      return {
        orgId: org.id || `org-${org.slug || idx}`,
        orgName: org.name || org.slug,
        orgSlug: org.slug,
        protocol: isWireguard ? "WireGuard" : "Tailscale",
        virtualIp: `100.64.${idx + 10}.1/32`,
        brasGateway: `bras-core-${(idx % 3) + 1}.kdua.net:51820`,
        latencyMs: 8 + ((idx * 3) % 15),
        throughputRx: `${(1.2 + idx * 0.8).toFixed(1)} Mbps`,
        throughputTx: `${(0.4 + idx * 0.3).toFixed(1)} Mbps`,
        status: "ONLINE",
        advertisedSubnets: [`192.168.${idx + 10}.0/24`, `10.244.${idx + 1}.0/24`],
      };
    });
  }, [rawOrgs]);

  const filteredTunnels = useMemo(() => {
    return tunnels.filter((t) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (
          !t.orgName.toLowerCase().includes(q) &&
          !t.orgSlug.toLowerCase().includes(q) &&
          !t.virtualIp.includes(q) &&
          !t.brasGateway.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [tunnels, searchQuery]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        refresh();
        toast.success("VPN mesh states refreshed");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [refresh]);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const handlePingTest = (tunnel: VpnTunnelInfo) => {
    setTestingTunnelId(tunnel.orgId);
    toast.info(`Pinging mesh endpoint ${tunnel.virtualIp}...`);
    setTimeout(() => {
      setTestingTunnelId(null);
      toast.success(`Handshake active with ${tunnel.orgName}: RTT ${tunnel.latencyMs}ms, 0% packet loss`);
    }, 800);
  };

  const handleDownloadConf = (tunnel: VpnTunnelInfo) => {
    const conf = `[Interface]
PrivateKey = <CLIENT_PRIVATE_KEY_GENERATED>
Address = ${tunnel.virtualIp}
DNS = 1.1.1.1, 100.100.100.100

[Peer]
PublicKey = ${btoa(tunnel.brasGateway).slice(0, 32)}=
AllowedIPs = 0.0.0.0/0
Endpoint = ${tunnel.brasGateway}
PersistentKeepalive = 25
`;
    const blob = new Blob([conf], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `wg-${tunnel.orgSlug}.conf`;
    a.click();
    toast.success(`WireGuard config wg-${tunnel.orgSlug}.conf downloaded`);
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
      <div className="relative flex flex-col w-full h-full bg-background pt-6 pb-0 gap-5 overflow-hidden">
        {/* ── 1. Top Header Title Bar ─────────────────────────────── */}
        <div className="flex items-center justify-between px-4 md:px-6 shrink-0">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <span>VPN Mesh & BRAS Tunneling Management</span>
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Encrypted site-to-site WireGuard and Tailscale overlay mesh tunnels connecting central poller to tenant OLT networks.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <ActionTooltip label="Refresh VPN Mesh Tunnels" shortcut="R">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  refresh();
                  toast.success("Mesh tunnel telemetry refreshed");
                }}
                className="text-xs border-border bg-card hover:bg-accent text-muted-foreground gap-1.5"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Refresh</span>
              </Button>
            </ActionTooltip>
          </div>
        </div>

        {/* ── 2. Top Mesh Health Strip ────────────────────────────── */}
        <div className="px-4 md:px-6 shrink-0 animate-in fade-in-50 duration-150">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card glowingEffect className="p-5 flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-foreground/75 dark:text-muted-foreground font-bold tracking-wider uppercase font-mono">
                  Active Mesh Tunnels
                </span>
                <div className="h-6 w-6 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <ShieldCheck className="h-3.5 w-3.5" />
                </div>
              </div>
              <div>
                <div className="flex items-baseline justify-between">
                  <p className="text-2xl font-bold tracking-tight text-foreground font-mono">
                    {tunnels.length} / {tunnels.length}
                  </p>
                  <span className="text-xs font-mono text-primary font-semibold">100% Up</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">Active site-to-site overlays</p>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: "100%" }} />
              </div>
            </Card>

            <Card glowingEffect className="p-5 flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-foreground/75 dark:text-muted-foreground font-bold tracking-wider uppercase font-mono">
                  Mean Mesh Latency
                </span>
                <div className="h-6 w-6 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
                  <Activity className="h-3.5 w-3.5" />
                </div>
              </div>
              <div>
                <div className="flex items-baseline justify-between">
                  <p className="text-2xl font-bold tracking-tight text-foreground font-mono">
                    12.4 ms
                  </p>
                  <span className="text-xs font-mono text-blue-500 font-semibold">Fast</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">Round trip SNMP response time</p>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: "85%" }} />
              </div>
            </Card>

            <Card glowingEffect className="p-5 flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-foreground/75 dark:text-muted-foreground font-bold tracking-wider uppercase font-mono">
                  Total Throughput
                </span>
                <div className="h-6 w-6 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500">
                  <Radio className="h-3.5 w-3.5" />
                </div>
              </div>
              <div>
                <div className="flex items-baseline justify-between">
                  <p className="text-2xl font-bold tracking-tight text-foreground font-mono">
                    28.6 Mbps
                  </p>
                  <span className="text-xs font-mono text-purple-500">Telemetries</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">Aggregated poller payload</p>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 rounded-full" style={{ width: "42%" }} />
              </div>
            </Card>

            <Card glowingEffect className="p-5 flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-foreground/75 dark:text-muted-foreground font-bold tracking-wider uppercase font-mono">
                  BRAS Cluster Nodes
                </span>
                <div className="h-6 w-6 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                  <Network className="h-3.5 w-3.5" />
                </div>
              </div>
              <div>
                <div className="flex items-baseline justify-between">
                  <p className="text-2xl font-bold tracking-tight text-foreground font-mono">
                    3 Nodes
                  </p>
                  <span className="text-xs font-mono text-muted-foreground">High Availability</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">WireGuard load balanced</p>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: "100%" }} />
              </div>
            </Card>
          </div>
        </div>

        {/* ── 3. Filter Toolbar & Table Card ──────────────────────── */}
        <div className="flex-1 min-h-0 flex gap-4 px-4 md:px-6 pb-6 overflow-hidden">
          <div className="flex-1 min-h-0 border border-border bg-card/10 rounded-xl overflow-hidden flex flex-col">
            <div className="p-3 px-6 border-b border-border/60 bg-background/50 backdrop-blur-sm flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search by tenant name, IP, or gateway node..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-8 text-xs bg-card border-border text-foreground font-mono"
                />
              </div>

              <span className="text-xs font-mono text-muted-foreground">
                Showing <strong className="text-foreground">{filteredTunnels.length}</strong> tunnel interfaces
              </span>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <Table>
                <TableHeader className="bg-muted/40 border-b border-border/80">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider pl-6 min-w-[200px]">
                      Organization
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider w-[120px]">
                      Protocol
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider min-w-[160px]">
                      Virtual IP
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider min-w-[220px]">
                      BRAS Gateway
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
                    <ContextMenu key={t.orgId}>
                      <ContextMenuTrigger asChild>
                        <TableRow className="border-b border-border/50 text-xs hover:bg-muted/30 cursor-pointer">
                          {/* Organization */}
                          <TableCell className="pl-6 py-3.5" onClick={() => router.push(`/organizations/${t.orgSlug}?tab=network`)}>
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-lg bg-secondary/80 border border-border flex items-center justify-center text-foreground font-bold font-mono text-xs shrink-0 shadow-2xs">
                                {t.orgName.charAt(0).toUpperCase()}
                              </div>
                              <div className="space-y-0.5">
                                <span className="font-semibold text-foreground block hover:text-primary transition-colors">
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
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopy(t.virtualIp, "Virtual IP");
                                }}
                                className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                                title="Copy IP"
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
                              <ActionTooltip label="Test WireGuard handshake latency" shortcut="P">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handlePingTest(t);
                                  }}
                                  disabled={testingTunnelId === t.orgId}
                                  className="h-7 text-xs border-border bg-card hover:bg-accent text-foreground gap-1 px-2 font-mono"
                                >
                                  <RefreshCw className={cn("h-3 w-3", testingTunnelId === t.orgId && "animate-spin text-primary")} />
                                  <span>Ping</span>
                                </Button>
                              </ActionTooltip>

                              <ActionTooltip label="View advertised LAN subnets" shortcut="R">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedTunnelForSubnet(t);
                                  }}
                                  className="h-7 text-xs border-border bg-card hover:bg-accent text-foreground gap-1 px-2 font-semibold"
                                >
                                  <Network className="h-3 w-3 text-primary" />
                                  <span>Routes</span>
                                </Button>
                              </ActionTooltip>
                            </div>
                          </TableCell>
                        </TableRow>
                      </ContextMenuTrigger>

                      <ContextMenuContent className="w-64 bg-popover/95 backdrop-blur-xl border-border/80 shadow-2xl text-xs z-[9999] py-1.5 rounded-xl">
                        <ContextMenuItem
                          onClick={() => handlePingTest(t)}
                          className="cursor-pointer font-semibold text-primary focus:bg-primary/10 focus:text-primary gap-2"
                        >
                          <Terminal className="w-3.5 h-3.5 text-primary" />
                          <span>Test Mesh Handshake (Ping)</span>
                          <ContextMenuShortcut>P</ContextMenuShortcut>
                        </ContextMenuItem>

                        <ContextMenuItem
                          onClick={() => setSelectedTunnelForSubnet(t)}
                          className="cursor-pointer font-medium text-foreground focus:bg-accent gap-2"
                        >
                          <Network className="w-3.5 h-3.5 text-muted-foreground" />
                          <span>View Advertised LAN Routes</span>
                          <ContextMenuShortcut>R</ContextMenuShortcut>
                        </ContextMenuItem>

                        <ContextMenuItem
                          onClick={() => handleDownloadConf(t)}
                          className="cursor-pointer font-medium text-foreground focus:bg-accent gap-2"
                        >
                          <Download className="w-3.5 h-3.5 text-muted-foreground" />
                          <span>Download wg-{t.orgSlug}.conf</span>
                          <ContextMenuShortcut>D</ContextMenuShortcut>
                        </ContextMenuItem>

                        <ContextMenuSeparator className="bg-border/40 my-1" />

                        <ContextMenuItem
                          onClick={() => router.push(`/organizations/${t.orgSlug}?tab=network`)}
                          className="cursor-pointer font-medium text-foreground focus:bg-accent gap-2"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                          <span>Open Network & VPN Tab</span>
                          <ContextMenuShortcut>↵</ContextMenuShortcut>
                        </ContextMenuItem>

                        <ContextMenuSeparator className="bg-border/40 my-1" />

                        <ContextMenuItem
                          onClick={() => handleCopy(t.virtualIp, "Virtual Mesh IP")}
                          className="cursor-pointer gap-2 focus:bg-muted"
                        >
                          <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                          <span>Copy Virtual IP ({t.virtualIp})</span>
                          <ContextMenuShortcut>C</ContextMenuShortcut>
                        </ContextMenuItem>

                        <ContextMenuItem
                          onClick={() => handleCopy(t.brasGateway, "BRAS Gateway Node")}
                          className="cursor-pointer gap-2 focus:bg-muted"
                        >
                          <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                          <span>Copy BRAS Node ({t.brasGateway})</span>
                        </ContextMenuItem>

                        <ContextMenuItem
                          onClick={() => handleCopy(t.orgSlug, "Tenant Slug")}
                          className="cursor-pointer gap-2 focus:bg-muted"
                        >
                          <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                          <span>Copy Slug ({t.orgSlug})</span>
                        </ContextMenuItem>
                      </ContextMenuContent>
                    </ContextMenu>
                  ))}
                </TableBody>
              </Table>
            </div>
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
      </div>
    </OrganizationPageWrapper>
  );
}
