import {
  Badge,
  Button,
} from "@k2net/ui";
import {
  Send,
  RefreshCw,
  Trash2,
  Edit2,
  Copy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { WebhookEndpoint, PingResult } from "./types";

interface EndpointRowItemProps {
  endpoint: WebhookEndpoint;
  pingResult?: PingResult;
  isPinging: boolean;
  isRolling: boolean;
  isDeleting: boolean;
  onTestPing: (id: string) => void;
  onEdit: (ep: WebhookEndpoint) => void;
  onDelete: (id: string) => void;
  onRollSecret: (id: string) => void;
  onCopy: (text: string, label: string) => void;
}

export function EndpointRowItem({
  endpoint: ep,
  pingResult,
  isPinging,
  isRolling,
  isDeleting,
  onTestPing,
  onEdit,
  onDelete,
  onRollSecret,
  onCopy,
}: EndpointRowItemProps) {
  return (
    <div className="p-4 rounded-xl border border-border/80 bg-background/40 hover:bg-muted/20 transition-all space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="text-xs font-bold text-foreground">{ep.name}</span>
          <Badge
            variant="outline"
            className={cn(
              "text-[9px] font-mono",
              ep.isActive
                ? "border-primary/30 bg-primary/10 text-primary"
                : "border-border text-muted-foreground"
            )}
          >
            {ep.isActive ? "ACTIVE" : "PAUSED"}
          </Badge>

          {pingResult && (
            <Badge
              variant="outline"
              className={cn(
                "text-[9px] font-mono",
                pingResult.success
                  ? "border-primary/30 bg-primary/10 text-primary"
                  : "border-destructive/30 bg-destructive/10 text-destructive"
              )}
            >
              Ping: {pingResult.status} ({pingResult.latencyMs}ms)
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onTestPing(ep.id)}
            disabled={isPinging || !ep.isActive}
            className="h-7 px-2 text-xs border-border text-foreground hover:bg-muted gap-1 cursor-pointer"
            title="Uji kirim ping ke endpoint ini"
          >
            <Send className={cn("h-3 w-3 text-primary", isPinging && "animate-pulse")} />
            <span>{isPinging ? "Pinging..." : "Test Ping"}</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(ep)}
            className="h-7 px-2 text-xs border-border text-foreground hover:bg-muted gap-1 cursor-pointer"
          >
            <Edit2 className="h-3 w-3" />
            <span>Edit</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(ep.id)}
            disabled={isDeleting}
            className="h-7 px-2 text-xs border-destructive/30 text-destructive hover:bg-destructive/10 gap-1 cursor-pointer"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <code className="text-[11px] font-mono text-foreground px-2 py-1 rounded bg-background border border-border select-all flex-1 truncate">
            {ep.targetUrl}
          </code>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onCopy(ep.targetUrl, "Target URL")}
            className="h-7 px-2 border-border text-xs"
          >
            <Copy className="h-3 w-3" />
          </Button>
        </div>
        {ep.description && (
          <p className="text-[11px] text-muted-foreground">{ep.description}</p>
        )}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-border/40 text-xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] text-muted-foreground">Events:</span>
          {ep.subscribedEvents.fiberCut && (
            <Badge variant="outline" className="text-[9px] font-mono bg-background border-border text-foreground">
              cable.fiber_cut
            </Badge>
          )}
          {ep.subscribedEvents.oltDown && (
            <Badge variant="outline" className="text-[9px] font-mono bg-background border-border text-foreground">
              device.olt_down
            </Badge>
          )}
          {ep.subscribedEvents.odpFull && (
            <Badge variant="outline" className="text-[9px] font-mono bg-background border-border text-foreground">
              odp.capacity_full
            </Badge>
          )}
          {ep.subscribedEvents.quotaAlert && (
            <Badge variant="outline" className="text-[9px] font-mono bg-background border-border text-foreground">
              tenant.quota_warning
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2 text-[11px]">
          <span className="text-muted-foreground font-mono">
            HMAC: {ep.secretMasked || "whsec_••••••••"}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRollSecret(ep.id)}
            disabled={isRolling}
            className="h-6 px-1.5 text-[10px] text-primary hover:text-primary hover:bg-primary/10 gap-1 cursor-pointer"
          >
            <RefreshCw className={cn("h-2.5 w-2.5", isRolling && "animate-spin")} />
            <span>Roll Secret</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
