import { Globe, RefreshCw } from "lucide-react";
import { Button, ActionTooltip } from "@k2net/ui";
import { toast } from "sonner";

interface DomainsHeaderProps {
  onRefresh: () => void;
}

export function DomainsHeader({ onRefresh }: DomainsHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 md:px-6 shrink-0">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          <span>Custom Domains &amp; SSL Routing Management</span>
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Whitelabel custom domain configuration, Traefik edge reverse-proxy SSL, and DNS verification.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <ActionTooltip label="Refresh Domain States" shortcut="R">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              onRefresh();
              toast.success("Domain and TLS states refreshed");
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
