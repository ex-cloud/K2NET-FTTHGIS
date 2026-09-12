import { Network, Download } from "lucide-react";
import {
  Button,
  Badge,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@k2net/ui";
import type { VpnTunnelInfo } from "./types";

interface VpnSubnetRoutesModalProps {
  selectedTunnel: VpnTunnelInfo | null;
  onClose: () => void;
  onDownloadConf: (tunnel: VpnTunnelInfo) => void;
}

export function VpnSubnetRoutesModal({
  selectedTunnel,
  onClose,
  onDownloadConf,
}: VpnSubnetRoutesModalProps) {
  return (
    <Dialog open={!!selectedTunnel} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-popover/95 backdrop-blur-xl border-border sm:max-w-[480px] p-0 overflow-hidden shadow-2xl text-foreground rounded-2xl">
        <DialogHeader className="p-6 pb-2 text-foreground">
          <DialogTitle className="text-base font-bold flex items-center gap-2 font-mono">
            <Network className="w-4 h-4 text-primary" />
            <span>Advertised Subnet Routes: {selectedTunnel?.orgName}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 space-y-3">
          <p className="text-xs text-muted-foreground">
            Subnet lokal yang di-routing secara otomatis melalui mesh VPN tunnel ke gateway poller:
          </p>
          <div className="space-y-2">
            {selectedTunnel?.advertisedSubnets.map((sub, idx) => (
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
            onClick={() => selectedTunnel && onDownloadConf(selectedTunnel)}
            className="text-xs gap-1.5 font-mono cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download .conf</span>
          </Button>
          <Button size="sm" onClick={onClose} className="text-xs cursor-pointer">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
