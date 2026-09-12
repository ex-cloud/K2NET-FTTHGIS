import { ShieldCheck, RefreshCw } from "lucide-react";
import { Button, ActionTooltip } from "@k2net/ui";
import { toast } from "sonner";

interface VpnHeaderProps {
  onRefresh: () => void;
}

export function VpnHeader({ onRefresh }: VpnHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 md:px-6 shrink-0">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <span>VPN Mesh &amp; BRAS Tunneling Management</span>
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
              onRefresh();
              toast.success("Mesh tunnel telemetry refreshed");
            }}
            className="h-8 px-3 text-xs font-semibold border-border bg-card hover:bg-muted text-foreground gap-1.5 shadow-2xs cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh</span>
          </Button>
        </ActionTooltip>
      </div>
    </div>
  );
}
