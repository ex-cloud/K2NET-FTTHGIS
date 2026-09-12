import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  Input,
} from "@k2net/ui";
import { Search } from "lucide-react";
import type { VpnTunnelInfo } from "./types";
import { VpnTableRow } from "./VpnTableRow";

interface VpnTableProps {
  filteredTunnels: VpnTunnelInfo[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  testingTunnelId: string | null;
  onNavigateNetwork: (slug: string) => void;
  onPingTest: (tunnel: VpnTunnelInfo) => void;
  onSelectSubnet: (tunnel: VpnTunnelInfo) => void;
  onDownloadConf: (tunnel: VpnTunnelInfo) => void;
  onCopy: (text: string, label: string) => void;
}

export function VpnTable({
  filteredTunnels,
  searchQuery,
  setSearchQuery,
  testingTunnelId,
  onNavigateNetwork,
  onPingTest,
  onSelectSubnet,
  onDownloadConf,
  onCopy,
}: VpnTableProps) {
  return (
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
                <VpnTableRow
                  key={t.orgId}
                  tunnel={t}
                  testingTunnelId={testingTunnelId}
                  onNavigateNetwork={onNavigateNetwork}
                  onPingTest={onPingTest}
                  onSelectSubnet={onSelectSubnet}
                  onDownloadConf={onDownloadConf}
                  onCopy={onCopy}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
