import {
  TableRow,
  TableCell,
  Badge,
  Button,
  ActionTooltip,
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
} from "@k2net/ui";
import {
  RefreshCw,
  Network,
  Download,
  Terminal,
  ExternalLink,
  Copy,
} from "lucide-react";
import type { VpnTunnelInfo } from "./types";
import { cn } from "@/lib/utils";

interface VpnTableRowProps {
  tunnel: VpnTunnelInfo;
  testingTunnelId: string | null;
  onNavigateNetwork: (slug: string) => void;
  onPingTest: (tunnel: VpnTunnelInfo) => void;
  onSelectSubnet: (tunnel: VpnTunnelInfo) => void;
  onDownloadConf: (tunnel: VpnTunnelInfo) => void;
  onCopy: (text: string, label: string) => void;
}

export function VpnTableRow({
  tunnel: t,
  testingTunnelId,
  onNavigateNetwork,
  onPingTest,
  onSelectSubnet,
  onDownloadConf,
  onCopy,
}: VpnTableRowProps) {
  return (
    <ContextMenu key={t.orgId}>
      <ContextMenuTrigger asChild>
        <TableRow className="border-b border-border/50 text-xs hover:bg-muted/30 cursor-pointer">
          {/* Organization */}
          <TableCell className="pl-6 py-3.5" onClick={() => onNavigateNetwork(t.orgSlug)}>
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
                  onCopy(t.virtualIp, "Virtual IP");
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
                    onPingTest(t);
                  }}
                  disabled={testingTunnelId === t.orgId}
                  className="h-7 text-xs border-border bg-card hover:bg-accent text-foreground gap-1 px-2 font-mono cursor-pointer"
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
                    onSelectSubnet(t);
                  }}
                  className="h-7 text-xs border-border bg-card hover:bg-accent text-foreground gap-1 px-2 font-semibold cursor-pointer"
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
          onClick={() => onPingTest(t)}
          className="cursor-pointer font-semibold text-primary focus:bg-primary/10 focus:text-primary gap-2"
        >
          <Terminal className="w-3.5 h-3.5 text-primary" />
          <span>Test Mesh Handshake (Ping)</span>
          <ContextMenuShortcut>P</ContextMenuShortcut>
        </ContextMenuItem>

        <ContextMenuItem
          onClick={() => onSelectSubnet(t)}
          className="cursor-pointer font-medium text-foreground focus:bg-accent gap-2"
        >
          <Network className="w-3.5 h-3.5 text-muted-foreground" />
          <span>View Advertised LAN Routes</span>
          <ContextMenuShortcut>R</ContextMenuShortcut>
        </ContextMenuItem>

        <ContextMenuItem
          onClick={() => onDownloadConf(t)}
          className="cursor-pointer font-medium text-foreground focus:bg-accent gap-2"
        >
          <Download className="w-3.5 h-3.5 text-muted-foreground" />
          <span>Download wg-{t.orgSlug}.conf</span>
          <ContextMenuShortcut>D</ContextMenuShortcut>
        </ContextMenuItem>

        <ContextMenuSeparator className="bg-border/40 my-1" />

        <ContextMenuItem
          onClick={() => onNavigateNetwork(t.orgSlug)}
          className="cursor-pointer font-medium text-foreground focus:bg-accent gap-2"
        >
          <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
          <span>Open Network &amp; VPN Tab</span>
          <ContextMenuShortcut>↵</ContextMenuShortcut>
        </ContextMenuItem>

        <ContextMenuSeparator className="bg-border/40 my-1" />

        <ContextMenuItem
          onClick={() => onCopy(t.virtualIp, "Virtual Mesh IP")}
          className="cursor-pointer gap-2 focus:bg-muted"
        >
          <Copy className="w-3.5 h-3.5 text-muted-foreground" />
          <span>Copy Virtual IP ({t.virtualIp})</span>
          <ContextMenuShortcut>C</ContextMenuShortcut>
        </ContextMenuItem>

        <ContextMenuItem
          onClick={() => onCopy(t.brasGateway, "BRAS Gateway Node")}
          className="cursor-pointer gap-2 focus:bg-muted"
        >
          <Copy className="w-3.5 h-3.5 text-muted-foreground" />
          <span>Copy BRAS Node ({t.brasGateway})</span>
        </ContextMenuItem>

        <ContextMenuItem
          onClick={() => onCopy(t.orgSlug, "Tenant Slug")}
          className="cursor-pointer gap-2 focus:bg-muted"
        >
          <Copy className="w-3.5 h-3.5 text-muted-foreground" />
          <span>Copy Slug ({t.orgSlug})</span>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
